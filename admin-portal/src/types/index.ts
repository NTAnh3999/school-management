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
// Modules/lessons/content-version create+publish+archive are gated to ROLES.ADMIN in the
// backend (module.routes.js, and content-version.service.js re-checks admin internally even
// though its routes accept STAFF_ROLES) — this is School Admin territory, not Teacher's daily
// authoring, in the current implementation.

export type ModuleStatus = "draft" | "archived";

export interface CourseModule {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  display_order: number;
  status: ModuleStatus;
  lessons?: Lesson[];
  created_at: string;
  updated_at: string;
}

export type LessonType = "Standard" | "Microlearning" | "QuizOnly";
export type LessonStatus = "draft" | "archived";

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  lesson_summary: string | null;
  content: string | null;
  lesson_type: LessonType;
  video_url: string | null;
  duration_minutes: number;
  display_order: number;
  status: LessonStatus;
  created_at: string;
  updated_at: string;
}

// Snapshot enum includes "REVIEW", but no backend code path ever sets it — create() always
// starts a version at DRAFT and publish() moves DRAFT straight to PUBLISHED. There is no
// submit-for-review or approve/reject action, so "Content Approval Queue" in the UI reflects
// DRAFT-awaiting-publish rather than a distinct reviewer workflow.
export type ContentVersionStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";

export interface ContentVersion {
  id: number;
  course_id: number;
  version_label: string;
  version_no: number;
  status: ContentVersionStatus;
  changelog: string | null;
  snapshot_ref: CourseModule[] | null;
  published_at: string | null;
  published_by: number | null;
  created_by: number | null;
  course?: Pick<Course, "id" | "course_code" | "course_name">;
  created_at: string;
  updated_at: string;
}

export interface ContentAsset {
  id: number;
  filename: string;
  media_type: string;
  mime_type: string;
  size_bytes: number | null;
  duration_seconds: number | null;
  storage_key: string;
  thumbnail_url: string | null;
  uploaded_by: number;
  uploaded_at: string;
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
