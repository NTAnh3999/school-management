const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");
const config = require("../configs/db.config.js");

const sequelize = new Sequelize({
  username: config.username,
  password: config.password,
  database: config.database,
  host: config.host,
  dialect: config.dialect,
  logging: false,
});

const ensureDatabase = async () => {
  try {
    const conn = await mysql.createConnection({
      host: config.host,
      user: config.username,
      password: config.password,
    });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
    await conn.end();
    console.log(`Database ensured: ${config.database}`);
  } catch (err) {
    console.warn("Database ensure skipped:", err.message);
  }
};

(async () => {
  try {
    await ensureDatabase();
    await sequelize.authenticate();
    console.log("Database connection established.");
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
  }
})();

module.exports = sequelize;
