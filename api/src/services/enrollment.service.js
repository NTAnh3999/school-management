"use strict";
const { Op } = require("sequelize");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  UnprocessableEntityError,
} = require("../utils/error-responses");
const {
  Enrollment,
  EnrollmentHistory,
  EligibilityResult,
  PaymentReference,
  Course,
  CoursePrerequisite,
  User,
  AuditLog,
  StudentCourseProgress,
} = require("../models");
const { ROLES, isRole } = require("../constants/roles");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ENROLLMENT_STATUSES = {
  PENDING: "pending",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  REJECTED: "rejected",
  WAITLISTED: "waitlisted",
};

// Valid state transitions per FSD §9.6
const VALID_TRANSITIONS = {
  pending: ["active", "rejected", "cancelled", "waitlisted"],
  active: ["suspended", "cancelled", "completed"],
  suspended: ["active", "cancelled"],
  waitlisted: ["active", "cancelled"],
  // terminal states
  cancelled: [],
  completed: [],
  rejected: [],
};

const canTransition = (from, to) => {
  const allowed = VALID_TRANSITIONS[from] || [];
  return allowed.includes(to);
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Write a history record for an enrollment status change.
 */
const writeHistory = async (
  enrollmentId,
  fromStatus,
  toStatus,
  {
    reasonCode = null,
    reasonMessage = null,
    source = "admin",
    sourceRef = null,
    actorId = null,
  } = {}
) => {
  await EnrollmentHistory.create({
    enrollment_id: enrollmentId,
    from_status: fromStatus || null,
    to_status: toStatus,
    reason_code: reasonCode,
    reason_message: reasonMessage,
    source,
    source_reference: sourceRef,
    changed_at: new Date(),
    changed_by: actorId || null,
  });
};

/**
 * Write an audit log entry for sensitive enrollment operations.
 */
const writeAuditLog = async ({
  enrollmentId,
  action,
  oldValues = null,
  newValues = null,
  actorId,
}) => {
  await AuditLog.create({
    entity_name: "Enrollment",
    entity_id: enrollmentId,
    action,
    old_values: oldValues,
    new_values: newValues,
    changed_by: actorId || null,
    changed_at: new Date(),
  });
};

/**
 * Resolve the history source from role/context.
 */
const resolveHistorySource = (actorRole, isBillingEvent = false) => {
  if (isBillingEvent) return "billing_event";
  if (isRole(actorRole, ROLES.ADMIN)) return "admin";
  return "user";
};

/**
 * Check if actor can view/operate on an enrollment (scope guard).
 * Returns true if allowed.
 */
const canAccessEnrollment = (enrollment, actorId, actorRole) => {
  if (isRole(actorRole, ROLES.ADMIN)) return true;
  if (isRole(actorRole, ROLES.TEACHER)) return true; // teachers can read any enrollment in their courses
  // Students can only access their own enrollment
  return enrollment.student_id === actorId;
};

// ---------------------------------------------------------------------------
// ENR-02: Validate Eligibility
// ---------------------------------------------------------------------------

/**
 * Run eligibility checks for a learner + course.
 * Returns { eligible: bool, result, reasonCode, reasonMessage }.
 * Does NOT create EligibilityResult record — callers do that as needed.
 */
const runEligibilityChecks = async (learnerId, courseId, existingEnrollmentId = null) => {
  // 1. Learner exists
  const learner = await User.findByPk(learnerId);
  if (!learner) {
    return {
      eligible: false,
      result: "not_eligible",
      reasonCode: "LEARNER_NOT_FOUND",
      reasonMessage: "Learner not found",
    };
  }

  // 2. Course exists and is enrollable (status=active)
  const course = await Course.findByPk(courseId);
  if (!course) {
    return {
      eligible: false,
      result: "not_eligible",
      reasonCode: "COURSE_NOT_FOUND",
      reasonMessage: "Course not found",
    };
  }
  if (course.status !== "active") {
    return {
      eligible: false,
      result: "not_eligible",
      reasonCode: "COURSE_NOT_ENROLLABLE",
      reasonMessage: `Course is not enrollable (status: ${course.status})`,
    };
  }

  // 3. Duplicate active/pending/waitlisted enrollment check
  const dupWhere = {
    student_id: learnerId,
    course_id: courseId,
    status: { [Op.in]: ["active", "pending", "waitlisted"] },
  };
  if (existingEnrollmentId) {
    dupWhere.id = { [Op.ne]: existingEnrollmentId };
  }
  const duplicate = await Enrollment.findOne({ where: dupWhere });
  if (duplicate) {
    return {
      eligible: false,
      result: "not_eligible",
      reasonCode: "DUPLICATE_ENROLLMENT",
      reasonMessage:
        "Learner already has an active, pending, or waitlisted enrollment for this course",
    };
  }

  // 4. Prerequisites: learner must have completed all prerequisite courses
  const prerequisites = await CoursePrerequisite.findAll({ where: { course_id: courseId } });
  if (prerequisites.length > 0) {
    for (const prereq of prerequisites) {
      const completed = await Enrollment.findOne({
        where: {
          student_id: learnerId,
          course_id: prereq.prerequisite_course_id,
          status: ENROLLMENT_STATUSES.COMPLETED,
        },
      });
      if (!completed) {
        return {
          eligible: false,
          result: "not_eligible",
          reasonCode: "PREREQUISITE_NOT_MET",
          reasonMessage: `Learner has not completed prerequisite course (id: ${prereq.prerequisite_course_id})`,
        };
      }
    }
  }

  // 5. Payment condition: if course has price > 0 and no payment_reference provided,
  //    mark as pending_condition (caller decides final status)
  if (parseFloat(course.price || 0) > 0) {
    return {
      eligible: false,
      result: "pending_condition",
      reasonCode: "PAYMENT_REQUIRED",
      reasonMessage: "Payment is required before enrollment can be activated",
    };
  }

  return { eligible: true, result: "eligible", reasonCode: null, reasonMessage: null };
};

// ---------------------------------------------------------------------------
// ENR-02: Validate Eligibility (external API function)
// ---------------------------------------------------------------------------
const validateEligibility = async (learnerId, courseId, actorId, actorRole) => {
  if (!isRole(actorRole, ROLES.ADMIN) && !isRole(actorRole, ROLES.TEACHER)) {
    // Students may not directly call validate eligibility
    throw new ForbiddenError("Insufficient permissions to validate eligibility");
  }

  const checks = await runEligibilityChecks(learnerId, courseId);

  // Persist eligibility result
  const record = await EligibilityResult.create({
    enrollment_id: null,
    learner_id: learnerId,
    course_id: courseId,
    result: checks.result,
    reason_code: checks.reasonCode,
    reason_message: checks.reasonMessage,
    checked_at: new Date(),
    checked_by: actorId,
  });

  return record;
};

// ---------------------------------------------------------------------------
// ENR-01: Request Enrollment
// ---------------------------------------------------------------------------
const requestEnrollment = async (payload, actorId, actorRole) => {
  const { learner_id, course_id, request_source, payment_reference } = payload;

  // Permission: admin can enroll any learner; student can only enroll themselves
  if (isRole(actorRole, ROLES.STUDENT) && learner_id !== actorId) {
    throw new ForbiddenError("Students can only request enrollment for themselves");
  }
  if (isRole(actorRole, ROLES.TEACHER)) {
    throw new ForbiddenError("Teachers cannot create enrollments");
  }

  // Validate learner
  const learner = await User.findByPk(learner_id);
  if (!learner) throw new NotFoundError("Learner not found");

  // Validate course
  const course = await Course.findByPk(course_id);
  if (!course) throw new NotFoundError("Course not found");
  if (course.status !== "active") {
    throw new BadRequestError(`Course is not available for enrollment (status: ${course.status})`);
  }

  // Run eligibility checks
  const eligibility = await runEligibilityChecks(learner_id, course_id);

  // Persist eligibility result
  const eligResult = await EligibilityResult.create({
    enrollment_id: null,
    learner_id: learner_id,
    course_id: course_id,
    result: eligibility.result,
    reason_code: eligibility.reasonCode,
    reason_message: eligibility.reasonMessage,
    checked_at: new Date(),
    checked_by: actorId,
  });

  // Determine initial status
  let initialStatus;
  let rejectionReason = null;

  if (eligibility.result === "not_eligible") {
    // Hard reject
    initialStatus = ENROLLMENT_STATUSES.REJECTED;
    rejectionReason = eligibility.reasonCode;
  } else if (eligibility.result === "pending_condition") {
    // Payment required → Pending
    initialStatus = ENROLLMENT_STATUSES.PENDING;
  } else {
    // Eligible → Active immediately
    initialStatus = ENROLLMENT_STATUSES.ACTIVE;
  }

  const now = new Date();
  const enrollment = await Enrollment.create({
    student_id: learner_id,
    course_id,
    status: initialStatus,
    request_source: request_source || (isRole(actorRole, ROLES.ADMIN) ? "admin" : "student"),
    payment_reference: payment_reference || null,
    eligibility_result_id: eligResult.id,
    requested_at: now,
    activated_at: initialStatus === ENROLLMENT_STATUSES.ACTIVE ? now : null,
    enrolled_at: initialStatus === ENROLLMENT_STATUSES.ACTIVE ? now : null,
    created_by: actorId,
    updated_by: actorId,
  });

  // Update eligibility result with enrollment_id
  await eligResult.update({ enrollment_id: enrollment.id });

  // Write history
  await writeHistory(enrollment.id, null, initialStatus, {
    reasonCode: rejectionReason,
    source: resolveHistorySource(actorRole),
    actorId,
  });

  // Write audit log
  await writeAuditLog({
    enrollmentId: enrollment.id,
    action: "CREATE",
    newValues: enrollment.toJSON(),
    actorId,
  });

  // If enrollment is active, create baseline progress record
  if (initialStatus === ENROLLMENT_STATUSES.ACTIVE) {
    const existing = await StudentCourseProgress.findOne({
      where: { enrollment_id: enrollment.id },
    });
    if (!existing) {
      await StudentCourseProgress.create({
        enrollment_id: enrollment.id,
        completion_percentage: 0,
        total_time_spent_minutes: 0,
      });
    }
  }

  // If rejected, throw with reason to signal failure clearly
  if (initialStatus === ENROLLMENT_STATUSES.REJECTED) {
    throw new UnprocessableEntityError(eligibility.reasonMessage || "Enrollment request rejected", {
      error_code: eligibility.reasonCode,
      enrollment_id: enrollment.id,
    });
  }

  return enrollment;
};

// ---------------------------------------------------------------------------
// ENR-03: Activate Enrollment
// ---------------------------------------------------------------------------
const activateEnrollment = async (enrollmentId, actorId, actorRole) => {
  if (!isRole(actorRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Only Admin can activate enrollments");
  }

  const enrollment = await Enrollment.findByPk(enrollmentId);
  if (!enrollment) throw new NotFoundError("Enrollment not found");

  if (!canTransition(enrollment.status, ENROLLMENT_STATUSES.ACTIVE)) {
    throw new BadRequestError(
      `Cannot activate enrollment with current status '${enrollment.status}'`
    );
  }

  // Re-validate eligibility before activating
  const eligibility = await runEligibilityChecks(
    enrollment.student_id,
    enrollment.course_id,
    enrollment.id
  );

  if (eligibility.result === "not_eligible") {
    throw new UnprocessableEntityError(
      eligibility.reasonMessage || "Enrollment is not eligible for activation",
      { error_code: eligibility.reasonCode }
    );
  }

  const oldStatus = enrollment.status;
  const now = new Date();
  enrollment.status = ENROLLMENT_STATUSES.ACTIVE;
  enrollment.activated_at = now;
  enrollment.enrolled_at = enrollment.enrolled_at || now;
  enrollment.updated_by = actorId;
  await enrollment.save();

  await writeHistory(enrollment.id, oldStatus, ENROLLMENT_STATUSES.ACTIVE, {
    source: "admin",
    actorId,
  });

  await writeAuditLog({
    enrollmentId: enrollment.id,
    action: "CHANGE_STATUS",
    oldValues: { status: oldStatus },
    newValues: { status: ENROLLMENT_STATUSES.ACTIVE },
    actorId,
  });

  // Create baseline progress if not yet exists
  const existing = await StudentCourseProgress.findOne({ where: { enrollment_id: enrollment.id } });
  if (!existing) {
    await StudentCourseProgress.create({
      enrollment_id: enrollment.id,
      completion_percentage: 0,
      total_time_spent_minutes: 0,
    });
  }

  return enrollment;
};

// ---------------------------------------------------------------------------
// ENR-04: Suspend Enrollment
// ---------------------------------------------------------------------------
const suspendEnrollment = async (
  enrollmentId,
  { reason_code, reason_message } = {},
  actorId,
  actorRole
) => {
  if (!isRole(actorRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Only Admin can suspend enrollments");
  }

  const enrollment = await Enrollment.findByPk(enrollmentId);
  if (!enrollment) throw new NotFoundError("Enrollment not found");

  if (!canTransition(enrollment.status, ENROLLMENT_STATUSES.SUSPENDED)) {
    throw new BadRequestError(
      `Cannot suspend enrollment with current status '${enrollment.status}'`
    );
  }

  const oldStatus = enrollment.status;
  enrollment.status = ENROLLMENT_STATUSES.SUSPENDED;
  enrollment.updated_by = actorId;
  await enrollment.save();

  await writeHistory(enrollment.id, oldStatus, ENROLLMENT_STATUSES.SUSPENDED, {
    reasonCode: reason_code,
    reasonMessage: reason_message,
    source: "admin",
    actorId,
  });

  await writeAuditLog({
    enrollmentId: enrollment.id,
    action: "CHANGE_STATUS",
    oldValues: { status: oldStatus },
    newValues: { status: ENROLLMENT_STATUSES.SUSPENDED },
    actorId,
  });

  return enrollment;
};

// ---------------------------------------------------------------------------
// ENR-04: Resume Enrollment
// ---------------------------------------------------------------------------
const resumeEnrollment = async (enrollmentId, actorId, actorRole) => {
  if (!isRole(actorRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Only Admin can resume enrollments");
  }

  const enrollment = await Enrollment.findByPk(enrollmentId);
  if (!enrollment) throw new NotFoundError("Enrollment not found");

  if (!canTransition(enrollment.status, ENROLLMENT_STATUSES.ACTIVE)) {
    throw new BadRequestError(
      `Cannot resume enrollment with current status '${enrollment.status}'`
    );
  }

  const oldStatus = enrollment.status;
  enrollment.status = ENROLLMENT_STATUSES.ACTIVE;
  enrollment.updated_by = actorId;
  await enrollment.save();

  await writeHistory(enrollment.id, oldStatus, ENROLLMENT_STATUSES.ACTIVE, {
    reasonCode: "RESUMED",
    source: "admin",
    actorId,
  });

  await writeAuditLog({
    enrollmentId: enrollment.id,
    action: "CHANGE_STATUS",
    oldValues: { status: oldStatus },
    newValues: { status: ENROLLMENT_STATUSES.ACTIVE },
    actorId,
  });

  return enrollment;
};

// ---------------------------------------------------------------------------
// ENR-05: Cancel Enrollment
// ---------------------------------------------------------------------------
const cancelEnrollment = async (
  enrollmentId,
  { reason_code, reason_message } = {},
  actorId,
  actorRole
) => {
  const enrollment = await Enrollment.findByPk(enrollmentId);
  if (!enrollment) throw new NotFoundError("Enrollment not found");

  // Permission check
  if (!isRole(actorRole, ROLES.ADMIN)) {
    // Students can only cancel their own enrollments
    if (!isRole(actorRole, ROLES.STUDENT) || enrollment.student_id !== actorId) {
      throw new ForbiddenError("Insufficient permissions to cancel this enrollment");
    }
    // Students can only cancel pending or active enrollments
    if (!["pending", "active"].includes(enrollment.status)) {
      throw new BadRequestError("You can only cancel pending or active enrollments");
    }
  }

  if (!canTransition(enrollment.status, ENROLLMENT_STATUSES.CANCELLED)) {
    throw new BadRequestError(
      `Cannot cancel enrollment with current status '${enrollment.status}'`
    );
  }

  const oldStatus = enrollment.status;
  const now = new Date();
  enrollment.status = ENROLLMENT_STATUSES.CANCELLED;
  enrollment.cancelled_at = now;
  enrollment.updated_by = actorId;
  await enrollment.save();

  const source = resolveHistorySource(actorRole);
  await writeHistory(enrollment.id, oldStatus, ENROLLMENT_STATUSES.CANCELLED, {
    reasonCode: reason_code,
    reasonMessage: reason_message,
    source,
    actorId,
  });

  await writeAuditLog({
    enrollmentId: enrollment.id,
    action: "CHANGE_STATUS",
    oldValues: { status: oldStatus },
    newValues: { status: ENROLLMENT_STATUSES.CANCELLED },
    actorId,
  });

  return enrollment;
};

// ---------------------------------------------------------------------------
// ENR-06: Complete Enrollment
// ---------------------------------------------------------------------------
const completeEnrollment = async (enrollmentId, actorId, actorRole) => {
  if (!isRole(actorRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Only Admin can mark enrollments as completed");
  }

  const enrollment = await Enrollment.findByPk(enrollmentId);
  if (!enrollment) throw new NotFoundError("Enrollment not found");

  if (!canTransition(enrollment.status, ENROLLMENT_STATUSES.COMPLETED)) {
    throw new BadRequestError(
      `Cannot complete enrollment with current status '${enrollment.status}'`
    );
  }

  const oldStatus = enrollment.status;
  const now = new Date();
  enrollment.status = ENROLLMENT_STATUSES.COMPLETED;
  enrollment.completed_at = now;
  enrollment.updated_by = actorId;
  await enrollment.save();

  await writeHistory(enrollment.id, oldStatus, ENROLLMENT_STATUSES.COMPLETED, {
    source: "admin",
    actorId,
  });

  await writeAuditLog({
    enrollmentId: enrollment.id,
    action: "CHANGE_STATUS",
    oldValues: { status: oldStatus },
    newValues: { status: ENROLLMENT_STATUSES.COMPLETED },
    actorId,
  });

  return enrollment;
};

// ---------------------------------------------------------------------------
// ENR-00: List Enrollments
// ---------------------------------------------------------------------------
const list = async (filters = {}, actorId, actorRole) => {
  const where = {};

  // Scope by role
  if (isRole(actorRole, ROLES.STUDENT)) {
    where.student_id = actorId;
  } else if (isRole(actorRole, ROLES.TEACHER)) {
    // Teachers can see enrollments for courses they teach
    const teacherCourses = await Course.findAll({
      where: { teacher_id: actorId },
      attributes: ["id"],
    });
    const courseIds = teacherCourses.map((c) => c.id);
    if (courseIds.length === 0) return { total: 0, page: 1, page_size: 20, enrollments: [] };
    where.course_id = { [Op.in]: courseIds };
  }
  // Admin sees all

  if (filters.status) where.status = filters.status;
  if (filters.course_id) where.course_id = filters.course_id;
  if (filters.learner_id && isRole(actorRole, ROLES.ADMIN)) {
    where.student_id = filters.learner_id;
  }
  if (filters.request_source) where.request_source = filters.request_source;

  const limit = Math.min(parseInt(filters.page_size) || 20, 100);
  const offset = ((parseInt(filters.page) || 1) - 1) * limit;

  const { count, rows } = await Enrollment.findAndCountAll({
    where,
    include: [
      { model: User, as: "student", attributes: ["id", "full_name", "email"] },
      { model: Course, as: "course", attributes: ["id", "course_code", "title", "status"] },
    ],
    limit,
    offset,
    order: [["requested_at", "DESC"]],
  });

  return { total: count, page: parseInt(filters.page) || 1, page_size: limit, enrollments: rows };
};

// ---------------------------------------------------------------------------
// ENR-00: Get Enrollment Detail
// ---------------------------------------------------------------------------
const detail = async (enrollmentId, actorId, actorRole) => {
  const enrollment = await Enrollment.findByPk(enrollmentId, {
    include: [
      { model: User, as: "student", attributes: ["id", "full_name", "email"] },
      {
        model: Course,
        as: "course",
        attributes: ["id", "course_code", "title", "status", "price"],
      },
      { model: StudentCourseProgress, as: "progress" },
    ],
  });

  if (!enrollment) throw new NotFoundError("Enrollment not found");

  if (!canAccessEnrollment(enrollment, actorId, actorRole)) {
    throw new ForbiddenError("Access denied to this enrollment");
  }

  return enrollment;
};

// ---------------------------------------------------------------------------
// ENR-07: View Enrollment History
// ---------------------------------------------------------------------------
const getHistory = async (enrollmentId, actorId, actorRole) => {
  const enrollment = await Enrollment.findByPk(enrollmentId);
  if (!enrollment) throw new NotFoundError("Enrollment not found");

  if (!canAccessEnrollment(enrollment, actorId, actorRole)) {
    throw new ForbiddenError("Access denied to this enrollment");
  }

  const history = await EnrollmentHistory.findAll({
    where: { enrollment_id: enrollmentId },
    include: [{ model: User, as: "changed_by_user", attributes: ["id", "full_name"] }],
    order: [["changed_at", "ASC"]],
  });

  return history;
};

// ---------------------------------------------------------------------------
// ENR-08: Query Enrollment Access State
// ---------------------------------------------------------------------------
const queryAccessState = async (learnerId, courseId, actorId, actorRole) => {
  const enrollment = await Enrollment.findOne({
    where: {
      student_id: learnerId,
      course_id: courseId,
    },
    order: [["requested_at", "DESC"]],
  });

  if (!enrollment) {
    return {
      allowed: false,
      reason: "NO_ENROLLMENT",
      message: "No enrollment found for this learner and course",
    };
  }

  const status = enrollment.status;

  if (status === ENROLLMENT_STATUSES.ACTIVE) {
    return { allowed: true, status, enrollment_id: enrollment.id };
  }

  if (status === ENROLLMENT_STATUSES.COMPLETED) {
    // Allow view-only by policy
    return {
      allowed: true,
      view_only: true,
      status,
      enrollment_id: enrollment.id,
      message: "Enrollment is completed; view-only access may apply",
    };
  }

  const reasonMap = {
    pending: "ENROLLMENT_PENDING",
    suspended: "ENROLLMENT_SUSPENDED",
    cancelled: "ENROLLMENT_CANCELLED",
    rejected: "ENROLLMENT_REJECTED",
    waitlisted: "ENROLLMENT_WAITLISTED",
  };

  return {
    allowed: false,
    status,
    reason: reasonMap[status] || "ENROLLMENT_INACTIVE",
    enrollment_id: enrollment.id,
    message: `Access denied: enrollment status is '${status}'`,
  };
};

// ---------------------------------------------------------------------------
// Payment event consumption (integration point)
// ---------------------------------------------------------------------------

/**
 * Process PaymentConfirmed event from Billing (idempotent).
 * Activates enrollment if eligible and currently Pending.
 */
const handlePaymentConfirmed = async ({ enrollmentId, billingReference, eventId }) => {
  // Idempotency: check if event already processed
  const existingRef = await PaymentReference.findOne({
    where: { enrollment_id: enrollmentId, event_id: eventId },
  });

  if (existingRef && existingRef.payment_condition_status === "confirmed") {
    return { idempotent: true };
  }

  const enrollment = await Enrollment.findByPk(enrollmentId);
  if (!enrollment) throw new NotFoundError("Enrollment not found");

  // Upsert payment reference
  if (existingRef) {
    await existingRef.update({
      payment_condition_status: "confirmed",
      confirmed_at: new Date(),
    });
  } else {
    await PaymentReference.create({
      enrollment_id: enrollmentId,
      billing_reference: billingReference,
      payment_condition_status: "confirmed",
      confirmed_at: new Date(),
      event_id: eventId,
    });
  }

  // Only activate if Pending
  if (enrollment.status !== ENROLLMENT_STATUSES.PENDING) {
    return { enrollment };
  }

  // Re-validate eligibility (skip payment check since it's now confirmed)
  const eligibility = await runEligibilityChecks(
    enrollment.student_id,
    enrollment.course_id,
    enrollment.id
  );

  // Treat pending_condition as eligible since payment is now confirmed
  if (eligibility.result === "not_eligible") {
    return { enrollment, skipped: true, reason: eligibility.reasonCode };
  }

  const oldStatus = enrollment.status;
  const now = new Date();
  enrollment.status = ENROLLMENT_STATUSES.ACTIVE;
  enrollment.activated_at = now;
  enrollment.enrolled_at = enrollment.enrolled_at || now;
  enrollment.payment_reference = billingReference;
  enrollment.updated_by = null;
  await enrollment.save();

  await writeHistory(enrollment.id, oldStatus, ENROLLMENT_STATUSES.ACTIVE, {
    reasonCode: "PAYMENT_CONFIRMED",
    source: "billing_event",
    sourceRef: eventId,
    actorId: null,
  });

  // Create baseline progress
  const existing = await StudentCourseProgress.findOne({ where: { enrollment_id: enrollment.id } });
  if (!existing) {
    await StudentCourseProgress.create({
      enrollment_id: enrollment.id,
      completion_percentage: 0,
      total_time_spent_minutes: 0,
    });
  }

  return { enrollment };
};

/**
 * Process PaymentFailed / PaymentExpired event from Billing (idempotent).
 */
const handlePaymentFailed = async ({
  enrollmentId,
  billingReference,
  eventId,
  reason = "PAYMENT_FAILED",
}) => {
  const existingRef = await PaymentReference.findOne({
    where: { enrollment_id: enrollmentId, event_id: eventId },
  });

  if (existingRef && ["failed", "expired"].includes(existingRef.payment_condition_status)) {
    return { idempotent: true };
  }

  const failedStatus = reason === "PAYMENT_EXPIRED" ? "expired" : "failed";

  if (existingRef) {
    await existingRef.update({ payment_condition_status: failedStatus });
  } else {
    await PaymentReference.create({
      enrollment_id: enrollmentId,
      billing_reference: billingReference,
      payment_condition_status: failedStatus,
      event_id: eventId,
    });
  }

  const enrollment = await Enrollment.findByPk(enrollmentId);
  if (!enrollment) throw new NotFoundError("Enrollment not found");

  // Cancel or keep Pending per policy; here we cancel pending enrollments
  if (enrollment.status === ENROLLMENT_STATUSES.PENDING) {
    const oldStatus = enrollment.status;
    enrollment.status = ENROLLMENT_STATUSES.CANCELLED;
    enrollment.cancelled_at = new Date();
    await enrollment.save();

    await writeHistory(enrollment.id, oldStatus, ENROLLMENT_STATUSES.CANCELLED, {
      reasonCode: reason,
      source: "billing_event",
      sourceRef: eventId,
      actorId: null,
    });
  }

  return { enrollment };
};

module.exports = {
  ENROLLMENT_STATUSES,
  requestEnrollment,
  validateEligibility,
  activateEnrollment,
  suspendEnrollment,
  resumeEnrollment,
  cancelEnrollment,
  completeEnrollment,
  list,
  detail,
  getHistory,
  queryAccessState,
  handlePaymentConfirmed,
  handlePaymentFailed,
};
