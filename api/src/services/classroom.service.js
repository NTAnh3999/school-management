"use strict";
const { Op } = require("sequelize");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require("../utils/error-responses");
const {
  Classroom,
  ClassroomTeacher,
  ClassroomSession,
  ClassroomEnrollment,
  Course,
  ContentVersion,
  User,
  AuditLog,
} = require("../models");
const NotificationService = require("./notification.service");
const { ROLES, isRole } = require("../constants/roles");
const sequelize = require("../database/init.mysql.js");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CLASSROOM_STATUSES = {
  DRAFT: "draft",
  OPEN: "open",
  FULL: "full",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  ARCHIVED: "archived",
};

const VALID_TRANSITIONS = {
  draft: ["open", "cancelled"],
  open: ["full", "in_progress", "cancelled"],
  full: ["open", "in_progress"],
  in_progress: ["completed", "cancelled"],
  completed: ["archived"],
  cancelled: ["archived"],
  archived: [],
};

const canTransition = (from, to) => (VALID_TRANSITIONS[from] || []).includes(to);

const ACTIVE_ENROLLMENT_STATUSES = ["pending_approval", "enrolled", "waitlisted"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const writeAuditLog = async ({
  classroomId,
  action,
  oldValues,
  newValues,
  actorId,
  source = "web",
}) => {
  await AuditLog.create({
    entity_name: "Classroom",
    entity_id: classroomId,
    source,
    action,
    old_values: oldValues || null,
    new_values: newValues || null,
    changed_by: actorId || null,
    changed_at: new Date(),
  });
};

const generateClassroomCode = async (courseCode) => {
  const prefix = courseCode
    ? `CLS-${courseCode.toUpperCase().replace(/\s+/g, "-").slice(0, 20)}`
    : "CLS";
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const latest = await Classroom.findOne({
    where: { classroom_code: { [Op.like]: `${prefix}-${ym}-%` } },
    order: [["classroom_code", "DESC"]],
    paranoid: false,
  });
  let seq = 1;
  if (latest) {
    const parts = latest.classroom_code.split("-");
    const last = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(last)) seq = last + 1;
  }
  return `${prefix}-${ym}-${String(seq).padStart(3, "0")}`;
};

const getActiveEnrolledCount = async (classroomId) => {
  return ClassroomEnrollment.count({
    where: { classroom_id: classroomId, enrollment_status: "enrolled" },
  });
};

const notifyClassroomParticipants = async (classroomId, { type, title, message }) => {
  const enrollments = await ClassroomEnrollment.findAll({
    where: {
      classroom_id: classroomId,
      enrollment_status: { [Op.in]: ["enrolled", "pending_approval"] },
    },
    attributes: ["student_id"],
  });
  const teachers = await ClassroomTeacher.findAll({
    where: { classroom_id: classroomId, active_flag: true },
    attributes: ["user_id"],
  });

  const userIds = [
    ...new Set([...enrollments.map((e) => e.student_id), ...teachers.map((t) => t.user_id)]),
  ];

  await Promise.all(
    userIds.map((userId) => NotificationService.create(userId, { type, title, message }))
  );
};

// ---------------------------------------------------------------------------
// SC-01: List Classrooms
// ---------------------------------------------------------------------------
const list = async (filters = {}, actorId, actorRole) => {
  const {
    keyword,
    status,
    course_id,
    teacher_id,
    delivery_method,
    date_from,
    date_to,
    enrollment_availability,
    page = 1,
    page_size = 20,
  } = filters;

  const where = {};

  if (keyword) {
    where[Op.or] = [
      { classroom_code: { [Op.like]: `%${keyword}%` } },
      { classroom_name: { [Op.like]: `%${keyword}%` } },
    ];
  }
  if (status) where.status = status;
  if (course_id) where.course_id = parseInt(course_id);
  if (delivery_method) where.delivery_method = delivery_method;
  if (date_from || date_to) {
    where.start_date = {};
    if (date_from) where.start_date[Op.gte] = date_from;
    if (date_to) where.start_date[Op.lte] = date_to;
  }
  if (enrollment_availability === "available") {
    where[Op.and] = [
      { status: { [Op.in]: ["open"] } },
      sequelize.literal("enrolled_count < max_capacity"),
    ];
  } else if (enrollment_availability === "full") {
    where.status = "full";
  }

  // Role-based scoping
  if (isRole(actorRole, ROLES.STUDENT)) {
    const enrolled = await ClassroomEnrollment.findAll({
      where: { student_id: actorId },
      attributes: ["classroom_id"],
    });
    where.id = { [Op.in]: enrolled.map((e) => e.classroom_id) };
  } else if (isRole(actorRole, ROLES.TEACHER)) {
    if (teacher_id && parseInt(teacher_id) !== actorId) {
      throw new ForbiddenError("Teachers can only view their own classrooms");
    }
    const assigned = await ClassroomTeacher.findAll({
      where: { user_id: actorId, active_flag: true },
      attributes: ["classroom_id"],
    });
    where.id = { [Op.in]: assigned.map((t) => t.classroom_id) };
  }

  // Filter by teacher_id for admin (join)
  let teacherWhere = null;
  if (isRole(actorRole, ROLES.ADMIN) && teacher_id) {
    teacherWhere = parseInt(teacher_id);
  }

  const offset = (parseInt(page) - 1) * parseInt(page_size);

  let classroomIds = null;
  if (teacherWhere) {
    const rows = await ClassroomTeacher.findAll({
      where: { user_id: teacherWhere, active_flag: true },
      attributes: ["classroom_id"],
    });
    classroomIds = rows.map((r) => r.classroom_id);
    if (classroomIds.length === 0) {
      return { items: [], total: 0, page: parseInt(page), page_size: parseInt(page_size) };
    }
    where.id = { [Op.in]: classroomIds };
  }

  const { count, rows } = await Classroom.findAndCountAll({
    where,
    include: [
      { model: Course, as: "course", attributes: ["id", "course_code", "course_name"] },
      {
        model: ContentVersion,
        as: "course_version",
        attributes: ["id", "version_label", "version_no"],
      },
      {
        model: ClassroomTeacher,
        as: "teachers",
        where: { role_in_classroom: "main_teacher", active_flag: true },
        required: false,
        include: [{ model: User, as: "user", attributes: ["id", "full_name", "email"] }],
      },
    ],
    order: [["created_at", "DESC"]],
    limit: parseInt(page_size),
    offset,
    distinct: true,
  });

  return {
    items: rows,
    total: count,
    page: parseInt(page),
    page_size: parseInt(page_size),
  };
};

