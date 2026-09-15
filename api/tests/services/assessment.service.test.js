jest.mock("../../src/models", () => ({
  AssessmentAssignment: { create: jest.fn(), findOne: jest.fn() },
  AssessmentAuditLog: { create: jest.fn() },
  AssessmentDefinition: { create: jest.fn(), findOne: jest.fn() },
  AssessmentGrade: { create: jest.fn(), findByPk: jest.fn() },
  AssessmentResultPublication: { create: jest.fn(), findOne: jest.fn() },
  AssessmentSubmission: { create: jest.fn(), findByPk: jest.fn() },
  AssessmentVersion: { create: jest.fn(), findOne: jest.fn() },
  Classroom: { findByPk: jest.fn() },
  ClassroomEnrollment: { findAll: jest.fn(), findOne: jest.fn() },
  ClassroomTeacher: { findAll: jest.fn() },
  Course: {},
  CourseModule: {},
  Enrollment: { findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn() },
  Lesson: { findByPk: jest.fn() },
  ParentProfile: {},
  ParentStudentRelationship: { findAll: jest.fn() },
  Profile: {},
  Quiz: { create: jest.fn(), findAll: jest.fn(), findByPk: jest.fn() },
  QuizAttempt: {
    count: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
  QuizAttemptAnswer: { bulkCreate: jest.fn() },
  QuizOption: { bulkCreate: jest.fn() },
  QuizQuestion: { create: jest.fn() },
  StudentProfile: {},
  sequelize: {
    transaction: jest.fn((callback) => callback("tx")),
  },
}));

const {
  AssessmentAssignment,
  AssessmentAuditLog,
  AssessmentDefinition,
  AssessmentGrade,
  AssessmentResultPublication,
  AssessmentSubmission,
  AssessmentVersion,
  Lesson,
  Enrollment,
  Quiz,
  QuizAttempt,
  QuizAttemptAnswer,
  QuizOption,
  QuizQuestion,
} = require("../../src/models");
const AssessmentService = require("../../src/services/assessment.service");
const { ASSESSMENT_ERROR_CODES } = require("../../src/constants/assessment");
const { ConflictError, ForbiddenError } = require("../../src/utils/error-responses");

const makeInstance = (overrides = {}) => {
  const instance = { ...overrides };
  instance.save = jest.fn().mockResolvedValue(instance);
  instance.toJSON = jest.fn(() => {
    const plain = { ...instance };
    delete plain.save;
    delete plain.toJSON;
    delete plain.get;
    delete plain.previous;
    return plain;
  });
  instance.get = jest.fn(({ plain } = {}) => (plain ? instance.toJSON() : instance));
  instance.previous = jest.fn((field) => instance[`previous_${field}`]);
  return instance;
};

const admin = { id: 1, role: "admin" };
const student = { id: 20, role: "student" };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("assessment.service P0 behavior", () => {
  test("createAssessment creates the FSD definition/version/assignment bridge", async () => {
    const lesson = makeInstance({
      id: 44,
      module_id: 33,
      content_version_id: 22,
      module: { id: 33, content_version_id: 22, course: { id: 11 } },
    });
    const createdAssessment = makeInstance({
      id: 10,
      lesson_id: 44,
      title: "Checkpoint 1",
      description: "Readiness check",
      assessment_type: "quiz",
      course_id: 11,
      classroom_id: null,
      status: "draft",
      open_at: null,
      close_at: null,
      passing_score: 70,
      time_limit_minutes: 30,
      max_attempts: 2,
      max_score: 10,
      grading_method: "auto",
      publish_policy: "manual",
      result_publish_at: null,
      created_by: admin.id,
      updated_by: admin.id,
    });
    const returnedAssessment = makeInstance({ ...createdAssessment, questions: [] });

    Lesson.findByPk.mockResolvedValueOnce(lesson);
    Quiz.create.mockResolvedValueOnce(createdAssessment);
    Quiz.findByPk.mockResolvedValueOnce(returnedAssessment);
    AssessmentDefinition.findOne.mockResolvedValueOnce(null);
    AssessmentDefinition.create.mockResolvedValueOnce(makeInstance({ id: 700 }));
    AssessmentVersion.findOne.mockResolvedValueOnce(null);
    AssessmentVersion.create.mockResolvedValueOnce(makeInstance({ id: 800, status: "draft" }));
    AssessmentAssignment.findOne.mockResolvedValueOnce(null);
    AssessmentAssignment.create.mockResolvedValueOnce(makeInstance({ id: 900 }));

    const result = await AssessmentService.createAssessment(
      {
        title: "Checkpoint 1",
        lessonId: 44,
        description: "Readiness check",
        durationMinutes: 30,
        maxAttempts: 2,
        maxScore: 10,
        questions: [],
      },
      admin
    );

    expect(result).toBe(returnedAssessment);
    expect(AssessmentDefinition.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Checkpoint 1",
        assessment_type: "quiz",
        owner_scope_type: "course",
        owner_scope_id: 11,
        legacy_quiz_id: 10,
      }),
      { transaction: "tx" }
    );
    expect(AssessmentVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assessment_definition_id: 700,
        legacy_quiz_id: 10,
        version_no: 1,
        status: "draft",
        max_score: 10,
        pass_threshold: 70,
        grading_method: "auto",
      }),
      { transaction: "tx" }
    );
    expect(AssessmentAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assessment_version_id: 800,
        legacy_quiz_id: 10,
        course_id: 11,
        content_version_id: 22,
        module_id: 33,
        lesson_id: 44,
        duration_minutes: 30,
        attempt_limit: 2,
        status: "draft",
      }),
      { transaction: "tx" }
    );
  });

  test("duplicateAssessment creates a draft copy with cloned questions and P1 bridge", async () => {
    const sourceAssessment = makeInstance({
      id: 10,
      lesson_id: 44,
      title: "Published Exam",
      description: "Original",
      assessment_type: "exam",
      course_id: 11,
      classroom_id: null,
      status: "published",
      open_at: null,
      close_at: null,
      passing_score: 70,
      time_limit_minutes: 45,
      max_attempts: 1,
      max_score: 10,
      grading_method: "auto",
      publish_policy: "manual",
      result_publish_at: null,
      lesson: {
        id: 44,
        module_id: 33,
        content_version_id: 22,
        module: { id: 33, content_version_id: 22, course: { id: 11 } },
      },
      course: { id: 11 },
      classroom: null,
      questions: [
        {
          id: 100,
          question_text: "Pick one",
          question_type: "single_choice",
          points: 10,
          order_index: 0,
          options: [
            { id: 501, option_text: "Yes", is_correct: true },
            { id: 502, option_text: "No", is_correct: false },
          ],
        },
      ],
    });
    const duplicatedAssessment = makeInstance({
      id: 20,
      lesson_id: 44,
      title: "Retake Draft",
      description: "Original",
      assessment_type: "exam",
      course_id: 11,
      classroom_id: null,
      status: "draft",
      open_at: null,
      close_at: null,
      passing_score: 70,
      time_limit_minutes: 45,
      max_attempts: 1,
      max_score: 10,
      grading_method: "auto",
      publish_policy: "manual",
      result_publish_at: null,
      created_by: admin.id,
      updated_by: admin.id,
    });
    const returnedCopy = makeInstance({ ...duplicatedAssessment, questions: [] });

    Quiz.findByPk.mockResolvedValueOnce(sourceAssessment).mockResolvedValueOnce(returnedCopy);
    Quiz.create.mockResolvedValueOnce(duplicatedAssessment);
    const duplicatedQuestion = makeInstance({ id: 200 });
    QuizQuestion.create.mockResolvedValueOnce(duplicatedQuestion);
    AssessmentDefinition.findOne.mockResolvedValueOnce(null);
    AssessmentDefinition.create.mockResolvedValueOnce(makeInstance({ id: 701 }));
    AssessmentVersion.findOne.mockResolvedValueOnce(null);
    AssessmentVersion.create.mockResolvedValueOnce(makeInstance({ id: 801, status: "draft" }));
    AssessmentAssignment.findOne.mockResolvedValueOnce(null);
    AssessmentAssignment.create.mockResolvedValueOnce(makeInstance({ id: 901 }));

    const result = await AssessmentService.duplicateAssessment(
      10,
      { title: "Retake Draft" },
      admin
    );

    expect(result).toBe(returnedCopy);
    expect(Quiz.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Retake Draft",
        status: "draft",
        lesson_id: 44,
        assessment_type: "exam",
      }),
      { transaction: "tx" }
    );
    expect(QuizQuestion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        quiz_id: 20,
        question_text: "Pick one",
      }),
      { transaction: "tx" }
    );
    expect(QuizOption.bulkCreate).toHaveBeenCalledWith(
      [
        expect.objectContaining({ question_id: 200, option_text: "Yes", is_correct: true }),
        expect.objectContaining({ question_id: 200, option_text: "No", is_correct: false }),
      ],
      { transaction: "tx" }
    );
    expect(AssessmentAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assessment_version_id: 801,
        legacy_quiz_id: 20,
        status: "draft",
      }),
      { transaction: "tx" }
    );
  });

  test("addQuestion blocks changes once an assessment is published", async () => {
    const assessment = makeInstance({
      id: 10,
      status: "published",
      questions: [{ id: 100 }],
    });
    Quiz.findByPk.mockResolvedValueOnce(assessment);

    await expect(
      AssessmentService.addQuestion(10, { questionText: "Late question" }, admin)
    ).rejects.toBeInstanceOf(ConflictError);

    expect(QuizAttempt.count).not.toHaveBeenCalled();
    expect(QuizQuestion.create).not.toHaveBeenCalled();
  });

  test("closeAssessment closes the assessment without expiring in-progress attempts", async () => {
    const assessment = makeInstance({
      id: 10,
      status: "published",
      questions: [{ id: 100 }],
    });
    Quiz.findByPk.mockResolvedValueOnce(assessment).mockResolvedValueOnce(assessment);
    AssessmentAuditLog.create.mockResolvedValueOnce({});

    const result = await AssessmentService.closeAssessment(10, "maintenance", admin);

    expect(result).toBe(assessment);
    expect(assessment.status).toBe("closed");
    expect(assessment.closed_by).toBe(admin.id);
    expect(assessment.save).toHaveBeenCalledWith({ transaction: "tx" });
    expect(QuizAttempt.update).not.toHaveBeenCalled();
    expect(AssessmentAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assessment_id: 10,
        action: "AssessmentClosed",
        reason: "maintenance",
      }),
      { transaction: "tx" }
    );
  });

  test("startAttempt resumes an existing in-progress attempt instead of creating another one", async () => {
    const assessment = makeInstance({
      id: 10,
      status: "published",
      open_at: new Date(Date.now() - 60_000),
      close_at: new Date(Date.now() + 60_000),
      course_id: 30,
      classroom_id: null,
      max_attempts: 2,
      questions: [{ id: 100 }],
    });
    const enrollment = makeInstance({ id: 55, student_id: student.id, course_id: 30 });
    const existingAttempt = makeInstance({
      id: 99,
      quiz_id: 10,
      enrollment_id: 55,
      status: "in_progress",
      expired_at: new Date(Date.now() + 60_000),
    });
    Quiz.findByPk.mockResolvedValueOnce(assessment);
    Enrollment.findOne.mockResolvedValueOnce(enrollment);
    QuizAttempt.findOne.mockResolvedValueOnce(existingAttempt);

    const result = await AssessmentService.startAttempt(10, 55, student);

    expect(result).toBe(existingAttempt);
    expect(QuizAttempt.count).not.toHaveBeenCalled();
    expect(QuizAttempt.create).not.toHaveBeenCalled();
    expect(AssessmentAuditLog.create).not.toHaveBeenCalled();
  });

  test("startAttempt rejects attempts after the assessment window closes", async () => {
    const assessment = makeInstance({
      id: 10,
      status: "published",
      open_at: new Date(Date.now() - 120_000),
      close_at: new Date(Date.now() - 60_000),
      questions: [{ id: 100 }],
    });
    Quiz.findByPk.mockResolvedValueOnce(assessment);

    await expect(AssessmentService.startAttempt(10, 55, student)).rejects.toBeInstanceOf(
      ConflictError
    );

    expect(Enrollment.findOne).not.toHaveBeenCalled();
    expect(QuizAttempt.create).not.toHaveBeenCalled();
  });

  test("submitAttempt is idempotent when a submission already exists", async () => {
    const grade = makeInstance({ id: 300, publication: null });
    const submission = makeInstance({ id: 200, grade });
    const attempt = makeInstance({
      id: 99,
      status: "submitted",
      enrollment: { id: 55, student_id: student.id },
      quiz: { id: 10, questions: [] },
      submission,
    });
    QuizAttempt.findByPk.mockResolvedValueOnce(attempt);

    const result = await AssessmentService.submitAttempt(99, [{ questionId: 100 }], student);

    expect(result).toEqual({
      attempt,
      submission,
      grade,
      publication: null,
      event: null,
    });
    expect(QuizAttemptAnswer.bulkCreate).not.toHaveBeenCalled();
    expect(AssessmentSubmission.create).not.toHaveBeenCalled();
    expect(AssessmentGrade.create).not.toHaveBeenCalled();
    expect(AssessmentResultPublication.create).not.toHaveBeenCalled();
  });

  test("student result access is denied until the grade is published", async () => {
    const assessment = makeInstance({
      id: 10,
      status: "published",
      questions: [{ id: 100 }],
    });
    const attempt = makeInstance({
      id: 99,
      quiz_id: 10,
      enrollment_id: 55,
      attempt_number: 1,
      status: "graded",
      enrollment: { id: 55, student_id: student.id },
      submission: {
        grade: {
          id: 300,
          score: 80,
          max_score: 100,
          grading_status: "graded",
          publication: { publication_status: "not_published" },
        },
      },
    });
    Quiz.findByPk.mockResolvedValueOnce(assessment);
    QuizAttempt.findAll.mockResolvedValueOnce([attempt]);
    AssessmentAuditLog.create.mockResolvedValueOnce({});

    let caught;
    try {
      await AssessmentService.getAssessmentResults(10, {}, student);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ForbiddenError);
    expect(caught.details).toEqual(
      expect.objectContaining({ errorCode: ASSESSMENT_ERROR_CODES.RESULT_NOT_PUBLISHED })
    );
    expect(AssessmentAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assessment_id: 10,
        action: "ViewResultDenied",
        reason: ASSESSMENT_ERROR_CODES.RESULT_NOT_PUBLISHED,
      }),
      { transaction: undefined }
    );
  });
});
