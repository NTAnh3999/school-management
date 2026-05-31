"use strict";

const { Op } = require("sequelize");
const {
  AssessmentAuditLog,
  AssessmentGrade,
  AssessmentResultPublication,
  AssessmentSubmission,
  Classroom,
  ClassroomEnrollment,
  ClassroomTeacher,
  Course,
  CourseModule,
  Enrollment,
  Lesson,
  ParentProfile,
  ParentStudentRelationship,
  Profile,
  Quiz,
  QuizAttempt,
  QuizAttemptAnswer,
  QuizOption,
  QuizQuestion,
  StudentProfile,
  sequelize,
} = require("../models");
const { ROLES, hasRole, isRole, normalizeRole } = require("../constants/roles");
const {
  ASSESSMENT_ERROR_CODES,
  ASSESSMENT_EVENTS,
  ASSESSMENT_STATUSES,
  ASSESSMENT_TYPES,
  ATTEMPT_STATUSES,
  GRADING_METHODS,
  PUBLICATION_STATUSES,
  PUBLISH_POLICIES,
} = require("../constants/assessment");
const {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} = require("../utils/error-responses");

const STAFF_ROLES = [ROLES.ADMIN, ROLES.TEACHER];
const DEFAULT_EXPORT_LIMIT = 500;
const ACTIVE_ENROLLMENT_STATUSES = ["active", "completed"];
const ACTIVE_CLASSROOM_ENROLLMENT_STATUSES = ["enrolled", "completed", "in_progress"];

const includeAssessmentQuestions = (includeCorrectAnswers = true) => ({
  model: QuizQuestion,
  as: "questions",
  separate: true,
  order: [
    ["order_index", "ASC"],
    ["id", "ASC"],
  ],
  include: [
    includeCorrectAnswers
      ? { model: QuizOption, as: "options" }
      : { model: QuizOption, as: "options", attributes: ["id", "option_text"] },
  ],
});

const assessmentDetailInclude = (includeCorrectAnswers = true) => [
  {
    model: Lesson,
    as: "lesson",
    include: [
      {
        model: CourseModule,
        as: "module",
        include: [{ model: Course, as: "course" }],
      },
    ],
  },
  { model: Course, as: "course" },
  { model: Classroom, as: "classroom" },
  includeAssessmentQuestions(includeCorrectAnswers),
];

const attemptDetailInclude = (includeCorrectAnswers = true) => [
  {
    model: Quiz,
    as: "quiz",
    include: assessmentDetailInclude(includeCorrectAnswers),
  },
  { model: Enrollment, as: "enrollment" },
  { model: QuizAttemptAnswer, as: "answers" },
  {
    model: AssessmentSubmission,
    as: "submission",
    include: [
      {
        model: AssessmentGrade,
        as: "grade",
        include: [{ model: AssessmentResultPublication, as: "publication" }],
      },
    ],
  },
];

const pickRequestMeta = (requestContext = {}) => ({
  request_id: requestContext.requestId || null,
  ip_address: requestContext.ipAddress || null,
  user_agent: requestContext.userAgent || null,
});

const buildErrorDetails = (errorCode, extra = {}) => ({ errorCode, ...extra });

const parseDate = (value, fieldName) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestError(
      `${fieldName} is invalid`,
      buildErrorDetails(ASSESSMENT_ERROR_CODES.REQUIRED_FIELD)
    );
  }
  return parsed;
};

const normalizeAssessmentType = (value) => {
  if (!value) return ASSESSMENT_TYPES.QUIZ;
  return String(value).trim().toLowerCase();
};

const normalizeQuestionType = (value) => {
  if (!value) return "single_choice";
  return String(value).trim().toLowerCase();
};

const toNumber = (value, fieldName) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    throw new BadRequestError(
      `${fieldName} is invalid`,
      buildErrorDetails(ASSESSMENT_ERROR_CODES.REQUIRED_FIELD)
    );
  }
  return numeric;
};

const calculateTotalQuestionPoints = (questions = []) =>
  questions.reduce((sum, question) => sum + Number(question.points || 0), 0);

const calculatePercentage = (rawScore, maxScore) => {
  if (!maxScore || maxScore <= 0) return 0;
  return Number((((rawScore || 0) / maxScore) * 100).toFixed(2));
};

const buildAssessmentWhere = (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.courseId) where.course_id = filters.courseId;
  if (filters.classroomId) where.classroom_id = filters.classroomId;
  if (filters.lessonId) where.lesson_id = filters.lessonId;
  if (filters.assessmentType)
    where.assessment_type = normalizeAssessmentType(filters.assessmentType);
  return where;
};

const ensureAssessmentPayload = async (payload, { partial = false } = {}) => {
  const errors = [];
  const title = payload.title ? String(payload.title).trim() : "";
  const lessonId = payload.lessonId ?? payload.lesson_id;
  const maxAttempts = payload.maxAttempts ?? payload.max_attempts;
  const maxScore = payload.maxScore ?? payload.max_score;
  const assessmentType = payload.assessmentType ?? payload.assessment_type;
  const gradingMethod = payload.gradingMethod ?? payload.grading_method;
  const publishPolicy = payload.publishPolicy ?? payload.publish_policy;

  if (!partial && !title) errors.push("title");
  if (!partial && !lessonId) errors.push("lessonId");
  if (maxAttempts !== undefined && toNumber(maxAttempts, "maxAttempts") <= 0)
    errors.push("maxAttempts");
  if (maxScore !== undefined && maxScore !== null && toNumber(maxScore, "maxScore") <= 0) {
    errors.push("maxScore");
  }

  const openAt = parseDate(payload.openAt ?? payload.open_at, "openAt");
  const closeAt = parseDate(payload.closeAt ?? payload.close_at, "closeAt");
  const resultPublishAt = parseDate(
    payload.resultPublishAt ?? payload.result_publish_at,
    "resultPublishAt"
  );

  if (openAt && closeAt && openAt >= closeAt) errors.push("openAt");

  if (
    assessmentType &&
    !Object.values(ASSESSMENT_TYPES).includes(normalizeAssessmentType(assessmentType))
  ) {
    errors.push("assessmentType");
  }

  if (
    gradingMethod &&
    !Object.values(GRADING_METHODS).includes(String(gradingMethod).trim().toLowerCase())
  ) {
    errors.push("gradingMethod");
  }

  if (
    publishPolicy &&
    !Object.values(PUBLISH_POLICIES).includes(String(publishPolicy).trim().toLowerCase())
  ) {
    errors.push("publishPolicy");
  }

  if (errors.length) {
    throw new BadRequestError(
      "Assessment payload is invalid",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.REQUIRED_FIELD, { fields: errors })
    );
  }

  return { openAt, closeAt, resultPublishAt };
};

