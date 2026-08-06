"use strict";
const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const EnrollmentService = require("../services/enrollment.service");
const asyncHandler = require("../utils/async-handler");

// ---------------------------------------------------------------------------
// ENR-01: Request Enrollment
// ---------------------------------------------------------------------------
const requestEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await EnrollmentService.requestEnrollment(req.body, req.user);
  return new CreatedResponse({
    message: "Enrollment request created",
    metadata: { enrollment },
  }).send(res);
});

// ---------------------------------------------------------------------------
// ENR-00: List Enrollments
// ---------------------------------------------------------------------------
const list = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    course_id: req.query.course_id,
    learner_id: req.query.learner_id,
    request_source: req.query.request_source,
    tenant_id: req.query.tenant_id,
    classroom_id: req.query.classroom_id,
    enrollment_level: req.query.enrollment_level,
    learner_profile_id: req.query.learner_profile_id,
    requested_from: req.query.requested_from,
    requested_to: req.query.requested_to,
    actor_tenant_id: req.user.activeTenantId,
    page: req.query.page,
    page_size: req.query.page_size,
  };
  const result = await EnrollmentService.list(filters, req.user.id, req.user.role);
  return new OKResponse({ metadata: result }).send(res);
});

// ---------------------------------------------------------------------------
// ENR-00: Get Enrollment Detail
// ---------------------------------------------------------------------------
const detail = asyncHandler(async (req, res) => {
  const enrollment = await EnrollmentService.detail(
    parseInt(req.params.id),
    req.user.id,
    req.user.role
  );
  return new OKResponse({ metadata: { enrollment } }).send(res);
});

// ---------------------------------------------------------------------------
// ENR-02: Validate Eligibility
// ---------------------------------------------------------------------------
const validateEligibility = asyncHandler(async (req, res) => {
  const payload = { ...req.query, ...req.body };
  if (req.params.id && (!payload.learner_id || !payload.course_id)) {
    const enrollment = await EnrollmentService.detail(
      parseInt(req.params.id),
      req.user.id,
      req.user.role
    );
    payload.learner_id = enrollment.student_id;
    payload.course_id = enrollment.course_id;
    payload.classroom_id = enrollment.classroom_id;
    payload.learner_profile_id = enrollment.learner_profile_id;
    payload.tenant_id = enrollment.tenant_id;
  }
  const result = await EnrollmentService.validateEligibility(payload, req.user);
  return new OKResponse({ message: "Eligibility checked", metadata: { eligibility: result } }).send(
    res
  );
});

// ---------------------------------------------------------------------------
// ENR-03: Activate Enrollment
// ---------------------------------------------------------------------------
const activateEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await EnrollmentService.activateEnrollment(
    parseInt(req.params.id),
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Enrollment activated", metadata: { enrollment } }).send(res);
});

// ---------------------------------------------------------------------------
// ENR-04: Suspend Enrollment
// ---------------------------------------------------------------------------
const suspendEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await EnrollmentService.suspendEnrollment(
    parseInt(req.params.id),
    {
      reason_code: req.body.reason_code,
      reason_message: req.body.reason_message,
    },
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Enrollment suspended", metadata: { enrollment } }).send(res);
});

// ---------------------------------------------------------------------------
// ENR-04: Resume Enrollment
// ---------------------------------------------------------------------------
const resumeEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await EnrollmentService.resumeEnrollment(
    parseInt(req.params.id),
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Enrollment resumed", metadata: { enrollment } }).send(res);
});

// ---------------------------------------------------------------------------
// ENR-05: Cancel Enrollment
// ---------------------------------------------------------------------------
const cancelEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await EnrollmentService.cancelEnrollment(
    parseInt(req.params.id),
    {
      reason_code: req.body.reason_code,
      reason_message: req.body.reason_message,
    },
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Enrollment cancelled", metadata: { enrollment } }).send(res);
});

// ---------------------------------------------------------------------------
// ENR-06: Complete Enrollment
// ---------------------------------------------------------------------------
const completeEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await EnrollmentService.completeEnrollment(
    parseInt(req.params.id),
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Enrollment completed", metadata: { enrollment } }).send(res);
});

// ---------------------------------------------------------------------------
// ENR-07: View Enrollment History
// ---------------------------------------------------------------------------
const getHistory = asyncHandler(async (req, res) => {
  const history = await EnrollmentService.getHistory(
    parseInt(req.params.id),
    req.user.id,
    req.user.role
  );
  return new OKResponse({ metadata: { history } }).send(res);
});

// ---------------------------------------------------------------------------
// ENR-08: Query Enrollment Access State
// ---------------------------------------------------------------------------
const queryAccessState = asyncHandler(async (req, res) => {
  const state = await EnrollmentService.queryAccessState(req.query, req.user);
  return new OKResponse({ metadata: { access: state } }).send(res);
});

// ---------------------------------------------------------------------------
// ENR-09: Export Enrollment
// ---------------------------------------------------------------------------
const exportEnrollments = asyncHandler(async (req, res) => {
  const buffer = await EnrollmentService.exportEnrollments(req.query, req.user);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="enrollments_${Date.now()}.xlsx"`);
  return res.send(buffer);
});

// ---------------------------------------------------------------------------
// Payment event endpoints (integration / webhook)
// ---------------------------------------------------------------------------
const handlePaymentConfirmed = asyncHandler(async (req, res) => {
  const { enrollment_id, billing_reference, event_id } = req.body;
  const result = await EnrollmentService.handlePaymentConfirmed({
    enrollmentId: enrollment_id,
    billingReference: billing_reference,
    eventId: event_id,
  });
  return new OKResponse({ message: "Payment confirmation processed", metadata: result }).send(res);
});

const handlePaymentFailed = asyncHandler(async (req, res) => {
  const { enrollment_id, billing_reference, event_id, reason } = req.body;
  const result = await EnrollmentService.handlePaymentFailed({
    enrollmentId: enrollment_id,
    billingReference: billing_reference,
    eventId: event_id,
    reason: reason || "PAYMENT_FAILED",
  });
  return new OKResponse({ message: "Payment failure processed", metadata: result }).send(res);
});

module.exports = {
  requestEnrollment,
  list,
  detail,
  validateEligibility,
  activateEnrollment,
  suspendEnrollment,
  resumeEnrollment,
  cancelEnrollment,
  completeEnrollment,
  getHistory,
  queryAccessState,
  exportEnrollments,
  handlePaymentConfirmed,
  handlePaymentFailed,
};
