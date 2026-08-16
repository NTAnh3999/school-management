// Domain types mirror the API's wire format exactly: every JSON response is recursively
// snake_cased by the backend's `toSnakeCaseKeys` response wrapper (see api/src/utils/success-responses.js),
// regardless of the camelCase used internally by service/controller code. Request bodies are
// NOT auto-converted, and different modules expect different casing — each api slice documents
// the casing it sends inline.

// ─── Common ─────────────────────────────────────────────────────────────────

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// The /courses, /profiles, /enrollments list endpoints use `page_size`/`limit` inconsistently
// and return the collection under a module-specific key rather than `items` — each api slice
// maps its own raw response into this shape via `transformResponse`.

// ─── IAM: Tenant / Org structure ────────────────────────────────────────────

export interface Tenant {
  id: number;
  tenant_code: string;
  tenant_name: string;
  status: "active" | "inactive";
}

export type OrgStatus = "active" | "inactive";

export interface Branch {
  id: number;
  tenant_id: number;
  branch_code: string;
  branch_name: string;
  status: OrgStatus;
}

export interface Campus {
  id: number;
  tenant_id: number;
  branch_id: number;
  campus_code: string;
  campus_name: string;
  status: OrgStatus;
}

export type LocationType = "room" | "building" | "hall" | "lab" | "other";

export interface OrgLocation {
  id: number;
  tenant_id: number;
  branch_id: number;
  campus_id: number;
  parent_location_id: number | null;
  location_code: string;
  location_name: string;
  location_type: LocationType;
  capacity: number | null;
  status: OrgStatus;
}

// ─── IAM: Users, roles, permissions, memberships ────────────────────────────

export type ScopeType = "tenant" | "branch" | "campus" | "location";
export type MembershipStatus = "active" | "inactive" | "revoked" | "expired";
export type AccountStatus =
  | "active"
  | "inactive"
  | "locked"
  | "suspended"
  | "deactivated";

export interface Permission {
  id: number;
  code: string;
  description: string;
  module: string;
  resource: string;
  action: string;
  is_system: boolean;
}

export interface Role {
  id: number;
  name: string;
  permissions?: Permission[];
}

export interface Membership {
  id: number;
  user_id: number;
  tenant_id: number;
  scope_type: ScopeType;
  branch_id: number | null;
  campus_id: number | null;
  location_id: number | null;
  status: MembershipStatus;
  expires_at: string | null;
  tenant: Tenant | null;
}

export interface IamUser {
  id: number;
  email: string;
  full_name: string;
  role: string | null;
  status: AccountStatus;
  username: string | null;
  phone: string | null;
  active_tenant_id: number | null;
  roles: Role[];
  permissions: Permission[];
  memberships: Membership[];
  created_at: string;
  updated_at: string;
}

export interface IamAuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: string | number | null;
  status: string;
  details: Record<string, unknown> | null;
  actor: { id: number; email: string; full_name: string } | null;
  tenant: Tenant | null;
  created_at: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthSession {
  id: number;
  user_id: number;
  active_tenant_id: number | null;
  status: string;
  expires_at: string;
  last_used_at: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  session: AuthSession;
  tenant_context_required: boolean;
  active_tenant: Tenant | null;
  tenants: Membership[];
  user: IamUser;
}

