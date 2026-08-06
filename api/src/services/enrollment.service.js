"use strict";
const nodeCrypto = require("crypto");
const { Op } = require("sequelize");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  UnprocessableEntityError,
} = require("../utils/error-responses");
const {
  sequelize,
  Enrollment,
  EnrollmentHistory,
  EnrollmentEventOutbox,
  EligibilityResult,
  PaymentReference,
  Course,
  Classroom,
  ClassroomTeacher,
  ClassroomEnrollment,
  CoursePrerequisite,
  Profile,
  StudentProfile,
  ParentProfile,
  ParentStudentRelationship,
  User,
  AuditLog,
  StudentCourseProgress,
} = require("../models");
const { ROLES, isRole } = require("../constants/roles");
const ProgressService = require("./progress.service");

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

const ACTIVE_LIKE_STATUSES = [
  ENROLLMENT_STATUSES.PENDING,
  ENROLLMENT_STATUSES.ACTIVE,
  ENROLLMENT_STATUSES.SUSPENDED,
  ENROLLMENT_STATUSES.WAITLISTED,
];

const CLASSROOM_ENROLLABLE_STATUSES = ["open", "in_progress"];

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

const EVENT_BY_STATUS = {
  pending: "EnrollmentRequested",
  active: "EnrollmentActivated",
  suspended: "EnrollmentSuspended",
  cancelled: "EnrollmentCancelled",
  completed: "EnrollmentCompleted",
  rejected: "EnrollmentRejected",
  waitlisted: "EnrollmentWaitlisted",
};

