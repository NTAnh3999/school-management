const { BadRequestError, ForbiddenError, NotFoundError } = require("../utils/error-responses");
const { ROLES, isRole } = require("../constants/roles");
const {
  AuditLog,
  Classroom,
  ClassroomTeacher,
  ContentVersion,
  LessonProgress,
  Enrollment,
  Lesson,
  ParentProfile,
  ParentStudentRelationship,
  Profile,
  ProgressEventLog,
  StudentCourseProgress,
  Course,
  StudentProfile,
  User,
} = require("../models");

const PROGRESS_STATUSES = Object.freeze({
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  BLOCKED: "blocked",
  ARCHIVED: "archived",
});

const DEFAULT_MILESTONE_SUMMARY = Object.freeze({
  enabled: false,
  items: [],
});

const roundPercentage = (value) => Number(Number(value || 0).toFixed(2));

const writeAuditLog = async ({
  progressId,
  enrollmentId,
  action,
  actorId = null,
  oldValues = null,
  newValues = null,
}) => {
  await AuditLog.create({
    entity_name: "Progress",
    entity_id: progressId || enrollmentId,
    action,
    old_values: oldValues,
    new_values: newValues,
    changed_by: actorId,
    changed_at: new Date(),
  });
};

const writeProgressEventLog = async ({
  progressId = null,
  enrollmentId,
  learnerId,
  courseId,
  courseVersionId = null,
  sourceModule,
  sourceEventName,
  sourceEventId = null,
  processStatus = "success",
  errorCode = null,
  errorMessage = null,
  metadata = null,
  receivedAt = new Date(),
  processedAt = new Date(),
}) =>
  ProgressEventLog.create({
    progress_id: progressId,
    enrollment_id: enrollmentId,
    learner_id: learnerId,
    course_id: courseId,
    course_version_id: courseVersionId,
    source_module: sourceModule,
    source_event_name: sourceEventName,
    source_event_id: sourceEventId,
    process_status: processStatus,
    error_code: errorCode,
    error_message: errorMessage,
    metadata,
    received_at: receivedAt,
    processed_at: processedAt,
  });

const flattenPublishedLessons = (snapshotRef) => {
  if (!Array.isArray(snapshotRef)) return [];

  return snapshotRef.flatMap((courseModule) =>
    (courseModule?.lessons || []).map((lesson) => ({
      id: Number(lesson.id),
      title: lesson.title,
      module_id: courseModule?.id || null,
      module_title: courseModule?.title || null,
      learning_item_count: Array.isArray(lesson.learning_items) ? lesson.learning_items.length : 0,
    }))
  );
};

const resolveProgressStatus = ({
  completionPercentage,
  completedItemCount,
  totalTimeSpentMinutes,
  enrollmentStatus,
}) => {
  if (["cancelled", "rejected"].includes(enrollmentStatus)) return PROGRESS_STATUSES.ARCHIVED;
  if (completionPercentage >= 100 && completedItemCount > 0) return PROGRESS_STATUSES.COMPLETED;
  if (completedItemCount > 0 || totalTimeSpentMinutes > 0) return PROGRESS_STATUSES.IN_PROGRESS;
  return PROGRESS_STATUSES.NOT_STARTED;
};

