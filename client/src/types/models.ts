export type Role = "admin" | "instructor" | "student";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published" | "archived";

export interface Course {
  id: number;
  title: string;
  description: string;
  level: CourseLevel;
  price: number;
  status: CourseStatus;
  instructor_id: number;
  instructor?: User;
  sections?: CourseSection[];
  reviews?: CourseReview[];
  enrollments?: Enrollment[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseSection {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order_index: number;
  lessons?: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export type LessonType = "video" | "text" | "quiz" | "assignment";

export interface Lesson {
  id: number;
  section_id: number;
  title: string;
  content?: string;
  lesson_type: LessonType;
  video_url?: string;
  duration_minutes: number;
  order_index: number;
  quiz?: Quiz;
  feedback?: LessonFeedback[];
  createdAt: string;
  updatedAt: string;
}

export type EnrollmentStatus = "active" | "completed" | "dropped";

export interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  status: EnrollmentStatus;
  enrolled_at: string;
  completed_at?: string;
  student?: User;
  course?: Course;
  progress?: StudentCourseProgress;
  lesson_progress?: LessonProgress[];
  createdAt: string;
  updatedAt: string;
}

export type LessonProgressStatus = "not_started" | "in_progress" | "completed";

export interface LessonProgress {
  id: number;
  enrollment_id: number;
  lesson_id: number;
  status: LessonProgressStatus;
  completion_date?: string;
  time_spent_minutes: number;
  lesson?: Lesson;
  createdAt: string;
  updatedAt: string;
}

export interface StudentCourseProgress {
  id: number;
  enrollment_id: number;
  completion_percentage: number;
  total_time_spent_minutes: number;
  createdAt: string;
  updatedAt: string;
}

export type QuestionType = "single_choice" | "multiple_choice" | "text";

export interface Quiz {
  id: number;
  lesson_id: number;
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes?: number;
  max_attempts: number;
  questions?: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: QuestionType;
  points: number;
  order_index: number;
  options?: QuizOption[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
  createdAt: string;
  updatedAt: string;
}

export type QuizAttemptStatus = "in_progress" | "submitted" | "graded";

export interface QuizAttempt {
  id: number;
  enrollment_id: number;
  quiz_id: number;
  score?: number;
  status: QuizAttemptStatus;
  started_at: string;
  submitted_at?: string;
  feedback?: string;
  attempt_number: number;
  quiz?: Quiz;
  answers?: QuizAttemptAnswer[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttemptAnswer {
  id: number;
  attempt_id: number;
  question_id: number;
  selected_option_id?: number;
  text_answer?: string;
  is_correct?: boolean;
  question?: QuizQuestion;
  selected_option?: QuizOption;
  createdAt: string;
  updatedAt: string;
}

export interface CourseReview {
  id: number;
  course_id: number;
  student_id: number;
  rating: number;
  review_text?: string;
  student?: User;
  createdAt: string;
  updatedAt: string;
}

export interface LessonFeedback {
  id: number;
  lesson_id: number;
  student_id: number;
  feedback_text: string;
  student?: User;
  createdAt: string;
  updatedAt: string;
}

export type RewardType = "certificate" | "badge" | "points";

export interface Reward {
  id: number;
  title: string;
  description?: string;
  reward_type: RewardType;
  points_value: number;
  icon_url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentReward {
  id: number;
  student_id: number;
  reward_id: number;
  enrollment_id?: number;
  earned_at: string;
  reward?: Reward;
  enrollment?: Enrollment;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "progress"
  | "assignment"
  | "reward"
  | "course"
  | "general";

export interface Notification {
  id: number;
  user_id: number;
  notification_type: NotificationType;
  title: string;
  message?: string;
  is_read: boolean;
  createdAt: string;
  updatedAt: string;
}