const getAssessmentById = async (assessmentId, includeCorrectAnswers = true) => {
  const assessment = await Quiz.findByPk(assessmentId, {
    include: assessmentDetailInclude(includeCorrectAnswers),
  });
  if (!assessment) {
    throw new NotFoundError(
      "Assessment not found",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_SCOPE)
    );
  }
  return assessment;
};

const getAttemptById = async (attemptId, includeCorrectAnswers = true) => {
  const attempt = await QuizAttempt.findByPk(attemptId, {
    include: attemptDetailInclude(includeCorrectAnswers),
  });
  if (!attempt) {
    throw new NotFoundError(
      "Attempt not found",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.ATTEMPT_NOT_FOUND)
    );
  }
  return attempt;
};

const getSubmissionById = async (submissionId) => {
  const submission = await AssessmentSubmission.findByPk(submissionId, {
    include: [
      {
        model: QuizAttempt,
        as: "attempt",
        include: [
          {
            model: Quiz,
            as: "quiz",
            include: assessmentDetailInclude(true),
          },
          { model: Enrollment, as: "enrollment" },
        ],
      },
      {
        model: AssessmentGrade,
        as: "grade",
        include: [{ model: AssessmentResultPublication, as: "publication" }],
      },
    ],
  });
  if (!submission) {
    throw new NotFoundError(
      "Submission not found",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_SUBMISSION)
    );
  }
  return submission;
};

const getGradeById = async (gradeId) => {
  const grade = await AssessmentGrade.findByPk(gradeId, {
    include: [
      {
        model: AssessmentSubmission,
        as: "submission",
        include: [
          {
            model: QuizAttempt,
            as: "attempt",
            include: [
              {
                model: Quiz,
                as: "quiz",
                include: assessmentDetailInclude(true),
              },
              { model: Enrollment, as: "enrollment" },
            ],
          },
        ],
      },
      { model: AssessmentResultPublication, as: "publication" },
    ],
  });

  if (!grade) {
    throw new NotFoundError(
      "Grade not found",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_SCORE)
    );
  }
  return grade;
};

const getTeacherClassroomIds = async (teacherId) => {
  const classroomTeachers = await ClassroomTeacher.findAll({
    where: { user_id: teacherId, active_flag: true },
    attributes: ["classroom_id"],
  });
  return classroomTeachers.map((row) => row.classroom_id);
};

const assertStaffScope = async (assessment, actor) => {
  if (isRole(actor.role, ROLES.ADMIN)) return;

  if (assessment.classroom_id) {
    const classroomIds = await getTeacherClassroomIds(actor.id);
    if (classroomIds.includes(Number(assessment.classroom_id))) return;
  }

  throw new ForbiddenError(
    "Assessment is outside your scope",
    buildErrorDetails(ASSESSMENT_ERROR_CODES.UNAUTHORIZED)
  );
};

const assertStudentAssessmentAccess = async (assessment, actor, enrollmentId) => {
  const enrollment = await Enrollment.findOne({
    where: {
      id: enrollmentId,
      student_id: actor.id,
      status: { [Op.in]: ACTIVE_ENROLLMENT_STATUSES },
    },
  });

  if (!enrollment) {
    throw new ForbiddenError(
      "Enrollment is outside your scope",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_SCOPE)
    );
  }

  if (assessment.course_id && Number(assessment.course_id) !== Number(enrollment.course_id)) {
    throw new ForbiddenError(
      "Assessment is outside your enrollment scope",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_SCOPE)
    );
  }

  if (assessment.classroom_id) {
    const classroomEnrollment = await ClassroomEnrollment.findOne({
      where: {
        classroom_id: assessment.classroom_id,
        student_id: actor.id,
        enrollment_status: { [Op.in]: ACTIVE_CLASSROOM_ENROLLMENT_STATUSES },
      },
    });

    if (!classroomEnrollment) {
      throw new ForbiddenError(
        "Assessment is outside your classroom scope",
        buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_SCOPE)
      );
    }
  }

  return enrollment;
};

const getLinkedStudentIds = async (parentUserId) => {
  const relationships = await ParentStudentRelationship.findAll({
    where: { status: "active" },
    include: [
      {
        model: ParentProfile,
        as: "parent_profile",
        include: [{ model: Profile, as: "profile", where: { user_id: parentUserId } }],
      },
      {
        model: StudentProfile,
        as: "student_profile",
        include: [{ model: Profile, as: "profile" }],
      },
    ],
  });

  return relationships
    .map((relationship) => relationship.student_profile?.profile?.user_id)
    .filter(Boolean)
    .map((id) => Number(id));
};

const resolveMaxScore = (assessment, questions = []) => {
  if (assessment.max_score !== null && assessment.max_score !== undefined) {
    return Number(assessment.max_score);
  }
  const questionTotal = calculateTotalQuestionPoints(questions);
  return questionTotal > 0 ? questionTotal : 100;
};

const isAssessmentOpen = (assessment, now = new Date()) => {
  const openAt = assessment.open_at ? new Date(assessment.open_at) : null;
  const closeAt = assessment.close_at ? new Date(assessment.close_at) : null;

  if (assessment.status !== ASSESSMENT_STATUSES.PUBLISHED) {
    throw new ConflictError(
      "Assessment is not published",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.NOT_PUBLISHED)
    );
  }

  if (openAt && now < openAt) {
    throw new ConflictError(
      "Assessment is not open yet",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.NOT_OPEN)
    );
  }

  if (closeAt && now > closeAt) {
    throw new ConflictError(
      "Assessment is already closed",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.CLOSED)
    );
  }
};

const computeAttemptExpiry = (assessment, startedAt) => {
  if (!assessment.time_limit_minutes) return null;
  return new Date(startedAt.getTime() + Number(assessment.time_limit_minutes) * 60 * 1000);
};

const summarizeQuestionAnswer = (answer) => ({
  questionId: Number(answer.questionId),
  selectedOptionId: answer.selectedOptionId ? Number(answer.selectedOptionId) : null,
  selectedOptionIds: Array.isArray(answer.selectedOptionIds)
    ? answer.selectedOptionIds.map((id) => Number(id)).sort((a, b) => a - b)
    : [],
  textAnswer: answer.textAnswer || null,
  fileUrl: answer.fileUrl || null,
});

