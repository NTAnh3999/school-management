const express = require("express");
const { body, param, query } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const AuthMiddleware = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");
const ProfileController = require("../controllers/profile.controller");
const { ROLES } = require("../constants/roles");

const router = express.Router();

// All profile routes require authentication
router.use(AuthMiddleware.verifyToken);

// ---------------------------------------------------------------------------
// PROFILE-00: List & view profiles
// ---------------------------------------------------------------------------
router.get(
  "/",
  requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([
    query("profileType").optional().isIn(["student", "parent", "teacher", "staff", "admin"]),
    query("status").optional().isIn(["draft", "active", "inactive", "archived"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ]),
  ProfileController.listProfiles
);

router.get("/:id", validate([param("id").isInt({ min: 1 })]), ProfileController.getProfileById);

router.get(
  "/:id/summary",
  validate([param("id").isInt({ min: 1 })]),
  ProfileController.getProfileSummary
);

// ---------------------------------------------------------------------------
// PROFILE-01: Create profile (Admin only)
// ---------------------------------------------------------------------------
router.post(
  "/",
  requireRole([ROLES.ADMIN]),
  validate([
    body("userId").isInt({ min: 1 }).withMessage("userId must be a valid integer"),
    body("profileType")
      .isIn(["student", "parent", "teacher", "staff", "admin"])
      .withMessage("Invalid profileType"),
    body("fullName")
      .isString()
      .isLength({ min: 2, max: 120 })
      .withMessage("fullName is required (2-120 chars)"),
    body("contactEmail").optional({ nullable: true }).isEmail(),
    body("phoneNumber").optional({ nullable: true }).isString(),
    body("status")
      .optional()
      .isIn(["draft", "active"])
      .withMessage("status must be draft or active on creation"),
  ]),
  ProfileController.createProfile
);

// ---------------------------------------------------------------------------
// PROFILE-02: Update profile
// ---------------------------------------------------------------------------
router.put(
  "/:id",
  validate([
    param("id").isInt({ min: 1 }),
    body("fullName").optional().isString().isLength({ min: 2, max: 120 }),
    body("contactEmail").optional({ nullable: true }).isEmail(),
    body("phoneNumber").optional({ nullable: true }).isString(),
  ]),
  ProfileController.updateProfile
);

// ---------------------------------------------------------------------------
// PROFILE-03: Change profile status (Admin only)
// ---------------------------------------------------------------------------
router.patch(
  "/:id/status",
  requireRole([ROLES.ADMIN]),
  validate([
    param("id").isInt({ min: 1 }),
    body("status")
      .isIn(["draft", "active", "inactive", "archived"])
      .withMessage("Invalid status value"),
    body("reason").optional({ nullable: true }).isString(),
  ]),
  ProfileController.changeProfileStatus
);

// ---------------------------------------------------------------------------
// PROFILE-07: Link parent to student (Admin only)
// ---------------------------------------------------------------------------
router.post(
  "/relationships/link",
  requireRole([ROLES.ADMIN]),
  validate([
    body("parentProfileId").isInt({ min: 1 }),
    body("studentProfileId").isInt({ min: 1 }),
    body("relationshipType").optional().isIn(["father", "mother", "guardian", "other"]),
  ]),
  ProfileController.linkParentToStudent
);

// ---------------------------------------------------------------------------
// PROFILE-08: Unlink parent-student relationship (Admin only)
// ---------------------------------------------------------------------------
router.patch(
  "/relationships/:relationshipId/revoke",
  requireRole([ROLES.ADMIN]),
  validate([
    param("relationshipId").isInt({ min: 1 }),
    body("reason").optional({ nullable: true }).isString(),
  ]),
  ProfileController.unlinkParentStudent
);

// ---------------------------------------------------------------------------
// PROFILE-09: Get linked students for a parent profile
// ---------------------------------------------------------------------------
router.get(
  "/parent/:parentProfileId/students",
  validate([param("parentProfileId").isInt({ min: 1 })]),
  ProfileController.getLinkedStudents
);

// ---------------------------------------------------------------------------
// PROFILE-13: Audit logs (Admin only)
// ---------------------------------------------------------------------------
router.get(
  "/:id/audit-logs",
  requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  ProfileController.getAuditLogs
);

module.exports = router;