const buildProgressSnapshot = ({
  enrollment,
  courseVersion,
  publishedLessons,
  lessonProgressRows,
  completionPercentage,
  completedItemCount,
  totalItemCount,
  totalTimeSpentMinutes,
  status,
  startedAt,
  completedAt,
  lastComputedAt,
}) => {
  const progressByLessonId = new Map(lessonProgressRows.map((row) => [Number(row.lesson_id), row]));

  return {
    learner_summary: enrollment.student
      ? {
          id: enrollment.student.id,
          full_name: enrollment.student.full_name,
          email: enrollment.student.email,
        }
      : null,
    course_summary: enrollment.course
      ? {
          id: enrollment.course.id,
          course_code: enrollment.course.course_code,
          course_name: enrollment.course.course_name,
        }
      : null,
    course_version: courseVersion
      ? {
          id: courseVersion.id,
          version_label: courseVersion.version_label,
          version_no: courseVersion.version_no,
          published_at: courseVersion.published_at,
        }
      : null,
    status,
    completion_percentage: completionPercentage,
    completed_item_count: completedItemCount,
    total_item_count: totalItemCount,
    total_time_spent_minutes: totalTimeSpentMinutes,
    milestone_summary: DEFAULT_MILESTONE_SUMMARY,
    started_at: startedAt,
    completed_at: completedAt,
    last_updated_at: lastComputedAt,
    lessons: publishedLessons.map((lesson) => {
      const lessonProgress = progressByLessonId.get(Number(lesson.id));
      return {
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        module_id: lesson.module_id,
        module_title: lesson.module_title,
        learning_item_count: lesson.learning_item_count,
        status: lessonProgress?.status || PROGRESS_STATUSES.NOT_STARTED,
        time_spent_minutes: lessonProgress?.time_spent_minutes || 0,
        completion_date: lessonProgress?.completion_date || null,
      };
    }),
  };
};

const getParentLinkedStudentIds = async (parentUserId) => {
  const parentProfile = await ParentProfile.findOne({
    include: [
      {
        model: Profile,
        as: "profile",
        required: true,
        where: { user_id: parentUserId },
      },
    ],
  });

  if (!parentProfile) return [];

  const relationships = await ParentStudentRelationship.findAll({
    where: {
      parent_profile_id: parentProfile.id,
      status: "active",
    },
    include: [
      {
        model: StudentProfile,
        as: "student_profile",
        required: true,
        include: [
          {
            model: Profile,
            as: "profile",
            required: true,
            attributes: ["user_id"],
          },
        ],
      },
    ],
  });

  return relationships
    .map((relationship) => relationship.student_profile?.profile?.user_id)
    .filter(Boolean)
    .map((id) => Number(id));
};

const teacherHasCourseScope = async (teacherUserId, courseId) => {
  const assignmentCount = await ClassroomTeacher.count({
    where: { user_id: teacherUserId, active_flag: true },
    include: [
      {
        model: Classroom,
        as: "classroom",
        required: true,
        where: { course_id: courseId },
      },
    ],
  });

  return assignmentCount > 0;
};

const assertEnrollmentViewAccess = async (enrollment, actorUser) => {
  if (!actorUser) throw new ForbiddenError("Authentication required");
  if (isRole(actorUser.role, ROLES.ADMIN)) return;

  if (isRole(actorUser.role, ROLES.STUDENT)) {
    if (Number(enrollment.student_id) !== Number(actorUser.id)) {
      throw new ForbiddenError("Enrollment progress is outside your scope");
    }
    return;
  }

  if (isRole(actorUser.role, ROLES.PARENT)) {
    const linkedStudentIds = await getParentLinkedStudentIds(actorUser.id);
    if (!linkedStudentIds.includes(Number(enrollment.student_id))) {
      throw new ForbiddenError("Enrollment progress is outside your scope");
    }
    return;
  }

  if (isRole(actorUser.role, ROLES.TEACHER)) {
    const inScope = await teacherHasCourseScope(actorUser.id, enrollment.course_id);
    if (!inScope) throw new ForbiddenError("Enrollment progress is outside your teaching scope");
    return;
  }

  throw new ForbiddenError("Enrollment progress is outside your scope");
};

const assertCourseViewAccess = async (courseId, actorUser) => {
  if (!actorUser) throw new ForbiddenError("Authentication required");
  if (isRole(actorUser.role, ROLES.ADMIN)) return;
  if (
    isRole(actorUser.role, ROLES.TEACHER) &&
    (await teacherHasCourseScope(actorUser.id, courseId))
  ) {
    return;
  }
  throw new ForbiddenError("Course progress is outside your scope");
};

