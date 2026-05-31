# School Management API - Comprehensive Documentation

A complete Learning Management System (LMS) API built with Node.js, Express, and MySQL/Sequelize.

## 🌟 Features

- 🔐 **User Authentication & Authorization** (Admin, Teacher, Student roles)
- 📚 **Course Management** (Create, publish, manage lifecycle with status state machine)
- 🏫 **Department Management** (Courses grouped by departments)
- 🔗 **Prerequisite Management** (Define course prerequisites with cycle detection)
- 📋 **Audit Logging** (Full history of Create/Update/Delete/ChangeStatus actions)
- 📖 **Content Management** (Sections, Lessons with videos/text/quizzes)
- �️ **Course Content Authoring** (Learning Items, Content Assets, versioned publishing workflow)
- �📊 **Progress Tracking** (Student progress, completion rates, time tracking)
- ✅ **Assessment System** (Draft/publish/close/archive lifecycle, attempts, submissions, grading, result publication, exports)
- 🏆 **Rewards & Achievements** (Certificates, badges, points)
- ⭐ **Reviews & Feedback** (Course ratings, lesson feedback)
- 🔔 **Notifications** (Progress updates, assignments, rewards)

## 📋 Database Schema Overview

### Core Tables

- **users** - User accounts with roles
- **roles** - Admin, Teacher, Student
- **departments** - Academic departments that own courses
- **courses** - Course catalog with `course_code`, `department_id`, `course_type`, `credit`, `duration_hours`, status lifecycle (draft → active → inactive → archived), soft delete
- **course_prerequisites** - Many-to-many prerequisite relationships between courses
- **audit_logs** - Full change history for course operations (enhanced with `course_id`, `source`, `version_ref`)
- **course_sections** - Course modules/sections (with `status`, `created_by`, `updated_by`)
- **lessons** - Individual lessons (video, text, quiz, assignment) (with `status`, `estimated_duration`, `created_by`, `updated_by`)
- **enrollments** - Student course enrollments
- **lesson_progress** - Student progress per lesson
- **student_course_progress** - Overall course completion tracking

### Course Content Authoring Tables

- **content_assets** - Uploaded file metadata (video, image, document, audio) with storage references
- **learning_items** - Granular content within a lesson: VIDEO, QUIZ, INFOGRAPHIC, DOCUMENT, TEXT; supports `content_payload` JSON
- **content_versions** - Versioned snapshots of published course content (DRAFT → REVIEW → PUBLISHED → ARCHIVED)

### Assessment Tables

- **quizzes** - Assessment definitions with lifecycle, scope, grading, and publication settings
- **quiz_questions** - Assessment questions with objective and manual-review question types
- **quiz_options** - Answer options for objective questions
- **quiz_attempts** - Learner attempts with lifecycle status, expiry, and published result state
- **quiz_attempt_answers** - Per-question answer payloads and awarded points
- **assessment_submissions** - One submission record per attempt
- **assessment_grades** - Finalized or draft grading records
- **assessment_result_publications** - Grade publication state and timestamps
- **assessment_audit_logs** - Assessment-specific audit trail for lifecycle, attempts, grading, exports, and access events

### Engagement Tables

- **rewards** - Available rewards (certificates, badges, points)
- **student_rewards** - Earned rewards by students
- **course_reviews** - Course ratings and reviews
- **lesson_feedback** - Lesson-specific feedback
- **notifications** - User notifications

## 🚀 API Endpoints

### Authentication

#### Register

```http
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "roleName": "student" // or "teacher", "admin", "parent"
}
```

Creates the user, provisions an IAM account, assigns the default tenant membership, and returns:

```json
{
  "access_token": "jwt_access_token",
  "refresh_token": "opaque_refresh_token",
  "session": {
    "id": "uuid",
    "active_tenant_id": 1,
    "status": "active"
  },
  "tenant_context_required": false,
  "active_tenant": {
    "id": 1,
    "tenant_code": "DEFAULT",
    "tenant_name": "Default School"
  },
  "tenants": [...],
  "user": {...}
}
```

#### Login

```http
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123",
  "tenantId": 1 // optional
}
```

Business rules:

- Credentials must be valid.
- IAM account status must be `active`.
- User must have at least one active tenant membership.
- If the user has one valid tenant, it is selected automatically.
- If the user has multiple tenants and `tenantId` is omitted, login still succeeds but returns `tenant_context_required: true` and `active_tenant: null`.

