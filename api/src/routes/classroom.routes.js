"use strict";
const express = require("express");
const { body, param, query } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const ClassroomController = require("../controllers/classroom.controller");
const { ROLES } = require("../constants/roles");

const router = express.Router();

const CLASSROOM_STATUSES = [
  "draft",
  "open",
  "full",
  "in_progress",
  "completed",
  "cancelled",
  "archived",
];
const DELIVERY_METHODS = ["online", "offline", "hybrid"];
const ENROLLMENT_MODES = ["manual", "self_enrollment", "invitation_only"];
const VISIBILITY = ["public", "private", "internal"];
const ENROLLMENT_STATUSES = [
  "pending_approval",
  "enrolled",
  "waitlisted",
  "withdrawn",
  "transferred",
  "rejected",
  "completed",
  "failed",
];

// ---------------------------------------------------------------------------
// SC-01: List Classrooms
// GET /classrooms
// All authenticated users (role-scoped internally)
// ---------------------------------------------------------------------------
router.get(
  "/",
  AuthMiddleware.verifyToken,
  validate([
    query("status").optional().isIn(CLASSROOM_STATUSES),
    query("delivery_method").optional().isIn(DELIVERY_METHODS),
    query("enrollment_availability").optional().isIn(["available", "full"]),
    query("course_id").optional().isInt({ min: 1 }),
    query("teacher_id").optional().isInt({ min: 1 }),
    query("date_from").optional().isDate(),
    query("date_to").optional().isDate(),
    query("page").optional().isInt({ min: 1 }),
    query("page_size").optional().isInt({ min: 1, max: 100 }),
  ]),
  ClassroomController.list
);

// ---------------------------------------------------------------------------
// SC-02: Create Classroom
// POST /classrooms
// Admin, Teacher (configurable — currently admin only per FSD recommendation)
// ---------------------------------------------------------------------------
router.post(
  "/",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([
    body("course_id").isInt({ min: 1 }).withMessage("course_id is required"),
    body("classroom_name")
      .isString()
      .notEmpty()
      .isLength({ max: 255 })
      .withMessage("classroom_name is required (max 255 chars)"),
    body("delivery_method").isIn(DELIVERY_METHODS).withMessage("Invalid delivery_method"),
    body("start_date").isDate().withMessage("start_date must be a valid date"),
    body("end_date").isDate().withMessage("end_date must be a valid date"),
    body("max_capacity").isInt({ min: 1 }).withMessage("max_capacity must be a positive integer"),
    body("classroom_code").optional().isString().isLength({ max: 100 }),
    body("course_version_id").optional().isInt({ min: 1 }),
    body("description").optional().isString(),
    body("campus_id").optional().isInt({ min: 1 }),
    body("location").optional().isString(),
    body("online_meeting_link")
      .optional()
      .isURL()
      .withMessage("online_meeting_link must be a valid URL"),
    body("academic_year").optional().isString().isLength({ max: 20 }),
    body("term").optional().isString().isLength({ max: 100 }),
    body("language").optional().isString().isLength({ max: 50 }),
    body("main_teacher_id").optional().isInt({ min: 1 }),
    body("co_teacher_ids").optional().isArray(),
    body("co_teacher_ids.*").optional().isInt({ min: 1 }),
    body("teaching_assistant_ids").optional().isArray(),
    body("teaching_assistant_ids.*").optional().isInt({ min: 1 }),
    body("enrollment_mode").optional().isIn(ENROLLMENT_MODES),
    body("enrollment_start_date").optional().isDate(),
    body("enrollment_end_date").optional().isDate(),
    body("min_capacity").optional().isInt({ min: 0 }),
    body("waitlist_enabled").optional().isBoolean(),
    body("approval_required").optional().isBoolean(),
    body("visibility").optional().isIn(VISIBILITY),
  ]),
  ClassroomController.create
);

// ---------------------------------------------------------------------------
// SC-04: Get Classroom Detail
// GET /classrooms/:id
// ---------------------------------------------------------------------------
router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  validate([param("id").isInt({ min: 1 })]),
  ClassroomController.detail
);

