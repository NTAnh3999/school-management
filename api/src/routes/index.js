const express = require("express");
const router = express.Router();

// Health check
router.get("/health", (req, res) => res.json({ status: "ok" }));

// Route groups
router.use("/auth", require("./auth.routes"));
router.use("/iam", require("./iam.routes"));
router.use("/org", require("./org-structure.routes"));
router.use("/users", require("./user.routes"));
router.use("/departments", require("./department.routes"));
router.use("/courses", require("./course.routes"));
router.use("/enrollments", require("./enrollment.routes"));
router.use("/modules", require("./module.routes"));
router.use("/lessons", require("./lesson.routes"));
router.use("/progress", require("./progress.routes"));
router.use("/assessments", require("./assessment.routes"));
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

// Scheduling module
router.use("/schedules", require("./schedule.routes"));

// Profile module
router.use("/profiles", require("./profile.routes"));

module.exports = router;
