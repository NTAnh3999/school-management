"use strict";
const express = require("express");
const { body, param, query } = require("express-validator");
const multer = require("multer");
const { validate } = require("../middleware/validation.middleware");
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const ScheduleController = require("../controllers/schedule.controller");
const { ROLES, STAFF_ROLES } = require("../constants/roles");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const VALID_STATUSES = ["scheduled", "rescheduled", "cancelled", "completed", "archived"];
const DELIVERY_MODES = ["Offline", "Online", "Hybrid"];

// ---------------------------------------------------------------------------
// SCHED-00: View Schedule
// GET /schedules
// ---------------------------------------------------------------------------
router.get(
  "/",
  AuthMiddleware.verifyToken,
  validate([
    query("fromDate").notEmpty().withMessage("from_date is required"),
    query("toDate").notEmpty().withMessage("to_date is required"),
    query("status").optional().isIn(VALID_STATUSES),
    query("deliveryMode").optional().isIn(DELIVERY_MODES),
    query("classroomId").optional().isInt({ min: 1 }),
    query("teacherId").optional().isInt({ min: 1 }),
    query("studentId").optional().isInt({ min: 1 }),
    query("campusId").optional().isInt({ min: 1 }),
  ]),
  ScheduleController.viewSchedule
);

// ---------------------------------------------------------------------------
// SCHED-06: Check Conflict (before :id routes to avoid ambiguity)
// GET /schedules/conflict-check
// ---------------------------------------------------------------------------
router.get(
  "/conflict-check",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([
    query("startDatetime").notEmpty().withMessage("startDatetime is required"),
    query("endDatetime").notEmpty().withMessage("endDatetime is required"),
    query("teacherId").optional().isInt({ min: 1 }),
    query("classroomId").optional().isInt({ min: 1 }),
    query("location").optional().isString(),
    query("excludeSessionId").optional().isInt({ min: 1 }),
  ]),
  ScheduleController.checkConflict
);

// ---------------------------------------------------------------------------
// SCHED-04: Create Recurring Series
// POST /schedules/series
// ---------------------------------------------------------------------------
router.post(
  "/series",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([
    body("classroomId").isInt({ min: 1 }).withMessage("classroomId is required"),
    body("recurrenceRule").notEmpty().withMessage("recurrenceRule is required"),
    body("recurrenceRule.type")
      .isIn(["daily", "weekly", "monthly"])
      .withMessage("recurrenceRule.type must be daily|weekly|monthly"),
    body("startDate").isDate().withMessage("startDate is required (YYYY-MM-DD)"),
    body("endDate").isDate().withMessage("endDate is required (YYYY-MM-DD)"),
    body("startTime").notEmpty().withMessage("startTime is required (HH:MM:SS)"),
    body("endTime").notEmpty().withMessage("endTime is required (HH:MM:SS)"),
    body("deliveryMode").optional().isIn(DELIVERY_MODES),
    body("teacherId").optional().isInt({ min: 1 }),
    body("location").optional().isString(),
  ]),
  ScheduleController.createSeries
);

// ---------------------------------------------------------------------------
// SCHED-08: Import Schedule
// POST /schedules/import
// ---------------------------------------------------------------------------
router.post(
  "/import",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  upload.single("file"),
  ScheduleController.importSchedule
);

// ---------------------------------------------------------------------------
// SCHED-09: Export Schedule
// GET /schedules/export
// ---------------------------------------------------------------------------
router.get(
  "/export",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([
    ROLES.ADMIN,
    ...Object.values(ROLES).filter((r) => r === ROLES.TEACHER),
  ]),
  validate([
    query("fromDate").notEmpty().withMessage("from_date is required"),
    query("toDate").notEmpty().withMessage("to_date is required"),
    query("status").optional().isIn(VALID_STATUSES),
    query("deliveryMode").optional().isIn(DELIVERY_MODES),
    query("classroomId").optional().isInt({ min: 1 }),
  ]),
  ScheduleController.exportSchedule
);