const evaluateAnswer = (question, answer) => {
  const normalizedAnswer = summarizeQuestionAnswer(answer);
  const points = Number(question.points || 0);
  const result = {
    isCorrect: null,
    awardedPoints: null,
    manualReviewRequired: false,
    answerPayload: normalizedAnswer,
    storedTextAnswer:
      normalizedAnswer.textAnswer ||
      (normalizedAnswer.selectedOptionIds.length
        ? JSON.stringify(normalizedAnswer.selectedOptionIds)
        : null) ||
      normalizedAnswer.fileUrl,
  };

  if (question.question_type === "single_choice") {
    const selectedOption = question.options.find(
      (option) => Number(option.id) === Number(normalizedAnswer.selectedOptionId)
    );
    const isCorrect = Boolean(selectedOption?.is_correct);
    result.isCorrect = isCorrect;
    result.awardedPoints = isCorrect ? points : 0;
    return result;
  }

  if (question.question_type === "multiple_choice") {
    const correctOptions = question.options
      .filter((option) => option.is_correct)
      .map((option) => Number(option.id))
      .sort((a, b) => a - b);
    const isCorrect =
      JSON.stringify(correctOptions) === JSON.stringify(normalizedAnswer.selectedOptionIds);
    result.isCorrect = isCorrect;
    result.awardedPoints = isCorrect ? points : 0;
    return result;
  }

  result.manualReviewRequired = true;
  result.isCorrect = null;
  result.awardedPoints = null;
  return result;
};

const createAuditLog = async (
  {
    assessmentId,
    attemptId,
    submissionId,
    gradeId,
    publicationId,
    entityType,
    entityId,
    action,
    oldValues,
    newValues,
    reason,
  },
  actor,
  requestContext,
  transaction
) => {
  return AssessmentAuditLog.create(
    {
      assessment_id: assessmentId || null,
      attempt_id: attemptId || null,
      submission_id: submissionId || null,
      grade_id: gradeId || null,
      publication_id: publicationId || null,
      entity_type: entityType,
      entity_id: entityId,
      action,
      actor_user_id: actor?.id || null,
      actor_role: normalizeRole(actor?.role) || actor?.role || null,
      reason: reason || null,
      old_values: oldValues || null,
      new_values: newValues || null,
      ...pickRequestMeta(requestContext),
    },
    { transaction }
  );
};

const createAssessmentQuestions = async (assessmentId, questions = [], transaction) => {
  for (let index = 0; index < questions.length; index += 1) {
    const questionPayload = questions[index];
    const question = await QuizQuestion.create(
      {
        quiz_id: assessmentId,
        question_text: questionPayload.questionText,
        question_type: normalizeQuestionType(questionPayload.questionType),
        points: questionPayload.points || 1,
        order_index: questionPayload.orderIndex ?? index,
      },
      { transaction }
    );

    if (Array.isArray(questionPayload.options) && questionPayload.options.length) {
      await QuizOption.bulkCreate(
        questionPayload.options.map((option) => ({
          question_id: question.id,
          option_text: option.text,
          is_correct: Boolean(option.isCorrect),
        })),
        { transaction }
      );
    }
  }
};

const maybeAutoPublishGrade = async (
  assessment,
  attempt,
  grade,
  actor,
  requestContext,
  transaction
) => {
  let publication =
    grade.publication ||
    (await AssessmentResultPublication.findOne({
      where: { grade_id: grade.id },
      transaction,
    }));

  if (!publication) {
    publication = await AssessmentResultPublication.create(
      {
        grade_id: grade.id,
        publication_status: PUBLICATION_STATUSES.NOT_PUBLISHED,
        scheduled_publish_at: assessment.result_publish_at || null,
      },
      { transaction }
    );
  }

  const shouldPublishImmediately =
    grade.grading_status === "graded" &&
    (assessment.publish_policy === PUBLISH_POLICIES.AUTO_AFTER_GRADED ||
      (assessment.publish_policy === PUBLISH_POLICIES.SCHEDULED &&
        assessment.result_publish_at &&
        new Date(assessment.result_publish_at) <= new Date()));

  if (
    !shouldPublishImmediately ||
    publication.publication_status === PUBLICATION_STATUSES.PUBLISHED
  ) {
    return { publication, event: null };
  }

  publication.publication_status = PUBLICATION_STATUSES.PUBLISHED;
  publication.published_at = new Date();
  publication.published_by = actor?.id || null;
  await publication.save({ transaction });

  attempt.status = ATTEMPT_STATUSES.PUBLISHED;
  attempt.published_at = publication.published_at;
  await attempt.save({ transaction });

  await createAuditLog(
    {
      assessmentId: assessment.id,
      attemptId: attempt.id,
      gradeId: grade.id,
      publicationId: publication.id,
      entityType: "ResultPublication",
      entityId: publication.id,
      action: ASSESSMENT_EVENTS.GRADE_PUBLISHED,
      newValues: {
        publicationStatus: publication.publication_status,
        publishedAt: publication.published_at,
      },
    },
    actor,
    requestContext,
    transaction
  );

  return {
    publication,
    event: {
      name: ASSESSMENT_EVENTS.GRADE_PUBLISHED,
      assessmentId: assessment.id,
      attemptId: attempt.id,
      gradeId: grade.id,
      publicationId: publication.id,
    },
  };
};

const toResultRecord = (attempt) => {
  const grade = attempt.submission?.grade;
  const publication = grade?.publication;
  return {
    assessmentId: attempt.quiz_id,
    attemptId: attempt.id,
    enrollmentId: attempt.enrollment_id,
    studentId: attempt.enrollment?.student_id || null,
    attemptNumber: attempt.attempt_number,
    attemptStatus: attempt.status,
    startedAt: attempt.started_at,
    expiredAt: attempt.expired_at,
    submittedAt: attempt.submitted_at,
    publishedAt: publication?.published_at || attempt.published_at || null,
    rawScore: grade?.score !== null && grade?.score !== undefined ? Number(grade.score) : null,
    maxScore:
      grade?.max_score !== null && grade?.max_score !== undefined ? Number(grade.max_score) : null,
    percentageScore:
      attempt.score !== null && attempt.score !== undefined ? Number(attempt.score) : null,
    feedback: grade?.feedback || attempt.feedback || null,
    gradingStatus: grade?.grading_status || null,
    publicationStatus: publication?.publication_status || PUBLICATION_STATUSES.NOT_PUBLISHED,
  };
};

