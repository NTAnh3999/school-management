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

export type CourseStatus = "draft" | "active" | "inactive" | "archived";

// Course fields mirror api/src/models/course.model.js exactly (snake_case,
// no title/price/level/instructor — those never existed on the backend).
export interface Course {
  id: number;
  course_code: string;
  course_name: string;
  short_name?: string;
  description?: string;
  course_type: string;
  credit?: number;
  duration_hours?: number;
  status: CourseStatus;
  department_id: number;
  department?: { id: number; department_code: string; department_name: string };
  effective_from?: string;
  effective_to?: string;
  modules?: CourseModule[];
  reviews?: CourseReview[];
  created_at: string;
  updated_at: string;
}

// Mirrors api/src/models/course-module.model.js. Replaces the old
// "CourseSection" mock concept — the backend calls this a Module.
export interface CourseModule {
  id: number;
  course_id: number;
  content_version_id: number;
  revision: number;
  title: string;
  description?: string;
  display_order: number;
  status: "draft" | "archived";
  created_by?: number;
  updated_by?: number;
  lessons?: Lesson[];
  created_at: string;
  updated_at: string;
}

// Mirrors api/src/models/lesson.model.js. No content/lesson_type/video_url/
// section_id/order_index fields exist on the backend — those were mock-only.
export interface Lesson {
  id: number;
  module_id: number;
  content_version_id: number;
  revision: number;
  title: string;
  objective?: string;
  lesson_summary?: string;
  duration_minutes?: number;
  display_order: number;
  status: "draft" | "archived";
  estimated_duration?: number;
  created_by?: number;
  updated_by?: number;
  quiz?: Quiz;
  learning_items?: LearningItem[];
  feedback?: LessonFeedback[];
  created_at: string;
  updated_at: string;
}

// Mirrors api/src/models/enrollment.model.js status enum exactly.
export type EnrollmentStatus =
  | "pending"
  | "active"
  | "suspended"
  | "cancelled"
  | "completed"
  | "rejected"
  | "waitlisted";

export interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  classroom_id?: number;
  status: EnrollmentStatus;
  enrolled_at?: string;
  activated_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  student?: User;
  course?: Course;
  progress?: StudentCourseProgress;
  lesson_progress?: LessonProgress[];
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface ProgressSnapshotLesson {
  lesson_id: number;
  lesson_title: string;
  module_id: number;
  module_title: string;
  learning_item_count: number;
  status: LessonProgressStatus;
  time_spent_minutes: number;
  completion_date?: string | null;
}

export interface ProgressSnapshot {
  status: ProgressStatus;
  completion_percentage: number;
  completed_item_count: number;
  total_item_count: number;
  total_time_spent_minutes: number;
  started_at?: string | null;
  completed_at?: string | null;
  last_updated_at?: string | null;
  lessons: ProgressSnapshotLesson[];
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
  progress_snapshot?: ProgressSnapshot | null;
  started_at?: string | null;
  completed_at?: string | null;
  last_computed_at?: string | null;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
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

// Mirrors api/src/models/learning-item.model.js item_type enum exactly.
export type LearningItemType =
  | "Text"
  | "Video"
  | "Document"
  | "Infographic"
  | "ExternalLink"
  | "KnowledgeCheck"
  | "AssessmentReference"
  | "Model3D"
  | "InteractivePackage";
export type LearningItemStatus = "draft" | "archived";
export type LearningItemSource = "uploaded" | "external";
export type LearningItemCompletionRule =
  | "dwell_time"
  | "watch_percentage"
  | "opened"
  | "clicked"
  | "submitted"
  | "delegated"
  | "interacted"
  | "xapi_statement";

// content_payload shape depends on item_type — see
// api/src/services/learning-item.service.js validation.
export interface TextContentPayload {
  body: string;
}
export interface ExternalLinkContentPayload {
  url: string;
}
export interface AssessmentReferenceContentPayload {
  assessment_id: number;
}
export interface KnowledgeCheckOption {
  text: string;
}
export interface KnowledgeCheckQuestion {
  text: string;
  options: KnowledgeCheckOption[];
  correct_index: number;
}
export interface KnowledgeCheckContentPayload {
  questions: KnowledgeCheckQuestion[];
}
export interface VideoContentPayload {
  url?: string; // only present when source === "external"
}

export interface LearningItem {
  id: number;
  lesson_id: number;
  content_version_id: number;
  revision: number;
  item_type: LearningItemType;
  title: string;
  content_payload?:
    | TextContentPayload
    | ExternalLinkContentPayload
    | AssessmentReferenceContentPayload
    | KnowledgeCheckContentPayload
    | VideoContentPayload
    | Record<string, unknown>;
  asset_id?: number | null;
  source?: LearningItemSource | null;
  completion_rule?: LearningItemCompletionRule;
  display_order: number;
  estimated_duration?: number;
  is_required: boolean;
  group_with_next?: boolean;
  status: LearningItemStatus;
  created_by?: number;
  updated_by?: number;
  asset?: ContentAsset;
  created_at: string;
  updated_at: string;
}

// Mirrors api/src/models/content-asset.model.js media_type enum exactly.
export type ContentAssetMediaType =
  | "video"
  | "image"
  | "document"
  | "audio"
  | "model3d"
  | "h5p";
export type ContentAssetProcessingStatus =
  | "pending"
  | "processing"
  | "ready"
  | "failed";

export interface ContentAsset {
  id: number;
  tenant_id?: number;
  filename: string;
  media_type: ContentAssetMediaType;
  mime_type: string;
  size_bytes?: number;
  duration_seconds?: number;
  // Relative path served by the API's static file middleware, e.g.
  // "/uploads/169...-abc.mp4" or "/uploads/h5p/{storedId}" (no trailing
  // slash for h5p). Resolve against API_ORIGIN, not API_BASE_URL.
  storage_key: string;
  thumbnail_url?: string;
  processing_status: ContentAssetProcessingStatus;
  checksum?: string;
  uploaded_by: number;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

// GET /content/courses/:courseId/published (CCA-API-17) — the single call
// that returns modules -> lessons -> learning_items in one response. Note:
// learning_items here do NOT include `asset` (see content-version.service.js
// _buildSnapshot) — fetch GET /learning-items/:id or GET /content-assets/:id
// lazily when a learning item with asset_id is opened.
export interface PublishedContentStructure {
  course_id: number;
  version_id: number;
  version_label: string;
  version_no: number;
  published_at: string;
  structure: CourseModule[];
}
