const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/error-responses");
const { CourseModule, Course, Lesson, AuditLog } = require("../models");
const { ROLES, isRole } = require("../constants/roles");

const create = async (courseId, { title, description, displayOrder }, userId, userRole) => {
  if (!title) throw new BadRequestError("Missing title");

  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found");

  if (!isRole(userRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Not authorized to add modules to this course");
  }

  const courseModule = await CourseModule.create({
    course_id: courseId,
    title,
    description,
    display_order: displayOrder || 0,
    status: "draft",
    created_by: userId,
    updated_by: userId,
  });

  await AuditLog.create({
    entity_name: "CourseModule",
    entity_id: courseModule.id,
    course_id: courseId,
    action: "CREATE",
    new_values: { title },
    changed_by: userId,
    source: "api",
  });

  return courseModule;
};

const list = async (courseId) => {
  return CourseModule.findAll({
    where: { course_id: courseId },
    include: [{ model: Lesson, as: "lessons" }],
    order: [
      ["display_order", "ASC"],
      [{ model: Lesson, as: "lessons" }, "display_order", "ASC"],
    ],
  });
};

const detail = async (id) => {
  const courseModule = await CourseModule.findByPk(id, {
    include: [
      { model: Course, as: "course" },
      { model: Lesson, as: "lessons" },
    ],
  });
  if (!courseModule) throw new NotFoundError("Module not found");
  return courseModule;
};

const update = async (id, payload, userId, userRole) => {
  const courseModule = await CourseModule.findByPk(id, {
    include: [{ model: Course, as: "course" }],
  });
  if (!courseModule) throw new NotFoundError("Module not found");

  if (!isRole(userRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Not authorized to update this module");
  }

  const { title, description, displayOrder } = payload;
  courseModule.title = title ?? courseModule.title;
  courseModule.description = description ?? courseModule.description;
  courseModule.display_order = displayOrder ?? courseModule.display_order;
  courseModule.updated_by = userId;

  await courseModule.save();
  return courseModule;
};

const remove = async (id, userId, userRole) => {
  const courseModule = await CourseModule.findByPk(id, {
    include: [{ model: Course, as: "course" }],
  });
  if (!courseModule) throw new NotFoundError("Module not found");

  if (!isRole(userRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Not authorized to delete this module");
  }

  await courseModule.destroy();
  return true;
};

const archive = async (id, userId, userRole) => {
  const courseModule = await CourseModule.findByPk(id, {
    include: [{ model: Course, as: "course" }],
  });
  if (!courseModule) throw new NotFoundError("Module not found");
  if (courseModule.status === "archived") throw new BadRequestError("Module is already archived");

  if (!isRole(userRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Not authorized to archive this module");
  }

  courseModule.status = "archived";
  courseModule.updated_by = userId;
  await courseModule.save();

  await AuditLog.create({
    entity_name: "CourseModule",
    entity_id: courseModule.id,
    course_id: courseModule.course_id,
    action: "CHANGE_STATUS",
    new_values: { status: "archived" },
    changed_by: userId,
    source: "api",
  });

  return courseModule;
};

const reorder = async (courseId, orderedIds, userId, userRole) => {
  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found");

  if (!isRole(userRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Not authorized to reorder modules in this course");
  }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new BadRequestError("orderedIds must be a non-empty array");
  }

  const modules = await CourseModule.findAll({ where: { course_id: courseId } });
  const moduleMap = new Map(modules.map((m) => [m.id, m]));

  for (let i = 0; i < orderedIds.length; i++) {
    const courseModule = moduleMap.get(orderedIds[i]);
    if (!courseModule)
      throw new BadRequestError(`Module ${orderedIds[i]} not found in this course`);
    courseModule.display_order = i;
    courseModule.updated_by = userId;
    await courseModule.save();
  }

  return CourseModule.findAll({
    where: { course_id: courseId },
    include: [{ model: Lesson, as: "lessons" }],
    order: [["display_order", "ASC"]],
  });
};

module.exports = { create, list, detail, update, remove, archive, reorder };
