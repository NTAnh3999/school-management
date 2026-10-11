import type {
  Assessment,
  AssessmentAttempt,
  AssessmentQuestionType,
  AssessmentType,
  Enrollment,
} from "@/types/models";

export type AssessmentState =
  | "upcoming"
  | "open"
  | "in_progress"
  | "submitted"
  | "graded"
  | "closed";

export const assessmentTypeLabel: Record<AssessmentType, string> = {
  quiz: "Bài kiểm tra",
  assignment: "Bài tập",
  exam: "Bài thi",
  survey: "Khảo sát",
  other: "Bài đánh giá",
};

export const questionTypeLabel: Record<AssessmentQuestionType, string> = {
  single_choice: "Trắc nghiệm",
  multiple_choice: "Chọn nhiều đáp án",
  text: "Trả lời ngắn",
  essay: "Tự luận",
  file_upload: "Nộp tệp",
};

export function assessmentCourseId(assessment: Assessment) {
  return (
    assessment.course_id ??
    assessment.course?.id ??
    assessment.lesson?.module?.course?.id ??
    undefined
  );
}

export function assessmentCourseName(assessment: Assessment) {
  return (
    assessment.course?.course_name ??
    assessment.lesson?.module?.course?.course_name ??
    ""
  );
}

// Attempts are tied to an enrollment; the API only accepts active/completed.
export function enrollmentFor(assessment: Assessment, enrollments: Enrollment[]) {
  const courseId = assessmentCourseId(assessment);
  return enrollments.find(
    (enrollment) =>
      enrollment.course_id === courseId &&
      (enrollment.status === "active" || enrollment.status === "completed"),
  );
}

export function latestAttempt(attempts: AssessmentAttempt[] = []) {
  return [...attempts].sort((a, b) => b.attempt_number - a.attempt_number)[0];
}

export function maxAttempts(assessment: Assessment) {
  return Number(assessment.max_attempts || 1);
}

export function attemptsUsed(attempts: AssessmentAttempt[] = []) {
  return attempts.filter((attempt) => attempt.status !== "not_started").length;
}

export function attemptsLeft(assessment: Assessment, attempts: AssessmentAttempt[] = []) {
  return Math.max(0, maxAttempts(assessment) - attemptsUsed(attempts));
}

function isLiveAttempt(attempt: AssessmentAttempt, now: Date) {
  return (
    attempt.status === "in_progress" &&
    (!attempt.expired_at || new Date(attempt.expired_at) > now)
  );
}

export function assessmentState(
  assessment: Assessment,
  attempts: AssessmentAttempt[] = [],
  now = new Date(),
): AssessmentState {
  const latest = latestAttempt(attempts);
  if (latest && isLiveAttempt(latest, now)) return "in_progress";
  if (latest?.status === "submitted") return "submitted";
  if (latest?.status === "graded" || latest?.status === "published") return "graded";
  if (assessment.open_at && new Date(assessment.open_at) > now) return "upcoming";
  if (
    assessment.status === "closed" ||
    (assessment.close_at && new Date(assessment.close_at) < now) ||
    attemptsLeft(assessment, attempts) === 0
  ) {
    return "closed";
  }
  return "open";
}

// Whether a new attempt may be started right now (retake included).
export function canStartAttempt(
  assessment: Assessment,
  attempts: AssessmentAttempt[] = [],
  now = new Date(),
) {
  if (assessment.status !== "published") return false;
  if (assessment.open_at && new Date(assessment.open_at) > now) return false;
  if (assessment.close_at && new Date(assessment.close_at) < now) return false;
  const latest = latestAttempt(attempts);
  if (latest && isLiveAttempt(latest, now)) return true;
  return attemptsLeft(assessment, attempts) > 0;
}

export function isPassed(percentage: number | null, assessment: Assessment) {
  if (percentage === null) return null;
  return percentage >= Number(assessment.passing_score ?? 0);
}

// The engine writes English default feedback when no teacher comment exists.
const DEFAULT_FEEDBACK: Record<string, string> = {
  "Assessment passed.": "Bài làm đạt yêu cầu.",
  "Assessment submitted.": "Bài làm đã được ghi nhận.",
  "Assessment submitted and awaiting grading.": "Bài làm đang chờ giáo viên chấm.",
};

export function feedbackText(feedback?: string | null) {
  if (!feedback) return "";
  return DEFAULT_FEEDBACK[feedback] ?? feedback;
}
