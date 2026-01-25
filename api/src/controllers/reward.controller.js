const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const RewardService = require("../services/reward.service");
const asyncHandler = require("../utils/async-handler");

const createReward = asyncHandler(async (req, res) => {
  const reward = await RewardService.createReward(req.body);
  return new CreatedResponse({ message: "Reward created", metadata: { reward } }).send(res);
});

const awardReward = asyncHandler(async (req, res) => {
  const { studentId, rewardId, enrollmentId } = req.body;
  const studentReward = await RewardService.awardReward(studentId, rewardId, enrollmentId);
  return new CreatedResponse({ message: "Reward awarded", metadata: { studentReward } }).send(res);
});

const getStudentRewards = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId || req.user.id;
  const rewards = await RewardService.getStudentRewards(studentId);
  return new OKResponse({ metadata: { rewards } }).send(res);
});

const getAllRewards = asyncHandler(async (req, res) => {
  const rewards = await RewardService.getAllRewards();
  return new OKResponse({ metadata: { rewards } }).send(res);
});

module.exports = { createReward, awardReward, getStudentRewards, getAllRewards };
