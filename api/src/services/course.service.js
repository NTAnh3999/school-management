const { BadRequestError, NotFoundError } = require("../utils/error-responses");
const { Course, User } = require("../models");
const Role = require("../models/role.model");

const create = async ({ name, description, startDate, endDate, teacherId }) => {
  if (!name || !teacherId) throw new BadRequestError("Missing name or teacherId");
  const teacher = await User.findByPk(teacherId, { include: [{ model: Role, as: "role" }] });
  if (!teacher) throw new BadRequestError("Teacher not found");
  if (teacher.role?.name !== "Teacher" && teacher.role?.name !== "Admin") {
    throw new BadRequestError("Assigned user must be a Teacher or Admin");
  }
  const course = await Course.create({
    name,
    description,
    start_date: startDate || null,
    end_date: endDate || null,
    teacher_id: teacherId,
  });
  return course;
};

const list = async () => {
  return Course.findAll({
    include: [{ model: User, as: "teacher", attributes: ["id", "full_name", "email"] }],
  });
};

const detail = async (id) => {
  const course = await Course.findByPk(id, {
    include: [{ model: User, as: "teacher", attributes: ["id", "full_name", "email"] }],
  });
  if (!course) throw new NotFoundError("Course not found");
  return course;
};

const update = async (id, payload) => {
  const course = await Course.findByPk(id);
  if (!course) throw new NotFoundError("Course not found");
  const { name, description, startDate, endDate, teacherId } = payload;
  if (teacherId) {
    const teacher = await User.findByPk(teacherId, { include: [{ model: Role, as: "role" }] });
    if (!teacher) throw new BadRequestError("Teacher not found");
    if (teacher.role?.name !== "Teacher" && teacher.role?.name !== "Admin") {
      throw new BadRequestError("Assigned user must be a Teacher or Admin");
    }
    course.teacher_id = teacherId;
  }
  course.name = name ?? course.name;
  course.description = description ?? course.description;
  course.start_date = startDate ?? course.start_date;
  course.end_date = endDate ?? course.end_date;
  await course.save();
  return course;
};

const remove = async (id) => {
  const course = await Course.findByPk(id);
  if (!course) throw new NotFoundError("Course not found");
  await course.destroy();
  return true;
};

module.exports = { create, list, detail, update, remove };