const writeEnrollmentEvent = async ({
  enrollment,
  previousStatus = null,
  currentStatus,
  eventType,
  actorId = null,
  source = "api",
  sourceRef = null,
  reasonCode = null,
} = {}) => {
  try {
    await EnrollmentEventOutbox.create({
      event_id: nodeCrypto.randomUUID(),
      event_type: eventType || EVENT_BY_STATUS[currentStatus] || "EnrollmentChanged",
      tenant_id: enrollment.tenant_id || null,
      enrollment_id: enrollment.id,
      learner_id: enrollment.student_id,
      course_id: enrollment.course_id,
      classroom_id: enrollment.classroom_id || null,
      previous_status: previousStatus,
      current_status: currentStatus,
      occurred_at: new Date(),
      payload: {
        actor_id: actorId,
        source,
        source_ref: sourceRef,
        reason_code: reasonCode,
        learner_profile_id: enrollment.learner_profile_id,
        enrollment_level: enrollment.enrollment_level,
        version: enrollment.version,
      },
    });
  } catch {
    // Outbox failures must not roll back the committed enrollment state.
  }
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
const getTeacherCourseIds = async (teacherUserId) => {
  const assignments = await ClassroomTeacher.findAll({
    where: { user_id: teacherUserId, active_flag: true },
    attributes: ["classroom_id"],
    include: [
      {
        model: Classroom,
        as: "classroom",
        required: true,
        attributes: ["course_id"],
      },
    ],
  });

  return [
    ...new Set(assignments.map((assignment) => assignment.classroom?.course_id).filter(Boolean)),
  ];
};

const resolveActorContext = (actor = {}) => ({
  id: actor.id,
  role: actor.role,
  tenantId: actor.activeTenantId || actor.active_tenant_id || actor.tenant_id || null,
});

const getStudentProfileForUser = async (userId, tenantId = null) => {
  const profileWhere = { user_id: userId, profile_type: "student" };
  if (tenantId) profileWhere.tenant_id = tenantId;

  const profile = await Profile.findOne({
    where: profileWhere,
    include: [{ model: StudentProfile, as: "student_profile", required: false }],
  });

  return {
    learnerId: userId,
    learnerProfileId: profile?.id || null,
    studentProfileId: profile?.student_profile?.id || null,
  };
};

const resolveLearnerIdentity = async ({ learner_id, learner_profile_id, tenant_id }) => {
  if (learner_profile_id) {
    const where = { id: learner_profile_id, profile_type: "student" };
    if (tenant_id) where.tenant_id = tenant_id;

    const profile = await Profile.findOne({
      where,
      include: [{ model: StudentProfile, as: "student_profile", required: false }],
    });
    if (!profile) {
      throw new NotFoundError("Learner profile not found");
    }
    return {
      learnerId: profile.user_id,
      learnerProfileId: profile.id,
      studentProfileId: profile.student_profile?.id || null,
    };
  }

  if (!learner_id) {
    throw new BadRequestError("learner_id or learner_profile_id is required", {
      error_code: "LEARNER_NOT_FOUND",
    });
  }

  const learner = await User.findByPk(learner_id);
  if (!learner) throw new NotFoundError("Learner not found");
  return getStudentProfileForUser(learner_id, tenant_id);
};

const getLinkedChildUserIds = async (parentUserId, tenantId = null) => {
  const profileWhere = { user_id: parentUserId, profile_type: "parent" };
  if (tenantId) profileWhere.tenant_id = tenantId;

  const parentProfile = await Profile.findOne({
    where: profileWhere,
    include: [{ model: ParentProfile, as: "parent_profile", required: true }],
  });
  if (!parentProfile?.parent_profile) return [];

  const relationshipWhere = {
    parent_profile_id: parentProfile.parent_profile.id,
    status: "active",
  };
  if (tenantId) relationshipWhere.tenant_id = tenantId;

  const relationships = await ParentStudentRelationship.findAll({
    where: relationshipWhere,
    include: [
      {
        model: StudentProfile,
        as: "student_profile",
        required: true,
        include: [{ model: Profile, as: "profile", required: true }],
      },
    ],
  });

  return [
    ...new Set(
      relationships
        .map((relationship) => relationship.student_profile?.profile?.user_id)
        .filter(Boolean)
    ),
  ];
};

const assertCanRequestForLearner = async ({ learnerId, actorId, actorRole, tenantId }) => {
  if (isRole(actorRole, ROLES.ADMIN)) return;
  if (isRole(actorRole, ROLES.STUDENT) && learnerId === actorId) return;

  if (isRole(actorRole, ROLES.PARENT)) {
    const linkedChildUserIds = await getLinkedChildUserIds(actorId, tenantId);
    if (linkedChildUserIds.includes(learnerId)) return;
    throw new ForbiddenError("Parent is not linked to this learner", {
      error_code: "PARENT_STUDENT_RELATIONSHIP_INVALID",
    });
  }

  if (isRole(actorRole, ROLES.TEACHER)) {
    throw new ForbiddenError("Teachers cannot create enrollments");
  }

  throw new ForbiddenError("Insufficient permissions to request enrollment");
};

const canAccessEnrollment = async (enrollment, actorId, actorRole) => {
  if (isRole(actorRole, ROLES.ADMIN)) return true;
  if (isRole(actorRole, ROLES.TEACHER)) {
    const teacherCourseIds = await getTeacherCourseIds(actorId);
    return teacherCourseIds.includes(enrollment.course_id);
  }
  if (isRole(actorRole, ROLES.PARENT)) {
    const linkedChildUserIds = await getLinkedChildUserIds(actorId, enrollment.tenant_id);
    return linkedChildUserIds.includes(enrollment.student_id);
  }
  // Students can only access their own enrollment
  return enrollment.student_id === actorId;
};

const getActiveEnrollmentCountForClassroom = async (classroomId, excludeEnrollmentId = null) => {
  const unifiedCount = await Enrollment.count({
    where: {
      classroom_id: classroomId,
      status: { [Op.in]: [ENROLLMENT_STATUSES.ACTIVE, ENROLLMENT_STATUSES.SUSPENDED] },
      ...(excludeEnrollmentId ? { id: { [Op.ne]: excludeEnrollmentId } } : {}),
    },
  });
  const rosterCount = await ClassroomEnrollment.count({
    where: { classroom_id: classroomId, enrollment_status: "enrolled" },
  });
  return Math.max(unifiedCount, rosterCount);
};

// ---------------------------------------------------------------------------
// ENR-02: Validate Eligibility
// ---------------------------------------------------------------------------

/**
 * Run eligibility checks for a learner + course.
 * Returns { eligible: bool, result, reasonCode, reasonMessage }.
 * Does NOT create EligibilityResult record — callers do that as needed.
 */
const runEligibilityChecks = async ({
  learnerId,
  courseId,
  classroomId = null,
  tenantId = null,
  existingEnrollmentId = null,
} = {}) => {
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

  // 3. Classroom target, if provided
  let classroom = null;
  if (classroomId) {
    classroom = await Classroom.findByPk(classroomId);
    if (!classroom) {
      return {
        eligible: false,
        result: "not_eligible",
        reasonCode: "CLASSROOM_NOT_FOUND",
        reasonMessage: "Classroom not found",
      };
    }

    if (classroom.course_id !== courseId) {
      return {
        eligible: false,
        result: "not_eligible",
        reasonCode: "CLASSROOM_COURSE_MISMATCH",
        reasonMessage: "Classroom does not belong to the requested course",
      };
    }

    if (!CLASSROOM_ENROLLABLE_STATUSES.includes(classroom.status) && classroom.status !== "full") {
      return {
        eligible: false,
        result: "not_eligible",
        reasonCode: "CLASSROOM_CLOSED",
        reasonMessage: `Classroom is not accepting enrollments (status: ${classroom.status})`,
      };
    }

    const today = new Date();
    if (classroom.enrollment_start_date && today < new Date(classroom.enrollment_start_date)) {
      return {
        eligible: false,
        result: "not_eligible",
        reasonCode: "CLASSROOM_CLOSED",
        reasonMessage: "Classroom enrollment has not opened yet",
      };
    }
    if (classroom.enrollment_end_date && today > new Date(classroom.enrollment_end_date)) {
      return {
        eligible: false,
        result: "not_eligible",
        reasonCode: "CLASSROOM_CLOSED",
        reasonMessage: "Classroom enrollment is closed",
      };
    }

    const duplicateClassroomEnrollment = await Enrollment.findOne({
      where: {
        ...(tenantId ? { tenant_id: tenantId } : {}),
        student_id: learnerId,
        course_id: courseId,
        classroom_id: classroomId,
        status: { [Op.in]: ACTIVE_LIKE_STATUSES },
        ...(existingEnrollmentId ? { id: { [Op.ne]: existingEnrollmentId } } : {}),
      },
    });
    if (duplicateClassroomEnrollment) {
      return {
        eligible: false,
        result: "not_eligible",
        reasonCode: "DUPLICATE_ENROLLMENT",
        reasonMessage: "Learner already has an active-like enrollment for this classroom",
      };
    }

    const activeCount = await getActiveEnrollmentCountForClassroom(
      classroomId,
      existingEnrollmentId
    );
    if (activeCount >= classroom.max_capacity) {
      if (classroom.waitlist_enabled) {
        return {
          eligible: true,
          result: "pending_condition",
          reasonCode: "CLASSROOM_CAPACITY_EXCEEDED",
          reasonMessage: "Classroom is full; learner will be waitlisted",
          initialStatus: ENROLLMENT_STATUSES.WAITLISTED,
        };
      }
      return {
        eligible: false,
        result: "not_eligible",
        reasonCode: "CLASSROOM_CAPACITY_EXCEEDED",
        reasonMessage: "Classroom has reached maximum capacity",
      };
    }

    if (classroom.approval_required) {
      return {
        eligible: true,
        result: "pending_condition",
        reasonCode: "APPROVAL_REQUIRED",
        reasonMessage: "Enrollment requires approval",
        initialStatus: ENROLLMENT_STATUSES.PENDING,
      };
    }
  }

  // 4. Duplicate active-like enrollment check
  const dupWhere = {
    student_id: learnerId,
    course_id: courseId,
    status: { [Op.in]: ACTIVE_LIKE_STATUSES },
  };
  if (tenantId) dupWhere.tenant_id = tenantId;
  if (classroomId) {
    dupWhere.classroom_id = classroomId;
  } else {
    dupWhere.classroom_id = null;
  }
  if (existingEnrollmentId) {
    dupWhere.id = { [Op.ne]: existingEnrollmentId };
  }
  const duplicate = await Enrollment.findOne({ where: dupWhere });
  if (duplicate) {
    return {
      eligible: false,
      result: "not_eligible",
      reasonCode: "DUPLICATE_ENROLLMENT",
      reasonMessage: "Learner already has an active-like enrollment for this target",
    };
  }

  // 5. Prerequisites: learner must have completed all prerequisite courses
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

  return {
    eligible: true,
    result: "eligible",
    reasonCode: null,
    reasonMessage: null,
    initialStatus: ENROLLMENT_STATUSES.ACTIVE,
  };
};

// ---------------------------------------------------------------------------
// ENR-02: Validate Eligibility (external API function)
// ---------------------------------------------------------------------------
const validateEligibility = async (options, actor = {}) => {
  const { id: actorId, role: actorRole, tenantId: actorTenantId } = resolveActorContext(actor);
  const learnerId = parseInt(options.learner_id || options.learnerId);
  const courseId = parseInt(options.course_id || options.courseId);
  const classroomId = options.classroom_id || options.classroomId || null;
  const tenantId = options.tenant_id || options.tenantId || actorTenantId || null;
  const learnerProfileId = options.learner_profile_id || options.learnerProfileId || null;

  if (!isRole(actorRole, ROLES.ADMIN) && !isRole(actorRole, ROLES.TEACHER)) {
    // Students may not directly call validate eligibility
    throw new ForbiddenError("Insufficient permissions to validate eligibility");
  }

  const learnerIdentity = await resolveLearnerIdentity({
    learner_id: learnerId,
    learner_profile_id: learnerProfileId,
    tenant_id: tenantId,
  });

  const checks = await runEligibilityChecks({
    learnerId: learnerIdentity.learnerId,
    courseId,
    classroomId: classroomId ? parseInt(classroomId) : null,
    tenantId,
  });

  // Persist eligibility result
  const record = await EligibilityResult.create({
    enrollment_id: null,
    learner_id: learnerIdentity.learnerId,
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
    await ProgressService.initializeProgressForEnrollment(enrollment.id, {
      actorId,
      sourceEventId: `enrollment:${enrollment.id}:activated`,
      sourceEventName: "EnrollmentActivated",
      sourceModule: "enrollment",
    });
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

const requestEnrollmentV2 = async (payload, actor = {}) => {
  const { id: actorId, role: actorRole, tenantId: actorTenantId } = resolveActorContext(actor);
  const {
    learner_id,
    learner_profile_id,
    course_id,
    classroom_id,
    request_source,
    payment_reference,
    tenant_id,
    idempotency_key,
  } = payload;

  const tenantId = tenant_id || actorTenantId || null;
  if (actorTenantId && tenant_id && parseInt(tenant_id) !== parseInt(actorTenantId)) {
    throw new ForbiddenError("Request tenant is outside the active tenant context", {
      error_code: "TENANT_SCOPE_VIOLATION",
    });
  }

  const effectiveLearnerId =
    learner_id || (!learner_profile_id && isRole(actorRole, ROLES.STUDENT) ? actorId : null);

  const learnerIdentity = await resolveLearnerIdentity({
    learner_id: effectiveLearnerId,
    learner_profile_id,
    tenant_id: tenantId,
  });

  await assertCanRequestForLearner({
    learnerId: learnerIdentity.learnerId,
    actorId,
    actorRole,
    tenantId,
  });

  const parsedCourseId = parseInt(course_id);
  const parsedClassroomId = classroom_id ? parseInt(classroom_id) : null;

  if (idempotency_key) {
    const existingByKey = await Enrollment.findOne({
      where: {
        ...(tenantId ? { tenant_id: tenantId } : {}),
        idempotency_key,
      },
    });
    if (existingByKey) {
      const samePayload =
        existingByKey.student_id === learnerIdentity.learnerId &&
        existingByKey.course_id === parsedCourseId &&
        (existingByKey.classroom_id || null) === parsedClassroomId;
      if (!samePayload) {
        throw new ConflictError("Idempotency key was already used with different enrollment data", {
          error_code: "IDEMPOTENCY_CONFLICT",
        });
      }
      return existingByKey;
    }
  }

  const eligibility = await runEligibilityChecks({
    learnerId: learnerIdentity.learnerId,
    courseId: parsedCourseId,
    classroomId: parsedClassroomId,
    tenantId,
  });

  const eligResult = await EligibilityResult.create({
    enrollment_id: null,
    learner_id: learnerIdentity.learnerId,
    course_id: parsedCourseId,
    result: eligibility.result,
    reason_code: eligibility.reasonCode,
    reason_message: eligibility.reasonMessage,
    checked_at: new Date(),
    checked_by: actorId,
  });

  let initialStatus;
  let rejectionReason = null;

  if (eligibility.result === "not_eligible") {
    initialStatus = ENROLLMENT_STATUSES.REJECTED;
    rejectionReason = eligibility.reasonCode;
  } else if (eligibility.initialStatus) {
    initialStatus = eligibility.initialStatus;
  } else if (eligibility.result === "pending_condition") {
    initialStatus = ENROLLMENT_STATUSES.PENDING;
  } else {
    initialStatus = ENROLLMENT_STATUSES.ACTIVE;
  }

  const now = new Date();
  const enrollment = await Enrollment.create({
    tenant_id: tenantId,
    learner_profile_id: learnerIdentity.learnerProfileId,
    student_id: learnerIdentity.learnerId,
    course_id: parsedCourseId,
    classroom_id: parsedClassroomId,
    enrollment_level: parsedClassroomId ? "classroom" : "course",
    status: initialStatus,
    request_source: request_source || (isRole(actorRole, ROLES.ADMIN) ? "admin" : "student"),
    idempotency_key: idempotency_key || null,
    payment_reference: payment_reference || null,
    eligibility_result_id: eligResult.id,
    requested_at: now,
    activated_at: initialStatus === ENROLLMENT_STATUSES.ACTIVE ? now : null,
    enrolled_at: initialStatus === ENROLLMENT_STATUSES.ACTIVE ? now : null,
    current_reason_code: eligibility.reasonCode || rejectionReason,
    current_reason_message: eligibility.reasonMessage || null,
    version: 0,
    created_by: actorId,
    updated_by: actorId,
  });

  await eligResult.update({ enrollment_id: enrollment.id });

  await writeHistory(enrollment.id, null, initialStatus, {
    reasonCode: rejectionReason || eligibility.reasonCode,
    reasonMessage: eligibility.reasonMessage,
    source: resolveHistorySource(actorRole),
    actorId,
  });

  await writeAuditLog({
    enrollmentId: enrollment.id,
    action: "CREATE",
    newValues: enrollment.toJSON(),
    actorId,
  });

  await writeEnrollmentEvent({
    enrollment,
    currentStatus: initialStatus,
    actorId,
    source: resolveHistorySource(actorRole),
    reasonCode: rejectionReason || eligibility.reasonCode,
  });

  if (initialStatus === ENROLLMENT_STATUSES.ACTIVE) {
    await ProgressService.initializeProgressForEnrollment(enrollment.id, {
      actorId,
      sourceEventId: `enrollment:${enrollment.id}:activated`,
      sourceEventName: "EnrollmentActivated",
      sourceModule: "enrollment",
    });
  }

  if (initialStatus === ENROLLMENT_STATUSES.ACTIVE && parsedClassroomId) {
    await Classroom.update(
      { enrolled_count: sequelize.literal("enrolled_count + 1") },
      { where: { id: parsedClassroomId } }
    );
  }

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
  const eligibility = await runEligibilityChecks({
    learnerId: enrollment.student_id,
    courseId: enrollment.course_id,
    classroomId: enrollment.classroom_id,
    tenantId: enrollment.tenant_id,
    existingEnrollmentId: enrollment.id,
  });

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
  enrollment.current_reason_code = null;
  enrollment.current_reason_message = null;
  enrollment.version = (enrollment.version || 0) + 1;
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

  await writeEnrollmentEvent({
    enrollment,
    previousStatus: oldStatus,
    currentStatus: ENROLLMENT_STATUSES.ACTIVE,
    actorId,
    source: "admin",
  });

  // Create baseline progress if not yet exists
  await ProgressService.initializeProgressForEnrollment(enrollment.id, {
    actorId,
    sourceEventId: `enrollment:${enrollment.id}:activated`,
    sourceEventName: "EnrollmentActivated",
    sourceModule: "enrollment",
  });

  if (enrollment.classroom_id && oldStatus !== ENROLLMENT_STATUSES.ACTIVE) {
    await Classroom.update(
      { enrolled_count: sequelize.literal("enrolled_count + 1") },
      { where: { id: enrollment.classroom_id } }
    );
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
  enrollment.suspended_at = new Date();
  enrollment.current_reason_code = reason_code || "SUSPENDED";
  enrollment.current_reason_message = reason_message || null;
  enrollment.version = (enrollment.version || 0) + 1;
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

  await writeEnrollmentEvent({
    enrollment,
    previousStatus: oldStatus,
    currentStatus: ENROLLMENT_STATUSES.SUSPENDED,
    actorId,
    source: "admin",
    reasonCode: reason_code,
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

  const eligibility = await runEligibilityChecks({
    learnerId: enrollment.student_id,
    courseId: enrollment.course_id,
    classroomId: enrollment.classroom_id,
    tenantId: enrollment.tenant_id,
    existingEnrollmentId: enrollment.id,
  });
  if (eligibility.result === "not_eligible") {
    throw new UnprocessableEntityError(
      eligibility.reasonMessage || "Enrollment is not eligible for resume",
      { error_code: eligibility.reasonCode }
    );
  }

  const oldStatus = enrollment.status;
  enrollment.status = ENROLLMENT_STATUSES.ACTIVE;
  enrollment.current_reason_code = null;
  enrollment.current_reason_message = null;
  enrollment.version = (enrollment.version || 0) + 1;
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

  await writeEnrollmentEvent({
    enrollment,
    previousStatus: oldStatus,
    currentStatus: ENROLLMENT_STATUSES.ACTIVE,
    eventType: "EnrollmentResumed",
    actorId,
    source: "admin",
    reasonCode: "RESUMED",
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
    const isStudentOwn = isRole(actorRole, ROLES.STUDENT) && enrollment.student_id === actorId;
    let isParentLinked = false;
    if (isRole(actorRole, ROLES.PARENT)) {
      const linkedChildUserIds = await getLinkedChildUserIds(actorId, enrollment.tenant_id);
      isParentLinked = linkedChildUserIds.includes(enrollment.student_id);
    }
    if (!isStudentOwn && !isParentLinked) {
      throw new ForbiddenError("Insufficient permissions to cancel this enrollment");
    }
    // Student/parent self-service can only cancel pending or active enrollments.
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
  enrollment.current_reason_code = reason_code || "CANCELLED";
  enrollment.current_reason_message = reason_message || null;
  enrollment.version = (enrollment.version || 0) + 1;
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

  await writeEnrollmentEvent({
    enrollment,
    previousStatus: oldStatus,
    currentStatus: ENROLLMENT_STATUSES.CANCELLED,
    actorId,
    source,
    reasonCode: reason_code,
  });

  if (
    enrollment.classroom_id &&
    [ENROLLMENT_STATUSES.ACTIVE, ENROLLMENT_STATUSES.SUSPENDED].includes(oldStatus)
  ) {
    await Classroom.update(
      { enrolled_count: sequelize.literal("GREATEST(enrolled_count - 1, 0)") },
      { where: { id: enrollment.classroom_id } }
    );
  }

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
  enrollment.current_reason_code = null;
  enrollment.current_reason_message = null;
  enrollment.version = (enrollment.version || 0) + 1;
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

  await writeEnrollmentEvent({
    enrollment,
    previousStatus: oldStatus,
    currentStatus: ENROLLMENT_STATUSES.COMPLETED,
    actorId,
    source: "admin",
  });

  return enrollment;
};

// ---------------------------------------------------------------------------
// ENR-00: List Enrollments
// ---------------------------------------------------------------------------
const buildScopedEnrollmentWhere = async (
  filters = {},
  actorId,
  actorRole,
  actorTenantId = null
) => {
  const where = {};

  if (actorTenantId) where.tenant_id = actorTenantId;

  if (isRole(actorRole, ROLES.STUDENT)) {
    where.student_id = actorId;
  } else if (isRole(actorRole, ROLES.PARENT)) {
    const childUserIds = await getLinkedChildUserIds(actorId, actorTenantId);
    if (childUserIds.length === 0) return null;
    where.student_id = { [Op.in]: childUserIds };
  } else if (isRole(actorRole, ROLES.TEACHER)) {
    const courseIds = await getTeacherCourseIds(actorId);
    if (courseIds.length === 0) return null;
    where.course_id = { [Op.in]: courseIds };
  }

  if (filters.tenant_id && !actorTenantId && isRole(actorRole, ROLES.ADMIN)) {
    where.tenant_id = filters.tenant_id;
  }
  if (filters.status) where.status = filters.status;
  if (filters.course_id) where.course_id = filters.course_id;
  if (filters.classroom_id) where.classroom_id = filters.classroom_id;
  if (filters.enrollment_level) where.enrollment_level = filters.enrollment_level;
  if (filters.learner_id && isRole(actorRole, ROLES.ADMIN)) {
    where.student_id = filters.learner_id;
  }
  if (filters.learner_profile_id && isRole(actorRole, ROLES.ADMIN)) {
    where.learner_profile_id = filters.learner_profile_id;
  }
  if (filters.request_source) where.request_source = filters.request_source;
  if (filters.requested_from || filters.requested_to) {
    where.requested_at = {};
    if (filters.requested_from) where.requested_at[Op.gte] = new Date(filters.requested_from);
    if (filters.requested_to) where.requested_at[Op.lte] = new Date(filters.requested_to);
  }

  return where;
};

const list = async (filters = {}, actorId, actorRole) => {
  const where = await buildScopedEnrollmentWhere(
    filters,
    actorId,
    actorRole,
    filters.actor_tenant_id || null
  );
  if (!where) return { total: 0, page: 1, page_size: 20, enrollments: [] };

  const limit = Math.min(parseInt(filters.page_size) || 20, 100);
  const offset = ((parseInt(filters.page) || 1) - 1) * limit;

  const { count, rows } = await Enrollment.findAndCountAll({
    where,
    include: [
      { model: Profile, as: "learner_profile", attributes: ["id", "full_name", "profile_type"] },
      { model: User, as: "student", attributes: ["id", "full_name", "email"] },
      { model: Course, as: "course", attributes: ["id", "course_code", "course_name", "status"] },
      {
        model: Classroom,
        as: "classroom",
        attributes: ["id", "classroom_code", "classroom_name", "status"],
      },
    ],
    limit,
    offset,
    order: [
      ["requested_at", "DESC"],
      ["id", "DESC"],
    ],
  });

  return { total: count, page: parseInt(filters.page) || 1, page_size: limit, enrollments: rows };
};

// ---------------------------------------------------------------------------
// ENR-00: Get Enrollment Detail
// ---------------------------------------------------------------------------
const detail = async (enrollmentId, actorId, actorRole) => {
  const enrollment = await Enrollment.findByPk(enrollmentId, {
    include: [
      { model: Profile, as: "learner_profile", attributes: ["id", "full_name", "profile_type"] },
      { model: User, as: "student", attributes: ["id", "full_name", "email"] },
      {
        model: Course,
        as: "course",
        attributes: ["id", "course_code", "course_name", "status"],
      },
      {
        model: Classroom,
        as: "classroom",
        attributes: ["id", "classroom_code", "classroom_name", "status"],
      },
      { model: StudentCourseProgress, as: "progress" },
    ],
  });

  if (!enrollment) throw new NotFoundError("Enrollment not found");

  if (!(await canAccessEnrollment(enrollment, actorId, actorRole))) {
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

  if (!(await canAccessEnrollment(enrollment, actorId, actorRole))) {
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
const queryAccessState = async (options, actor = {}) => {
  const { id: actorId, role: actorRole, tenantId } = resolveActorContext(actor);
  const learnerId = parseInt(options.learner_id || options.learnerId);
  const courseId = parseInt(options.course_id || options.courseId);
  const classroomId = options.classroom_id || options.classroomId || null;

  const enrollment = await Enrollment.findOne({
    where: {
      ...(tenantId ? { tenant_id: tenantId } : {}),
      student_id: learnerId,
      course_id: courseId,
      ...(classroomId ? { classroom_id: parseInt(classroomId) } : {}),
    },
    order: [["requested_at", "DESC"]],
  });

  if (!enrollment) {
    return {
      allowed: false,
      reason_code: "NO_ENROLLMENT",
      message: "No enrollment found for this learner and course",
    };
  }

  if (!(await canAccessEnrollment(enrollment, actorId, actorRole))) {
    throw new ForbiddenError("Access denied to this enrollment access state", {
      error_code: "ENROLLMENT_ACCESS_DENIED",
    });
  }

  const status = enrollment.status;
  const basePayload = {
    enrollment_id: enrollment.id,
    current_status: status,
    access_scope: {
      target: enrollment.enrollment_level,
      course_id: enrollment.course_id,
      classroom_id: enrollment.classroom_id,
    },
  };

  if (status === ENROLLMENT_STATUSES.ACTIVE) {
    return { allowed: true, ...basePayload };
  }

  if (status === ENROLLMENT_STATUSES.COMPLETED) {
    // Allow view-only by policy
    return {
      allowed: true,
      view_only: true,
      ...basePayload,
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
    ...basePayload,
    reason_code: reasonMap[status] || "ENROLLMENT_INACTIVE",
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
  const eligibility = await runEligibilityChecks({
    learnerId: enrollment.student_id,
    courseId: enrollment.course_id,
    classroomId: enrollment.classroom_id,
    tenantId: enrollment.tenant_id,
    existingEnrollmentId: enrollment.id,
  });

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
  enrollment.current_reason_code = null;
  enrollment.current_reason_message = null;
  enrollment.version = (enrollment.version || 0) + 1;
  enrollment.updated_by = null;
  await enrollment.save();

  await writeHistory(enrollment.id, oldStatus, ENROLLMENT_STATUSES.ACTIVE, {
    reasonCode: "PAYMENT_CONFIRMED",
    source: "billing_event",
    sourceRef: eventId,
    actorId: null,
  });

  // Create baseline progress
  await ProgressService.initializeProgressForEnrollment(enrollment.id, {
    actorId: null,
    sourceEventId: eventId || `payment:${enrollment.id}:confirmed`,
    sourceEventName: "EnrollmentActivated",
    sourceModule: "billing",
  });

  await writeAuditLog({
    enrollmentId: enrollment.id,
    action: "CHANGE_STATUS",
    oldValues: { status: oldStatus },
    newValues: { status: ENROLLMENT_STATUSES.ACTIVE, source: "billing_event" },
    actorId: null,
  });

  await writeEnrollmentEvent({
    enrollment,
    previousStatus: oldStatus,
    currentStatus: ENROLLMENT_STATUSES.ACTIVE,
    actorId: null,
    source: "billing_event",
    sourceRef: eventId,
    reasonCode: "PAYMENT_CONFIRMED",
  });

  if (enrollment.classroom_id) {
    await Classroom.update(
      { enrolled_count: sequelize.literal("enrolled_count + 1") },
      { where: { id: enrollment.classroom_id } }
    );
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
    enrollment.current_reason_code = reason;
    enrollment.version = (enrollment.version || 0) + 1;
    await enrollment.save();

    await writeHistory(enrollment.id, oldStatus, ENROLLMENT_STATUSES.CANCELLED, {
      reasonCode: reason,
      source: "billing_event",
      sourceRef: eventId,
      actorId: null,
    });

    await writeAuditLog({
      enrollmentId: enrollment.id,
      action: "CHANGE_STATUS",
      oldValues: { status: oldStatus },
      newValues: { status: ENROLLMENT_STATUSES.CANCELLED, source: "billing_event", reason },
      actorId: null,
    });

    await writeEnrollmentEvent({
      enrollment,
      previousStatus: oldStatus,
      currentStatus: ENROLLMENT_STATUSES.CANCELLED,
      actorId: null,
      source: "billing_event",
      sourceRef: eventId,
      reasonCode: reason,
    });
  }

  return { enrollment };
};

// ---------------------------------------------------------------------------
// ENR-09: Export Enrollments
// ---------------------------------------------------------------------------
const exportEnrollments = async (filters = {}, actor = {}) => {
  const { id: actorId, role: actorRole, tenantId } = resolveActorContext(actor);
  if (!isRole(actorRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Only Admin can export enrollments", {
      error_code: "ENROLLMENT_ACCESS_DENIED",
    });
  }

  const where = await buildScopedEnrollmentWhere(
    { ...filters, actor_tenant_id: tenantId },
    actorId,
    actorRole,
    tenantId
  );

  const enrollments = await Enrollment.findAll({
    where: where || {},
    include: [
      { model: Profile, as: "learner_profile", attributes: ["id", "full_name", "profile_type"] },
      { model: User, as: "student", attributes: ["id", "full_name", "email"] },
      { model: Course, as: "course", attributes: ["id", "course_code", "course_name", "status"] },
      {
        model: Classroom,
        as: "classroom",
        attributes: ["id", "classroom_code", "classroom_name", "status"],
      },
    ],
    order: [
      ["requested_at", "DESC"],
      ["id", "DESC"],
    ],
  });

  const XLSX = require("xlsx");
  const data = enrollments.map((enrollment) => ({
    enrollment_id: enrollment.id,
    tenant_id: enrollment.tenant_id || "",
    enrollment_level: enrollment.enrollment_level,
    learner_id: enrollment.student_id,
    learner_name: enrollment.learner_profile?.full_name || enrollment.student?.full_name || "",
    learner_email: enrollment.student?.email || "",
    course_id: enrollment.course_id,
    course_code: enrollment.course?.course_code || "",
    course_name: enrollment.course?.course_name || "",
    classroom_id: enrollment.classroom_id || "",
    classroom_code: enrollment.classroom?.classroom_code || "",
    classroom_name: enrollment.classroom?.classroom_name || "",
    status: enrollment.status,
    request_source: enrollment.request_source,
    requested_at: enrollment.requested_at || "",
    activated_at: enrollment.activated_at || "",
    suspended_at: enrollment.suspended_at || "",
    cancelled_at: enrollment.cancelled_at || "",
    completed_at: enrollment.completed_at || "",
    reason_code: enrollment.current_reason_code || "",
    version: enrollment.version,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Enrollments");

  await writeAuditLog({
    enrollmentId: 0,
    action: "EXPORT",
    newValues: { filters, row_count: data.length },
    actorId,
  });

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

void requestEnrollment;

module.exports = {
  ENROLLMENT_STATUSES,
  requestEnrollment: requestEnrollmentV2,
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
  exportEnrollments,
};