const createAssessment = async (payload, actor, requestContext = {}) => {
  await ensureAssessmentPayload(payload);

  const lessonId = Number(payload.lessonId ?? payload.lesson_id);
  const classroomId = payload.classroomId ?? payload.classroom_id;
  const lesson = await Lesson.findByPk(lessonId, {
    include: [
      {
        model: CourseModule,
        as: "module",
        include: [{ model: Course, as: "course" }],
      },
    ],
  });

  if (!lesson) {
    throw new NotFoundError(
      "Lesson not found",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_SCOPE)
    );
  }

  const course = lesson.module?.course;
  if (!course) {
    throw new BadRequestError(
      "Lesson is missing course scope",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_SCOPE)
    );
  }

  let classroom = null;
  if (classroomId) {
    classroom = await Classroom.findByPk(classroomId);
    if (!classroom || Number(classroom.course_id) !== Number(course.id)) {
      throw new BadRequestError(
        "Classroom scope is invalid",
        buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_SCOPE)
      );
    }
  }

  await assertStaffScope(
    {
      course,
      lesson: { section: { course } },
      classroom_id: classroom?.id || null,
    },
    actor
  );

  const totalQuestionPoints = calculateTotalQuestionPoints(payload.questions || []);
  const assessment = await sequelize.transaction(async (transaction) => {
    const createdAssessment = await Quiz.create(
      {
        lesson_id: lessonId,
        title: payload.title,
        description: payload.description || null,
        assessment_type: normalizeAssessmentType(payload.assessmentType ?? payload.assessment_type),
        course_id: course.id,
        classroom_id: classroom?.id || null,
        status: ASSESSMENT_STATUSES.DRAFT,
        open_at: parseDate(payload.openAt ?? payload.open_at, "openAt"),
        close_at: parseDate(payload.closeAt ?? payload.close_at, "closeAt"),
        passing_score: payload.passingScore ?? payload.passing_score ?? 70,
        time_limit_minutes:
          payload.durationMinutes ?? payload.timeLimitMinutes ?? payload.time_limit_minutes,
        max_attempts: payload.maxAttempts ?? payload.max_attempts ?? 1,
        max_score: payload.maxScore ?? payload.max_score ?? (totalQuestionPoints || null),
        grading_method: String(
          payload.gradingMethod ?? payload.grading_method ?? GRADING_METHODS.AUTO
        ).toLowerCase(),
        publish_policy: String(
          payload.publishPolicy ?? payload.publish_policy ?? PUBLISH_POLICIES.MANUAL
        ).toLowerCase(),
        result_publish_at: parseDate(
          payload.resultPublishAt ?? payload.result_publish_at,
          "resultPublishAt"
        ),
        created_by: actor.id,
        updated_by: actor.id,
      },
      { transaction }
    );

    if (Array.isArray(payload.questions) && payload.questions.length) {
      await createAssessmentQuestions(createdAssessment.id, payload.questions, transaction);
    }

    await createAuditLog(
      {
        assessmentId: createdAssessment.id,
        entityType: "Assessment",
        entityId: createdAssessment.id,
        action: ASSESSMENT_EVENTS.CREATED,
        newValues: {
          title: createdAssessment.title,
          assessmentType: createdAssessment.assessment_type,
          courseId: createdAssessment.course_id,
          classroomId: createdAssessment.classroom_id,
          status: createdAssessment.status,
        },
      },
      actor,
      requestContext,
      transaction
    );

    return createdAssessment;
  });

  return getAssessmentById(assessment.id, true);
};

const updateAssessment = async (assessmentId, payload, actor, requestContext = {}) => {
  await ensureAssessmentPayload(payload, { partial: true });

  const assessment = await getAssessmentById(assessmentId, true);
  await assertStaffScope(assessment, actor);

  const lockedFieldNames = ["maxScore", "gradingMethod", "maxAttempts", "assessmentType"];
  const lockedFieldUpdates = lockedFieldNames.filter((fieldName) =>
    Object.prototype.hasOwnProperty.call(payload, fieldName)
  );

  if (lockedFieldUpdates.length) {
    const attemptCount = await QuizAttempt.count({ where: { quiz_id: assessment.id } });
    if (attemptCount > 0) {
      throw new ConflictError(
        "Locked assessment settings cannot change after attempts exist",
        buildErrorDetails(ASSESSMENT_ERROR_CODES.GRADE_LOCKED, { fields: lockedFieldUpdates })
      );
    }
  }

  const previousValues = assessment.toJSON();
  const openAt = Object.prototype.hasOwnProperty.call(payload, "openAt")
    ? parseDate(payload.openAt, "openAt")
    : assessment.open_at;
  const closeAt = Object.prototype.hasOwnProperty.call(payload, "closeAt")
    ? parseDate(payload.closeAt, "closeAt")
    : assessment.close_at;

  if (openAt && closeAt && openAt >= closeAt) {
    throw new BadRequestError(
      "openAt must be earlier than closeAt",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.REQUIRED_FIELD)
    );
  }

  await sequelize.transaction(async (transaction) => {
    if (payload.title !== undefined) assessment.title = payload.title;
    if (payload.description !== undefined) assessment.description = payload.description;
    if (payload.assessmentType !== undefined) {
      assessment.assessment_type = normalizeAssessmentType(payload.assessmentType);
    }
    if (payload.openAt !== undefined) assessment.open_at = openAt;
    if (payload.closeAt !== undefined) assessment.close_at = closeAt;
    if (payload.passingScore !== undefined) assessment.passing_score = payload.passingScore;
    if (payload.durationMinutes !== undefined)
      assessment.time_limit_minutes = payload.durationMinutes;
    if (payload.maxAttempts !== undefined) assessment.max_attempts = payload.maxAttempts;
    if (payload.maxScore !== undefined) assessment.max_score = payload.maxScore;
    if (payload.gradingMethod !== undefined) {
      assessment.grading_method = String(payload.gradingMethod).toLowerCase();
    }
    if (payload.publishPolicy !== undefined) {
      assessment.publish_policy = String(payload.publishPolicy).toLowerCase();
    }
    if (payload.resultPublishAt !== undefined) {
      assessment.result_publish_at = parseDate(payload.resultPublishAt, "resultPublishAt");
    }
    assessment.updated_by = actor.id;

    await assessment.save({ transaction });
    await createAuditLog(
      {
        assessmentId: assessment.id,
        entityType: "Assessment",
        entityId: assessment.id,
        action: ASSESSMENT_EVENTS.UPDATED,
        oldValues: previousValues,
        newValues: assessment.toJSON(),
      },
      actor,
      requestContext,
      transaction
    );
  });

  return getAssessmentById(assessment.id, true);
};

const publishAssessment = async (assessmentId, actor, requestContext = {}) => {
  const assessment = await getAssessmentById(assessmentId, true);
  await assertStaffScope(assessment, actor);

  if (assessment.status !== ASSESSMENT_STATUSES.DRAFT) {
    throw new ConflictError(
      "Only draft assessments can be published",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_STATUS)
    );
  }

  if (!assessment.questions?.length) {
    throw new BadRequestError(
      "Assessment must contain at least one question before publication",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.REQUIRED_FIELD)
    );
  }

  await sequelize.transaction(async (transaction) => {
    assessment.status = ASSESSMENT_STATUSES.PUBLISHED;
    assessment.published_at = new Date();
    assessment.published_by = actor.id;
    assessment.updated_by = actor.id;
    await assessment.save({ transaction });

    await createAuditLog(
      {
        assessmentId: assessment.id,
        entityType: "Assessment",
        entityId: assessment.id,
        action: ASSESSMENT_EVENTS.PUBLISHED,
        oldValues: { status: ASSESSMENT_STATUSES.DRAFT },
        newValues: { status: assessment.status, publishedAt: assessment.published_at },
      },
      actor,
      requestContext,
      transaction
    );
  });

  return getAssessmentById(assessment.id, true);
};

