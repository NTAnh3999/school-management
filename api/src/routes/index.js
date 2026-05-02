const express = require("express");
const router = express.Router();

// Health check
router.get("/health", (req, res) => res.json({ status: "ok" }));

// Route groups
router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use("/courses", require("./course.routes"));
router.use("/enrollments", require("./enrollment.routes"));
router.use("/sections", require("./section.routes"));
router.use("/lessons", require("./lesson.routes"));
router.use("/progress", require("./progress.routes"));
router.use("/quizzes", require("./quiz.routes"));
router.use("/reviews", require("./review.routes"));
router.use("/notifications", require("./notification.routes"));
router.use("/rewards", require("./reward.routes"));

// Course Content Authoring routes
router.use("/learning-items", require("./learning-item.routes"));
router.use("/content-assets", require("./content-asset.routes"));
router.use("/content", require("./content-version.routes"));

// Classroom module
router.use("/classrooms", require("./classroom.routes"));

module.exports = router;
