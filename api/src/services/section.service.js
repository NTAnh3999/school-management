const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/error-responses");
const { CourseSection, Course, Lesson, AuditLog } = require("../models");
const { ROLES, isRole } = require("../constants/roles");

const create = async (courseId, { title, description, orderIndex }, userId, userRole) => {
  if (!title) throw new BadRequestError("Missing title");

  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found");

  // Check authorization
  if (!isRole(userRole, ROLES.ADMIN) && course.teacher_id !== userId) {
    throw new ForbiddenError("Not authorized to add sections to this course");
  }

  const section = await CourseSection.create({
    course_id: courseId,
    title,
    description,
    order_index: orderIndex || 0,
    status: "draft",
    created_by: userId,
    updated_by: userId,
  });

  await AuditLog.create({
    entity_name: "CourseSection",
    entity_id: section.id,
    course_id: courseId,
    action: "CREATE",
    new_values: { title },
    changed_by: userId,
    source: "api",
  });

  return section;
};

const list = async (courseId) => {
  return CourseSection.findAll({
    where: { course_id: courseId },
    include: [{ model: Lesson, as: "lessons" }],
    order: [
      ["order_index", "ASC"],
      [{ model: Lesson, as: "lessons" }, "order_index", "ASC"],
    ],
  });
};

const detail = async (id) => {
  const section = await CourseSection.findByPk(id, {
    include: [
      { model: Course, as: "course" },
      { model: Lesson, as: "lessons" },
    ],
  });
  if (!section) throw new NotFoundError("Section not found");
  return section;
};

const update = async (id, payload, userId, userRole) => {
  const section = await CourseSection.findByPk(id, {
    include: [{ model: Course, as: "course" }],
  });
  if (!section) throw new NotFoundError("Section not found");

  // Check authorization
  if (!isRole(userRole, ROLES.ADMIN) && section.course.teacher_id !== userId) {
    throw new ForbiddenError("Not authorized to update this section");
  }

  const { title, description, orderIndex } = payload;
  section.title = title ?? section.title;
  section.description = description ?? section.description;
  section.order_index = orderIndex ?? section.order_index;
  section.updated_by = userId;

  await section.save();
  return section;
};

const remove = async (id, userId, userRole) => {
  const section = await CourseSection.findByPk(id, {
    include: [{ model: Course, as: "course" }],
  });
  if (!section) throw new NotFoundError("Section not found");

  // Check authorization
  if (!isRole(userRole, ROLES.ADMIN) && section.course.teacher_id !== userId) {
    throw new ForbiddenError("Not authorized to delete this section");
  }

  await section.destroy();
  return true;
};

const archive = async (id, userId, userRole) => {
  const section = await CourseSection.findByPk(id, {
    include: [{ model: Course, as: "course" }],
  });
  if (!section) throw new NotFoundError("Section not found");
  if (section.status === "archived") throw new BadRequestError("Section is already archived");

  if (!isRole(userRole, ROLES.ADMIN) && section.course.teacher_id !== userId) {
    throw new ForbiddenError("Not authorized to archive this section");
  }

  section.status = "archived";
  section.updated_by = userId;
  await section.save();

  await AuditLog.create({
    entity_name: "CourseSection",
    entity_id: section.id,
    course_id: section.course_id,
    action: "CHANGE_STATUS",
    new_values: { status: "archived" },
    changed_by: userId,
    source: "api",
  });

  return section;
};

const reorder = async (courseId, orderedIds, userId, userRole) => {
  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found");

  if (!isRole(userRole, ROLES.ADMIN) && course.teacher_id !== userId) {
    throw new ForbiddenError("Not authorized to reorder sections in this course");
  }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new BadRequestError("orderedIds must be a non-empty array");
  }

  const sections = await CourseSection.findAll({ where: { course_id: courseId } });
  const sectionMap = new Map(sections.map((s) => [s.id, s]));

  for (let i = 0; i < orderedIds.length; i++) {
    const section = sectionMap.get(orderedIds[i]);
    if (!section) throw new BadRequestError(`Section ${orderedIds[i]} not found in this course`);
    section.order_index = i;
    section.updated_by = userId;
    await section.save();
  }

  return CourseSection.findAll({
    where: { course_id: courseId },
    include: [{ model: Lesson, as: "lessons" }],
    order: [["order_index", "ASC"]],
  });
};

module.exports = { create, list, detail, update, remove, archive, reorder };