const closeAssessment = async (assessmentId, reason, actor, requestContext = {}) => {
  const assessment = await getAssessmentById(assessmentId, true);
  await assertStaffScope(assessment, actor);

  if (assessment.status !== ASSESSMENT_STATUSES.PUBLISHED) {
    throw new ConflictError(
      "Only published assessments can be closed",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_STATUS)
    );
  }

  await sequelize.transaction(async (transaction) => {
    assessment.status = ASSESSMENT_STATUSES.CLOSED;
    assessment.closed_at = new Date();
    assessment.closed_by = actor.id;
    assessment.updated_by = actor.id;
    await assessment.save({ transaction });

    await QuizAttempt.update(
      { status: ATTEMPT_STATUSES.EXPIRED },
      {
        where: {
          quiz_id: assessment.id,
          status: ATTEMPT_STATUSES.IN_PROGRESS,
        },
        transaction,
      }
    );

    await createAuditLog(
      {
        assessmentId: assessment.id,
        entityType: "Assessment",
        entityId: assessment.id,
        action: ASSESSMENT_EVENTS.CLOSED,
        oldValues: { status: ASSESSMENT_STATUSES.PUBLISHED },
        newValues: { status: assessment.status, closedAt: assessment.closed_at },
        reason,
      },
      actor,
      requestContext,
      transaction
    );
  });

  return getAssessmentById(assessment.id, true);
};

const archiveAssessment = async (assessmentId, reason, actor, requestContext = {}) => {
  const assessment = await getAssessmentById(assessmentId, true);
  await assertStaffScope(assessment, actor);

  if (assessment.status === ASSESSMENT_STATUSES.ARCHIVED) {
    return assessment;
  }

  await sequelize.transaction(async (transaction) => {
    assessment.status = ASSESSMENT_STATUSES.ARCHIVED;
    assessment.archived_at = new Date();
    assessment.archived_by = actor.id;
    assessment.updated_by = actor.id;
    await assessment.save({ transaction });

    await createAuditLog(
      {
        assessmentId: assessment.id,
        entityType: "Assessment",
        entityId: assessment.id,
        action: "AssessmentArchived",
        oldValues: { status: assessment.previous("status") || null },
        newValues: { status: assessment.status, archivedAt: assessment.archived_at },
        reason,
      },
      actor,
      requestContext,
      transaction
    );
  });

  return getAssessmentById(assessment.id, true);
};

const addQuestion = async (assessmentId, payload, actor) => {
  const assessment = await getAssessmentById(assessmentId, true);
  await assertStaffScope(assessment, actor);

  if (!payload.questionText) {
    throw new BadRequestError(
      "Missing question text",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.REQUIRED_FIELD)
    );
  }

  if (assessment.status === ASSESSMENT_STATUSES.ARCHIVED) {
    throw new ConflictError(
      "Archived assessments cannot be modified",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_STATUS)
    );
  }

  const question = await QuizQuestion.create({
    quiz_id: assessmentId,
    question_text: payload.questionText,
    question_type: normalizeQuestionType(payload.questionType),
    points: payload.points || 1,
    order_index: payload.orderIndex || 0,
  });

  if (Array.isArray(payload.options) && payload.options.length) {
    await QuizOption.bulkCreate(
      payload.options.map((option) => ({
        question_id: question.id,
        option_text: option.text,
        is_correct: Boolean(option.isCorrect),
      }))
    );
  }

  return QuizQuestion.findByPk(question.id, {
    include: [{ model: QuizOption, as: "options" }],
  });
};

const listAssessments = async (filters, actor) => {
  const role = normalizeRole(actor.role);
  const where = buildAssessmentWhere(filters);
  const includeCorrectAnswers = hasRole(role, STAFF_ROLES);

  let assessments = await Quiz.findAll({
    where,
    include: assessmentDetailInclude(includeCorrectAnswers),
    order: [["created_at", "DESC"]],
  });

  if (isRole(role, ROLES.ADMIN)) return assessments;

  if (isRole(role, ROLES.TEACHER)) {
    const classroomIds = await getTeacherClassroomIds(actor.id);
    assessments = assessments.filter((assessment) => {
      return assessment.classroom_id && classroomIds.includes(Number(assessment.classroom_id));
    });
    return assessments;
  }

  if (isRole(role, ROLES.STUDENT)) {
    const enrollments = await Enrollment.findAll({
      where: { student_id: actor.id, status: { [Op.in]: ACTIVE_ENROLLMENT_STATUSES } },
      attributes: ["course_id"],
    });
    const classroomEnrollments = await ClassroomEnrollment.findAll({
      where: {
        student_id: actor.id,
        enrollment_status: { [Op.in]: ACTIVE_CLASSROOM_ENROLLMENT_STATUSES },
      },
      attributes: ["classroom_id"],
    });
    const courseIds = new Set(enrollments.map((item) => Number(item.course_id)));
    const classroomIds = new Set(classroomEnrollments.map((item) => Number(item.classroom_id)));

    return assessments.filter(
      (assessment) =>
        assessment.status === ASSESSMENT_STATUSES.PUBLISHED &&
        (courseIds.has(Number(assessment.course_id)) ||
          (assessment.classroom_id && classroomIds.has(Number(assessment.classroom_id))))
    );
  }

  if (isRole(role, ROLES.PARENT)) {
    const studentIds = await getLinkedStudentIds(actor.id);
    const enrollments = await Enrollment.findAll({
      where: {
        student_id: { [Op.in]: studentIds.length ? studentIds : [0] },
        status: { [Op.in]: ACTIVE_ENROLLMENT_STATUSES },
      },
      attributes: ["course_id"],
    });
    const classroomEnrollments = await ClassroomEnrollment.findAll({
      where: {
        student_id: { [Op.in]: studentIds.length ? studentIds : [0] },
        enrollment_status: { [Op.in]: ACTIVE_CLASSROOM_ENROLLMENT_STATUSES },
      },
      attributes: ["classroom_id"],
    });
    const courseIds = new Set(enrollments.map((item) => Number(item.course_id)));
    const classroomIds = new Set(classroomEnrollments.map((item) => Number(item.classroom_id)));

    return assessments.filter(
      (assessment) =>
        assessment.status === ASSESSMENT_STATUSES.PUBLISHED &&
        (courseIds.has(Number(assessment.course_id)) ||
          (assessment.classroom_id && classroomIds.has(Number(assessment.classroom_id))))
    );
  }

  return [];
};

