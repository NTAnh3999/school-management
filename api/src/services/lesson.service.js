const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/error-responses");
const { Lesson, CourseSection, Course, Quiz, LessonFeedback } = require("../models");

const create = async (sectionId, payload, userId, userRole) => {
  const { title, content, lessonType, videoUrl, durationMinutes, orderIndex } = payload;
  if (!title) throw new BadRequestError("Missing title");

  const section = await CourseSection.findByPk(sectionId, {
    include: [{ model: Course, as: "course" }],
  });
  if (!section) throw new NotFoundError("Section not found");

  // Check authorization
  if (userRole !== "admin" && section.course.instructor_id !== userId) {
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
  if (userRole !== "admin" && lesson.section.course.instructor_id !== userId) {
    throw new ForbiddenError("Not authorized to update this lesson");
  }

  const { title, content, lessonType, videoUrl, durationMinutes, orderIndex } = payload;
  lesson.title = title ?? lesson.title;
  lesson.content = content ?? lesson.content;
  lesson.lesson_type = lessonType ?? lesson.lesson_type;
  lesson.video_url = videoUrl ?? lesson.video_url;
  lesson.duration_minutes = durationMinutes ?? lesson.duration_minutes;
  lesson.order_index = orderIndex ?? lesson.order_index;

  await lesson.save();
  return lesson;
};

const remove = async (id, userId, userRole) => {
  const lesson = await Lesson.findByPk(id, {
    include: [{ model: CourseSection, as: "section", include: [{ model: Course, as: "course" }] }],
  });
  if (!lesson) throw new NotFoundError("Lesson not found");

  // Check authorization
  if (userRole !== "admin" && lesson.section.course.instructor_id !== userId) {
    throw new ForbiddenError("Not authorized to delete this lesson");
  }

  await lesson.destroy();
  return true;
};

module.exports = { create, list, detail, update, remove };