// ---------------------------------------------------------------------------
// SC-04: Get Classroom Detail
// ---------------------------------------------------------------------------
const detail = async (classroomId, actorId, actorRole) => {
  const classroom = await Classroom.findByPk(classroomId, {
    include: [
      {
        model: Course,
        as: "course",
        attributes: ["id", "course_code", "course_name", "status", "description"],
      },
      {
        model: ContentVersion,
        as: "course_version",
        attributes: ["id", "version_label", "version_no", "status"],
      },
      {
        model: ClassroomTeacher,
        as: "teachers",
        include: [{ model: User, as: "user", attributes: ["id", "full_name", "email"] }],
      },
    ],
  });

  if (!classroom) throw new NotFoundError("Classroom not found");

  // Students can only view classrooms they are enrolled in
  if (isRole(actorRole, ROLES.STUDENT)) {
    const enr = await ClassroomEnrollment.findOne({
      where: { classroom_id: classroomId, student_id: actorId },
    });
    if (!enr) throw new ForbiddenError("Access denied");
  }

  return classroom;
};

// ---------------------------------------------------------------------------
// SC-02: Create Classroom
// ---------------------------------------------------------------------------
const create = async (data, actorId) => {
  const {
    course_id,
    course_version_id,
    classroom_code,
    classroom_name,
    description,
    delivery_method,
    campus_id,
    location,
    online_meeting_link,
    academic_year,
    term,
    language,
    tags,
    start_date,
    end_date,
    main_teacher_id,
    co_teacher_ids = [],
    teaching_assistant_ids = [],
    teacher_notes,
    enrollment_mode,
    enrollment_start_date,
    enrollment_end_date,
    min_capacity,
    max_capacity,
    waitlist_enabled,
    approval_required,
    visibility,
  } = data;

  // Validate course exists and is published
  const course = await Course.findByPk(course_id);
  if (!course) throw new NotFoundError("Course not found");
  if (course.status !== "active") {
    throw new BadRequestError("Classroom can only be created from a published (active) course");
  }

  // Validate course version if provided
  if (course_version_id) {
    const cv = await ContentVersion.findOne({
      where: { id: course_version_id, course_id },
    });
    if (!cv) throw new NotFoundError("Course version not found for this course");
  }

  // Date validation
  if (end_date < start_date) {
    throw new BadRequestError("End date must be greater than or equal to start date");
  }
  if (enrollment_start_date && enrollment_end_date && enrollment_end_date < enrollment_start_date) {
    throw new BadRequestError("Enrollment end date cannot be before enrollment start date");
  }

  // Capacity validation
  if (!max_capacity || parseInt(max_capacity) <= 0) {
    throw new BadRequestError("Maximum capacity must be greater than 0");
  }
  if (min_capacity && parseInt(min_capacity) > parseInt(max_capacity)) {
    throw new BadRequestError("Minimum capacity cannot exceed maximum capacity");
  }

  // Delivery method location validation
  if (["offline", "hybrid"].includes(delivery_method) && !location) {
    throw new BadRequestError("Location is required for offline/hybrid delivery");
  }
  if (["online", "hybrid"].includes(delivery_method) && !online_meeting_link) {
    // Just a warning-level constraint; not hard blocking per FSD
  }

  // Resolve classroom code
  let resolvedCode = classroom_code;
  if (!resolvedCode) {
    resolvedCode = await generateClassroomCode(course.course_code || "");
  } else {
    // Check uniqueness
    const existing = await Classroom.findOne({
      where: { classroom_code: resolvedCode },
    });
    if (existing)
      throw new ConflictError("Classroom code already exists. Please use another code.");
  }

  const classroom = await sequelize.transaction(async (t) => {
    const cls = await Classroom.create(
      {
        classroom_code: resolvedCode,
        classroom_name,
        description,
        course_id,
        course_version_id: course_version_id || null,
        status: CLASSROOM_STATUSES.DRAFT,
        delivery_method,
        campus_id: campus_id || null,
        location: location || null,
        online_meeting_link: online_meeting_link || null,
        academic_year: academic_year || null,
        term: term || null,
        language: language || null,
        tags: tags || null,
        start_date,
        end_date,
        enrollment_mode: enrollment_mode || "manual",
        enrollment_start_date: enrollment_start_date || null,
        enrollment_end_date: enrollment_end_date || null,
        min_capacity: min_capacity ? parseInt(min_capacity) : 0,
        max_capacity: parseInt(max_capacity),
        enrolled_count: 0,
        waitlist_enabled: Boolean(waitlist_enabled),
        approval_required: Boolean(approval_required),
        visibility: visibility || "internal",
        created_by: actorId,
        updated_by: actorId,
      },
      { transaction: t }
    );

    // Assign teachers
    const teacherAssignments = [];
    if (main_teacher_id) {
      teacherAssignments.push({
        classroom_id: cls.id,
        user_id: main_teacher_id,
        role_in_classroom: "main_teacher",
        assigned_by: actorId,
        active_flag: true,
      });
    }
    for (const uid of co_teacher_ids) {
      teacherAssignments.push({
        classroom_id: cls.id,
        user_id: uid,
        role_in_classroom: "co_teacher",
        assigned_by: actorId,
        active_flag: true,
      });
    }
    for (const uid of teaching_assistant_ids) {
      teacherAssignments.push({
        classroom_id: cls.id,
        user_id: uid,
        role_in_classroom: "teaching_assistant",
        assigned_by: actorId,
        active_flag: true,
      });
    }
    if (teacherAssignments.length > 0) {
      await ClassroomTeacher.bulkCreate(teacherAssignments, { transaction: t });
    }

    await writeAuditLog({
      classroomId: cls.id,
      action: "CREATE",
      newValues: { classroom_code: resolvedCode, classroom_name, status: "draft" },
      actorId,
    });

    return cls;
  });

  return classroom;
};