// ---------------------------------------------------------------------------
// SC-03: Update Classroom
// PUT /classrooms/:id
// ---------------------------------------------------------------------------
router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([
    param("id").isInt({ min: 1 }),
    body("classroom_name").optional().isString().isLength({ max: 255 }),
    body("delivery_method").optional().isIn(DELIVERY_METHODS),
    body("start_date").optional().isDate(),
    body("end_date").optional().isDate(),
    body("max_capacity").optional().isInt({ min: 1 }),
    body("min_capacity").optional().isInt({ min: 0 }),
    body("enrollment_mode").optional().isIn(ENROLLMENT_MODES),
    body("visibility").optional().isIn(VISIBILITY),
    body("online_meeting_link").optional().isURL(),
    body("waitlist_enabled").optional().isBoolean(),
    body("approval_required").optional().isBoolean(),
  ]),
  ClassroomController.update
);

// ---------------------------------------------------------------------------
// SC-10: Publish Classroom
// POST /classrooms/:id/publish
// ---------------------------------------------------------------------------
router.post(
  "/:id/publish",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  ClassroomController.publish
);

// ---------------------------------------------------------------------------
// Start Classroom (-> In Progress)
// POST /classrooms/:id/start
// ---------------------------------------------------------------------------
router.post(
  "/:id/start",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  ClassroomController.start
);

// ---------------------------------------------------------------------------
// SC-11: Cancel Classroom
// POST /classrooms/:id/cancel
// ---------------------------------------------------------------------------
router.post(
  "/:id/cancel",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 }), body("reason").optional().isString()]),
  ClassroomController.cancel
);

// ---------------------------------------------------------------------------
// SC-12: Complete Classroom
// POST /classrooms/:id/complete
// ---------------------------------------------------------------------------
router.post(
  "/:id/complete",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([param("id").isInt({ min: 1 })]),
  ClassroomController.complete
);

// ---------------------------------------------------------------------------
// Archive Classroom
// POST /classrooms/:id/archive
// ---------------------------------------------------------------------------
router.post(
  "/:id/archive",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  ClassroomController.archive
);

// ---------------------------------------------------------------------------
// Duplicate Classroom
// POST /classrooms/:id/duplicate
// ---------------------------------------------------------------------------
router.post(
  "/:id/duplicate",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([param("id").isInt({ min: 1 })]),
  ClassroomController.duplicate
);

// ---------------------------------------------------------------------------
// SC-05: Assign Teachers
// PUT /classrooms/:id/teachers
// ---------------------------------------------------------------------------
router.put(
  "/:id/teachers",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([
    param("id").isInt({ min: 1 }),
    body("main_teacher_id").optional().isInt({ min: 1 }),
    body("co_teacher_ids").optional().isArray(),
    body("co_teacher_ids.*").optional().isInt({ min: 1 }),
    body("teaching_assistant_ids").optional().isArray(),
    body("teaching_assistant_ids.*").optional().isInt({ min: 1 }),
  ]),
  ClassroomController.assignTeachers
);

// ---------------------------------------------------------------------------
// SC-08: List Students
// GET /classrooms/:id/students
// ---------------------------------------------------------------------------
router.get(
  "/:id/students",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([
    param("id").isInt({ min: 1 }),
    query("status").optional().isIn(ENROLLMENT_STATUSES),
    query("page").optional().isInt({ min: 1 }),
    query("page_size").optional().isInt({ min: 1, max: 100 }),
  ]),
  ClassroomController.listStudents
);

// ---------------------------------------------------------------------------
// SC-08: Add Student
// POST /classrooms/:id/students
// ---------------------------------------------------------------------------
router.post(
  "/:id/students",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([
    param("id").isInt({ min: 1 }),
    body("student_id").isInt({ min: 1 }).withMessage("student_id is required"),
    body("source").optional().isIn(["manual", "self_enrollment", "import", "api"]),
    body("notes").optional().isString(),
  ]),
  ClassroomController.addStudent
);