const getProgressVersionForEnrollment = async (
  enrollment,
  progress,
  explicitCourseVersionId = null
) => {
  if (explicitCourseVersionId) {
    const version = await ContentVersion.findOne({
      where: {
        id: explicitCourseVersionId,
        course_id: enrollment.course_id,
        status: "PUBLISHED",
      },
    });
    if (!version) {
      throw new BadRequestError("Published course version not found for this enrollment");
    }
    return version;
  }

  if (progress?.course_version_id) {
    const version = await ContentVersion.findOne({
      where: { id: progress.course_version_id, course_id: enrollment.course_id },
    });
    if (!version) {
      throw new BadRequestError("Stored course version reference is no longer valid");
    }
    return version;
  }

  const latestPublishedVersion = await ContentVersion.findOne({
    where: { course_id: enrollment.course_id, status: "PUBLISHED" },
    order: [
      ["published_at", "DESC"],
      ["id", "DESC"],
    ],
  });

  return latestPublishedVersion || null;
};

const initializeProgressForEnrollment = async (
  enrollmentId,
  {
    actorId = null,
    sourceEventId = null,
    sourceEventName = "EnrollmentActivated",
    sourceModule = "progress",
  } = {}
) => {
  const enrollment = await Enrollment.findByPk(enrollmentId, {
    include: [
      { model: Course, as: "course" },
      { model: User, as: "student", attributes: ["id", "full_name", "email"] },
      { model: StudentCourseProgress, as: "progress" },
    ],
  });
  if (!enrollment) throw new NotFoundError("Enrollment not found");
  const courseVersion = await getProgressVersionForEnrollment(enrollment, enrollment.progress);

  if (enrollment.status !== "active" || !courseVersion) {
    await writeProgressEventLog({
      progressId: enrollment.progress?.id || null,
      enrollmentId: enrollment.id,
      learnerId: enrollment.student_id,
      courseId: enrollment.course_id,
      courseVersionId: courseVersion?.id || null,
      sourceModule,
      sourceEventName,
      sourceEventId,
      processStatus: "failed",
      errorCode: !courseVersion ? "PRG_INIT_04" : "PRG_INIT_03",
      errorMessage: !courseVersion
        ? "Published course version is required before progress can be initialized"
        : "Enrollment must be active before progress can be initialized",
      metadata: { enrollment_status: enrollment.status },
    });

    return null;
  }

  if (enrollment.progress) {
    if (!enrollment.progress.course_version_id) {
      enrollment.progress.course_version_id = courseVersion.id;
      enrollment.progress.last_computed_at = enrollment.progress.last_computed_at || new Date();
      await enrollment.progress.save();
    }
    return enrollment.progress;
  }

  const publishedLessons = flattenPublishedLessons(courseVersion.snapshot_ref);
  const now = new Date();
  const progress = await StudentCourseProgress.create({
    enrollment_id: enrollment.id,
    course_version_id: courseVersion.id,
    status: PROGRESS_STATUSES.NOT_STARTED,
    completion_percentage: 0,
    completed_item_count: 0,
    total_item_count: publishedLessons.length,
    total_time_spent_minutes: 0,
    progress_snapshot: buildProgressSnapshot({
      enrollment,
      courseVersion,
      publishedLessons,
      lessonProgressRows: [],
      completionPercentage: 0,
      completedItemCount: 0,
      totalItemCount: publishedLessons.length,
      totalTimeSpentMinutes: 0,
      status: PROGRESS_STATUSES.NOT_STARTED,
      startedAt: null,
      completedAt: null,
      lastComputedAt: now,
    }),
    started_at: null,
    completed_at: null,
    last_computed_at: now,
  });

  await writeProgressEventLog({
    progressId: progress.id,
    enrollmentId: enrollment.id,
    learnerId: enrollment.student_id,
    courseId: enrollment.course_id,
    courseVersionId: courseVersion.id,
    sourceModule,
    sourceEventName,
    sourceEventId,
    processStatus: "success",
    metadata: { initialized: true, total_item_count: publishedLessons.length },
  });

  await writeAuditLog({
    progressId: progress.id,
    enrollmentId: enrollment.id,
    action: "INITIALIZE",
    actorId,
    newValues: {
      course_version_id: courseVersion.id,
      total_item_count: publishedLessons.length,
    },
  });

  return progress;
};

