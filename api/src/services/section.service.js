const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/error-responses");
const { CourseSection, Course, Lesson } = require("../models");

const create = async (courseId, { title, description, orderIndex }, userId, userRole) => {
  if (!title) throw new BadRequestError("Missing title");

  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found");

  // Check authorization
  if (userRole !== "admin" && course.instructor_id !== userId) {
    throw new ForbiddenError("Not authorized to add sections to this course");
  }

  const section = await CourseSection.create({
    course_id: courseId,
    title,
    description,
    order_index: orderIndex || 0,
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
  if (userRole !== "admin" && section.course.instructor_id !== userId) {
    throw new ForbiddenError("Not authorized to update this section");
  }

  const { title, description, orderIndex } = payload;
  section.title = title ?? section.title;
  section.description = description ?? section.description;
  section.order_index = orderIndex ?? section.order_index;

  await section.save();
  return section;
};

const remove = async (id, userId, userRole) => {
  const section = await CourseSection.findByPk(id, {
    include: [{ model: Course, as: "course" }],
  });
  if (!section) throw new NotFoundError("Section not found");

  // Check authorization
  if (userRole !== "admin" && section.course.instructor_id !== userId) {
    throw new ForbiddenError("Not authorized to delete this section");
  }

  await section.destroy();
  return true;
};

module.exports = { create, list, detail, update, remove };
