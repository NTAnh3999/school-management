"use strict";
const express = require("express");
const { body, param, query } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const EnrollmentController = require("../controllers/enrollment.controller");
const { ROLES } = require("../constants/roles");

const router = express.Router();

const VALID_STATUSES = [
  "pending",
  "active",
  "suspended",
  "cancelled",
  "completed",
  "rejected",
  "waitlisted",
];

// ---------------------------------------------------------------------------
// ENR-00: List Enrollments
// GET /enrollments
// Admin: all; Teacher: assigned courses; Student: own
// ---------------------------------------------------------------------------
router.get(
  "/",
  AuthMiddleware.verifyToken,
  validate([
    query("status").optional().isIn(VALID_STATUSES),
    query("course_id").optional().isInt({ min: 1 }),
    query("learner_id").optional().isInt({ min: 1 }),
    query("request_source")
      .optional()
      .isIn(["student", "parent", "admin", "system", "import"]),
    query("page").optional().isInt({ min: 1 }),
    query("page_size").optional().isInt({ min: 1, max: 100 }),
  ]),
  EnrollmentController.list
);

// ---------------------------------------------------------------------------
// ENR-02: Validate Eligibility
// GET /enrollments/eligibility
// Admin, Teacher only
// ---------------------------------------------------------------------------
router.get(
  "/eligibility",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([
    query("learner_id").isInt({ min: 1 }).withMessage("learner_id is required"),
    query("course_id").isInt({ min: 1 }).withMessage("course_id is required"),
  ]),
  EnrollmentController.validateEligibility
);

// ---------------------------------------------------------------------------
// ENR-08: Query Enrollment Access State
// GET /enrollments/access-state
// Admin, Teacher, System
// ---------------------------------------------------------------------------
router.get(
  "/access-state",
  AuthMiddleware.verifyToken,
  validate([
    query("learner_id").isInt({ min: 1 }).withMessage("learner_id is required"),
    query("course_id").isInt({ min: 1 }).withMessage("course_id is required"),
  ]),
  EnrollmentController.queryAccessState
);

// ---------------------------------------------------------------------------
// ENR-01: Request Enrollment
// POST /enrollments
// Admin, Student (own only)
// ---------------------------------------------------------------------------
router.post(
  "/",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.STUDENT]),
  validate([
    body("learner_id").isInt({ min: 1 }).withMessage("learner_id is required"),
    body("course_id").isInt({ min: 1 }).withMessage("course_id is required"),
    body("request_source")
      .optional()
      .isIn(["student", "parent", "admin", "system", "import"]),
    body("payment_reference").optional().isString().isLength({ max: 100 }),
  ]),
  EnrollmentController.requestEnrollment
);

// ---------------------------------------------------------------------------
// Payment event endpoints (webhook / internal integration)
// POST /enrollments/events/payment-confirmed
// POST /enrollments/events/payment-failed
// Admin only (system events should use admin service account)
// ---------------------------------------------------------------------------
router.post(
  "/events/payment-confirmed",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([
    body("enrollment_id").isInt({ min: 1 }).withMessage("enrollment_id is required"),
    body("billing_reference").isString().notEmpty().withMessage("billing_reference is required"),
    body("event_id").isString().notEmpty().withMessage("event_id is required"),
  ]),
  EnrollmentController.handlePaymentConfirmed
);

router.post(
  "/events/payment-failed",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([
    body("enrollment_id").isInt({ min: 1 }).withMessage("enrollment_id is required"),
    body("billing_reference").isString().notEmpty().withMessage("billing_reference is required"),
    body("event_id").isString().notEmpty().withMessage("event_id is required"),
    body("reason").optional().isIn(["PAYMENT_FAILED", "PAYMENT_EXPIRED"]),
  ]),
  EnrollmentController.handlePaymentFailed
);

// ---------------------------------------------------------------------------
// ENR-00: Get Enrollment Detail
// GET /enrollments/:id
// ---------------------------------------------------------------------------
router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  validate([param("id").isInt({ min: 1 })]),
  EnrollmentController.detail
);

// ---------------------------------------------------------------------------
// ENR-07: View Enrollment History
// GET /enrollments/:id/history
// ---------------------------------------------------------------------------
router.get(
  "/:id/history",
  AuthMiddleware.verifyToken,
  validate([param("id").isInt({ min: 1 })]),
  EnrollmentController.getHistory
);

// ---------------------------------------------------------------------------
// ENR-03: Activate Enrollment
// PUT /enrollments/:id/activate
// Admin only
// ---------------------------------------------------------------------------
router.put(
  "/:id/activate",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  EnrollmentController.activateEnrollment
);

// ---------------------------------------------------------------------------
// ENR-04: Suspend Enrollment
// PUT /enrollments/:id/suspend
// Admin only
// ---------------------------------------------------------------------------
router.put(
  "/:id/suspend",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([
    param("id").isInt({ min: 1 }),
    body("reason_code").optional().isString().isLength({ max: 100 }),
    body("reason_message").optional().isString(),
  ]),
  EnrollmentController.suspendEnrollment
);

// ---------------------------------------------------------------------------
// ENR-04: Resume Enrollment
// PUT /enrollments/:id/resume
// Admin only
// ---------------------------------------------------------------------------
router.put(
  "/:id/resume",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  EnrollmentController.resumeEnrollment
);

// ---------------------------------------------------------------------------
// ENR-05: Cancel Enrollment
// PUT /enrollments/:id/cancel
// Admin, Student (own, limited)
// ---------------------------------------------------------------------------
router.put(
  "/:id/cancel",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN, ROLES.STUDENT]),
  validate([
    param("id").isInt({ min: 1 }),
    body("reason_code").optional().isString().isLength({ max: 100 }),
    body("reason_message").optional().isString(),
  ]),
  EnrollmentController.cancelEnrollment
);

// ---------------------------------------------------------------------------
// ENR-06: Complete Enrollment
// PUT /enrollments/:id/complete
// Admin only
// ---------------------------------------------------------------------------
router.put(
  "/:id/complete",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  EnrollmentController.completeEnrollment
);

module.exports = router;