const updateCourseProgress = async (
  enrollmentId,
  {
    actorId = null,
    explicitCourseVersionId = null,
    sourceModule = "progress",
    sourceEventName = "ProgressRecomputed",
    sourceEventId = null,
    auditAction = null,
    reason = null,
  } = {}
) => {
  const enrollment = await Enrollment.findByPk(enrollmentId, {
    include: [
      { model: Course, as: "course" },
      { model: User, as: "student", attributes: ["id", "full_name", "email"] },
      { model: StudentCourseProgress, as: "progress" },
      { model: LessonProgress, as: "lesson_progress", include: [{ model: Lesson, as: "lesson" }] },
    ],
  });

  if (!enrollment) throw new NotFoundError("Enrollment not found");

  let courseProgress = enrollment.progress;
  if (!courseProgress) {
    courseProgress = await initializeProgressForEnrollment(enrollmentId, {
      actorId,
      sourceEventId,
      sourceEventName:
        sourceEventName === "ProgressRecomputed" ? "EnrollmentActivated" : sourceEventName,
      sourceModule,
    });
    enrollment.progress = courseProgress;
  }

  if (!courseProgress) {
    throw new BadRequestError(
      "Published course version is required before progress can be computed"
    );
  }

  const courseVersion = await getProgressVersionForEnrollment(
    enrollment,
    courseProgress,
    explicitCourseVersionId
  );
  if (!courseVersion) {
    throw new BadRequestError(
      "Published course version is required before progress can be computed"
    );
  }

  const publishedLessons = flattenPublishedLessons(courseVersion.snapshot_ref);
  const publishedLessonIds = new Set(publishedLessons.map((lesson) => Number(lesson.id)));
  const relevantLessonProgressRows = (enrollment.lesson_progress || []).filter((row) =>
    publishedLessonIds.has(Number(row.lesson_id))
  );
  const uniqueCompletedLessonIds = new Set(
    relevantLessonProgressRows
      .filter((row) => row.status === "completed")
      .map((row) => Number(row.lesson_id))
  );
  const completedItemCount = uniqueCompletedLessonIds.size;
  const totalItemCount = publishedLessons.length;
  const completionPercentage =
    totalItemCount > 0 ? roundPercentage((completedItemCount / totalItemCount) * 100) : 0;
  const totalTimeSpentMinutes = relevantLessonProgressRows.reduce(
    (sum, row) => sum + Number(row.time_spent_minutes || 0),
    0
  );
  const firstStartedRow = relevantLessonProgressRows.find(
    (row) => row.status !== PROGRESS_STATUSES.NOT_STARTED || Number(row.time_spent_minutes || 0) > 0
  );
  const startedAt =
    courseProgress.started_at ||
    firstStartedRow?.completion_date ||
    firstStartedRow?.updated_at ||
    null;
  const status = resolveProgressStatus({
    completionPercentage,
    completedItemCount,
    totalTimeSpentMinutes,
    enrollmentStatus: enrollment.status,
  });
  const completedAt =
    status === PROGRESS_STATUSES.COMPLETED ? courseProgress.completed_at || new Date() : null;
  const lastComputedAt = new Date();
  const snapshot = buildProgressSnapshot({
    enrollment,
    courseVersion,
    publishedLessons,
    lessonProgressRows: relevantLessonProgressRows,
    completionPercentage,
    completedItemCount,
    totalItemCount,
    totalTimeSpentMinutes,
    status,
    startedAt,
    completedAt,
    lastComputedAt,
  });

  const previousValues = {
    course_version_id: courseProgress.course_version_id,
    status: courseProgress.status,
    completion_percentage: courseProgress.completion_percentage,
    completed_item_count: courseProgress.completed_item_count,
    total_item_count: courseProgress.total_item_count,
    total_time_spent_minutes: courseProgress.total_time_spent_minutes,
    last_computed_at: courseProgress.last_computed_at,
  };

  courseProgress.course_version_id = courseVersion.id;
  courseProgress.status = status;
  courseProgress.completion_percentage = completionPercentage;
  courseProgress.completed_item_count = completedItemCount;
  courseProgress.total_item_count = totalItemCount;
  courseProgress.total_time_spent_minutes = totalTimeSpentMinutes;
  courseProgress.progress_snapshot = snapshot;
  courseProgress.started_at = startedAt;
  courseProgress.completed_at = completedAt;
  courseProgress.last_computed_at = lastComputedAt;
  await courseProgress.save();

  await writeProgressEventLog({
    progressId: courseProgress.id,
    enrollmentId: enrollment.id,
    learnerId: enrollment.student_id,
    courseId: enrollment.course_id,
    courseVersionId: courseVersion.id,
    sourceModule,
    sourceEventName,
    sourceEventId,
    processStatus: "success",
    metadata: {
      completion_percentage: completionPercentage,
      completed_item_count: completedItemCount,
      total_item_count: totalItemCount,
      reason,
    },
  });

  if (auditAction) {
    await writeAuditLog({
      progressId: courseProgress.id,
      enrollmentId: enrollment.id,
      action: auditAction,
      actorId,
      oldValues: previousValues,
      newValues: {
        course_version_id: courseVersion.id,
        status,
        completion_percentage: completionPercentage,
        completed_item_count: completedItemCount,
        total_item_count: totalItemCount,
        total_time_spent_minutes: totalTimeSpentMinutes,
        last_computed_at: lastComputedAt,
        reason,
      },
    });
  }

  return courseProgress;
};

