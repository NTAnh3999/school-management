export type Role = "student" | "parent";

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
  status: "draft" | "archived";
  created_by?: number;
  updated_by?: number;
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
  status: "draft" | "archived";
  estimated_duration?: number;
  created_by?: number;
  updated_by?: number;
  quiz?: Quiz;
  learning_items?: LearningItem[];
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
export type ProgressStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "blocked"
  | "archived";

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
  course_version_id?: number | null;
  status: ProgressStatus;
  completion_percentage: number;
  completed_item_count: number;
  total_item_count: number;
  total_time_spent_minutes: number;
  progress_snapshot?: unknown;
  started_at?: string | null;
  completed_at?: string | null;
  last_computed_at?: string | null;
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

// -------------------------------------------------------
// Course Content Authoring types
// -------------------------------------------------------

export type LearningItemType =
  | "VIDEO"
  | "QUIZ"
  | "INFOGRAPHIC"
  | "DOCUMENT"
  | "TEXT";
export type LearningItemStatus = "draft" | "archived";

export interface LearningItem {
  id: number;
  lesson_id: number;
  item_type: LearningItemType;
  title: string;
  content_payload?: Record<string, unknown>;
  asset_id?: number;
  display_order: number;
  estimated_duration?: number;
  is_required: boolean;
  status: LearningItemStatus;
  created_by?: number;
  updated_by?: number;
  asset?: ContentAsset;
  createdAt: string;
  updatedAt: string;
}

export type ContentAssetMediaType = "video" | "image" | "document" | "audio";

export interface ContentAsset {
  id: number;
  filename: string;
  media_type: ContentAssetMediaType;
  mime_type: string;
  size_bytes?: number;
  duration_seconds?: number;
  storage_key: string;
  thumbnail_url?: string;
  uploaded_by: number;
  uploaded_at: string;
  createdAt: string;
  updatedAt: string;
}

export type ContentVersionStatus =
  | "DRAFT"
  | "REVIEW"
  | "PUBLISHED"
  | "ARCHIVED";

export interface ContentVersion {
  id: number;
  course_id: number;
  version_label: string;
  version_no: number;
  status: ContentVersionStatus;
  changelog?: string;
  snapshot_ref?: unknown;
  published_at?: string;
  published_by?: number;
  created_by?: number;
  course?: Course;
  createdAt: string;
  updatedAt: string;
}

export interface PublishedContentStructure {
  course_id: number;
  version_id: number;
  version_label: string;
  version_no: number;
  published_at: string;
  structure: CourseSection[];
}