// ---------------------------------------------------------------------------
// SC-03: Update Classroom
// ---------------------------------------------------------------------------
const update = async (classroomId, data, actorId, actorRole) => {
  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");

  const { status } = classroom;

  // Archived classrooms cannot be edited
  if (status === CLASSROOM_STATUSES.ARCHIVED) {
    throw new ForbiddenError("Archived classroom cannot be edited");
  }
  if (status === CLASSROOM_STATUSES.CANCELLED && !isRole(actorRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Cancelled classroom cannot be edited");
  }

  // Course cannot be changed once In Progress
  if (status === CLASSROOM_STATUSES.IN_PROGRESS && data.course_id !== undefined) {
    throw new BadRequestError("Cannot change course once classroom is in progress");
  }

  // Capacity validation
  if (data.max_capacity !== undefined) {
    const newMax = parseInt(data.max_capacity);
    if (newMax <= 0) throw new BadRequestError("Maximum capacity must be greater than 0");
    const activeCount = await getActiveEnrolledCount(classroomId);
    if (newMax < activeCount) {
      throw new BadRequestError(
        `Maximum capacity (${newMax}) cannot be lower than current enrolled count (${activeCount})`
      );
    }
  }

  const oldValues = {
    classroom_name: classroom.classroom_name,
    status: classroom.status,
    start_date: classroom.start_date,
    end_date: classroom.end_date,
    max_capacity: classroom.max_capacity,
    delivery_method: classroom.delivery_method,
    location: classroom.location,
  };

  const allowedFields = [
    "classroom_name",
    "description",
    "delivery_method",
    "campus_id",
    "location",
    "online_meeting_link",
    "academic_year",
    "term",
    "language",
    "tags",
    "start_date",
    "end_date",
    "enrollment_mode",
    "enrollment_start_date",
    "enrollment_end_date",
    "min_capacity",
    "max_capacity",
    "waitlist_enabled",
    "approval_required",
    "visibility",
  ];

  // Restrict fields for In Progress
  const restrictedInProgress = ["course_id", "course_version_id"];
  for (const field of restrictedInProgress) {
    if (data[field] !== undefined && status === CLASSROOM_STATUSES.IN_PROGRESS) {
      throw new BadRequestError(
        `Field "${field}" cannot be changed while classroom is in progress`
      );
    }
  }

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      classroom[field] = data[field];
    }
  }

  if (data.course_version_id !== undefined && status === CLASSROOM_STATUSES.DRAFT) {
    classroom.course_version_id = data.course_version_id;
  }

  classroom.updated_by = actorId;
  await classroom.save();

  // Notify on schedule change if open/in_progress
  if (
    (data.start_date || data.end_date) &&
    [CLASSROOM_STATUSES.OPEN, CLASSROOM_STATUSES.IN_PROGRESS].includes(status)
  ) {
    await notifyClassroomParticipants(classroomId, {
      type: "classroom_update",
      title: "Classroom Schedule Updated",
      message: `The schedule for classroom "${classroom.classroom_name}" has been updated.`,
    });
  }

  await writeAuditLog({
    classroomId,
    action: "UPDATE",
    oldValues,
    newValues: data,
    actorId,
  });

  return classroom;
};

// ---------------------------------------------------------------------------
// SC-10: Publish Classroom (Draft -> Open)
// ---------------------------------------------------------------------------
const publish = async (classroomId, actorId) => {
  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");

  if (!canTransition(classroom.status, CLASSROOM_STATUSES.OPEN)) {
    throw new BadRequestError(
      `Cannot publish classroom in status "${classroom.status}". Must be "draft".`
    );
  }

  // Validation
  const course = await Course.findByPk(classroom.course_id);
  if (!course || course.status !== "active") {
    throw new BadRequestError("Classroom can only be published from a published (active) course");
  }

  if (!classroom.classroom_name) throw new BadRequestError("Classroom name is required");

  const mainTeacher = await ClassroomTeacher.findOne({
    where: { classroom_id: classroomId, role_in_classroom: "main_teacher", active_flag: true },
  });
  if (!mainTeacher)
    throw new BadRequestError("Please assign a main teacher before publishing the classroom");

  if (!classroom.start_date || !classroom.end_date) {
    throw new BadRequestError("Start date and end date are required before publishing");
  }
  if (classroom.end_date < classroom.start_date) {
    throw new BadRequestError("End date must be greater than or equal to start date");
  }
  if (!classroom.max_capacity || classroom.max_capacity <= 0) {
    throw new BadRequestError("Maximum capacity must be greater than 0");
  }

  const oldStatus = classroom.status;
  classroom.status = CLASSROOM_STATUSES.OPEN;
  classroom.updated_by = actorId;
  await classroom.save();

  await writeAuditLog({
    classroomId,
    action: "CHANGE_STATUS",
    oldValues: { status: oldStatus },
    newValues: { status: CLASSROOM_STATUSES.OPEN },
    actorId,
  });

  // Notify teachers
  await notifyClassroomParticipants(classroomId, {
    type: "classroom_published",
    title: "Classroom Published",
    message: `Classroom "${classroom.classroom_name}" is now open for enrollment.`,
  });

  return classroom;
};

