const { OKResponse } = require("../utils/success-responses");
const UserService = require("../services/user.service");

const getMe = async (req, res, next) => {
  try {
    const user = await UserService.getMe(req.user.id);
    return new OKResponse({ metadata: { user } }).send(res);
  } catch (err) {
    return next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const data = await UserService.updateMe(req.user.id, { fullName: req.body?.fullName });
    return new OKResponse({ message: "Profile updated", metadata: { user: data } }).send(res);
  } catch (err) {
    return next(err);
  }
};

module.exports = { getMe, updateMe };