export interface AuthState {
  user: IamUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: number | null;
  activeTenant: Tenant | null;
  tenants: Membership[];
  tenantContextRequired: boolean;
  isAuthenticated: boolean;
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export type ProfileType = "student" | "parent" | "teacher" | "staff" | "admin";
export type ProfileStatus = "draft" | "active" | "inactive" | "archived";
export type ProfileVisibility = "internal" | "public" | "private";

export interface Profile {
  id: number;
  tenant_id: number;
  user_id: number;
  profile_type: ProfileType;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  contact_email: string | null;
  phone_number: string | null;
  address: string | null;
  status: ProfileStatus;
  visibility: ProfileVisibility;
  created_at: string;
  updated_at: string;
}

export type RelationshipType = "father" | "mother" | "guardian" | "other";
export type RelationshipStatus = "pending" | "active" | "suspended" | "revoked";

export interface ParentStudentRelationship {
  id: number;
  parent_profile_id: number;
  student_profile_id: number;
  relationship_type: RelationshipType;
  relationship_status: RelationshipStatus;
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export type CourseStatus = "draft" | "active" | "inactive" | "archived";

export interface Department {
  id: number;
  tenant_id: number;
  department_code: string;
  department_name: string;
  /** Present on list/detail responses; how many courses currently reference this department. */
  course_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CoursePrerequisite {
  id: number;
  course_id: number;
  prerequisite_course_id: number;
  prerequisite_type: "ALL" | "ANY";
  prerequisite_course?: Pick<
    Course,
    "id" | "course_code" | "course_name" | "status"
  >;
}

export interface Course {
  id: number;
  course_code: string;
  department_id: number;
  course_name: string;
  short_name: string | null;
  description: string | null;
  course_type: string;
  credit: number | null;
  duration_hours: number | null;
  status: CourseStatus;
  effective_from: string | null;
  effective_to: string | null;
  department?: Department;
  prerequisites?: CoursePrerequisite[];
  created_at: string;
  updated_at: string;
}

// ─── Course Content (modules, lessons, content versions, assets) ────────────
// Content authoring follows the FSD "Course Content Authoring" 6-state version lifecycle
// (see api/src/constants/content.js's CONTENT_VERSION_TRANSITIONS for the source of truth).
// Module/Lesson/LearningItem are version-scoped: each ContentVersion has its own tree, cloned
// from the currently Published version when a new Draft is created, so editing a Draft never
// touches what's live. Editing is gated to the course's assigned Content Author(s)
// (course-author.routes.js) or an Admin/Academic-Admin holding content.version.manage.any.

export type ModuleStatus = "draft" | "archived";

export interface CourseModule {
  id: number;
  course_id: number;
  content_version_id: number;
  revision: number;
  title: string;
  description: string | null;
  display_order: number;
  status: ModuleStatus;
  lessons?: Lesson[];
  created_at: string;
  updated_at: string;
}

export type LessonStatus = "draft" | "archived";

// FSD 7.2 core fields: title, objective, estimated_duration, order_no, status. Video/interactive
// content lives on LearningItem now (item_type=Video etc.), not directly on Lesson.
export interface Lesson {
  id: number;
  module_id: number;
  content_version_id: number;
  revision: number;
  title: string;
  objective: string | null;
  lesson_summary: string | null;
  duration_minutes: number;
  display_order: number;
  status: LessonStatus;
  learning_items?: LearningItem[];
  created_at: string;
  updated_at: string;
}

// FSD 5.3 CCA-05 / 5.4: Text, Video, Document, Infographic, ExternalLink, KnowledgeCheck,
// AssessmentReference, Model3D, InteractivePackage.
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

// FSD 5.4: one fixed completion_rule per item_type (see backend's COMPLETION_RULE_BY_ITEM_TYPE).
export type LearningItemCompletionRule =
  | "dwell_time"
  | "watch_percentage"
  | "opened"
  | "clicked"
  | "submitted"
  | "delegated"
  | "interacted"
  | "xapi_statement";

// Only meaningful when item_type = "Video": uploaded -> asset_id/ContentAsset; external ->
// content_payload.url (+ optional provider).
export type LearningItemVideoSource = "uploaded" | "external";

export interface LearningItem {
  id: number;
  lesson_id: number;
  content_version_id: number;
  revision: number;
  item_type: LearningItemType;
  title: string;
  // Shape of content_payload varies per item_type per FSD 5.4:
  // Text -> { body: string }; ExternalLink -> { url, open_in_new_tab? };
  // Video (external) -> { url, provider? }; AssessmentReference -> { assessment_id: number };
  // KnowledgeCheck -> { questions[], pass_threshold?, shuffle?, allow_retry? };
  // Document/Infographic/Model3D/InteractivePackage/Video(uploaded) -> reference via asset_id
  // instead, content_payload unused.
  content_payload: Record<string, unknown> | null;
  asset_id: number | null;
  asset?: ContentAsset;
  source: LearningItemVideoSource | null;
  completion_rule: LearningItemCompletionRule | null;
  display_order: number;
  estimated_duration: number | null;
  is_required: boolean;
  status: LearningItemStatus;
  created_at: string;
  updated_at: string;
}

// FSD 6.1: Draft -> InReview -> ChangesRequested (loops back to InReview) -> Approved -> Published
// -> Archived, with Draft -> Published direct only when the course's approval policy is off.
export type ContentVersionStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "PUBLISHED"
  | "ARCHIVED";

export interface ContentVersion {
  id: number;
  course_id: number;
  content_root_id: number | null;
  based_on_version_id: number | null;
  version_label: string;
  version_no: number;
  status: ContentVersionStatus;
  revision: number;
  changelog: string | null;
  snapshot_ref: CourseModule[] | null;
  submitted_for_review_by: number | null;
  submitted_for_review_at: string | null;
  approved_by: number | null;
  approved_at: string | null;
  published_at: string | null;
  published_by: number | null;
  created_by: number | null;
  course?: Pick<Course, "id" | "course_code" | "course_name">;
  created_at: string;
  updated_at: string;
}

export type ContentReviewDecision = "APPROVED" | "CHANGES_REQUESTED";

export interface ContentReview {
  id: number;
  content_version_id: number;
  decided_by: number;
  decision: ContentReviewDecision;
  comment: string | null;
  decided_at: string;
}

export type ContentAssetProcessingStatus = "pending" | "processing" | "ready" | "failed";

export interface ContentAsset {
  id: number;
  tenant_id: number | null;
  filename: string;
  media_type: string;
  mime_type: string;
  size_bytes: number | null;
  duration_seconds: number | null;
  storage_key: string;
  thumbnail_url: string | null;
  processing_status: ContentAssetProcessingStatus;
  checksum: string | null;
  uploaded_by: number;
  uploaded_at: string;
}

export type CourseAuthorRole = "primary_author" | "co_author";

export interface CourseAuthorAssignment {
  id: number;
  course_id: number;
  user_id: number;
  role_in_course: CourseAuthorRole;
  assigned_at: string;
  assigned_by: number | null;
  active_flag: boolean;
  user?: { id: number; full_name: string; email: string };
}

// ─── Classrooms ──────────────────────────────────────────────────────────────

export type ClassroomStatus =
  | "draft"
  | "open"
  | "full"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "archived";
export type DeliveryMethod = "online" | "offline" | "hybrid";
export type EnrollmentMode = "manual" | "self_enrollment" | "invitation_only";
export type ClassroomVisibility = "public" | "private" | "internal";
export type ClassroomEnrollmentStatus =
  | "pending_approval"
  | "enrolled"
  | "waitlisted"
  | "withdrawn"
  | "transferred"
  | "rejected"
  | "completed"
  | "failed";

export interface ClassroomTeacherAssignment {
  id: number;
  classroom_id: number;
  user_id: number;
  role_in_classroom: "main_teacher" | "co_teacher" | "teaching_assistant";
  active_flag: boolean;
  user?: { id: number; full_name: string; email: string };
}

export interface Classroom {
  id: number;
  classroom_code: string;
  classroom_name: string;
  description: string | null;
  course_id: number;
  course_version_id: number | null;
  status: ClassroomStatus;
  delivery_method: DeliveryMethod;
  campus_id: number | null;
  location: string | null;
  online_meeting_link: string | null;
  academic_year: string | null;
  term: string | null;
  language: string | null;
  start_date: string;
  end_date: string;
  enrollment_mode: EnrollmentMode;
  enrollment_start_date: string | null;
  enrollment_end_date: string | null;
  min_capacity: number | null;
  max_capacity: number;
  enrolled_count: number;
  waitlist_enabled: boolean;
  approval_required: boolean;
  visibility: ClassroomVisibility;
  cancelled_reason: string | null;
  course?: Pick<Course, "id" | "course_code" | "course_name">;
  teachers?: ClassroomTeacherAssignment[];
  created_at: string;
  updated_at: string;
}

export interface ClassroomSession {
  id: number;
  classroom_id: number;
  session_date: string;
  start_time: string;
  end_time: string;
  session_title: string | null;
  teacher_id: number | null;
  location: string | null;
  online_meeting_link: string | null;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  notes: string | null;
}

export interface ClassroomStudentEnrollment {
  id: number;
  classroom_id: number;
  student_id: number;
  enrollment_status: ClassroomEnrollmentStatus;
  enrollment_date: string;
  source: "manual" | "self_enrollment" | "import" | "api";
  completion_status:
    | "not_started"
    | "in_progress"
    | "completed"
    | "not_completed";
  attendance_rate: number | null;
  notes: string | null;
  student?: { id: number; full_name: string; email: string };
}

// ─── Enrollments (course-level) ─────────────────────────────────────────────

export type EnrollmentStatus =
  | "pending"
  | "active"
  | "suspended"
  | "cancelled"
  | "completed"
  | "rejected"
  | "waitlisted";
export type RequestSource =
  | "student"
  | "parent"
  | "admin"
  | "system"
  | "import";
export type EnrollmentLevel = "course" | "classroom";

export interface Enrollment {
  id: number;
  tenant_id: number | null;
  learner_profile_id: number | null;
  student_id: number;
  course_id: number;
  classroom_id: number | null;
  enrollment_level: EnrollmentLevel;
  status: EnrollmentStatus;
  request_source: RequestSource;
  idempotency_key: string | null;
  payment_reference: string | null;
  requested_at: string;
  activated_at: string | null;
  suspended_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  current_reason_code: string | null;
  current_reason_message: string | null;
  version: number;
  enrolled_at: string | null;
  learner_profile?: { id: number; full_name: string; profile_type: string };
  student?: { id: number; full_name: string; email: string };
  course?: Pick<Course, "id" | "course_code" | "course_name" | "status">;
  classroom?: Pick<
    Classroom,
    "id" | "classroom_code" | "classroom_name" | "status"
  >;
}

export interface EnrollmentHistoryEntry {
  id: number;
  enrollment_id: number;
  from_status: EnrollmentStatus | null;
  to_status: EnrollmentStatus;
  reason_code: string | null;
  reason_message: string | null;
  changed_by: number | null;
  created_at: string;
}

// ─── Assessments (Quiz) ──────────────────────────────────────────────────────

export type AssessmentType =
  | "quiz"
  | "assignment"
  | "exam"
  | "survey"
  | "other";
export type AssessmentStatus = "draft" | "published" | "closed" | "archived";
export type GradingMethod = "auto" | "manual" | "hybrid";

export interface Assessment {
  id: number;
  lesson_id: number;
  title: string;
  description: string | null;
  assessment_type: AssessmentType;
  course_id: number | null;
  classroom_id: number | null;
  status: AssessmentStatus;
  open_at: string | null;
  close_at: string | null;
  passing_score: number;
  time_limit_minutes: number | null;
  max_attempts: number;
  max_score: number | null;
  grading_method: GradingMethod;
  publish_policy: "manual" | "auto_after_graded" | "scheduled";
  result_publish_at: string | null;
  published_at: string | null;
  closed_at: string | null;
  archived_at: string | null;
}

export type AttemptStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "graded"
  | "published"
  | "expired";

export interface AssessmentAttempt {
  id: number;
  enrollment_id: number;
  quiz_id: number;
  score: number | null;
  status: AttemptStatus;
  started_at: string;
  submitted_at: string | null;
  published_at: string | null;
  feedback: string | null;
  attempt_number: number;
}

export interface AssessmentResult {
  student_id?: number;
  attempt_id: number;
  score: number | null;
  max_score: number | null;
  grading_status: "draft" | "graded";
  status: AttemptStatus;
}

// ─── Progress ────────────────────────────────────────────────────────────────

export type ProgressStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "blocked"
  | "archived";

export interface StudentCourseProgress {
  id: number;
  enrollment_id: number;
  course_version_id: number | null;
  status: ProgressStatus;
  completion_percentage: number;
  completed_item_count: number;
  total_item_count: number;
  total_time_spent_minutes: number;
  started_at: string | null;
  completed_at: string | null;
  last_computed_at: string | null;
}

export interface TeacherCourseProgressRow {
  enrollment_id: number;
  student_id?: number;
  student?: { id: number; full_name: string; email: string };
  progress?: StudentCourseProgress | null;
}

export interface ProgressEventLog {
  id: number;
  enrollment_id: number;
  learner_id: number;
  course_id: number;
  source_module: string;
  source_event_name: string;
  process_status: "received" | "success" | "failed" | "ignored";
  error_code: string | null;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType =
  | "progress"
  | "assignment"
  | "reward"
  | "course"
  | "general";

export interface AppNotification {
  id: number;
  user_id: number;
  notification_type: NotificationType;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}
