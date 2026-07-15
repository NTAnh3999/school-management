const express = require("express");
const { body, param, query } = require("express-validator");
const OrgStructureController = require("../controllers/org-structure.controller");
const AuthMiddleware = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { validate } = require("../middleware/validation.middleware");

const router = express.Router();

router.use(AuthMiddleware.verifyToken);

router.get(
  "/branches",
  requirePermission("org.branch.view"),
  validate([query("tenantId").optional().isInt({ min: 1 })]),
  OrgStructureController.listBranches
);
router.post(
  "/branches",
  requirePermission("org.branch.manage"),
  validate([
    body("tenantId").isInt({ min: 1 }).withMessage("tenantId is required"),
    body("branchCode").isString().notEmpty().withMessage("branchCode is required"),
    body("branchName").isString().notEmpty().withMessage("branchName is required"),
  ]),
  OrgStructureController.createBranch
);
router.patch(
  "/branches/:id",
  requirePermission("org.branch.manage"),
  validate([param("id").isInt({ min: 1 })]),
  OrgStructureController.updateBranch
);

router.get(
  "/campuses",
  requirePermission("org.campus.view"),
  validate([
    query("branchId").optional().isInt({ min: 1 }),
    query("tenantId").optional().isInt({ min: 1 }),
  ]),
  OrgStructureController.listCampuses
);
router.post(
  "/campuses",
  requirePermission("org.campus.manage"),
  validate([
    body("branchId").isInt({ min: 1 }).withMessage("branchId is required"),
    body("campusCode").isString().notEmpty().withMessage("campusCode is required"),
    body("campusName").isString().notEmpty().withMessage("campusName is required"),
  ]),
  OrgStructureController.createCampus
);
router.patch(
  "/campuses/:id",
  requirePermission("org.campus.manage"),
  validate([param("id").isInt({ min: 1 })]),
  OrgStructureController.updateCampus
);

router.get(
  "/locations",
  requirePermission("org.location.view"),
  validate([
    query("campusId").optional().isInt({ min: 1 }),
    query("branchId").optional().isInt({ min: 1 }),
    query("tenantId").optional().isInt({ min: 1 }),
  ]),
  OrgStructureController.listLocations
);
router.post(
  "/locations",
  requirePermission("org.location.manage"),
  validate([
    body("campusId").isInt({ min: 1 }).withMessage("campusId is required"),
    body("locationCode").isString().notEmpty().withMessage("locationCode is required"),
    body("locationName").isString().notEmpty().withMessage("locationName is required"),
    body("parentLocationId").optional().isInt({ min: 1 }),
    body("capacity").optional().isInt({ min: 0 }),
  ]),
  OrgStructureController.createLocation
);
router.patch(
  "/locations/:id",
  requirePermission("org.location.manage"),
  validate([param("id").isInt({ min: 1 })]),
  OrgStructureController.updateLocation
);

module.exports = router;
