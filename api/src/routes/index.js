const express = require("express");
const router = express.Router();

// Health check
router.get("/health", (req, res) => res.json({ status: "ok" }));

// Route groups
router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use("/courses", require("./course.routes"));
router.use("/sections", require("./section.routes"));
router.use("/lessons", require("./lesson.routes"));
router.use("/progress", require("./progress.routes"));
router.use("/quizzes", require("./quiz.routes"));
router.use("/reviews", require("./review.routes"));
router.use("/notifications", require("./notification.routes"));
router.use("/rewards", require("./reward.routes"));

module.exports = router;