// ---------------------------------------------------------------------------
// Transfer Student
// POST /classrooms/:id/students/:studentId/transfer
// ---------------------------------------------------------------------------
router.post(
  "/:id/students/:studentId/transfer",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([
    param("id").isInt({ min: 1 }),
    param("studentId").isInt({ min: 1 }),
    body("target_classroom_id").isInt({ min: 1 }).withMessage("target_classroom_id is required"),
    body("notes").optional().isString(),
  ]),
  ClassroomController.transferStudent
);

// ---------------------------------------------------------------------------
// Update Student Enrollment Status
// PUT /classrooms/:id/students/:studentId/status
// ---------------------------------------------------------------------------
router.put(
  "/:id/students/:studentId/status",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([
    param("id").isInt({ min: 1 }),
    param("studentId").isInt({ min: 1 }),
    body("status").isIn(ENROLLMENT_STATUSES).withMessage("Invalid enrollment status"),
    body("notes").optional().isString(),
  ]),
  ClassroomController.updateStudentStatus
);

// ---------------------------------------------------------------------------
// SC-08: Remove Student
// DELETE /classrooms/:id/students/:studentId
// ---------------------------------------------------------------------------
router.delete(
  "/:id/students/:studentId",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([
    param("id").isInt({ min: 1 }),
    param("studentId").isInt({ min: 1 }),
    body("reason").optional().isString(),
  ]),
  ClassroomController.removeStudent
);

// ---------------------------------------------------------------------------
// SC-06: List Sessions
// GET /classrooms/:id/sessions
// ---------------------------------------------------------------------------
router.get(
  "/:id/sessions",
  AuthMiddleware.verifyToken,
  validate([param("id").isInt({ min: 1 })]),
  ClassroomController.listSessions
);

// ---------------------------------------------------------------------------
// Generate Sessions from Recurrence
// POST /classrooms/:id/sessions/generate
// ---------------------------------------------------------------------------
router.post(
  "/:id/sessions/generate",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([
    param("id").isInt({ min: 1 }),
    body("start_time").isString().withMessage("start_time is required (HH:MM:SS)"),
    body("end_time").isString().withMessage("end_time is required (HH:MM:SS)"),
    body("session_days").isArray({ min: 1 }).withMessage("session_days must be a non-empty array"),
    body("session_days.*").isIn(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
  ]),
  ClassroomController.generateSessions
);

// ---------------------------------------------------------------------------
// SC-06: Create Session
// POST /classrooms/:id/sessions
// ---------------------------------------------------------------------------
router.post(
  "/:id/sessions",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([
    param("id").isInt({ min: 1 }),
    body("session_date").isDate().withMessage("session_date is required"),
    body("start_time").isString().withMessage("start_time is required"),
    body("end_time").isString().withMessage("end_time is required"),
    body("session_title").optional().isString(),
    body("teacher_id").optional().isInt({ min: 1 }),
    body("location").optional().isString(),
    body("online_meeting_link").optional().isURL(),
    body("notes").optional().isString(),
  ]),
  ClassroomController.createSession
);

// ---------------------------------------------------------------------------
// Update Session
// PUT /classrooms/:id/sessions/:sessionId
// ---------------------------------------------------------------------------
router.put(
  "/:id/sessions/:sessionId",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([
    param("id").isInt({ min: 1 }),
    param("sessionId").isInt({ min: 1 }),
    body("session_date").optional().isDate(),
    body("start_time").optional().isString(),
    body("end_time").optional().isString(),
    body("status").optional().isIn(["scheduled", "completed", "cancelled", "rescheduled"]),
    body("online_meeting_link").optional().isURL(),
  ]),
  ClassroomController.updateSession
);

// ---------------------------------------------------------------------------
// Delete Session
// DELETE /classrooms/:id/sessions/:sessionId
// ---------------------------------------------------------------------------
router.delete(
  "/:id/sessions/:sessionId",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([param("id").isInt({ min: 1 }), param("sessionId").isInt({ min: 1 })]),
  ClassroomController.deleteSession
);

// ---------------------------------------------------------------------------
// SC-13: Activity Log
// GET /classrooms/:id/activity-log
// ---------------------------------------------------------------------------
router.get(
  "/:id/activity-log",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([param("id").isInt({ min: 1 })]),
  ClassroomController.getActivityLog
);

module.exports = router;