const getAssessment = async (assessmentId, actor) => {
  const role = normalizeRole(actor.role);
  const includeCorrectAnswers = hasRole(role, STAFF_ROLES);
  const assessment = await getAssessmentById(assessmentId, includeCorrectAnswers);

  if (isRole(role, ROLES.ADMIN)) return assessment;
  if (isRole(role, ROLES.TEACHER)) {
    await assertStaffScope(assessment, actor);
    return assessment;
  }

  if (![ROLES.STUDENT, ROLES.PARENT].includes(role)) {
    throw new ForbiddenError(
      "Assessment access denied",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.UNAUTHORIZED)
    );
  }

  if (assessment.status !== ASSESSMENT_STATUSES.PUBLISHED) {
    throw new ForbiddenError(
      "Assessment is not visible",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.NOT_PUBLISHED)
    );
  }

  return assessment;
};

const startAttempt = async (assessmentId, enrollmentId, actor, requestContext = {}) => {
  const assessment = await getAssessmentById(assessmentId, true);
  isAssessmentOpen(assessment);
  const enrollment = await assertStudentAssessmentAccess(assessment, actor, enrollmentId);

  const existingAttempt = await QuizAttempt.findOne({
    where: {
      quiz_id: assessment.id,
      enrollment_id: enrollment.id,
      status: ATTEMPT_STATUSES.IN_PROGRESS,
    },
    order: [["created_at", "DESC"]],
  });

  if (existingAttempt) {
    if (existingAttempt.expired_at && new Date(existingAttempt.expired_at) < new Date()) {
      existingAttempt.status = ATTEMPT_STATUSES.EXPIRED;
      await existingAttempt.save();
    } else {
      return existingAttempt;
    }
  }

  const previousAttempts = await QuizAttempt.count({
    where: {
      quiz_id: assessment.id,
      enrollment_id: enrollment.id,
      status: {
        [Op.notIn]: [ATTEMPT_STATUSES.NOT_STARTED],
      },
    },
  });

  if (previousAttempts >= Number(assessment.max_attempts || 1)) {
    throw new ConflictError(
      "Maximum attempts exceeded",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.MAX_ATTEMPT)
    );
  }

  const now = new Date();
  const attempt = await sequelize.transaction(async (transaction) => {
    const createdAttempt = await QuizAttempt.create(
      {
        enrollment_id: enrollment.id,
        quiz_id: assessment.id,
        status: ATTEMPT_STATUSES.IN_PROGRESS,
        started_at: now,
        expired_at: computeAttemptExpiry(assessment, now),
        attempt_number: previousAttempts + 1,
      },
      { transaction }
    );

    await createAuditLog(
      {
        assessmentId: assessment.id,
        attemptId: createdAttempt.id,
        entityType: "Attempt",
        entityId: createdAttempt.id,
        action: ASSESSMENT_EVENTS.ATTEMPT_STARTED,
        newValues: {
          attemptNumber: createdAttempt.attempt_number,
          startedAt: createdAttempt.started_at,
          expiredAt: createdAttempt.expired_at,
        },
      },
      actor,
      requestContext,
      transaction
    );

    return createdAttempt;
  });

  return attempt;
};

const submitAttempt = async (attemptId, answers, actor, requestContext = {}) => {
  if (!Array.isArray(answers) || !answers.length) {
    throw new BadRequestError(
      "answers must be a non-empty array",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_SUBMISSION)
    );
  }

  const attempt = await getAttemptById(attemptId, true);
  const assessment = attempt.quiz;
  const enrollment = attempt.enrollment;

  if (!enrollment || Number(enrollment.student_id) !== Number(actor.id)) {
    throw new ForbiddenError(
      "Attempt is outside your scope",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.UNAUTHORIZED)
    );
  }

  if (attempt.submission) {
    return {
      attempt,
      submission: attempt.submission,
      grade: attempt.submission.grade || null,
      publication: attempt.submission.grade?.publication || null,
      event: null,
    };
  }

  if (attempt.status !== ATTEMPT_STATUSES.IN_PROGRESS) {
    throw new ConflictError(
      "Attempt is not in progress",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.DUPLICATE_SUBMISSION)
    );
  }

  if (attempt.expired_at && new Date(attempt.expired_at) < new Date()) {
    attempt.status = ATTEMPT_STATUSES.EXPIRED;
    await attempt.save();
    throw new ConflictError(
      "Attempt has expired",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.ATTEMPT_EXPIRED)
    );
  }

  const questionsById = new Map(
    assessment.questions.map((question) => [Number(question.id), question])
  );
  const submittedQuestionIds = new Set();
  let rawAutoScore = 0;
  let manualReviewRequired = assessment.grading_method === GRADING_METHODS.MANUAL;
  const evaluatedAnswers = [];

  for (const answer of answers) {
    const questionId = Number(answer.questionId);
    const question = questionsById.get(questionId);
    if (!question || submittedQuestionIds.has(questionId)) {
      continue;
    }
    submittedQuestionIds.add(questionId);
    const evaluation = evaluateAnswer(question, answer);
    if (!evaluation.manualReviewRequired && evaluation.awardedPoints !== null) {
      rawAutoScore += Number(evaluation.awardedPoints);
    }
    if (evaluation.manualReviewRequired) manualReviewRequired = true;
    evaluatedAnswers.push({ question, evaluation });
  }

  if (!evaluatedAnswers.length) {
    throw new BadRequestError(
      "Submission does not contain valid answers",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_SUBMISSION)
    );
  }

  const maxScore = resolveMaxScore(assessment, assessment.questions);
  const autoGradedCompletely =
    !manualReviewRequired && assessment.grading_method !== GRADING_METHODS.MANUAL;
  const rawScore = autoGradedCompletely ? rawAutoScore : rawAutoScore;
  const percentageScore = calculatePercentage(rawScore, maxScore);
  const defaultFeedback = autoGradedCompletely
    ? percentageScore >= Number(assessment.passing_score || 0)
      ? "Assessment passed."
      : "Assessment submitted."
    : "Assessment submitted and awaiting grading.";

  const result = await sequelize.transaction(async (transaction) => {
    await QuizAttemptAnswer.bulkCreate(
      evaluatedAnswers.map(({ question, evaluation }) => ({
        attempt_id: attempt.id,
        question_id: question.id,
        selected_option_id: evaluation.answerPayload.selectedOptionId || null,
        text_answer: evaluation.storedTextAnswer,
        answer_payload: evaluation.answerPayload,
        is_correct: evaluation.isCorrect,
        awarded_points: evaluation.awardedPoints,
      })),
      { transaction }
    );

    const submission = await AssessmentSubmission.create(
      {
        attempt_id: attempt.id,
        submission_payload: {
          answers: evaluatedAnswers.map(({ evaluation }) => evaluation.answerPayload),
        },
        submission_status: "submitted",
        submitted_by: actor.id,
        submitted_at: new Date(),
      },
      { transaction }
    );

    const grade = await AssessmentGrade.create(
      {
        submission_id: submission.id,
        score: rawScore,
        max_score: maxScore,
        grading_status: autoGradedCompletely ? "graded" : "draft",
        feedback: defaultFeedback,
        grading_breakdown: {
          autoGradedScore: rawAutoScore,
          manualReviewRequired,
        },
        graded_by: autoGradedCompletely ? actor.id : null,
        graded_at: autoGradedCompletely ? new Date() : null,
      },
      { transaction }
    );

    attempt.submitted_at = submission.submitted_at;
    attempt.status = autoGradedCompletely ? ATTEMPT_STATUSES.GRADED : ATTEMPT_STATUSES.SUBMITTED;
    attempt.score = percentageScore;
    attempt.feedback = defaultFeedback;
    await attempt.save({ transaction });

    await createAuditLog(
      {
        assessmentId: assessment.id,
        attemptId: attempt.id,
        submissionId: submission.id,
        entityType: "Submission",
        entityId: submission.id,
        action: ASSESSMENT_EVENTS.SUBMISSION_SUBMITTED,
        newValues: {
          submittedAt: submission.submitted_at,
          submissionStatus: submission.submission_status,
        },
      },
      actor,
      requestContext,
      transaction
    );

    let publication = await AssessmentResultPublication.create(
      {
        grade_id: grade.id,
        publication_status: PUBLICATION_STATUSES.NOT_PUBLISHED,
        scheduled_publish_at: assessment.result_publish_at || null,
      },
      { transaction }
    );

    let event = null;
    if (autoGradedCompletely) {
      await createAuditLog(
        {
          assessmentId: assessment.id,
          attemptId: attempt.id,
          submissionId: submission.id,
          gradeId: grade.id,
          entityType: "Grade",
          entityId: grade.id,
          action: ASSESSMENT_EVENTS.GRADE_ASSIGNED,
          newValues: {
            score: grade.score,
            maxScore: grade.max_score,
            gradingStatus: grade.grading_status,
          },
        },
        actor,
        requestContext,
        transaction
      );

      const autoPublish = await maybeAutoPublishGrade(
        assessment,
        attempt,
        { ...grade.get({ plain: true }), publication },
        actor,
        requestContext,
        transaction
      );
      publication = autoPublish.publication;
      event = autoPublish.event;
    }

    return { attempt, submission, grade, publication, event };
  });

  return result;
};

