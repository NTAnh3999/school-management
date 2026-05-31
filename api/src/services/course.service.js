const { Op } = require("sequelize");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require("../utils/error-responses");
const {
  Course,
  Department,
  CoursePrerequisite,
  AuditLog,
  CourseModule,
  Lesson,
  Enrollment,
  CourseReview,
  StudentCourseProgress,
} = require("../models");
const { ROLES, isRole } = require("../constants/roles");

// ---------------------------------------------------------------------------
// Status state machine
// ---------------------------------------------------------------------------
const VALID_TRANSITIONS = {
  draft: ["active", "inactive"],
  active: ["inactive", "archived"],
  inactive: ["active", "archived"],
  archived: [],
};

const validateStatusTransition = (from, to) => {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) throw new BadRequestError(`Unknown current status: ${from}`);
  if (!allowed.includes(to)) {
    throw new BadRequestError(`Cannot transition course status from '${from}' to '${to}'`);
  }
};

// ---------------------------------------------------------------------------
// AuditLog helper
// ---------------------------------------------------------------------------
const writeAuditLog = async ({ entityId, action, oldValues = null, newValues = null, userId }) => {
  await AuditLog.create({
    entity_name: "Course",
    entity_id: entityId,
    action,
    old_values: oldValues,
    new_values: newValues,
    changed_by: userId || null,
    changed_at: new Date(),
  });
};

// ---------------------------------------------------------------------------
// Prerequisite cycle detection (DFS)
// ---------------------------------------------------------------------------
const detectPrerequisiteCycle = async (courseId, newPrereqId) => {
  // BFS/DFS: does newPrereqId eventually require courseId as a prerequisite?
  const visited = new Set();
  const queue = [newPrereqId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === courseId) return true; // cycle found
    if (visited.has(current)) continue;
    visited.add(current);

    const downstreamPrereqs = await CoursePrerequisite.findAll({
      where: { course_id: current },
      attributes: ["prerequisite_course_id"],
    });
    downstreamPrereqs.forEach((p) => queue.push(p.prerequisite_course_id));
  }
  return false;
};

// ---------------------------------------------------------------------------
// Check if course has downstream data (enrollments / active sections)
// ---------------------------------------------------------------------------
const hasDownstreamData = async (courseId) => {
  const enrollmentCount = await Enrollment.count({ where: { course_id: courseId } });
  return enrollmentCount > 0;
};

const hasActiveEnrollments = async (courseId) => {
  const count = await Enrollment.count({
    where: { course_id: courseId, status: "active" },
  });
  return count > 0;
};

// ---------------------------------------------------------------------------
// COURSE-01: Create Course
// ---------------------------------------------------------------------------
const create = async (payload, userId) => {
  const {
    course_code,
    course_name,
    short_name,
    description,
    course_type,
    credit,
    duration_hours,
    status,
    department_id,
    effective_from,
    effective_to,
  } = payload;

  if (!course_code) throw new BadRequestError("course_code is required");
  if (!course_name) throw new BadRequestError("course_name is required");
  if (!department_id) throw new BadRequestError("department_id is required");

  // Uniqueness check
  const existing = await Course.findOne({ where: { course_code } });
  if (existing) {
    throw new ConflictError(`course_code '${course_code}' already exists`);
  }

  // Validate department
  const dept = await Department.findByPk(department_id);
  if (!dept) throw new BadRequestError(`Department ${department_id} not found`);

  // Validate effective dates
  if (effective_from && effective_to && new Date(effective_from) > new Date(effective_to)) {
    throw new BadRequestError("effective_to must be >= effective_from");
  }

  if (credit !== undefined && credit !== null && credit <= 0) {
    throw new BadRequestError("credit must be greater than 0");
  }
  if (duration_hours !== undefined && duration_hours !== null && duration_hours <= 0) {
    throw new BadRequestError("duration_hours must be greater than 0");
  }

  const course = await Course.create({
    course_code,
    course_name,
    short_name: short_name || null,
    description,
    course_type: course_type || "general",
    credit: credit || null,
    duration_hours: duration_hours || null,
    status: status || "draft",
    department_id,
    effective_from: effective_from || null,
    effective_to: effective_to || null,
    is_deleted: false,
    created_by: userId,
    updated_by: userId,
  });

  await writeAuditLog({
    entityId: course.id,
    action: "CREATE",
    newValues: course.toJSON(),
    userId,
  });
  return course;
};