// ---------------------------------------------------------------------------
// SC-11: Cancel Classroom
// ---------------------------------------------------------------------------
const cancel = async (classroomId, { reason } = {}, actorId) => {
  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");

  if (!canTransition(classroom.status, CLASSROOM_STATUSES.CANCELLED)) {
    throw new BadRequestError(`Cannot cancel classroom in status "${classroom.status}"`);
  }

  const oldStatus = classroom.status;
  classroom.status = CLASSROOM_STATUSES.CANCELLED;
  classroom.cancelled_reason = reason || null;
  classroom.updated_by = actorId;
  await classroom.save();

  await writeAuditLog({
    classroomId,
    action: "CHANGE_STATUS",
    oldValues: { status: oldStatus },
    newValues: { status: CLASSROOM_STATUSES.CANCELLED, reason },
    actorId,
  });

  await notifyClassroomParticipants(classroomId, {
    type: "classroom_cancelled",
    title: "Classroom Cancelled",
    message: `Classroom "${classroom.classroom_name}" has been cancelled.${reason ? ` Reason: ${reason}` : ""}`,
  });

  return classroom;
};

// ---------------------------------------------------------------------------
// SC-12: Complete Classroom
// ---------------------------------------------------------------------------
const complete = async (classroomId, actorId) => {
  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");

  if (!canTransition(classroom.status, CLASSROOM_STATUSES.COMPLETED)) {
    throw new BadRequestError(
      `Cannot complete classroom in status "${classroom.status}". Must be "in_progress".`
    );
  }

  const oldStatus = classroom.status;
  classroom.status = CLASSROOM_STATUSES.COMPLETED;
  classroom.updated_by = actorId;
  await classroom.save();

  await writeAuditLog({
    classroomId,
    action: "CHANGE_STATUS",
    oldValues: { status: oldStatus },
    newValues: { status: CLASSROOM_STATUSES.COMPLETED },
    actorId,
  });

  await notifyClassroomParticipants(classroomId, {
    type: "classroom_completed",
    title: "Classroom Completed",
    message: `Classroom "${classroom.classroom_name}" has been marked as completed.`,
  });

  return classroom;
};

// ---------------------------------------------------------------------------
// Archive Classroom
// ---------------------------------------------------------------------------
const archive = async (classroomId, actorId) => {
  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");

  if (!canTransition(classroom.status, CLASSROOM_STATUSES.ARCHIVED)) {
    throw new BadRequestError(
      `Cannot archive classroom in status "${classroom.status}". Must be "completed" or "cancelled".`
    );
  }

  const oldStatus = classroom.status;
  classroom.status = CLASSROOM_STATUSES.ARCHIVED;
  classroom.updated_by = actorId;
  await classroom.save();

  await writeAuditLog({
    classroomId,
    action: "CHANGE_STATUS",
    oldValues: { status: oldStatus },
    newValues: { status: CLASSROOM_STATUSES.ARCHIVED },
    actorId,
  });

  return classroom;
};

// ---------------------------------------------------------------------------
// Start Classroom (Open/Full -> In Progress)
// ---------------------------------------------------------------------------
const start = async (classroomId, actorId) => {
  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");

  if (!canTransition(classroom.status, CLASSROOM_STATUSES.IN_PROGRESS)) {
    throw new BadRequestError(
      `Cannot start classroom in status "${classroom.status}". Must be "open" or "full".`
    );
  }

  const oldStatus = classroom.status;
  classroom.status = CLASSROOM_STATUSES.IN_PROGRESS;
  classroom.updated_by = actorId;
  await classroom.save();

  await writeAuditLog({
    classroomId,
    action: "CHANGE_STATUS",
    oldValues: { status: oldStatus },
    newValues: { status: CLASSROOM_STATUSES.IN_PROGRESS },
    actorId,
  });

  return classroom;
};

// ---------------------------------------------------------------------------
// Duplicate Classroom
// ---------------------------------------------------------------------------
const duplicate = async (classroomId, actorId) => {
  const classroom = await Classroom.findByPk(classroomId, {
    include: [
      { model: ClassroomTeacher, as: "teachers", where: { active_flag: true }, required: false },
    ],
  });
  if (!classroom) throw new NotFoundError("Classroom not found");

  const course = await Course.findByPk(classroom.course_id);
  const newCode = await generateClassroomCode(course?.course_code || "");

  const newClassroom = await sequelize.transaction(async (t) => {
    const cls = await Classroom.create(
      {
        classroom_code: newCode,
        classroom_name: `${classroom.classroom_name} (Copy)`,
        description: classroom.description,
        course_id: classroom.course_id,
        course_version_id: classroom.course_version_id,
        status: CLASSROOM_STATUSES.DRAFT,
        delivery_method: classroom.delivery_method,
        campus_id: classroom.campus_id,
        location: classroom.location,
        online_meeting_link: classroom.online_meeting_link,
        academic_year: classroom.academic_year,
        term: classroom.term,
        language: classroom.language,
        tags: classroom.tags,
        start_date: classroom.start_date,
        end_date: classroom.end_date,
        enrollment_mode: classroom.enrollment_mode,
        enrollment_start_date: classroom.enrollment_start_date,
        enrollment_end_date: classroom.enrollment_end_date,
        min_capacity: classroom.min_capacity,
        max_capacity: classroom.max_capacity,
        enrolled_count: 0,
        waitlist_enabled: classroom.waitlist_enabled,
        approval_required: classroom.approval_required,
        visibility: classroom.visibility,
        created_by: actorId,
        updated_by: actorId,
      },
      { transaction: t }
    );

    // Copy teachers (not students per FSD edge case)
    if (classroom.teachers && classroom.teachers.length > 0) {
      const teacherData = classroom.teachers.map((ct) => ({
        classroom_id: cls.id,
        user_id: ct.user_id,
        role_in_classroom: ct.role_in_classroom,
        assigned_by: actorId,
        active_flag: true,
      }));
      await ClassroomTeacher.bulkCreate(teacherData, { transaction: t });
    }

    await writeAuditLog({
      classroomId: cls.id,
      action: "CREATE",
      newValues: { duplicated_from: classroomId, classroom_code: newCode },
      actorId,
    });

    return cls;
  });

  return newClassroom;
};