const gradeSubmission = async (submissionId, payload, actor, requestContext = {}) => {
  const submission = await getSubmissionById(submissionId);
  await assertStaffScope(submission.attempt.quiz, actor);

  if (submission.attempt.status === ATTEMPT_STATUSES.PUBLISHED) {
    throw new ConflictError(
      "Published results are locked",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.GRADE_LOCKED)
    );
  }

  const maxScore = resolveMaxScore(submission.attempt.quiz, submission.attempt.quiz.questions);
  const score = toNumber(payload.score, "score");
  if (score === null || score < 0 || score > maxScore) {
    throw new UnprocessableEntityError(
      "Score is invalid",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_SCORE, { maxScore })
    );
  }

  const result = await sequelize.transaction(async (transaction) => {
    let grade = submission.grade;
    const previousValues = grade ? grade.toJSON() : null;

    if (!grade) {
      grade = await AssessmentGrade.create(
        {
          submission_id: submission.id,
          score,
          max_score: maxScore,
          grading_status: "graded",
          feedback: payload.feedback || null,
          grading_breakdown: payload.gradingBreakdown || null,
          graded_by: actor.id,
          graded_at: new Date(),
        },
        { transaction }
      );
    } else {
      grade.score = score;
      grade.max_score = maxScore;
      grade.feedback = payload.feedback || grade.feedback;
      grade.grading_breakdown = payload.gradingBreakdown || grade.grading_breakdown;
      grade.grading_status = "graded";
      grade.graded_by = actor.id;
      grade.graded_at = new Date();
      await grade.save({ transaction });
    }

    submission.attempt.score = calculatePercentage(score, maxScore);
    submission.attempt.feedback = grade.feedback;
    submission.attempt.status = ATTEMPT_STATUSES.GRADED;
    await submission.attempt.save({ transaction });

    await createAuditLog(
      {
        assessmentId: submission.attempt.quiz.id,
        attemptId: submission.attempt.id,
        submissionId: submission.id,
        gradeId: grade.id,
        entityType: "Grade",
        entityId: grade.id,
        action: ASSESSMENT_EVENTS.GRADE_ASSIGNED,
        oldValues: previousValues,
        newValues: grade.toJSON(),
        reason: payload.reason || null,
      },
      actor,
      requestContext,
      transaction
    );

    const autoPublish = await maybeAutoPublishGrade(
      submission.attempt.quiz,
      submission.attempt,
      grade,
      actor,
      requestContext,
      transaction
    );

    return { submission, grade, publication: autoPublish.publication, event: autoPublish.event };
  });

  return result;
};

const publishGrade = async (gradeId, actor, requestContext = {}) => {
  const grade = await getGradeById(gradeId);
  const assessment = grade.submission.attempt.quiz;
  await assertStaffScope(assessment, actor);

  if (grade.grading_status !== "graded") {
    throw new ConflictError(
      "Grade must be finalized before publication",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.INVALID_STATUS)
    );
  }

  const publication = grade.publication;
  if (publication?.publication_status === PUBLICATION_STATUSES.PUBLISHED) {
    return {
      grade,
      publication,
      event: {
        name: ASSESSMENT_EVENTS.GRADE_PUBLISHED,
        assessmentId: assessment.id,
        attemptId: grade.submission.attempt.id,
        gradeId: grade.id,
        publicationId: publication.id,
      },
    };
  }

  const result = await sequelize.transaction(async (transaction) => {
    let nextPublication = publication;
    if (!nextPublication) {
      nextPublication = await AssessmentResultPublication.create(
        {
          grade_id: grade.id,
          publication_status: PUBLICATION_STATUSES.NOT_PUBLISHED,
          scheduled_publish_at: assessment.result_publish_at || null,
        },
        { transaction }
      );
    }

    nextPublication.publication_status = PUBLICATION_STATUSES.PUBLISHED;
    nextPublication.published_at = new Date();
    nextPublication.published_by = actor.id;
    await nextPublication.save({ transaction });

    grade.submission.attempt.status = ATTEMPT_STATUSES.PUBLISHED;
    grade.submission.attempt.published_at = nextPublication.published_at;
    await grade.submission.attempt.save({ transaction });

    await createAuditLog(
      {
        assessmentId: assessment.id,
        attemptId: grade.submission.attempt.id,
        submissionId: grade.submission.id,
        gradeId: grade.id,
        publicationId: nextPublication.id,
        entityType: "ResultPublication",
        entityId: nextPublication.id,
        action: ASSESSMENT_EVENTS.GRADE_PUBLISHED,
        newValues: {
          publicationStatus: nextPublication.publication_status,
          publishedAt: nextPublication.published_at,
        },
      },
      actor,
      requestContext,
      transaction
    );

    return {
      grade,
      publication: nextPublication,
      event: {
        name: ASSESSMENT_EVENTS.GRADE_PUBLISHED,
        assessmentId: assessment.id,
        attemptId: grade.submission.attempt.id,
        gradeId: grade.id,
        publicationId: nextPublication.id,
      },
    };
  });

  return result;
};