// ---------------------------------------------------------------------------
// COURSE-00: List Courses
// ---------------------------------------------------------------------------
const list = async (filters = {}, userRole) => {
  const where = {};

  if (filters.keyword) {
    where[Op.or] = [
      { course_name: { [Op.like]: `%${filters.keyword}%` } },
      { course_code: { [Op.like]: `%${filters.keyword}%` } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.departmentId) where.department_id = filters.departmentId;
  if (filters.courseType) where.course_type = filters.courseType;

  // Non-admin users only see active courses
  if (!isRole(userRole, ROLES.ADMIN)) {
    where.status = "active";
  }

  const limit = Math.min(parseInt(filters.page_size) || 20, 100);
  const offset = ((parseInt(filters.page) || 1) - 1) * limit;

  const { count, rows } = await Course.findAndCountAll({
    where,
    include: [
      {
        model: Department,
        as: "department",
        attributes: ["id", "department_code", "department_name"],
      },
      { model: CourseReview, as: "reviews", attributes: ["rating"] },
    ],
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });

  return { total: count, page: parseInt(filters.page) || 1, page_size: limit, courses: rows };
};

// ---------------------------------------------------------------------------
// COURSE-00: Detail
// ---------------------------------------------------------------------------
const detail = async (id, userRole) => {
  const course = await Course.findByPk(id, {
    include: [
      { model: Department, as: "department" },
      {
        model: CoursePrerequisite,
        as: "prerequisites",
        include: [
          {
            model: Course,
            as: "prerequisite_course",
            attributes: ["id", "course_code", "course_name", "status"],
          },
        ],
      },
      {
        model: CourseModule,
        as: "modules",
        include: [{ model: Lesson, as: "lessons" }],
      },
      { model: CourseReview, as: "reviews" },
    ],
  });
  if (!course) throw new NotFoundError("Course not found");

  // Non-admin users cannot see inactive/archived/draft courses
  if (!isRole(userRole, ROLES.ADMIN) && course.status !== "active") {
    throw new NotFoundError("Course not found");
  }

  return course;
};

// ---------------------------------------------------------------------------
// COURSE-02: Update Course
// ---------------------------------------------------------------------------
const update = async (id, payload, userId, userRole) => {
  if (!isRole(userRole, ROLES.ADMIN)) throw new ForbiddenError("Only Admin can update courses");

  const course = await Course.findByPk(id);
  if (!course) throw new NotFoundError("Course not found");

  const downstream = await hasDownstreamData(id);

  // Fields locked when downstream data exists
  if (downstream) {
    if (payload.course_code !== undefined && payload.course_code !== course.course_code) {
      throw new BadRequestError("Cannot change course_code after course has enrollment data");
    }
    if (payload.department_id !== undefined && payload.department_id !== course.department_id) {
      throw new BadRequestError("Cannot change department after course has enrollment data");
    }
    if (payload.course_type !== undefined && payload.course_type !== course.course_type) {
      throw new BadRequestError("Cannot change course_type after course has enrollment data");
    }
  }

  // course_code uniqueness if it's being changed
  if (payload.course_code && payload.course_code !== course.course_code) {
    const dup = await Course.findOne({ where: { course_code: payload.course_code } });
    if (dup) throw new ConflictError(`course_code '${payload.course_code}' already exists`);
  }

  // Validate department
  if (payload.department_id) {
    const dept = await Department.findByPk(payload.department_id);
    if (!dept) throw new BadRequestError(`Department ${payload.department_id} not found`);
  }

  // Validate numerics
  if (payload.credit !== undefined && payload.credit !== null && payload.credit <= 0) {
    throw new BadRequestError("credit must be greater than 0");
  }
  if (
    payload.duration_hours !== undefined &&
    payload.duration_hours !== null &&
    payload.duration_hours <= 0
  ) {
    throw new BadRequestError("duration_hours must be greater than 0");
  }

  if (
    payload.effective_from &&
    payload.effective_to &&
    new Date(payload.effective_from) > new Date(payload.effective_to)
  ) {
    throw new BadRequestError("effective_to must be >= effective_from");
  }

  const oldValues = course.toJSON();

  const allowedFields = [
    "course_code",
    "course_name",
    "short_name",
    "description",
    "course_type",
    "credit",
    "duration_hours",
    "department_id",
    "effective_from",
    "effective_to",
  ];
  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) course[field] = payload[field];
  });
  course.updated_by = userId;
  await course.save();

  await writeAuditLog({
    entityId: course.id,
    action: "UPDATE",
    oldValues,
    newValues: course.toJSON(),
    userId,
  });
  return course;
};

