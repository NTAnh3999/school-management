const { OKResponse } = require("../utils/success-responses");
const UserService = require("../services/user.service");
const asyncHandler = require("../utils/async-handler");

const getMe = asyncHandler(async (req, res) => {
  const user = await UserService.getMe(req.user.id);
  return new OKResponse({ metadata: { user } }).send(res);
});

const updateMe = asyncHandler(async (req, res) => {
  const data = await UserService.updateMe(req.user.id, { fullName: req.body?.fullName });
  return new OKResponse({ message: "Profile updated", metadata: { user: data } }).send(res);
});

module.exports = { getMe, updateMe };
