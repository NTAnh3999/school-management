const { NotFoundError } = require("../utils/error-responses");
const {
  LessonProgress,
  Enrollment,
  Lesson,
  StudentCourseProgress,
  CourseSection,
  Course,
  User,
} = require("../models");

const updateProgress = async (enrollmentId, lessonId, status, timeSpent) => {
  const enrollment = await Enrollment.findByPk(enrollmentId);
  if (!enrollment) throw new NotFoundError("Enrollment not found");

  const lesson = await Lesson.findByPk(lessonId);
  if (!lesson) throw new NotFoundError("Lesson not found");

  let progress = await LessonProgress.findOne({
    where: { enrollment_id: enrollmentId, lesson_id: lessonId },
  });

  if (progress) {
    progress.status = status || progress.status;
    progress.time_spent_minutes += timeSpent || 0;
    if (status === "completed" && !progress.completion_date) {
      progress.completion_date = new Date();
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

  // Update overall course progress
  await updateCourseProgress(enrollmentId);

  return progress;
};

const updateCourseProgress = async (enrollmentId) => {
  const enrollment = await Enrollment.findByPk(enrollmentId, {
    include: [{ model: Course, as: "course" }],
  });

  // Get all lessons in the course
  const sections = await CourseSection.findAll({
    where: { course_id: enrollment.course_id },
    include: [{ model: Lesson, as: "lessons" }],
  });

  const allLessons = sections.flatMap((s) => s.lessons);
  const totalLessons = allLessons.length;

  if (totalLessons === 0) return;

  // Get completed lessons
  const completedProgress = await LessonProgress.findAll({
    where: {
      enrollment_id: enrollmentId,
      status: "completed",
    },
  });

  const completedCount = completedProgress.length;
  const completionPercentage = (completedCount / totalLessons) * 100;

  // Get total time spent
  const totalTime = completedProgress.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0);

  // Update or create course progress
  let courseProgress = await StudentCourseProgress.findOne({
    where: { enrollment_id: enrollmentId },
  });

  if (courseProgress) {
    courseProgress.completion_percentage = completionPercentage;
    courseProgress.total_time_spent_minutes = totalTime;
    await courseProgress.save();
  } else {
    await StudentCourseProgress.create({
      enrollment_id: enrollmentId,
      completion_percentage: completionPercentage,
      total_time_spent_minutes: totalTime,
    });
  }

  // Update enrollment status if course is completed
  if (completionPercentage >= 100 && enrollment.status === "active") {
    enrollment.status = "completed";
    enrollment.completed_at = new Date();
    await enrollment.save();
  }
};

const getStudentProgress = async (enrollmentId) => {
  const enrollment = await Enrollment.findByPk(enrollmentId, {
    include: [
      { model: Course, as: "course" },
      { model: StudentCourseProgress, as: "progress" },
      { model: LessonProgress, as: "lesson_progress", include: [{ model: Lesson, as: "lesson" }] },
    ],
  });

  if (!enrollment) throw new NotFoundError("Enrollment not found");
  return enrollment;
};

const getInstructorCourseProgress = async (courseId) => {
  const enrollments = await Enrollment.findAll({
    where: { course_id: courseId },
    include: [
      { model: User, as: "student", attributes: ["id", "full_name", "email"] },
      { model: StudentCourseProgress, as: "progress" },
    ],
  });

  return enrollments;
};

module.exports = {
  updateProgress,
  getStudentProgress,
  getInstructorCourseProgress,
  updateCourseProgress,
};
