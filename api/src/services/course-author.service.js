const { BadRequestError, NotFoundError } = require("../utils/error-responses");
const { CourseAuthor, Course, User } = require("../models");

const assign = async (courseId, userId, roleInCourse, actorId) => {
  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found");

  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError("User not found");

  const [assignment] = await CourseAuthor.findOrCreate({
    where: { course_id: courseId, user_id: userId },
    defaults: {
      course_id: courseId,
      user_id: userId,
      role_in_course: roleInCourse || "primary_author",
      assigned_by: actorId,
      active_flag: true,
    },
  });

  if (!assignment.active_flag || assignment.role_in_course !== (roleInCourse || assignment.role_in_course)) {
    assignment.active_flag = true;
    assignment.role_in_course = roleInCourse || assignment.role_in_course;
    assignment.assigned_by = actorId;
    assignment.assigned_at = new Date();
    await assignment.save();
  }

  return assignment;
};

const revoke = async (courseId, userId) => {
  const assignment = await CourseAuthor.findOne({ where: { course_id: courseId, user_id: userId } });
  if (!assignment) throw new NotFoundError("Author assignment not found");
  if (!assignment.active_flag) throw new BadRequestError("Author assignment is already revoked");

  assignment.active_flag = false;
  await assignment.save();
  return assignment;
};

const listForCourse = async (courseId) => {
  return CourseAuthor.findAll({
    where: { course_id: courseId, active_flag: true },
    include: [{ model: User, as: "user" }],
    order: [["assigned_at", "ASC"]],
  });
};

const isAssignedAuthor = async (courseId, userId) => {
  const assignment = await CourseAuthor.findOne({
    where: { course_id: courseId, user_id: userId, active_flag: true },
  });
  return Boolean(assignment);
};

module.exports = { assign, revoke, listForCourse, isAssignedAuthor };
