const { BadRequestError, NotFoundError } = require("../utils/error-responses");
const { Reward, StudentReward, Enrollment, User, Course } = require("../models");

const createReward = async ({ title, description, rewardType, pointsValue, iconUrl }) => {
  if (!title) throw new BadRequestError("Missing title");

  return Reward.create({
    title,
    description,
    reward_type: rewardType || "badge",
    points_value: pointsValue || 0,
    icon_url: iconUrl,
  });
};

const awardReward = async (studentId, rewardId, enrollmentId = null) => {
  const student = await User.findByPk(studentId);
  if (!student) throw new NotFoundError("Student not found");

  const reward = await Reward.findByPk(rewardId);
  if (!reward) throw new NotFoundError("Reward not found");

  // Check if already awarded
  const existing = await StudentReward.findOne({
    where: {
      student_id: studentId,
      reward_id: rewardId,
      enrollment_id: enrollmentId,
    },
  });

  if (existing) throw new BadRequestError("Reward already awarded");

  const studentReward = await StudentReward.create({
    student_id: studentId,
    reward_id: rewardId,
    enrollment_id: enrollmentId,
  });

  // Send notification
  const NotificationService = require("./notification.service");
  await NotificationService.create(studentId, {
    type: "reward",
    title: "New Reward Earned!",
    message: `Congratulations! You earned: ${reward.title}`,
  });

  return studentReward;
};

const getStudentRewards = async (studentId) => {
  return StudentReward.findAll({
    where: { student_id: studentId },
    include: [
      { model: Reward, as: "reward" },
      { model: Enrollment, as: "enrollment", include: [{ model: Course, as: "course" }] },
    ],
    order: [["earned_at", "DESC"]],
  });
};

const getAllRewards = async () => {
  return Reward.findAll({
    order: [["created_at", "DESC"]],
  });
};

module.exports = { createReward, awardReward, getStudentRewards, getAllRewards };
