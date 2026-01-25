const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/error-responses");
const {
  Course,
  User,
  CourseSection,
  Lesson,
  Enrollment,
  CourseReview,
  StudentCourseProgress,
} = require("../models");
const Role = require("../models/role.model");

const create = async ({ title, description, level, price, instructorId }) => {
  if (!title || !instructorId) throw new BadRequestError("Missing title or instructorId");
  const instructor = await User.findByPk(instructorId, { include: [{ model: Role, as: "role" }] });
  if (!instructor) throw new BadRequestError("Instructor not found");
  if (instructor.role?.name !== "instructor" && instructor.role?.name !== "admin") {
    throw new BadRequestError("Assigned user must be an instructor or admin");
  }
  const course = await Course.create({
    title,
    description,
    level: level || "beginner",
    price: price || 0,
    status: "draft",
    instructor_id: instructorId,
  });
  return course;
};

const list = async (filters = {}) => {
  const where = {};
  if (filters.level) where.level = filters.level;
  if (filters.status) where.status = filters.status;
  if (filters.instructorId) where.instructor_id = filters.instructorId;

  return Course.findAll({
    where,
    include: [
      { model: User, as: "instructor", attributes: ["id", "full_name", "email"] },
      { model: CourseReview, as: "reviews", attributes: ["rating"] },
    ],
  });
};

const detail = async (id) => {
  const course = await Course.findByPk(id, {
    include: [
      { model: User, as: "instructor", attributes: ["id", "full_name", "email"] },
      {
        model: CourseSection,
        as: "sections",
        include: [{ model: Lesson, as: "lessons" }],
      },
      { model: CourseReview, as: "reviews" },
    ],
  });
  if (!course) throw new NotFoundError("Course not found");
  return course;
};

const update = async (id, payload, userId, userRole) => {
  const course = await Course.findByPk(id);
  if (!course) throw new NotFoundError("Course not found");

  // Check authorization
  if (userRole !== "admin" && course.instructor_id !== userId) {
    throw new ForbiddenError("Not authorized to update this course");
  }

  const { title, description, level, price, status } = payload;
  course.title = title ?? course.title;
  course.description = description ?? course.description;
  course.level = level ?? course.level;
  course.price = price ?? course.price;
  course.status = status ?? course.status;

  await course.save();
  return course;
};

const remove = async (id, userId, userRole) => {
  const course = await Course.findByPk(id);
  if (!course) throw new NotFoundError("Course not found");

  // Check authorization
  if (userRole !== "admin" && course.instructor_id !== userId) {
    throw new ForbiddenError("Not authorized to delete this course");
  }

  await course.destroy();
  return true;
};

const enroll = async (courseId, studentId) => {
  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found");
  if (course.status !== "published")
    throw new BadRequestError("Course is not available for enrollment");

  const existing = await Enrollment.findOne({
    where: { course_id: courseId, student_id: studentId },
  });
  if (existing) throw new BadRequestError("Already enrolled in this course");

  const enrollment = await Enrollment.create({
    course_id: courseId,
    student_id: studentId,
    status: "active",
  });

  // Create initial progress record
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
        include: [{ model: User, as: "instructor", attributes: ["id", "full_name"] }],
      },
      { model: StudentCourseProgress, as: "progress" },
    ],
  });
};

module.exports = { create, list, detail, update, remove, enroll, getEnrollments };
