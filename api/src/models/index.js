const sequelize = require("../database/init.mysql.js");
const Role = require("./role.model");
const User = require("./user.model");
const Course = require("./course.model");

const sync = async () => {
  await sequelize.sync();
};

module.exports = {
  sequelize,
  Role,
  User,
  Course,
  sync,
};
