const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/error-responses");
const {
  Quiz,
  QuizQuestion,
  QuizOption,
  QuizAttempt,
  QuizAttemptAnswer,
  Lesson,
  Enrollment,
  CourseSection,
  Course,
} = require("../models");

const createQuiz = async (lessonId, payload, userId, userRole) => {
  const { title, description, passingScore, timeLimitMinutes, maxAttempts } = payload;
  if (!title) throw new BadRequestError("Missing title");

  const lesson = await Lesson.findByPk(lessonId, {
    include: [
      {
        model: CourseSection,
        as: "section",
        include: [{ model: Course, as: "course" }],
      },
    ],
  });
  if (!lesson) throw new NotFoundError("Lesson not found");

  // Check authorization
  if (userRole !== "admin" && lesson.section.course.instructor_id !== userId) {
    throw new ForbiddenError("Not authorized to create quiz for this lesson");
  }

  const quiz = await Quiz.create({
    lesson_id: lessonId,
    title,
    description,
    passing_score: passingScore || 70,
    time_limit_minutes: timeLimitMinutes,
    max_attempts: maxAttempts || 3,
  });

  return quiz;
};

const addQuestion = async (quizId, payload, userId, userRole) => {
  const { questionText, questionType, points, orderIndex, options } = payload;
  if (!questionText) throw new BadRequestError("Missing question text");

  const quiz = await Quiz.findByPk(quizId, {
    include: [
      {
        model: Lesson,
        as: "lesson",
        include: [
          {
            model: CourseSection,
            as: "section",
            include: [{ model: Course, as: "course" }],
          },
        ],
      },
    ],
  });
  if (!quiz) throw new NotFoundError("Quiz not found");

  // Check authorization
  if (userRole !== "admin" && quiz.lesson.section.course.instructor_id !== userId) {
    throw new ForbiddenError("Not authorized to add questions to this quiz");
  }

  const question = await QuizQuestion.create({
    quiz_id: quizId,
    question_text: questionText,
    question_type: questionType || "single_choice",
    points: points || 1,
    order_index: orderIndex || 0,
  });

  // Add options if provided
  if (options && Array.isArray(options)) {
    for (const opt of options) {
      await QuizOption.create({
        question_id: question.id,
        option_text: opt.text,
        is_correct: opt.isCorrect || false,
      });
    }
  }

  return question;
};

const getQuiz = async (quizId, includeAnswers = false) => {
  const include = [
    {
      model: QuizQuestion,
      as: "questions",
      include: includeAnswers
        ? [{ model: QuizOption, as: "options" }]
        : [{ model: QuizOption, as: "options", attributes: ["id", "option_text"] }],
    },
  ];

  const quiz = await Quiz.findByPk(quizId, { include });
  if (!quiz) throw new NotFoundError("Quiz not found");
  return quiz;
};

const startAttempt = async (quizId, enrollmentId) => {
  const quiz = await Quiz.findByPk(quizId);
  if (!quiz) throw new NotFoundError("Quiz not found");

  const enrollment = await Enrollment.findByPk(enrollmentId);
  if (!enrollment) throw new NotFoundError("Enrollment not found");

  // Check if max attempts exceeded
  const previousAttempts = await QuizAttempt.count({
    where: { quiz_id: quizId, enrollment_id: enrollmentId },
  });

  if (previousAttempts >= quiz.max_attempts) {
    throw new BadRequestError("Maximum attempts exceeded");
  }

  const attempt = await QuizAttempt.create({
    enrollment_id: enrollmentId,
    quiz_id: quizId,
    status: "in_progress",
    attempt_number: previousAttempts + 1,
  });

  return attempt;
};

const submitAttempt = async (attemptId, answers) => {
  const attempt = await QuizAttempt.findByPk(attemptId, {
    include: [
      {
        model: Quiz,
        as: "quiz",
        include: [
          {
            model: QuizQuestion,
            as: "questions",
            include: [{ model: QuizOption, as: "options" }],
          },
        ],
      },
    ],
  });

  if (!attempt) throw new NotFoundError("Attempt not found");
  if (attempt.status !== "in_progress") throw new BadRequestError("Attempt already submitted");

  let totalPoints = 0;
  let earnedPoints = 0;

  // Grade each answer
  for (const answer of answers) {
    const question = attempt.quiz.questions.find((q) => q.id === answer.questionId);
    if (!question) continue;

    totalPoints += parseFloat(question.points);
    let isCorrect = false;

    if (question.question_type === "single_choice") {
      const selectedOption = question.options.find((o) => o.id === answer.selectedOptionId);
      isCorrect = selectedOption?.is_correct || false;
    } else if (question.question_type === "multiple_choice") {
      const correctOptions = question.options.filter((o) => o.is_correct).map((o) => o.id);
      isCorrect =
        JSON.stringify(answer.selectedOptionIds?.sort()) === JSON.stringify(correctOptions.sort());
    }

    if (isCorrect) earnedPoints += parseFloat(question.points);

    await QuizAttemptAnswer.create({
      attempt_id: attemptId,
      question_id: answer.questionId,
      selected_option_id: answer.selectedOptionId,
      text_answer: answer.textAnswer,
      is_correct: isCorrect,
    });
  }

  const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

  attempt.score = score;
  attempt.status = "graded";
  attempt.submitted_at = new Date();
  attempt.feedback =
    score >= attempt.quiz.passing_score
      ? "Congratulations! You passed the quiz."
      : "You didn't pass. Please review the material and try again.";

  await attempt.save();

  return attempt;
};

const getAttempts = async (enrollmentId, quizId) => {
  return QuizAttempt.findAll({
    where: { enrollment_id: enrollmentId, quiz_id: quizId },
    include: [
      { model: Quiz, as: "quiz" },
      { model: QuizAttemptAnswer, as: "answers" },
    ],
    order: [["created_at", "DESC"]],
  });
};

module.exports = {
  createQuiz,
  addQuestion,
  getQuiz,
  startAttempt,
  submitAttempt,
  getAttempts,
};