// ---------------------------------------------------------------------------
// SC-05: Assign / Update Teachers
// ---------------------------------------------------------------------------
const assignTeachers = async (
  classroomId,
  { main_teacher_id, co_teacher_ids = [], teaching_assistant_ids = [] },
  actorId
) => {
  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");

  if ([CLASSROOM_STATUSES.ARCHIVED, CLASSROOM_STATUSES.CANCELLED].includes(classroom.status)) {
    throw new ForbiddenError("Cannot assign teachers to an archived or cancelled classroom");
  }

  await sequelize.transaction(async (t) => {
    // Deactivate existing main teacher if changing
    if (main_teacher_id) {
      const oldMain = await ClassroomTeacher.findOne({
        where: { classroom_id: classroomId, role_in_classroom: "main_teacher", active_flag: true },
        transaction: t,
      });
      if (oldMain && oldMain.user_id !== main_teacher_id) {
        oldMain.active_flag = false;
        await oldMain.save({ transaction: t });

        await writeAuditLog({
          classroomId,
          action: "UPDATE",
          oldValues: { main_teacher_id: oldMain.user_id },
          newValues: { main_teacher_id },
          actorId,
        });
      }

      await ClassroomTeacher.upsert(
        {
          classroom_id: classroomId,
          user_id: main_teacher_id,
          role_in_classroom: "main_teacher",
          assigned_by: actorId,
          active_flag: true,
        },
        { transaction: t }
      );
    }

    // Reset co-teachers
    if (co_teacher_ids.length > 0) {
      await ClassroomTeacher.update(
        { active_flag: false },
        { where: { classroom_id: classroomId, role_in_classroom: "co_teacher" }, transaction: t }
      );
      const data = co_teacher_ids.map((uid) => ({
        classroom_id: classroomId,
        user_id: uid,
        role_in_classroom: "co_teacher",
        assigned_by: actorId,
        active_flag: true,
      }));
      await ClassroomTeacher.bulkCreate(data, {
        updateOnDuplicate: ["active_flag", "assigned_by", "assigned_at"],
        transaction: t,
      });
    }

    // Reset TAs
    if (teaching_assistant_ids.length > 0) {
      await ClassroomTeacher.update(
        { active_flag: false },
        {
          where: { classroom_id: classroomId, role_in_classroom: "teaching_assistant" },
          transaction: t,
        }
      );
      const data = teaching_assistant_ids.map((uid) => ({
        classroom_id: classroomId,
        user_id: uid,
        role_in_classroom: "teaching_assistant",
        assigned_by: actorId,
        active_flag: true,
      }));
      await ClassroomTeacher.bulkCreate(data, {
        updateOnDuplicate: ["active_flag", "assigned_by", "assigned_at"],
        transaction: t,
      });
    }
  });

  // Notify new main teacher
  if (main_teacher_id) {
    await NotificationService.create(main_teacher_id, {
      type: "teacher_assigned",
      title: "You have been assigned to a classroom",
      message: `You are now the main teacher for classroom "${classroom.classroom_name}".`,
    });
  }

  return detail(classroomId, actorId, ROLES.ADMIN);
};

// ---------------------------------------------------------------------------
// SC-08: Get Students in Classroom
// ---------------------------------------------------------------------------
const listStudents = async (classroomId, filters = {}, actorId, actorRole) => {
  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");

  // Students cannot see other students' list
  if (isRole(actorRole, ROLES.STUDENT)) {
    throw new ForbiddenError("Students cannot view the full student roster");
  }

  const { status, page = 1, page_size = 50 } = filters;
  const where = { classroom_id: classroomId };
  if (status) where.enrollment_status = status;

  const { count, rows } = await ClassroomEnrollment.findAndCountAll({
    where,
    include: [{ model: User, as: "student", attributes: ["id", "full_name", "email"] }],
    order: [["enrollment_date", "ASC"]],
    limit: parseInt(page_size),
    offset: (parseInt(page) - 1) * parseInt(page_size),
  });

  return { items: rows, total: count, page: parseInt(page), page_size: parseInt(page_size) };
};

