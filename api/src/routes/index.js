const express = require("express");
const router = express.Router();

// Health check
router.get("/health", (req, res) => res.json({ status: "ok" }));

// Route groups
router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use("/courses", require("./course.routes"));

module.exports = router;
