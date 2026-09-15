const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();
const { toSnakeCaseKeys } = require("./utils/case-converter");

const app = express();

// Core middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json());

// Locally-stored content assets (dev-environment stand-in for real object storage -- see
// content-asset.service.js's UPLOAD_DIR note).
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

// Initialize database connection
require("./database/init.mysql.js");

// Sync models to the database, then seed baseline data (roles)
const { sync } = require("./models");
const { ensureSeedData } = require("./database/seed");

(async () => {
  try {
    // sequelize.sync() has no reliable FK-diffing: when a model's `references` doesn't match an
    // existing constraint exactly (different name, different ON DELETE behavior -- see the
    // "sync() tries to re-derive a conflicting FK on every boot" comments in course-module.model.js,
    // learning-item.model.js, lesson.model.js), MySQL dialect sync ADDS a new FK instead of
    // reconciling it, every single boot -- across many nodemon restarts in one dev session this
    // accumulates until a table exceeds MySQL's 64-key-per-table limit. Gate behind DB_SYNC so a
    // long edit-heavy session can set DB_SYNC=false in .env to stop resyncing once the schema is
    // already correct, without changing default behavior for anyone not hitting this.
    if (process.env.DB_SYNC !== "false") {
      await sync();
    } else {
      console.log("Skipping sync() (DB_SYNC=false)");
    }
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
  res.status(404).json(toSnakeCaseKeys({ message: "Route not found" }));
});

// Error handler
const { errorHandler } = require("./middleware/error.middleware");
app.use(errorHandler);

module.exports = app;