// ---------------------------------------------------------------------------
// SC-08: Add Student to Classroom
// ---------------------------------------------------------------------------
const addStudent = async (classroomId, { student_id, source = "manual", notes }, actorId) => {
  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");

  if ([CLASSROOM_STATUSES.CANCELLED, CLASSROOM_STATUSES.ARCHIVED].includes(classroom.status)) {
    throw new BadRequestError("Cannot add students to a cancelled or archived classroom");
  }

  // Check for existing active enrollment
  const existing = await ClassroomEnrollment.findOne({
    where: {
      classroom_id: classroomId,
      student_id,
      enrollment_status: { [Op.in]: ACTIVE_ENROLLMENT_STATUSES },
    },
  });
  if (existing) throw new ConflictError("This student is already enrolled in this classroom");

  // Capacity check
  const activeCount = await getActiveEnrolledCount(classroomId);
  if (activeCount >= classroom.max_capacity) {
    if (classroom.waitlist_enabled) {
      // Add to waitlist
      const enrollment = await ClassroomEnrollment.create({
        classroom_id: classroomId,
        student_id,
        enrollment_status: "waitlisted",
        source,
        notes,
        created_by: actorId,
        updated_by: actorId,
      });

      await writeAuditLog({
        classroomId,
        action: "UPDATE",
        newValues: { action: "student_waitlisted", student_id },
        actorId,
      });

      return { enrollment, waitlisted: true };
    }
    throw new BadRequestError("This classroom has reached maximum capacity");
  }

  // Approval or direct enrollment
  const enrollmentStatus = classroom.approval_required ? "pending_approval" : "enrolled";

  const enrollment = await sequelize.transaction(async (t) => {
    const enr = await ClassroomEnrollment.create(
      {
        classroom_id: classroomId,
        student_id,
        enrollment_status: enrollmentStatus,
        source,
        notes,
        approved_by: enrollmentStatus === "enrolled" ? actorId : null,
        approved_at: enrollmentStatus === "enrolled" ? new Date() : null,
        created_by: actorId,
        updated_by: actorId,
      },
      { transaction: t }
    );

    if (enrollmentStatus === "enrolled") {
      await Classroom.increment("enrolled_count", {
        by: 1,
        where: { id: classroomId },
        transaction: t,
      });

      // Auto-transition to Full if at capacity
      const newCount = activeCount + 1;
      if (newCount >= classroom.max_capacity && classroom.status === CLASSROOM_STATUSES.OPEN) {
        await Classroom.update(
          { status: CLASSROOM_STATUSES.FULL, updated_by: actorId },
          { where: { id: classroomId }, transaction: t }
        );
      }
    }

    await writeAuditLog({
      classroomId,
      action: "UPDATE",
      newValues: { action: "student_added", student_id, enrollment_status: enrollmentStatus },
      actorId,
    });

    return enr;
  });

  // Notify student
  await NotificationService.create(student_id, {
    type: "classroom_enrolled",
    title: "You have been added to a classroom",
    message: `You have been ${enrollmentStatus === "enrolled" ? "enrolled in" : "added (pending approval) to"} classroom "${classroom.classroom_name}".`,
  });

  // Notify main teacher
  const mainTeacher = await ClassroomTeacher.findOne({
    where: { classroom_id: classroomId, role_in_classroom: "main_teacher", active_flag: true },
  });
  if (mainTeacher) {
    await NotificationService.create(mainTeacher.user_id, {
      type: "student_added",
      title: "New student added to your classroom",
      message: `A new student has been added to classroom "${classroom.classroom_name}".`,
    });
  }

  return { enrollment, waitlisted: false };
};

// ---------------------------------------------------------------------------
// SC-08: Remove Student from Classroom
// ---------------------------------------------------------------------------
const removeStudent = async (classroomId, studentId, { reason } = {}, actorId) => {
  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");

  const enrollment = await ClassroomEnrollment.findOne({
    where: {
      classroom_id: classroomId,
      student_id: studentId,
      enrollment_status: { [Op.in]: ACTIVE_ENROLLMENT_STATUSES },
    },
  });

  if (!enrollment)
    throw new NotFoundError("Active enrollment for this student not found in classroom");

  const wasEnrolled = enrollment.enrollment_status === "enrolled";
  const oldStatus = enrollment.enrollment_status;

  enrollment.enrollment_status = "withdrawn";
  enrollment.withdrawn_reason = reason || null;
  enrollment.updated_by = actorId;
  await enrollment.save();

  if (wasEnrolled) {
    await Classroom.decrement("enrolled_count", { by: 1, where: { id: classroomId } });

    // If classroom was Full, revert to Open
    if (classroom.status === CLASSROOM_STATUSES.FULL) {
      await Classroom.update(
        { status: CLASSROOM_STATUSES.OPEN, updated_by: actorId },
        { where: { id: classroomId } }
      );
    }
  }

  await writeAuditLog({
    classroomId,
    action: "UPDATE",
    oldValues: { enrollment_status: oldStatus, student_id: studentId },
    newValues: { enrollment_status: "withdrawn", reason },
    actorId,
  });

  // Notify student
  await NotificationService.create(studentId, {
    type: "classroom_removed",
    title: "Removed from classroom",
    message: `You have been removed from classroom "${classroom.classroom_name}".${reason ? ` Reason: ${reason}` : ""}`,
  });

  return enrollment;
};

