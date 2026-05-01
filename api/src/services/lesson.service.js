const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/error-responses");
const { Lesson, CourseSection, Course, Quiz, LessonFeedback, AuditLog } = require("../models");
const { ROLES, isRole } = require("../constants/roles");

const create = async (sectionId, payload, userId, userRole) => {
  const { title, content, lessonType, videoUrl, durationMinutes, orderIndex } = payload;
  if (!title) throw new BadRequestError("Missing title");

  const section = await CourseSection.findByPk(sectionId, {
    include: [{ model: Course, as: "course" }],
  });
  if (!section) throw new NotFoundError("Section not found");

  // Check authorization
  if (!isRole(userRole, ROLES.ADMIN) && section.course.teacher_id !== userId) {
    throw new ForbiddenError("Not authorized to add lessons to this section");
  }

  const lesson = await Lesson.create({
    section_id: sectionId,
    title,
    content,
    lesson_type: lessonType || "text",
    video_url: videoUrl,
    duration_minutes: durationMinutes || 0,
    order_index: orderIndex || 0,
    status: "draft",
    created_by: userId,
    updated_by: userId,
  });

  await AuditLog.create({
    entity_name: "Lesson",
    entity_id: lesson.id,
    course_id: section.course_id,
    action: "CREATE",
    new_values: { title, lessonType },
    changed_by: userId,
    source: "api",
  });

  return lesson;
};

const list = async (sectionId) => {
  return Lesson.findAll({
    where: { section_id: sectionId },
    include: [{ model: Quiz, as: "quiz" }],
    order: [["order_index", "ASC"]],
  });
};

const detail = async (id) => {
  const lesson = await Lesson.findByPk(id, {
    include: [
      { model: CourseSection, as: "section", include: [{ model: Course, as: "course" }] },
      { model: Quiz, as: "quiz" },
      { model: LessonFeedback, as: "feedback" },
    ],
  });
  if (!lesson) throw new NotFoundError("Lesson not found");
  return lesson;
};

const update = async (id, payload, userId, userRole) => {
  const lesson = await Lesson.findByPk(id, {
    include: [{ model: CourseSection, as: "section", include: [{ model: Course, as: "course" }] }],
  });
  if (!lesson) throw new NotFoundError("Lesson not found");

  // Check authorization
  if (!isRole(userRole, ROLES.ADMIN) && lesson.section.course.teacher_id !== userId) {
    throw new ForbiddenError("Not authorized to update this lesson");
  }

  const { title, content, lessonType, videoUrl, durationMinutes, orderIndex } = payload;
  lesson.title = title ?? lesson.title;
  lesson.content = content ?? lesson.content;
  lesson.lesson_type = lessonType ?? lesson.lesson_type;
  lesson.video_url = videoUrl ?? lesson.video_url;
  lesson.duration_minutes = durationMinutes ?? lesson.duration_minutes;
  lesson.order_index = orderIndex ?? lesson.order_index;
  lesson.updated_by = userId;

  await lesson.save();
  return lesson;
};

const remove = async (id, userId, userRole) => {
  const lesson = await Lesson.findByPk(id, {
    include: [{ model: CourseSection, as: "section", include: [{ model: Course, as: "course" }] }],
  });
  if (!lesson) throw new NotFoundError("Lesson not found");

  // Check authorization
  if (!isRole(userRole, ROLES.ADMIN) && lesson.section.course.teacher_id !== userId) {
    throw new ForbiddenError("Not authorized to delete this lesson");
  }

  await lesson.destroy();
  return true;
};

const archive = async (id, userId, userRole) => {
  const lesson = await Lesson.findByPk(id, {
    include: [{ model: CourseSection, as: "section", include: [{ model: Course, as: "course" }] }],
  });
  if (!lesson) throw new NotFoundError("Lesson not found");
  if (lesson.status === "archived") throw new BadRequestError("Lesson is already archived");

  if (!isRole(userRole, ROLES.ADMIN) && lesson.section.course.teacher_id !== userId) {
    throw new ForbiddenError("Not authorized to archive this lesson");
  }

  lesson.status = "archived";
  lesson.updated_by = userId;
  await lesson.save();

  await AuditLog.create({
    entity_name: "Lesson",
    entity_id: lesson.id,
    course_id: lesson.section.course_id,
    action: "CHANGE_STATUS",
    new_values: { status: "archived" },
    changed_by: userId,
    source: "api",
  });

  return lesson;
};

module.exports = { create, list, detail, update, remove, archive };
