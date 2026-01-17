const { NotFoundError, BadRequestError } = require("../utils/error-responses");
const { User } = require("../models");
const Role = require("../models/role.model");

const getMe = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "email", "full_name"],
    include: [{ model: Role, as: "role" }],
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
};

const updateMe = async (userId, { fullName }) => {
  if (!fullName) throw new BadRequestError("Missing fullName");
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError("User not found");
  user.full_name = fullName;
  await user.save();
  return { id: user.id, email: user.email, full_name: user.full_name };
};

module.exports = { getMe, updateMe };
