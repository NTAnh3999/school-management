const sequelize = require("../database/init.mysql.js");

// Import all models
const Role = require("./role.model");
const User = require("./user.model");
const Course = require("./course.model");
const CourseSection = require("./course-section.model");
const Lesson = require("./lesson.model");
const Enrollment = require("./enrollment.model");
const LessonProgress = require("./lesson-progress.model");
const Quiz = require("./quiz.model");
const QuizQuestion = require("./quiz-question.model");
const QuizOption = require("./quiz-option.model");
const QuizAttempt = require("./quiz-attempt.model");
const QuizAttemptAnswer = require("./quiz-attempt-answer.model");
const Reward = require("./reward.model");
const StudentReward = require("./student-reward.model");
const StudentCourseProgress = require("./student-course-progress.model");
const CourseReview = require("./course-review.model");
const LessonFeedback = require("./lesson-feedback.model");
const Notification = require("./notification.model");

// Define associations
// User - Role
User.belongsTo(Role, { foreignKey: "role_id", as: "role" });
Role.hasMany(User, { foreignKey: "role_id", as: "users" });

// Course - User (Instructor)
Course.belongsTo(User, { foreignKey: "instructor_id", as: "instructor" });
User.hasMany(Course, { foreignKey: "instructor_id", as: "courses_teaching" });

// CourseSection - Course
CourseSection.belongsTo(Course, { foreignKey: "course_id", as: "course" });
Course.hasMany(CourseSection, { foreignKey: "course_id", as: "sections" });

// Lesson - CourseSection
Lesson.belongsTo(CourseSection, { foreignKey: "section_id", as: "section" });
CourseSection.hasMany(Lesson, { foreignKey: "section_id", as: "lessons" });

// Enrollment - User (Student) & Course
Enrollment.belongsTo(User, { foreignKey: "student_id", as: "student" });
Enrollment.belongsTo(Course, { foreignKey: "course_id", as: "course" });
User.hasMany(Enrollment, { foreignKey: "student_id", as: "enrollments" });
Course.hasMany(Enrollment, { foreignKey: "course_id", as: "enrollments" });

// LessonProgress - Enrollment & Lesson
LessonProgress.belongsTo(Enrollment, { foreignKey: "enrollment_id", as: "enrollment" });
LessonProgress.belongsTo(Lesson, { foreignKey: "lesson_id", as: "lesson" });
Enrollment.hasMany(LessonProgress, { foreignKey: "enrollment_id", as: "lesson_progress" });
Lesson.hasMany(LessonProgress, { foreignKey: "lesson_id", as: "progress_records" });

// Quiz - Lesson
Quiz.belongsTo(Lesson, { foreignKey: "lesson_id", as: "lesson" });
Lesson.hasOne(Quiz, { foreignKey: "lesson_id", as: "quiz" });

// QuizQuestion - Quiz
QuizQuestion.belongsTo(Quiz, { foreignKey: "quiz_id", as: "quiz" });
Quiz.hasMany(QuizQuestion, { foreignKey: "quiz_id", as: "questions" });

// QuizOption - QuizQuestion
QuizOption.belongsTo(QuizQuestion, { foreignKey: "question_id", as: "question" });
QuizQuestion.hasMany(QuizOption, { foreignKey: "question_id", as: "options" });

// QuizAttempt - Enrollment & Quiz
QuizAttempt.belongsTo(Enrollment, { foreignKey: "enrollment_id", as: "enrollment" });
QuizAttempt.belongsTo(Quiz, { foreignKey: "quiz_id", as: "quiz" });
Enrollment.hasMany(QuizAttempt, { foreignKey: "enrollment_id", as: "quiz_attempts" });
Quiz.hasMany(QuizAttempt, { foreignKey: "quiz_id", as: "attempts" });

// QuizAttemptAnswer - QuizAttempt, QuizQuestion, QuizOption
QuizAttemptAnswer.belongsTo(QuizAttempt, { foreignKey: "attempt_id", as: "attempt" });
QuizAttemptAnswer.belongsTo(QuizQuestion, { foreignKey: "question_id", as: "question" });
QuizAttemptAnswer.belongsTo(QuizOption, {
  foreignKey: "selected_option_id",
  as: "selected_option",
});
QuizAttempt.hasMany(QuizAttemptAnswer, { foreignKey: "attempt_id", as: "answers" });

// StudentReward - User (Student), Reward, Enrollment
StudentReward.belongsTo(User, { foreignKey: "student_id", as: "student" });
StudentReward.belongsTo(Reward, { foreignKey: "reward_id", as: "reward" });
StudentReward.belongsTo(Enrollment, { foreignKey: "enrollment_id", as: "enrollment" });
User.hasMany(StudentReward, { foreignKey: "student_id", as: "rewards_earned" });
Reward.hasMany(StudentReward, { foreignKey: "reward_id", as: "student_rewards" });

// StudentCourseProgress - Enrollment
StudentCourseProgress.belongsTo(Enrollment, { foreignKey: "enrollment_id", as: "enrollment" });
Enrollment.hasOne(StudentCourseProgress, { foreignKey: "enrollment_id", as: "progress" });

// CourseReview - Course & User (Student)
CourseReview.belongsTo(Course, { foreignKey: "course_id", as: "course" });
CourseReview.belongsTo(User, { foreignKey: "student_id", as: "student" });
Course.hasMany(CourseReview, { foreignKey: "course_id", as: "reviews" });
User.hasMany(CourseReview, { foreignKey: "student_id", as: "reviews_given" });

// LessonFeedback - Lesson & User (Student)
LessonFeedback.belongsTo(Lesson, { foreignKey: "lesson_id", as: "lesson" });
LessonFeedback.belongsTo(User, { foreignKey: "student_id", as: "student" });
Lesson.hasMany(LessonFeedback, { foreignKey: "lesson_id", as: "feedback" });
User.hasMany(LessonFeedback, { foreignKey: "student_id", as: "feedback_given" });

// Notification - User
Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });

const sync = async () => {
  await sequelize.sync();
};

module.exports = {
  sequelize,
  Role,
  User,
  Course,
  CourseSection,
  Lesson,
  Enrollment,
  LessonProgress,
  Quiz,
  QuizQuestion,
  QuizOption,
  QuizAttempt,
  QuizAttemptAnswer,
  Reward,
  StudentReward,
  StudentCourseProgress,
  CourseReview,
  LessonFeedback,
  Notification,
  sync,
};