const updateProgress = async (enrollmentId, lessonId, status, timeSpent, actorUser) => {
  const enrollment = await Enrollment.findByPk(enrollmentId, {
    include: [{ model: StudentCourseProgress, as: "progress" }],
  });
  if (!enrollment) throw new NotFoundError("Enrollment not found");
  if (Number(enrollment.student_id) !== Number(actorUser?.id)) {
    throw new ForbiddenError("Students can only update their own progress");
  }
  if (enrollment.status !== "active") {
    throw new BadRequestError("Only active enrollments can update progress");
  }

  const lesson = await Lesson.findByPk(lessonId);
  if (!lesson) throw new NotFoundError("Lesson not found");

  const courseVersion = await getProgressVersionForEnrollment(enrollment, enrollment.progress);
  if (!courseVersion) {
    await writeProgressEventLog({
      progressId: enrollment.progress?.id || null,
      enrollmentId: enrollment.id,
      learnerId: enrollment.student_id,
      courseId: enrollment.course_id,
      sourceModule: "student_portal",
      sourceEventName: "LessonProgressUpdated",
      sourceEventId: `enrollment:${enrollment.id}:lesson:${lessonId}`,
      processStatus: "failed",
      errorCode: "PRG_INIT_04",
      errorMessage: "Published course version is required before progress can be updated",
      metadata: { lesson_id: lessonId },
    });
    throw new BadRequestError(
      "Published course version is required before progress can be updated"
    );
  }

  const publishedLessonIds = new Set(
    flattenPublishedLessons(courseVersion.snapshot_ref).map((entry) => Number(entry.id))
  );
  if (!publishedLessonIds.has(Number(lessonId))) {
    await writeProgressEventLog({
      progressId: enrollment.progress?.id || null,
      enrollmentId: enrollment.id,
      learnerId: enrollment.student_id,
      courseId: enrollment.course_id,
      courseVersionId: courseVersion.id,
      sourceModule: "student_portal",
      sourceEventName: "LessonProgressUpdated",
      sourceEventId: `enrollment:${enrollment.id}:lesson:${lessonId}`,
      processStatus: "ignored",
      errorCode: "PRG_SCOPE_01",
      errorMessage: "Lesson is not part of the enrollment's published course version",
      metadata: { lesson_id: lessonId },
    });
    throw new BadRequestError(
      "Lesson is not part of the published course version for this enrollment"
    );
  }

  let progress = await LessonProgress.findOne({
    where: { enrollment_id: enrollmentId, lesson_id: lessonId },
  });

  if (progress) {
    progress.status = status || progress.status;
    progress.time_spent_minutes = Number(progress.time_spent_minutes || 0) + Number(timeSpent || 0);
    if (status === "completed" && !progress.completion_date) {
      progress.completion_date = new Date();
    }
    if (status !== "completed") {
      progress.completion_date = progress.completion_date || null;
    }
    await progress.save();
  } else {
    progress = await LessonProgress.create({
      enrollment_id: enrollmentId,
      lesson_id: lessonId,
      status: status || "in_progress",
      time_spent_minutes: timeSpent || 0,
      completion_date: status === "completed" ? new Date() : null,
    });
  }

  await updateCourseProgress(enrollmentId, {
    actorId: actorUser?.id || null,
    sourceModule: "student_portal",
    sourceEventName: "LessonProgressUpdated",
    sourceEventId: `enrollment:${enrollment.id}:lesson:${lessonId}`,
  });

  return progress;
};

