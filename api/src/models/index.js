const sequelize = require("../database/init.mysql.js");

// Import all models
const Role = require("./role.model");
const Department = require("./department.model");
const CoursePrerequisite = require("./course-prerequisite.model");
const AuditLog = require("./audit-log.model");
const User = require("./user.model");
const RefreshToken = require("./refresh-token.model");
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
const ContentAsset = require("./content-asset.model");
const LearningItem = require("./learning-item.model");
const ContentVersion = require("./content-version.model");
const EnrollmentHistory = require("./enrollment-history.model");
const EligibilityResult = require("./eligibility-result.model");
const PaymentReference = require("./payment-reference.model");

// Define associations
// User - Role
User.belongsTo(Role, { foreignKey: "role_id", as: "role" });
Role.hasMany(User, { foreignKey: "role_id", as: "role_users" });

// RefreshToken - User
RefreshToken.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(RefreshToken, { foreignKey: "user_id", as: "refresh_tokens" });

// Course - User (Teacher)
Course.belongsTo(User, { foreignKey: "teacher_id", as: "teacher" });
User.hasMany(Course, { foreignKey: "teacher_id", as: "courses_teaching" });

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

// Department - Course
Department.hasMany(Course, { foreignKey: "department_id", as: "courses" });
Course.belongsTo(Department, { foreignKey: "department_id", as: "department" });

// CoursePrerequisite - Course (main course)
Course.hasMany(CoursePrerequisite, { foreignKey: "course_id", as: "prerequisites" });
CoursePrerequisite.belongsTo(Course, { foreignKey: "course_id", as: "course" });
CoursePrerequisite.belongsTo(Course, {
  foreignKey: "prerequisite_course_id",
  as: "prerequisite_course",
});

// AuditLog - User
AuditLog.belongsTo(User, { foreignKey: "changed_by", as: "changed_by_user" });

// ContentAsset - User (uploader)
ContentAsset.belongsTo(User, { foreignKey: "uploaded_by", as: "uploader" });
User.hasMany(ContentAsset, { foreignKey: "uploaded_by", as: "uploaded_assets" });

// LearningItem - Lesson, ContentAsset
LearningItem.belongsTo(Lesson, { foreignKey: "lesson_id", as: "lesson" });
LearningItem.belongsTo(ContentAsset, { foreignKey: "asset_id", as: "asset" });
Lesson.hasMany(LearningItem, { foreignKey: "lesson_id", as: "learning_items" });
ContentAsset.hasMany(LearningItem, { foreignKey: "asset_id", as: "learning_items" });

// ContentVersion - Course
ContentVersion.belongsTo(Course, { foreignKey: "course_id", as: "course" });
ContentVersion.belongsTo(User, { foreignKey: "published_by", as: "publisher" });
ContentVersion.belongsTo(User, { foreignKey: "created_by", as: "creator" });
Course.hasMany(ContentVersion, { foreignKey: "course_id", as: "content_versions" });

// EnrollmentHistory - Enrollment & User
Enrollment.hasMany(EnrollmentHistory, { foreignKey: "enrollment_id", as: "history" });
EnrollmentHistory.belongsTo(Enrollment, { foreignKey: "enrollment_id", as: "enrollment" });
EnrollmentHistory.belongsTo(User, { foreignKey: "changed_by", as: "changed_by_user" });

// EligibilityResult - Enrollment, User (learner), Course
EligibilityResult.belongsTo(User, { foreignKey: "learner_id", as: "learner" });
EligibilityResult.belongsTo(Course, { foreignKey: "course_id", as: "course" });
EligibilityResult.belongsTo(User, { foreignKey: "checked_by", as: "checker" });
Enrollment.hasMany(EligibilityResult, { foreignKey: "enrollment_id", as: "eligibility_results" });
EligibilityResult.belongsTo(Enrollment, { foreignKey: "enrollment_id", as: "enrollment" });

// PaymentReference - Enrollment
PaymentReference.belongsTo(Enrollment, { foreignKey: "enrollment_id", as: "enrollment" });
Enrollment.hasMany(PaymentReference, { foreignKey: "enrollment_id", as: "payment_references" });


const sync = async () => {
  await sequelize.sync();
};

module.exports = {
  sequelize,
  Role,
  User,
  RefreshToken,
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
  Department,
  CoursePrerequisite,
  AuditLog,
  ContentAsset,
  LearningItem,
  ContentVersion,
  EnrollmentHistory,
  EligibilityResult,
  PaymentReference,
  sync,
};