// ---------------------------------------------------------------------------
// SC-08: Transfer Student to Another Classroom
// ---------------------------------------------------------------------------
const transferStudent = async (
  classroomId,
  studentId,
  { target_classroom_id, notes } = {},
  actorId
) => {
  if (!target_classroom_id) throw new BadRequestError("Target classroom ID is required");

  const [sourceClassroom, targetClassroom] = await Promise.all([
    Classroom.findByPk(classroomId),
    Classroom.findByPk(target_classroom_id),
  ]);

  if (!sourceClassroom) throw new NotFoundError("Source classroom not found");
  if (!targetClassroom) throw new NotFoundError("Target classroom not found");

  if (
    [CLASSROOM_STATUSES.CANCELLED, CLASSROOM_STATUSES.ARCHIVED].includes(targetClassroom.status)
  ) {
    throw new BadRequestError("Cannot transfer student to a cancelled or archived classroom");
  }

  const sourceEnrollment = await ClassroomEnrollment.findOne({
    where: {
      classroom_id: classroomId,
      student_id: studentId,
      enrollment_status: { [Op.in]: ACTIVE_ENROLLMENT_STATUSES },
    },
  });
  if (!sourceEnrollment) throw new NotFoundError("Active enrollment not found in source classroom");

  // Check target capacity
  const targetCount = await getActiveEnrolledCount(target_classroom_id);
  if (targetCount >= targetClassroom.max_capacity) {
    throw new BadRequestError("Target classroom has reached maximum capacity");
  }

  // Check duplicate in target
  const existingInTarget = await ClassroomEnrollment.findOne({
    where: {
      classroom_id: target_classroom_id,
      student_id: studentId,
      enrollment_status: { [Op.in]: ACTIVE_ENROLLMENT_STATUSES },
    },
  });
  if (existingInTarget) {
    throw new ConflictError("Student is already enrolled in the target classroom");
  }

  await sequelize.transaction(async (t) => {
    // Update source enrollment
    sourceEnrollment.enrollment_status = "transferred";
    sourceEnrollment.transferred_to_classroom_id = target_classroom_id;
    sourceEnrollment.updated_by = actorId;
    await sourceEnrollment.save({ transaction: t });

    if (sourceEnrollment.enrollment_status === "enrolled") {
      await Classroom.decrement("enrolled_count", {
        by: 1,
        where: { id: classroomId },
        transaction: t,
      });
    }

    // Create enrollment in target
    await ClassroomEnrollment.create(
      {
        classroom_id: target_classroom_id,
        student_id: studentId,
        enrollment_status: "enrolled",
        source: "manual",
        notes,
        approved_by: actorId,
        approved_at: new Date(),
        created_by: actorId,
        updated_by: actorId,
      },
      { transaction: t }
    );

    await Classroom.increment("enrolled_count", {
      by: 1,
      where: { id: target_classroom_id },
      transaction: t,
    });

    await writeAuditLog({
      classroomId,
      action: "UPDATE",
      oldValues: { student_id: studentId, classroom_id: classroomId },
      newValues: { transferred_to: target_classroom_id },
      actorId,
    });
  });

  // Notify student
  await NotificationService.create(studentId, {
    type: "classroom_transferred",
    title: "Transferred to a new classroom",
    message: `You have been transferred from "${sourceClassroom.classroom_name}" to "${targetClassroom.classroom_name}".`,
  });

  return { success: true };
};

// ---------------------------------------------------------------------------
// Update Student Enrollment Status
// ---------------------------------------------------------------------------
const updateStudentStatus = async (classroomId, studentId, { status, notes }, actorId) => {
  const enrollment = await ClassroomEnrollment.findOne({
    where: { classroom_id: classroomId, student_id: studentId },
  });
  if (!enrollment) throw new NotFoundError("Enrollment not found");

  const oldStatus = enrollment.enrollment_status;

  if (status === "enrolled" && oldStatus === "pending_approval") {
    enrollment.approved_by = actorId;
    enrollment.approved_at = new Date();
    await Classroom.increment("enrolled_count", { by: 1, where: { id: classroomId } });
  }

  enrollment.enrollment_status = status;
  if (notes) enrollment.notes = notes;
  enrollment.updated_by = actorId;
  await enrollment.save();

  await writeAuditLog({
    classroomId,
    action: "UPDATE",
    oldValues: { enrollment_status: oldStatus, student_id: studentId },
    newValues: { enrollment_status: status },
    actorId,
  });

  return enrollment;
};

// ---------------------------------------------------------------------------
// SC-06: List Sessions
// ---------------------------------------------------------------------------
const listSessions = async (classroomId) => {
  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");

  return ClassroomSession.findAll({
    where: { classroom_id: classroomId },
    include: [{ model: User, as: "teacher", attributes: ["id", "full_name"] }],
    order: [
      ["session_date", "ASC"],
      ["start_time", "ASC"],
    ],
  });
};

// ---------------------------------------------------------------------------
// SC-06: Create Session
// ---------------------------------------------------------------------------
const createSession = async (classroomId, data, actorId) => {
  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");

  if (
    [
      CLASSROOM_STATUSES.ARCHIVED,
      CLASSROOM_STATUSES.CANCELLED,
      CLASSROOM_STATUSES.COMPLETED,
    ].includes(classroom.status)
  ) {
    throw new ForbiddenError("Cannot add sessions to this classroom");
  }

  const { session_date, start_time, end_time } = data;

  if (end_time <= start_time) {
    throw new BadRequestError("End time must be after start time");
  }
  if (session_date < classroom.start_date || session_date > classroom.end_date) {
    throw new BadRequestError("Session date must be within the classroom date range");
  }

  // Auto-assign session number
  const lastSession = await ClassroomSession.findOne({
    where: { classroom_id: classroomId },
    order: [["session_no", "DESC"]],
  });
  const sessionNo = lastSession ? lastSession.session_no + 1 : 1;

  // Resolve teacher: default to main teacher
  let teacherId = data.teacher_id;
  if (!teacherId) {
    const mainTeacher = await ClassroomTeacher.findOne({
      where: { classroom_id: classroomId, role_in_classroom: "main_teacher", active_flag: true },
    });
    teacherId = mainTeacher?.user_id || null;
  }

  const session = await ClassroomSession.create({
    classroom_id: classroomId,
    session_no: sessionNo,
    session_title: data.session_title || null,
    session_date,
    start_time,
    end_time,
    teacher_id: teacherId,
    location: data.location || classroom.location,
    online_meeting_link: data.online_meeting_link || classroom.online_meeting_link,
    status: "scheduled",
    notes: data.notes || null,
  });

  await writeAuditLog({
    classroomId,
    action: "UPDATE",
    newValues: { action: "session_created", session_id: session.id, session_date },
    actorId,
  });

  return session;
};