#### Refresh Session

```http
POST /api/v1/auth/refresh
{
  "refreshToken": "opaque_refresh_token"
}
```

Returns a rotated refresh token, a new access token, and the current tenant/session context.

#### Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
{
  "refreshToken": "opaque_refresh_token" // optional when bearer token is present
}
```

Revokes the current IAM session.

#### List Tenant Memberships

```http
GET /api/v1/auth/tenants
Authorization: Bearer {token}
```

Returns the caller's active tenant memberships and the current `active_tenant_id`.

#### Switch Tenant Context

```http
POST /api/v1/auth/switch-tenant
Authorization: Bearer {token}
{
  "selectedTenantId": 2
}
```

Validates the selected tenant membership, updates the active session context, and returns fresh auth payload metadata.

### IAM

#### Users

```http
GET /api/v1/iam/users
POST /api/v1/iam/users
PATCH /api/v1/iam/users/:id
Authorization: Bearer {token}
```

Manages IAM user accounts, including base identity fields, IAM account status, and optional tenant bootstrap assignment.

#### Memberships

```http
POST /api/v1/iam/memberships
PATCH /api/v1/iam/memberships/:id
DELETE /api/v1/iam/memberships/:id
Authorization: Bearer {token}
```

Assigns, updates, or revokes tenant and scope memberships. Revoking a membership also revokes active sessions in that tenant.

#### Roles and Permissions

```http
GET /api/v1/iam/roles
POST /api/v1/iam/roles
PATCH /api/v1/iam/roles/:id
GET /api/v1/iam/permissions
POST /api/v1/iam/role-permissions
DELETE /api/v1/iam/role-permissions
Authorization: Bearer {token}
```

Role-permission mapping uses permission codes in `module.resource.action` format such as `iam.user.manage`.

#### Authorize

```http
POST /api/v1/iam/authorize
Authorization: Bearer {token}
{
  "requiredPermission": "iam.user.view",
  "requestedScopeType": "branch",
  "requestedScopeRefId": "branch-a"
}
```

Returns an allow/deny decision with IAM decision code such as:

- `ALLOW`
- `IAM_TENANT_CONTEXT_REQUIRED`
- `IAM_TENANT_ACCESS_DENIED`
- `IAM_SCOPE_ACCESS_DENIED`
- `IAM_PERMISSION_DENIED`

#### Session Revoke

```http
POST /api/v1/iam/sessions/revoke
Authorization: Bearer {token}
{
  "sessionId": "uuid"
}
```

#### IAM Audit Logs

```http
GET /api/v1/iam/audit-logs?tenantId=1&actorUserId=5
Authorization: Bearer {token}
```

Returns audit records for login, logout, tenant switching, membership changes, role updates, permission mapping changes, and session revocation.

### Courses

#### List Courses (Public)

```http
GET /api/v1/courses?level=beginner&status=active&teacherId=1
```

#### Get Course Details (Public)

```http
GET /api/v1/courses/:id
```

### Courses

#### List Courses (Public / Optional Auth)

```http
GET /api/v1/courses?keyword=python&status=active&level=beginner&departmentId=1&courseType=core&page=1&page_size=20
```

> Admin sees all statuses. Non-authenticated users and regular users only see `active` courses.

**Response**

```json
{
  "total": 50,
  "page": 1,
  "page_size": 20,
  "courses": [...]
}
```

#### Get Course Details (Public / Optional Auth)

```http
GET /api/v1/courses/:id
```

> Non-admin users receive 404 for courses that are not `active`.

#### Create Course (Admin only) — COURSE-01

```http
POST /api/v1/courses
Authorization: Bearer {token}
{
  "course_code": "CS101",
  "title": "Introduction to Programming",
  "department_id": 1,
  "description": "Learn programming fundamentals",
  "course_type": "core",
  "credit": 3,
  "duration_hours": 45,
  "level": "beginner",
  "price": 0,
  "status": "draft",
  "effective_from": "2026-01-01",
  "effective_to": "2026-12-31"
}
```

**Business rules:**

- `course_code` must be unique across the system
- `status` defaults to `draft`
- `credit` and `duration_hours` must be > 0 if provided
- `effective_to` must be ≥ `effective_from`

#### Update Course (Admin only) — COURSE-02

```http
PUT /api/v1/courses/:id
Authorization: Bearer {token}
{
  "title": "Updated title",
  "credit": 4,
  "duration_hours": 60
}
```

**Business rules:**

- `course_code`, `department_id`, and `course_type` are locked once enrollments exist
- Cannot change `status` via this endpoint — use the dedicated status endpoint

#### Change Course Status (Admin only) — COURSE-03

```http
PATCH /api/v1/courses/:id/status
Authorization: Bearer {token}
{
  "status": "active"
}
```

**Valid status transitions:**

| From     | To                         |
| -------- | -------------------------- |
| draft    | active, inactive           |
| active   | inactive, archived         |
| inactive | active, archived           |
| archived | _(no transitions allowed)_ |

**Business rules:**

- Cannot transition to `inactive` or `archived` while active enrollments exist

#### Manage Prerequisites (Admin only) — COURSE-04

```http
PUT /api/v1/courses/:id/prerequisites
Authorization: Bearer {token}
{
  "prerequisites": [
    { "prerequisite_course_id": 2, "prerequisite_type": "ALL" },
    { "prerequisite_course_id": 3, "prerequisite_type": "ALL" }
  ]
}
```

**Business rules:**

- A course cannot be a prerequisite of itself
- Circular dependencies are detected and rejected
- Duplicate entries within the same request are rejected
- This operation **replaces** all existing prerequisites

#### Delete Course (Admin only) — COURSE-07

```http
DELETE /api/v1/courses/:id
Authorization: Bearer {token}
```

**Business rules:**

- Course is **soft-deleted** (`is_deleted = true`), not physically removed
- Cannot delete if enrollment data exists — change status to `inactive` or `archived` instead

#### Enroll in Course (Student)

```http
POST /api/v1/courses/:id/enroll
Authorization: Bearer {token}
```

> Course must be `active` to allow enrollment.

#### Get My Enrollments (Student)

```http
GET /api/v1/courses/my/enrollments
Authorization: Bearer {token}
```

### Course Sections

#### Create Section (Teacher/Admin)

```http
POST /api/v1/sections/course/:courseId
Authorization: Bearer {token}
{
  "title": "Getting Started",
  "description": "Introduction to the course",
  "orderIndex": 0
}
```

#### List Sections (Public)

```http
GET /api/v1/sections/course/:courseId
```

#### Update Section (Owner/Admin)

```http
PUT /api/v1/sections/:id
Authorization: Bearer {token}
```

#### Archive Section (Owner/Admin) — CCA-API-03-ARC

```http
PATCH /api/v1/sections/:id/archive
Authorization: Bearer {token}
```

Soft-archives a section (sets `status = 'archived'`). Does not delete.

#### Reorder Sections (Owner/Admin) — CCA-API-09

```http
PATCH /api/v1/sections/course/:courseId/reorder
Authorization: Bearer {token}
{
  "orderedIds": [3, 1, 2]
}
```

Updates `order_index` for all sections of a course to match the provided array order.

#### Delete Section (Owner/Admin)

```http
DELETE /api/v1/sections/:id
Authorization: Bearer {token}
```

### Lessons

#### Create Lesson (Teacher/Admin)

```http
POST /api/v1/lessons/section/:sectionId
Authorization: Bearer {token}
{
  "title": "Variables and Data Types",
  "content": "Lesson content...",
  "lessonType": "video",
  "videoUrl": "https://example.com/video.mp4",
  "durationMinutes": 15,
  "orderIndex": 0
}
```

#### List Lessons (Public)

```http
GET /api/v1/lessons/section/:sectionId
```

#### Get Lesson Details (Authenticated)

```http
GET /api/v1/lessons/:id
Authorization: Bearer {token}
```

#### Update Lesson (Owner/Admin)

```http
PUT /api/v1/lessons/:id
Authorization: Bearer {token}
```

#### Archive Lesson (Owner/Admin) — CCA-API-05-ARC

```http
PATCH /api/v1/lessons/:id/archive
Authorization: Bearer {token}
```

Soft-archives a lesson (sets `status = 'archived'`). Does not delete.

### Learning Items (Course Content Authoring)

Learning items are granular content units within a lesson. Each lesson can contain multiple items of different types.

**Types:** `VIDEO`, `QUIZ`, `INFOGRAPHIC`, `DOCUMENT`, `TEXT`

#### List Learning Items — CCA-API-06-LIST

```http
GET /api/v1/learning-items/lesson/:lessonId
Authorization: Bearer {token}
```

Access: Teacher/Admin only.

#### Get Learning Item Detail

```http
GET /api/v1/learning-items/:id
Authorization: Bearer {token}
```

#### Create Learning Item — CCA-API-06

```http
POST /api/v1/learning-items/lesson/:lessonId
Authorization: Bearer {token}
{
  "itemType": "VIDEO",
  "title": "Intro Video",
  "contentPayload": { "url": "https://cdn.example.com/v1.mp4" },
  "assetId": 3,
  "displayOrder": 0,
  "estimatedDuration": 8.5,
  "isRequired": true
}
```

| Field             | Type    | Required | Description                                        |
| ----------------- | ------- | -------- | -------------------------------------------------- |
| itemType          | string  | Yes      | `VIDEO`, `QUIZ`, `INFOGRAPHIC`, `DOCUMENT`, `TEXT` |
| title             | string  | Yes      | Item title                                         |
| contentPayload    | object  | No       | Type-specific JSON payload                         |
| assetId           | integer | No       | FK to `content_assets`                             |
| displayOrder      | integer | No       | Display order (default 0)                          |
| estimatedDuration | decimal | No       | Duration in minutes                                |
| isRequired        | boolean | No       | Whether item is required (default true)            |

**Success Response (201):** returns created learning item.

#### Update Learning Item — CCA-API-07

```http
PATCH /api/v1/learning-items/:id
Authorization: Bearer {token}
{
  "title": "Updated Title",
  "contentPayload": { "url": "https://cdn.example.com/v2.mp4" }
}
```

All fields optional. Same field list as create.

#### Archive Learning Item

```http
PATCH /api/v1/learning-items/:id/archive
Authorization: Bearer {token}
```

#### Reorder Learning Items — CCA-API-09

```http
PATCH /api/v1/learning-items/lesson/:lessonId/reorder
Authorization: Bearer {token}
{
  "orderedIds": [5, 3, 4]
}
```

Updates `display_order` for all items in the lesson to match the provided array order.

### Content Assets

File/media metadata registry. Assets are registered here after upload to cloud storage.

#### List Content Assets — CCA-API-08-LIST

```http
GET /api/v1/content-assets?mediaType=video&uploadedBy=2
Authorization: Bearer {token}
```

Query parameters: `mediaType` (video/image/document/audio), `uploadedBy` (user ID).

Access: Teacher/Admin only.

#### Get Content Asset Detail

```http
GET /api/v1/content-assets/:id
Authorization: Bearer {token}
```

#### Register Content Asset — CCA-API-08

```http
POST /api/v1/content-assets
Authorization: Bearer {token}
{
  "filename": "lecture-01.mp4",
  "mediaType": "video",
  "mimeType": "video/mp4",
  "sizeBytes": 104857600,
  "durationSeconds": 510,
  "storageKey": "courses/cs101/lecture-01.mp4",
  "thumbnailUrl": "https://cdn.example.com/thumb/lecture-01.jpg"
}
```

| Field           | Type    | Required | Description                           |
| --------------- | ------- | -------- | ------------------------------------- |
| filename        | string  | Yes      | Original filename                     |
| mediaType       | string  | Yes      | `video`, `image`, `document`, `audio` |
| mimeType        | string  | Yes      | MIME type (e.g. `video/mp4`)          |
| sizeBytes       | integer | No       | File size in bytes                    |
| durationSeconds | integer | No       | Duration (for audio/video)            |
| storageKey      | string  | Yes      | Storage path/key in cloud storage     |
| thumbnailUrl    | string  | No       | Thumbnail URL                         |

#### Update Content Asset Metadata

```http
PATCH /api/v1/content-assets/:id
Authorization: Bearer {token}
{
  "thumbnailUrl": "https://cdn.example.com/thumb/updated.jpg"
}
```

### Content Versions

Versioned snapshots of a course's content, supporting a Draft → Review → Published → Archived workflow.

#### List Versions — CCA-API-12-LIST

```http
GET /api/v1/content/courses/:courseId/versions
Authorization: Bearer {token}
```

Access: Teacher/Admin only.

#### Create Version — CCA-API-10

```http
POST /api/v1/content/courses/:courseId/versions
Authorization: Bearer {token}
{
  "versionLabel": "v1.0 - Initial Release",
  "changelog": "First stable version of the course content."
}
```

Creates a new DRAFT version with a snapshot of the current course structure.

#### Get Version Detail — CCA-API-12

```http
GET /api/v1/content/versions/:id
Authorization: Bearer {token}
```

#### Publish Version — CCA-API-11

```http
POST /api/v1/content/versions/:id/publish
Authorization: Bearer {token}
```

Sets this version to PUBLISHED. Any previously PUBLISHED version is automatically archived. Rebuilds the snapshot from current draft structure.

**Business rules:**

- Course must have at least 1 module with at least 1 lesson
- Only one PUBLISHED version allowed at a time

#### Archive Version (Admin only)

```http
PATCH /api/v1/content/versions/:id/archive
Authorization: Bearer {token}
```

#### Get Published Structure — CCA-API-13

```http
GET /api/v1/content/courses/:courseId/published
Authorization: Bearer {token}
```

Returns the `snapshot_ref` JSON of the currently published version. Used by Assessment, Progress, and Portal modules.

**Access:** Any authenticated user.

#### Preview Draft

```http
GET /api/v1/content/courses/:courseId/preview
Authorization: Bearer {token}
```

Returns a real-time draft structure (sections → lessons → learning items with `status = 'draft'`). Does not create a version or affect progress records.

**Access:** Teacher/Admin only.

### Progress Tracking

#### Update Lesson Progress (Student)

```http
POST /api/v1/progress/update
Authorization: Bearer {token}
{
  "enrollmentId": 1,
  "lessonId": 5,
  "status": "completed",
  "timeSpent": 15
}
```

#### Get Student Progress (Authenticated)

```http
GET /api/v1/progress/enrollment/:enrollmentId
Authorization: Bearer {token}
```

#### Get Course Progress (Teacher)

```http
GET /api/v1/progress/course/:courseId
Authorization: Bearer {token}
```

### Assessments

The assessment service is the canonical flow for quiz, assignment, exam, survey, and other learner evaluations. Legacy `/api/v1/quizzes/*` endpoints remain as compatibility wrappers for quiz-only use cases, but new integrations should use `/api/v1/assessments/*`.

#### Create Assessment (Teacher/Admin)

```http
POST /api/v1/assessments
Authorization: Bearer {token}
{
  "title": "Midterm Quiz",
  "lessonId": 12,
  "classroomId": 4,
  "description": "Week 6 assessment",
  "assessmentType": "quiz",
  "openAt": "2026-06-01T08:00:00.000Z",
  "closeAt": "2026-06-02T08:00:00.000Z",
  "durationMinutes": 45,
  "maxAttempts": 2,
  "maxScore": 100,
  "gradingMethod": "hybrid",
  "publishPolicy": "manual",
  "resultPublishAt": "2026-06-03T08:00:00.000Z",
  "questions": [
    {
      "questionText": "What is JavaScript?",
      "questionType": "single_choice",
      "points": 10,
      "orderIndex": 0,
      "options": [
        { "text": "A programming language", "isCorrect": true },
        { "text": "A coffee brand", "isCorrect": false }
      ]
    }
  ]
}
```

Business rules:

- `lessonId` is required and determines the course scope.
- `classroomId` is optional, but when present it must belong to the same course as the lesson.
- `openAt` must be earlier than `closeAt`.
- `maxAttempts` and `maxScore` must be greater than zero.
- Assessments are created in `draft` status.

#### Update Assessment (Teacher/Admin)

```http
PATCH /api/v1/assessments/:id
Authorization: Bearer {token}
{
  "title": "Updated Midterm Quiz",
  "closeAt": "2026-06-02T10:00:00.000Z",
  "publishPolicy": "scheduled",
  "resultPublishAt": "2026-06-03T08:00:00.000Z"
}
```

Business rules:

- Locked fields such as `maxScore`, `gradingMethod`, and `maxAttempts` cannot change after attempts already exist.
- Archived assessments cannot be modified.

#### Publish Assessment (Teacher/Admin)

```http
POST /api/v1/assessments/:id/publish
Authorization: Bearer {token}
```

Only `draft` assessments with at least one question can transition to `published`.

#### Close or Archive Assessment (Teacher/Admin)

```http
POST /api/v1/assessments/:id/close
POST /api/v1/assessments/:id/archive
Authorization: Bearer {token}
{
  "reason": "Submission window finished"
}
```

Closing an assessment expires in-progress attempts. Archiving preserves history and blocks further updates.

#### Add Question (Teacher/Admin)

```http
POST /api/v1/assessments/:id/questions
Authorization: Bearer {token}
{
  "questionText": "Upload your essay",
  "questionType": "essay",
  "points": 40,
  "orderIndex": 2
}
```

Supported question types: `single_choice`, `multiple_choice`, `text`, `essay`, `file_upload`.

#### List or Get Assessments

```http
GET /api/v1/assessments?status=published&courseId=5
GET /api/v1/assessments/:id
Authorization: Bearer {token}
```

Students and parents only see published assessments in their scope. Staff users see full definitions and correct answers.

#### Start Attempt (Student)

```http
POST /api/v1/assessments/:id/attempts
Authorization: Bearer {token}
{
  "enrollmentId": 15
}
```

Business rules:

- Assessment must be `published`.
- Current time must be inside the `openAt` and `closeAt` window.
- Learner must belong to the matching enrollment and classroom scope.
- Existing in-progress attempts are returned instead of duplicated.

#### Submit Attempt (Student)

```http
POST /api/v1/assessments/attempts/:attemptId/submit
Authorization: Bearer {token}
{
  "answers": [
    { "questionId": 1, "selectedOptionId": 2 },
    { "questionId": 2, "selectedOptionIds": [5, 6] },
    { "questionId": 3, "textAnswer": "Manual grading response" }
  ]
}
```

Business rules:

- Only `in_progress` and non-expired attempts can be submitted.
- Objective questions are auto-graded.
- Manual or hybrid assessments keep the attempt in `submitted` until staff grading completes.
- Publish policy `auto_after_graded` can publish results immediately once grading is finalized.

#### Grade Submission (Teacher/Admin)

```http
POST /api/v1/assessments/submissions/:submissionId/grade
Authorization: Bearer {token}
{
  "score": 82,
  "feedback": "Strong answer. Clarify the final example.",
  "reason": "Essay review complete"
}
```

Business rules:

- `score` must be between `0` and `maxScore`.
- Published grades are locked against direct modification.
- This endpoint finalizes draft/manual grades and updates the attempt status to `graded`.

#### Publish Grade (Teacher/Admin)

```http
POST /api/v1/assessments/grades/:gradeId/publish
Authorization: Bearer {token}
```

Publishing a grade moves the attempt to `published`, records `publishedAt` / `publishedBy`, and returns a `GradePublished` event payload for downstream consumers.

#### View Results

```http
GET /api/v1/assessments/:id/results
GET /api/v1/assessments/:id/results?studentId=21
Authorization: Bearer {token}
```

Business rules:

- Students only see their own results.
- Parents only see results of linked students.
- Students and parents only see results after grade publication.
- Staff users can review unpublished and published grading states inside their scope.

#### Export Results (Teacher/Admin)

```http
GET /api/v1/assessments/:id/export
Authorization: Bearer {token}
```

Exports a scoped result snapshot. Large exports are rejected when the record count exceeds the service limit.

#### Assessment Audit Logs (Teacher/Admin)

```http
GET /api/v1/assessments/:id/audit-logs
Authorization: Bearer {token}
```

Includes create, update, publish, close, attempt, submission, grade, publication, and export audit records.

#### Legacy Quiz Compatibility

```http
POST /api/v1/quizzes/lesson/:lessonId
POST /api/v1/quizzes/:quizId/questions
GET /api/v1/quizzes/:id
POST /api/v1/quizzes/:quizId/attempts
POST /api/v1/quizzes/attempts/:attemptId/submit
GET /api/v1/quizzes/:quizId/attempts?enrollmentId=15
Authorization: Bearer {token}
```

These routes delegate to the assessment service with `assessmentType = quiz`.

### Reviews & Feedback

### Profiles

The profile module is the source of business identity data for students, parents, and teachers. It is separate from IAM authentication and authorization state.

#### Get My Profile

```http
GET /api/v1/profiles/me
GET /api/v1/profiles/me?profileType=teacher
Authorization: Bearer {token}
```

Returns the caller's profile in the active tenant. `profileType` is optional and useful when a user can own multiple business profiles.

#### Get My Profile Summary

```http
GET /api/v1/profiles/me/summary
Authorization: Bearer {token}
```

Returns a summary projection for portal headers and downstream modules:

- `profile_id`
- `user_id`
- `tenant_id`
- `profile_type`
- `display_name`
- `avatar_url`
- `status`
- `student_code` or `teacher_code` when applicable

#### List Profiles

```http
GET /api/v1/profiles?tenantId=1&profileType=student&status=active&search=an&page=1&limit=20
Authorization: Bearer {token}
```

Access rules:

- Admin can list profiles in the active tenant.
- Teacher can only list their own profile and student profiles in classrooms they teach.

#### Get Profile Detail or Summary

```http
GET /api/v1/profiles/:id
GET /api/v1/profiles/:id/summary
Authorization: Bearer {token}
```

Access rules:

- Users can view their own profile.
- Parent can only view linked student profiles with an active relationship.
- Teacher can only view student profiles in their classroom scope.
- Admin can view any profile in the active tenant.

#### Create Profile

```http
POST /api/v1/profiles
Authorization: Bearer {token}
{
  "tenantId": 1,
  "userId": 42,
  "profileType": "student",
  "fullName": "Alice Nguyen",
  "status": "draft",
  "studentCode": "ST-0001",
  "dateOfBirth": "2012-01-15",
  "learningGoal": "Improve English speaking"
}
```

Business rules:

- Admin only.
- `userId` must already exist in IAM.
- Duplicate profiles of the same `profileType` for the same `userId` and tenant are rejected.
- `studentCode`, `parentCode`, and `teacherCode` are unique per tenant when provided.
- Profile payload cannot update password, session, role, or permission data.

#### Update Profile

```http
PUT /api/v1/profiles/:id
Authorization: Bearer {token}
{
  "displayName": "Alice N.",
  "phoneNumber": "+84-123-456-789"
}
```

Access rules:

- Admin can update full business profile data.
- Student, parent, and teacher can only update limited self-service fields on their own profile.
- Inactive or archived profiles cannot be self-updated.

#### Change Profile Status

```http
PATCH /api/v1/profiles/:id/status
Authorization: Bearer {token}
{
  "status": "inactive",
  "reason": "Student transferred"
}
```

Allowed transitions:

- `draft -> active, inactive`
- `active -> inactive, archived`
- `inactive -> active, archived`
- `archived ->` no transitions

#### Link or Update Parent-Student Relationship

```http
POST /api/v1/profiles/relationships/link
PATCH /api/v1/profiles/relationships/:relationshipId/status
PATCH /api/v1/profiles/relationships/:relationshipId/revoke
Authorization: Bearer {token}
```

Relationship rules:

- Admin only.
- Parent and student must belong to the same tenant.
- Duplicate active or pending links are rejected.
- Supported statuses: `pending`, `active`, `suspended`, `revoked`.

#### View Linked Students

```http
GET /api/v1/profiles/me/linked-students
GET /api/v1/profiles/parent/:parentProfileId/students
Authorization: Bearer {token}
```

Parents only receive active linked students, and archived student profiles are excluded from the response.

#### Export Profiles

```http
GET /api/v1/profiles/export?tenantId=1&profileType=teacher&status=active
Authorization: Bearer {token}
```

Admin only. Returns a tenant-scoped export payload and records an audit log entry.

#### View Profile Audit Logs

```http
GET /api/v1/profiles/:id/audit-logs
Authorization: Bearer {token}
```

Admin only. Includes profile create/update/status events and related parent-student relationship audit events.

#### Create Course Review (Student)

```http
POST /api/v1/reviews/course/:courseId
Authorization: Bearer {token}
{
  "rating": 5,
  "reviewText": "Excellent course!"
}
```

#### Update Review (Student)

```http
PUT /api/v1/reviews/:id
Authorization: Bearer {token}
{
  "rating": 4
}
```

#### Get Course Reviews (Public)

```http
GET /api/v1/reviews/course/:courseId
```

#### Delete Review (Owner/Admin)

```http
DELETE /api/v1/reviews/:id
Authorization: Bearer {token}
```

### Notifications

#### Get Notifications (Authenticated)

```http
GET /api/v1/notifications?unread=true
Authorization: Bearer {token}
```

#### Mark as Read (Authenticated)

```http
PUT /api/v1/notifications/:id/read
Authorization: Bearer {token}
```

#### Mark All as Read (Authenticated)

```http
PUT /api/v1/notifications/read-all
Authorization: Bearer {token}
```

#### Delete Notification (Authenticated)

```http
DELETE /api/v1/notifications/:id
Authorization: Bearer {token}
```

### Rewards

#### Create Reward (Admin)

```http
POST /api/v1/rewards
Authorization: Bearer {token}
{
  "title": "Course Completion Certificate",
  "description": "Awarded for completing a course",
  "rewardType": "certificate",
  "pointsValue": 100,
  "iconUrl": "https://example.com/icon.png"
}
```

#### Award Reward (Admin/Teacher)

```http
POST /api/v1/rewards/award
Authorization: Bearer {token}
{
  "studentId": 1,
  "rewardId": 2,
  "enrollmentId": 5
}
```

#### Get My Rewards (Student)

```http
GET /api/v1/rewards/my
Authorization: Bearer {token}
```

#### Get All Available Rewards (Authenticated)

```http
GET /api/v1/rewards
Authorization: Bearer {token}
```

## 🔒 Role-Based Access Control

### Admin

- Full system access
- Manage users, courses, rewards
- View all statistics and progress
- Delete any content

### Teacher

- Create and manage own courses
- Add sections, lessons, quizzes to own courses
- View student progress in own courses
- Award rewards to students in own courses
- Cannot modify other teachers' content

### Student

- Browse and enroll in published courses
- Access enrolled course content
- Track own progress
- Take quizzes and view results
- Leave reviews and feedback
- Earn and view rewards
- Receive notifications

## 📊 Progress Tracking Features

1. **Lesson-Level Progress**
   - Track status: not_started, in_progress, completed
   - Time spent on each lesson
   - Completion dates

2. **Course-Level Progress**
   - Overall completion percentage
   - Total time spent
   - Automatic enrollment status update to "completed"

3. **Teacher Dashboard**
   - View all enrolled students
   - Track individual student progress
   - Identify struggling students
   - Monitor quiz performance

## ✅ Assessment Features

1. **Lifecycle**
   - Draft, published, closed, and archived states
   - Scoped to lesson, course, and optional classroom
   - Separate result publication policy from assessment publication

2. **Attempt and Submission Flow**
   - Idempotent attempt start with max-attempt enforcement
   - Expiring attempts based on configured duration
   - Separate attempt, submission, grade, and publication records

3. **Grading and Visibility**
   - Auto, manual, and hybrid grading methods
   - Explicit grade publication before learner and parent visibility
   - Result export and audit logging for sensitive score data

## 🏆 Reward System Features

1. **Reward Types**
   - Certificates (for course completion)
   - Badges (for achievements)
   - Points (gamification)

2. **Award Triggers**
   - Course completion
   - Quiz performance
   - Milestone achievements
   - Manual awards by teachers/admins

3. **Notifications**
   - Automatic notification on reward earning
   - View earned rewards in profile

## 🔔 Notification System

Types of notifications:

- **progress**: Course/lesson progress updates
- **assignment**: New assignments or quizzes
- **reward**: Earned rewards and achievements
- **course**: Course updates or announcements
- **general**: System-wide notifications

## 📝 Error Responses

All errors follow consistent format:

```json
{
  "message": "Error description",
  "statusCode": 400,
  "details": null
}
```

Status codes:

- 200: OK
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

## 🔐 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT authentication with expiration
- Role-based authorization middleware
- Helmet.js security headers
- CORS configuration
- Input validation with express-validator
- SQL injection prevention via Sequelize ORM
- Owner-based access control for content

## 🚀 Getting Started

1. Install dependencies: `npm install`
2. Configure `.env` file with database credentials
3. Run: `npm start`
4. Database will auto-create and seed roles

## 📦 Dependencies

- express: Web framework
- sequelize: ORM for MySQL
- mysql2: MySQL driver
- jsonwebtoken: JWT authentication
- bcryptjs: Password hashing
- express-validator: Request validation
- helmet: Security headers
- cors: CORS middleware
- dotenv: Environment variables

## 🧪 Testing the API

Use the provided Postman collection in `/docs/postman_collection.json` or test with curl:

```bash
# Register a student
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"test123","fullName":"Test Student","roleName":"student"}'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"test123"}'

# List courses
curl http://localhost:8080/api/v1/courses
```

## 📄 License

ISC
