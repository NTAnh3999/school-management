const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/error-responses");
const { Lesson, CourseModule, Course, Quiz, LessonFeedback, AuditLog } = require("../models");
const { ROLES, isRole } = require("../constants/roles");

const create = async (moduleId, payload, userId, userRole) => {
  const { title, lessonSummary, content, lessonType, videoUrl, durationMinutes, displayOrder } =
    payload;
  if (!title) throw new BadRequestError("Missing title");

  const courseModule = await CourseModule.findByPk(moduleId, {
    include: [{ model: Course, as: "course" }],
  });
  if (!courseModule) throw new NotFoundError("Module not found");

  if (!isRole(userRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Not authorized to add lessons to this module");
  }

  const lesson = await Lesson.create({
    module_id: moduleId,
    title,
    lesson_summary: lessonSummary,
    content,
    lesson_type: lessonType || "Standard",
    video_url: videoUrl,
    duration_minutes: durationMinutes || 0,
    display_order: displayOrder || 0,
    status: "draft",
    created_by: userId,
    updated_by: userId,
  });

  await AuditLog.create({
    entity_name: "Lesson",
    entity_id: lesson.id,
    course_id: courseModule.course_id,
    action: "CREATE",
    new_values: { title, lessonType },
    changed_by: userId,
    source: "api",
  });

  return lesson;
};

const list = async (moduleId) => {
  return Lesson.findAll({
    where: { module_id: moduleId },
    include: [{ model: Quiz, as: "quiz" }],
    order: [["display_order", "ASC"]],
  });
};

const detail = async (id) => {
  const lesson = await Lesson.findByPk(id, {
    include: [
      { model: CourseModule, as: "module", include: [{ model: Course, as: "course" }] },
      { model: Quiz, as: "quiz" },
      { model: LessonFeedback, as: "feedback" },
    ],
  });
  if (!lesson) throw new NotFoundError("Lesson not found");
  return lesson;
};

const update = async (id, payload, userId, userRole) => {
  const lesson = await Lesson.findByPk(id, {
    include: [{ model: CourseModule, as: "module", include: [{ model: Course, as: "course" }] }],
  });
  if (!lesson) throw new NotFoundError("Lesson not found");

  if (!isRole(userRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Not authorized to update this lesson");
  }

  const { title, lessonSummary, content, lessonType, videoUrl, durationMinutes, displayOrder } =
    payload;
  lesson.title = title ?? lesson.title;
  lesson.lesson_summary = lessonSummary ?? lesson.lesson_summary;
  lesson.content = content ?? lesson.content;
  lesson.lesson_type = lessonType ?? lesson.lesson_type;
  lesson.video_url = videoUrl ?? lesson.video_url;
  lesson.duration_minutes = durationMinutes ?? lesson.duration_minutes;
  lesson.display_order = displayOrder ?? lesson.display_order;
  lesson.updated_by = userId;

  await lesson.save();
  return lesson;
};

const remove = async (id, userId, userRole) => {
  const lesson = await Lesson.findByPk(id, {
    include: [{ model: CourseModule, as: "module", include: [{ model: Course, as: "course" }] }],
  });
  if (!lesson) throw new NotFoundError("Lesson not found");

  if (!isRole(userRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Not authorized to delete this lesson");
  }

  await lesson.destroy();
  return true;
};

const archive = async (id, userId, userRole) => {
  const lesson = await Lesson.findByPk(id, {
    include: [{ model: CourseModule, as: "module", include: [{ model: Course, as: "course" }] }],
  });
  if (!lesson) throw new NotFoundError("Lesson not found");
  if (lesson.status === "archived") throw new BadRequestError("Lesson is already archived");

  if (!isRole(userRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Not authorized to archive this lesson");
  }

  lesson.status = "archived";
  lesson.updated_by = userId;
  await lesson.save();

  await AuditLog.create({
    entity_name: "Lesson",
    entity_id: lesson.id,
    course_id: lesson.module.course_id,
    action: "CHANGE_STATUS",
    new_values: { status: "archived" },
    changed_by: userId,
    source: "api",
  });

  return lesson;
};

module.exports = { create, list, detail, update, remove, archive };