// ---------------------------------------------------------------------------
// SCHED-01: Create Session
// POST /schedules
// ---------------------------------------------------------------------------
router.post(
  "/",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    body("classroomId").isInt({ min: 1 }).withMessage("classroomId is required"),
    body("title").notEmpty().withMessage("title is required"),
    body("sessionDate").isDate().withMessage("sessionDate is required (YYYY-MM-DD)"),
    body("startTime").notEmpty().withMessage("startTime is required (HH:MM:SS)"),
    body("endTime").notEmpty().withMessage("endTime is required (HH:MM:SS)"),
    body("deliveryMode").optional().isIn(DELIVERY_MODES),
    body("teacherId").optional().isInt({ min: 1 }),
    body("location").optional().isString(),
    body("campusId").optional().isInt({ min: 1 }),
    body("notes").optional().isString(),
    body("description").optional().isString(),
    body("seriesId").optional().isInt({ min: 1 }),
  ]),
  ScheduleController.createSession
);

// ---------------------------------------------------------------------------
// SCHED-02: Update Session
// PUT /schedules/:id
// ---------------------------------------------------------------------------
router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    param("id").isInt({ min: 1 }),
    body("title").optional().isString(),
    body("description").optional().isString(),
    body("sessionDate").optional().isDate(),
    body("startTime").optional().isString(),
    body("endTime").optional().isString(),
    body("deliveryMode").optional().isIn(DELIVERY_MODES),
    body("teacherId").optional().isInt({ min: 1 }),
    body("location").optional().isString(),
    body("campusId").optional().isInt({ min: 1 }),
    body("notes").optional().isString(),
  ]),
  ScheduleController.updateSession
);

// ---------------------------------------------------------------------------
// SCHED-03: Cancel Session
// POST /schedules/:id/cancel
// ---------------------------------------------------------------------------
router.post(
  "/:id/cancel",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    param("id").isInt({ min: 1 }),
    body("cancel_reason").notEmpty().withMessage("cancel_reason is required"),
  ]),
  ScheduleController.cancelSession
);

// ---------------------------------------------------------------------------
// SCHED-05: Reschedule Session
// POST /schedules/:id/reschedule
// ---------------------------------------------------------------------------
router.post(
  "/:id/reschedule",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    param("id").isInt({ min: 1 }),
    body("scope")
      .isIn(["this_session", "this_and_following", "entire_series"])
      .withMessage("scope must be this_session|this_and_following|entire_series"),
    body("newDate").optional().isDate(),
    body("newStartTime").optional().isString(),
    body("newEndTime").optional().isString(),
    body("newLocation").optional().isString(),
    body("newTeacherId").optional().isInt({ min: 1 }),
    body("reason").optional().isString(),
  ]),
  ScheduleController.rescheduleSession
);

// ---------------------------------------------------------------------------
// SCHED-07: Attach Live Session Metadata
// POST /schedules/:id/live-metadata
// ---------------------------------------------------------------------------
router.post(
  "/:id/live-metadata",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    param("id").isInt({ min: 1 }),
    body("provider").notEmpty().withMessage("provider is required"),
    body("roomId").optional().isString(),
    body("joinUrl").optional().isURL(),
    body("hostUrl").optional().isURL(),
    body("accessPolicy").optional().isObject(),
    body("providerStatus").optional().isIn(["Created", "Pending", "Failed"]),
  ]),
  ScheduleController.attachLiveMetadata
);

// ---------------------------------------------------------------------------
// SCHED-10: Complete Session
// POST /schedules/:id/complete
// ---------------------------------------------------------------------------
router.post(
  "/:id/complete",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  ScheduleController.completeSession
);

// ---------------------------------------------------------------------------
// SCHED-11: Archive Session
// POST /schedules/:id/archive
// ---------------------------------------------------------------------------
router.post(
  "/:id/archive",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  ScheduleController.archiveSession
);

// ---------------------------------------------------------------------------
// Change History
// GET /schedules/:id/history
// ---------------------------------------------------------------------------
router.get(
  "/:id/history",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  ScheduleController.getChangeHistory
);

module.exports = router;