// ---------------------------------------------------------------------------
// Generate Sessions from Recurrence
// ---------------------------------------------------------------------------
const generateSessions = async (
  classroomId,
  { start_time, end_time, session_days = [], recurrence_type },
  actorId
) => {
  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");

  if (!classroom.start_date || !classroom.end_date) {
    throw new BadRequestError("Classroom must have start and end dates to generate sessions");
  }
  if (end_time <= start_time) {
    throw new BadRequestError("End time must be after start time");
  }
  if (!session_days || session_days.length === 0) {
    throw new BadRequestError("At least one session day is required");
  }

  // Day of week mapping: 0=Sun, 1=Mon, ..., 6=Sat
  const DAY_MAP = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const targetDays = session_days
    .map((d) => DAY_MAP[d.toLowerCase()])
    .filter((d) => d !== undefined);

  const mainTeacher = await ClassroomTeacher.findOne({
    where: { classroom_id: classroomId, role_in_classroom: "main_teacher", active_flag: true },
  });

  const sessions = [];
  const current = new Date(classroom.start_date);
  const end = new Date(classroom.end_date);
  let sessionNo = 1;

  while (current <= end) {
    if (targetDays.includes(current.getDay())) {
      const dateStr = current.toISOString().split("T")[0];
      sessions.push({
        classroom_id: classroomId,
        session_no: sessionNo++,
        session_date: dateStr,
        start_time,
        end_time,
        teacher_id: mainTeacher?.user_id || null,
        location: classroom.location,
        online_meeting_link: classroom.online_meeting_link,
        status: "scheduled",
      });
    }
    current.setDate(current.getDate() + 1);
  }

  if (sessions.length === 0) {
    throw new BadRequestError("No sessions generated for the given recurrence pattern");
  }

  // Remove old scheduled sessions before regenerating
  await ClassroomSession.destroy({
    where: { classroom_id: classroomId, status: "scheduled" },
  });

  const created = await ClassroomSession.bulkCreate(sessions);

  await writeAuditLog({
    classroomId,
    action: "UPDATE",
    newValues: { action: "sessions_generated", count: created.length },
    actorId,
  });

  return created;
};

// ---------------------------------------------------------------------------
// Update Session
// ---------------------------------------------------------------------------
const updateSession = async (classroomId, sessionId, data, actorId, actorRole) => {
  const session = await ClassroomSession.findOne({
    where: { id: sessionId, classroom_id: classroomId },
  });
  if (!session) throw new NotFoundError("Session not found");

  if (session.status === "completed" && !isRole(actorRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Only admins can modify a completed session");
  }

  const oldValues = {
    session_date: session.session_date,
    start_time: session.start_time,
    end_time: session.end_time,
    status: session.status,
  };

  // Track rescheduling
  if (data.session_date && data.session_date !== session.session_date) {
    if (!session.original_date) {
      session.original_date = session.session_date;
      session.original_start_time = session.start_time;
      session.original_end_time = session.end_time;
    }
    session.status = "rescheduled";
  }

  const updatableFields = [
    "session_title",
    "session_date",
    "start_time",
    "end_time",
    "teacher_id",
    "location",
    "online_meeting_link",
    "status",
    "notes",
  ];
  for (const field of updatableFields) {
    if (data[field] !== undefined) session[field] = data[field];
  }

  await session.save();

  await writeAuditLog({
    classroomId,
    action: "UPDATE",
    oldValues: { session_id: sessionId, ...oldValues },
    newValues: data,
    actorId,
  });

  // Notify on reschedule
  if (data.session_date || data.start_time || data.end_time) {
    const classroom = await Classroom.findByPk(classroomId);
    await notifyClassroomParticipants(classroomId, {
      type: "schedule_updated",
      title: "Session Schedule Updated",
      message: `A session in classroom "${classroom?.classroom_name}" has been rescheduled.`,
    });
  }

  return session;
};

// ---------------------------------------------------------------------------
// Delete Session
// ---------------------------------------------------------------------------
const deleteSession = async (classroomId, sessionId, actorId, actorRole) => {
  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");

  const session = await ClassroomSession.findOne({
    where: { id: sessionId, classroom_id: classroomId },
  });
  if (!session) throw new NotFoundError("Session not found");

  if (session.status === "completed") {
    if (!isRole(actorRole, ROLES.ADMIN)) {
      throw new ForbiddenError("Cannot delete a completed session");
    }
    // Admin can cancel instead of delete
    session.status = "cancelled";
    await session.save();
  } else {
    await session.destroy();
  }

  await writeAuditLog({
    classroomId,
    action: "DELETE",
    oldValues: { session_id: sessionId },
    actorId,
  });

  return { success: true };
};

// ---------------------------------------------------------------------------
// Get Activity Log
// ---------------------------------------------------------------------------
const getActivityLog = async (classroomId) => {
  return AuditLog.findAll({
    where: { entity_name: "Classroom", entity_id: classroomId },
    include: [{ model: User, as: "changed_by_user", attributes: ["id", "full_name"] }],
    order: [["changed_at", "DESC"]],
  });
};

module.exports = {
  list,
  detail,
  create,
  update,
  publish,
  cancel,
  complete,
  archive,
  start,
  duplicate,
  assignTeachers,
  listStudents,
  addStudent,
  removeStudent,
  transferStudent,
  updateStudentStatus,
  listSessions,
  createSession,
  generateSessions,
  updateSession,
  deleteSession,
  getActivityLog,
};