// ---------------------------------------------------------------------------
// COURSE-03: Change Status
// ---------------------------------------------------------------------------
const changeStatus = async (id, newStatus, userId, userRole) => {
  if (!isRole(userRole, ROLES.ADMIN))
    throw new ForbiddenError("Only Admin can change course status");

  const course = await Course.findByPk(id);
  if (!course) throw new NotFoundError("Course not found");

  validateStatusTransition(course.status, newStatus);

  // Cannot deactivate/archive if active enrollments exist
  if (["inactive", "archived"].includes(newStatus)) {
    const activeEnrollments = await hasActiveEnrollments(id);
    if (activeEnrollments) {
      throw new BadRequestError(
        `Cannot change status to '${newStatus}' while there are active enrollments`
      );
    }
  }

  const oldStatus = course.status;
  course.status = newStatus;
  course.updated_by = userId;
  await course.save();

  await writeAuditLog({
    entityId: course.id,
    action: "CHANGE_STATUS",
    oldValues: { status: oldStatus },
    newValues: { status: newStatus },
    userId,
  });

  return course;
};

// ---------------------------------------------------------------------------
// COURSE-04: Manage Prerequisites
// ---------------------------------------------------------------------------
const updatePrerequisites = async (courseId, prerequisiteList, userId, userRole) => {
  if (!isRole(userRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Only Admin can manage prerequisites");
  }

  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found");

  // prerequisiteList: [{ prerequisite_course_id, prerequisite_type? }]
  const uniqueIds = [...new Set(prerequisiteList.map((p) => p.prerequisite_course_id))];

  if (uniqueIds.length !== prerequisiteList.length) {
    throw new BadRequestError("Duplicate prerequisite course IDs are not allowed");
  }

  for (const prereqId of uniqueIds) {
    if (prereqId === courseId) {
      throw new BadRequestError("A course cannot be a prerequisite of itself");
    }

    const prereqCourse = await Course.findByPk(prereqId);
    if (!prereqCourse) {
      throw new BadRequestError(`Prerequisite course ${prereqId} not found`);
    }

    const hasCycle = await detectPrerequisiteCycle(courseId, prereqId);
    if (hasCycle) {
      throw new BadRequestError(
        `Adding course ${prereqId} as prerequisite creates a circular dependency`
      );
    }
  }

  // Replace existing prerequisites (delete all then insert)
  await CoursePrerequisite.destroy({ where: { course_id: courseId } });

  const records = prerequisiteList.map((p) => ({
    course_id: courseId,
    prerequisite_course_id: p.prerequisite_course_id,
    prerequisite_type: p.prerequisite_type || "ALL",
    created_by: userId,
    updated_by: userId,
  }));

  if (records.length > 0) {
    await CoursePrerequisite.bulkCreate(records);
  }

  await writeAuditLog({
    entityId: courseId,
    action: "UPDATE",
    newValues: { prerequisites: uniqueIds },
    userId,
  });

  return CoursePrerequisite.findAll({
    where: { course_id: courseId },
    include: [
      {
        model: Course,
        as: "prerequisite_course",
        attributes: ["id", "course_code", "course_name"],
      },
    ],
  });
};

// ---------------------------------------------------------------------------
// COURSE-07: Delete (soft delete with downstream guard)
// ---------------------------------------------------------------------------
const remove = async (id, userId, userRole) => {
  if (!isRole(userRole, ROLES.ADMIN)) throw new ForbiddenError("Only Admin can delete courses");

  const course = await Course.findByPk(id);
  if (!course) throw new NotFoundError("Course not found");

  const downstream = await hasDownstreamData(id);
  if (downstream) {
    throw new BadRequestError(
      "Cannot delete course with existing enrollment data. Change status to Inactive or Archived instead."
    );
  }

  const oldValues = course.toJSON();
  course.is_deleted = true;
  course.updated_by = userId;
  await course.save();

  await writeAuditLog({ entityId: course.id, action: "DELETE", oldValues, userId });
  return true;
};

// ---------------------------------------------------------------------------
// Enrollment helpers (unchanged behaviour)
// ---------------------------------------------------------------------------
const enroll = async (courseId, studentId) => {
  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found");
  if (course.status !== "active") {
    throw new BadRequestError("Course is not available for enrollment");
  }

  const existing = await Enrollment.findOne({
    where: { course_id: courseId, student_id: studentId },
  });
  if (existing) throw new BadRequestError("Already enrolled in this course");

  const enrollment = await Enrollment.create({
    course_id: courseId,
    student_id: studentId,
    status: "active",
  });

  await StudentCourseProgress.create({
    enrollment_id: enrollment.id,
    completion_percentage: 0,
    total_time_spent_minutes: 0,
  });

  return enrollment;
};

const getEnrollments = async (studentId) => {
  return Enrollment.findAll({
    where: { student_id: studentId },
    include: [
      {
        model: Course,
        as: "course",
      },
      { model: StudentCourseProgress, as: "progress" },
    ],
  });
};

// ---------------------------------------------------------------------------
// COURSE-05: Import Courses from Excel
// ---------------------------------------------------------------------------
const importCourses = async (fileBuffer, userId) => {
  const XLSX = require("xlsx");
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

  if (!rows || rows.length === 0) {
    throw new BadRequestError("Excel file is empty or has no data rows");
  }

  const results = { created: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed with header row

    const course_code = String(row["course_code"] || "").trim();
    const course_name = String(row["course_name"] || "").trim();
    const department_id = parseInt(row["department_id"]);

    if (!course_code) {
      results.errors.push({ row: rowNum, error: "course_code is required" });
      continue;
    }
    if (!course_name) {
      results.errors.push({ row: rowNum, error: "course_name is required" });
      continue;
    }
    if (!department_id || isNaN(department_id)) {
      results.errors.push({
        row: rowNum,
        error: "department_id is required and must be an integer",
      });
      continue;
    }

    const dept = await Department.findByPk(department_id);
    if (!dept) {
      results.errors.push({ row: rowNum, error: `department_id ${department_id} not found` });
      continue;
    }

    const existing = await Course.findOne({ where: { course_code } });
    if (existing) {
      results.skipped++;
      continue;
    }

    const effective_from = row["effective_from"] || null;
    const effective_to = row["effective_to"] || null;

    if (effective_from && effective_to && new Date(effective_from) > new Date(effective_to)) {
      results.errors.push({ row: rowNum, error: "effective_to must be >= effective_from" });
      continue;
    }

    await Course.create({
      course_code,
      course_name,
      short_name: String(row["short_name"] || "").trim() || null,
      description: row["description"] || null,
      course_type: String(row["course_type"] || "general").trim(),
      credit: row["credit"] ? parseFloat(row["credit"]) : null,
      duration_hours: row["duration_hours"] ? parseFloat(row["duration_hours"]) : null,
      status: "draft",
      department_id,
      effective_from,
      effective_to,
      is_deleted: false,
      created_by: userId,
      updated_by: userId,
    });
    results.created++;
  }

  return results;
};

// ---------------------------------------------------------------------------
// COURSE-06: Export Courses to Excel
// ---------------------------------------------------------------------------
const exportCourses = async (filters = {}, userRole) => {
  const XLSX = require("xlsx");
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.departmentId) where.department_id = filters.departmentId;
  if (filters.courseType) where.course_type = filters.courseType;
  if (!isRole(userRole, ROLES.ADMIN)) where.status = "active";

  const courses = await Course.findAll({
    where,
    include: [
      { model: Department, as: "department", attributes: ["department_code", "department_name"] },
    ],
    order: [["course_code", "ASC"]],
  });

  const data = courses.map((c) => ({
    course_code: c.course_code,
    course_name: c.course_name,
    short_name: c.short_name || "",
    department_id: c.department_id,
    department_code: c.department?.department_code || "",
    department_name: c.department?.department_name || "",
    course_type: c.course_type,
    credit: c.credit || "",
    duration_hours: c.duration_hours || "",
    status: c.status,
    effective_from: c.effective_from || "",
    effective_to: c.effective_to || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Courses");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

module.exports = {
  create,
  list,
  detail,
  update,
  changeStatus,
  updatePrerequisites,
  remove,
  enroll,
  getEnrollments,
  importCourses,
  exportCourses,
};
