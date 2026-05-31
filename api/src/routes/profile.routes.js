const express = require("express");
const { body, param, query } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const AuthMiddleware = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");
const ProfileController = require("../controllers/profile.controller");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.use(AuthMiddleware.verifyToken);

router.get(
  "/me",
  validate([query("profileType").optional().isIn(["student", "parent", "teacher", "staff", "admin"])]),
  ProfileController.getMyProfile
);

router.get(
  "/me/summary",
  validate([query("profileType").optional().isIn(["student", "parent", "teacher", "staff", "admin"])]),
  ProfileController.getMyProfileSummary
);

router.get("/me/linked-students", requireRole([ROLES.PARENT]), ProfileController.getMyLinkedStudents);

router.get(
  "/export",
  requireRole([ROLES.ADMIN]),
  validate([
    query("tenantId").optional().isInt({ min: 1 }),
    query("profileType").optional().isIn(["student", "parent", "teacher", "staff", "admin"]),
    query("status").optional().isIn(["draft", "active", "inactive", "archived"]),
  ]),
  ProfileController.exportProfiles
);

router.get(
  "/",
  requireRole([ROLES.ADMIN, ROLES.TEACHER]),
  validate([
    query("tenantId").optional().isInt({ min: 1 }),
    query("profileType").optional().isIn(["student", "parent", "teacher", "staff", "admin"]),
    query("status").optional().isIn(["draft", "active", "inactive", "archived"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ]),
  ProfileController.listProfiles
);

router.post(
  "/",
  requireRole([ROLES.ADMIN]),
  validate([
    body("tenantId").optional().isInt({ min: 1 }),
    body("userId").isInt({ min: 1 }),
    body("profileType").isIn(["student", "parent", "teacher", "staff", "admin"]),
    body("fullName").isString().isLength({ min: 2, max: 120 }),
    body("contactEmail").optional({ nullable: true }).isEmail(),
    body("phoneNumber").optional({ nullable: true }).isString(),
    body("status").optional().isIn(["draft", "active", "inactive"]),
    body("visibility").optional().isIn(["internal", "public", "private"]),
    body("dateOfBirth").optional({ nullable: true }).isISO8601(),
    body("relationshipStatus").optional().isIn(["pending", "active"]),
    body("yearsOfExperience").optional().isInt({ min: 0 }),
  ]),
  ProfileController.createProfile
);

router.post(
  "/relationships/link",
  requireRole([ROLES.ADMIN]),
  validate([
    body("parentProfileId").isInt({ min: 1 }),
    body("studentProfileId").isInt({ min: 1 }),
    body("relationshipType").optional().isIn(["father", "mother", "guardian", "other"]),
    body("relationshipStatus").optional().isIn(["pending", "active"]),
  ]),
  ProfileController.linkParentToStudent
);

router.patch(
  "/relationships/:relationshipId/status",
  requireRole([ROLES.ADMIN]),
  validate([
    param("relationshipId").isInt({ min: 1 }),
    body("status").isIn(["pending", "active", "suspended", "revoked"]),
    body("reason").optional({ nullable: true }).isString(),
  ]),
  ProfileController.updateRelationshipStatus
);

router.patch(
  "/relationships/:relationshipId/revoke",
  requireRole([ROLES.ADMIN]),
  validate([
    param("relationshipId").isInt({ min: 1 }),
    body("reason").optional({ nullable: true }).isString(),
  ]),
  ProfileController.unlinkParentStudent
);

router.get(
  "/parent/:parentProfileId/students",
  validate([param("parentProfileId").isInt({ min: 1 })]),
  ProfileController.getLinkedStudents
);

router.get("/:id/audit-logs", requireRole([ROLES.ADMIN]), validate([param("id").isInt({ min: 1 })]), ProfileController.getAuditLogs);

router.get("/:id/summary", validate([param("id").isInt({ min: 1 })]), ProfileController.getProfileSummary);

router.get("/:id", validate([param("id").isInt({ min: 1 })]), ProfileController.getProfileById);

router.put(
  "/:id",
  validate([
    param("id").isInt({ min: 1 }),
    body("fullName").optional().isString().isLength({ min: 2, max: 120 }),
    body("contactEmail").optional({ nullable: true }).isEmail(),
    body("phoneNumber").optional({ nullable: true }).isString(),
    body("dateOfBirth").optional({ nullable: true }).isISO8601(),
    body("yearsOfExperience").optional().isInt({ min: 0 }),
  ]),
  ProfileController.updateProfile
);

router.patch(
  "/:id/status",
  requireRole([ROLES.ADMIN]),
  validate([
    param("id").isInt({ min: 1 }),
    body("status").isIn(["draft", "active", "inactive", "archived"]),
    body("reason").optional({ nullable: true }).isString(),
  ]),
  ProfileController.changeProfileStatus
);

module.exports = router;
