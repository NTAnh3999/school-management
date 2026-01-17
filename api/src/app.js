const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const app = express();

// Core middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize database connection
require("./database/init.mysql.js");

// Sync models to the database, then seed baseline data (roles)
const { sync } = require("./models");
const { ensureSeedData } = require("./database/seed");

(async () => {
  try {
    await sync();
    await ensureSeedData();
  } catch (err) {
    console.error("Startup init error:", err.message);
  }
})();

// Routes
const routes = require("./routes");
app.use("/api/v1", routes);

// Global 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
const { errorHandler } = require("./middleware/error.middleware");
app.use(errorHandler);

module.exports = app;