const getStudentProgress = async (enrollmentId, actorUser) => {
  const enrollment = await Enrollment.findByPk(enrollmentId, {
    include: [
      { model: Course, as: "course" },
      { model: User, as: "student", attributes: ["id", "full_name", "email"] },
      { model: StudentCourseProgress, as: "progress" },
      { model: LessonProgress, as: "lesson_progress", include: [{ model: Lesson, as: "lesson" }] },
    ],
  });

  if (!enrollment) throw new NotFoundError("Enrollment not found");
  await assertEnrollmentViewAccess(enrollment, actorUser);

  if (!enrollment.progress) {
    const initialized = await initializeProgressForEnrollment(enrollmentId, {
      actorId: actorUser?.id || null,
      sourceEventId: `enrollment:${enrollmentId}:view`,
      sourceEventName: "ProgressViewed",
      sourceModule: "portal",
    });
    enrollment.progress = initialized;
  } else if (
    !enrollment.progress.progress_snapshot ||
    !enrollment.progress.last_computed_at ||
    !enrollment.progress.course_version_id
  ) {
    enrollment.progress = await updateCourseProgress(enrollmentId, {
      actorId: actorUser?.id || null,
      sourceModule: "portal",
      sourceEventName: "ProgressViewed",
      sourceEventId: `enrollment:${enrollmentId}:view-recompute`,
    });
  }

  return enrollment;
};

const getTeacherCourseProgress = async (courseId, actorUser) => {
  await assertCourseViewAccess(courseId, actorUser);
  const enrollments = await Enrollment.findAll({
    where: { course_id: courseId },
    include: [
      { model: User, as: "student", attributes: ["id", "full_name", "email"] },
      { model: StudentCourseProgress, as: "progress" },
    ],
  });

  return enrollments;
};

const recomputeEnrollmentProgress = async (enrollmentId, actorUser, payload = {}) => {
  if (!isRole(actorUser?.role, ROLES.ADMIN)) {
    throw new ForbiddenError("Only Admin can recompute progress");
  }

  return updateCourseProgress(enrollmentId, {
    actorId: actorUser.id,
    explicitCourseVersionId: payload.courseVersionId || null,
    sourceModule: "admin_portal",
    sourceEventName: "ManualProgressRecomputeRequested",
    sourceEventId: `manual:${enrollmentId}:${Date.now()}`,
    auditAction: "MANUAL_RECOMPUTE",
    reason: payload.reason || null,
  });
};

const getProgressEventLogs = async (enrollmentId, actorUser) => {
  if (!isRole(actorUser?.role, ROLES.ADMIN)) {
    throw new ForbiddenError("Only Admin can view progress event logs");
  }

  const enrollment = await Enrollment.findByPk(enrollmentId);
  if (!enrollment) throw new NotFoundError("Enrollment not found");

  return ProgressEventLog.findAll({
    where: { enrollment_id: enrollmentId },
    order: [["created_at", "DESC"]],
  });
};

module.exports = {
  updateProgress,
  getStudentProgress,
  getTeacherCourseProgress,
  updateCourseProgress,
  initializeProgressForEnrollment,
  recomputeEnrollmentProgress,
  getProgressEventLogs,
};