const getAttempts = async (enrollmentId, assessmentId, actor) => {
  const assessment = await getAssessmentById(assessmentId, hasRole(actor.role, STAFF_ROLES));
  const role = normalizeRole(actor.role);

  if (isRole(role, ROLES.TEACHER)) {
    await assertStaffScope(assessment, actor);
  } else if (isRole(role, ROLES.STUDENT)) {
    const enrollment = await Enrollment.findByPk(enrollmentId);
    if (!enrollment || Number(enrollment.student_id) !== Number(actor.id)) {
      throw new ForbiddenError(
        "Enrollment is outside your scope",
        buildErrorDetails(ASSESSMENT_ERROR_CODES.UNAUTHORIZED)
      );
    }
  } else if (!isRole(role, ROLES.ADMIN)) {
    throw new ForbiddenError(
      "Attempt history is outside your scope",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.UNAUTHORIZED)
    );
  }

  return QuizAttempt.findAll({
    where: { enrollment_id: enrollmentId, quiz_id: assessmentId },
    include: attemptDetailInclude(hasRole(role, STAFF_ROLES)),
    order: [["created_at", "DESC"]],
  });
};

const getAssessmentResults = async (assessmentId, filters, actor, requestContext = {}) => {
  const assessment = await getAssessmentById(assessmentId, hasRole(actor.role, STAFF_ROLES));
  const role = normalizeRole(actor.role);
  let studentIds = [];

  if (isRole(role, ROLES.ADMIN) || isRole(role, ROLES.TEACHER)) {
    if (isRole(role, ROLES.TEACHER)) {
      await assertStaffScope(assessment, actor);
    }
    if (filters.studentId) studentIds = [Number(filters.studentId)];
  } else if (isRole(role, ROLES.STUDENT)) {
    studentIds = [Number(actor.id)];
  } else if (isRole(role, ROLES.PARENT)) {
    const linkedStudentIds = await getLinkedStudentIds(actor.id);
    if (filters.studentId && !linkedStudentIds.includes(Number(filters.studentId))) {
      throw new ForbiddenError(
        "Student result is outside your scope",
        buildErrorDetails(ASSESSMENT_ERROR_CODES.UNAUTHORIZED)
      );
    }
    studentIds = filters.studentId ? [Number(filters.studentId)] : linkedStudentIds;
  } else {
    throw new ForbiddenError(
      "Result access denied",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.UNAUTHORIZED)
    );
  }

  const attempts = await QuizAttempt.findAll({
    where: { quiz_id: assessment.id },
    include: [
      {
        model: Enrollment,
        as: "enrollment",
        where: studentIds.length ? { student_id: { [Op.in]: studentIds } } : undefined,
      },
      {
        model: Quiz,
        as: "quiz",
        include: assessmentDetailInclude(hasRole(role, STAFF_ROLES)),
      },
      {
        model: AssessmentSubmission,
        as: "submission",
        include: [
          {
            model: AssessmentGrade,
            as: "grade",
            include: [{ model: AssessmentResultPublication, as: "publication" }],
          },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  let results = attempts.map(toResultRecord);

  if (isRole(role, ROLES.STUDENT) || isRole(role, ROLES.PARENT)) {
    results = results.filter(
      (result) => result.publicationStatus === PUBLICATION_STATUSES.PUBLISHED
    );
    if (!results.length) {
      await createAuditLog(
        {
          assessmentId: assessment.id,
          entityType: "Assessment",
          entityId: assessment.id,
          action: "ViewResultDenied",
          reason: ASSESSMENT_ERROR_CODES.RESULT_NOT_PUBLISHED,
        },
        actor,
        requestContext
      );
      throw new ForbiddenError(
        "Result is not published",
        buildErrorDetails(ASSESSMENT_ERROR_CODES.RESULT_NOT_PUBLISHED)
      );
    }
  }

  return results;
};

const exportAssessmentResults = async (assessmentId, filters, actor, requestContext = {}) => {
  const assessment = await getAssessmentById(assessmentId, true);
  await assertStaffScope(assessment, actor);

  const results = await getAssessmentResults(
    assessmentId,
    filters,
    { ...actor, role: actor.role },
    requestContext
  );
  if (results.length > DEFAULT_EXPORT_LIMIT) {
    throw new ConflictError(
      "Export limit exceeded",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.EXPORT_LIMIT, {
        limit: DEFAULT_EXPORT_LIMIT,
      })
    );
  }

  await createAuditLog(
    {
      assessmentId: assessment.id,
      entityType: "Assessment",
      entityId: assessment.id,
      action: "ExportResult",
      newValues: { recordCount: results.length, filters },
    },
    actor,
    requestContext
  );

  return {
    assessmentId: assessment.id,
    exportedAt: new Date(),
    count: results.length,
    results,
  };
};

const getAssessmentAuditLogs = async (assessmentId, actor) => {
  const assessment = await getAssessmentById(assessmentId, true);
  if (isRole(actor.role, ROLES.TEACHER)) {
    await assertStaffScope(assessment, actor);
  } else if (!isRole(actor.role, ROLES.ADMIN)) {
    throw new ForbiddenError(
      "Audit log access denied",
      buildErrorDetails(ASSESSMENT_ERROR_CODES.UNAUTHORIZED)
    );
  }

  return AssessmentAuditLog.findAll({
    where: { assessment_id: assessmentId },
    order: [["created_at", "DESC"]],
  });
};

module.exports = {
  addQuestion,
  archiveAssessment,
  closeAssessment,
  createAssessment,
  exportAssessmentResults,
  getAssessment,
  getAssessmentAuditLogs,
  getAssessmentResults,
  getAttempts,
  gradeSubmission,
  listAssessments,
  publishAssessment,
  publishGrade,
  startAttempt,
  submitAttempt,
  updateAssessment,
};
