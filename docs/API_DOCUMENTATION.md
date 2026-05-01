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
- ✅ **Quiz & Assessment System** (Multiple question types, auto-grading, attempt limits)
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

- **quizzes** - Quiz definitions with passing scores
- **quiz_questions** - Quiz questions with types
- **quiz_options** - Answer options for questions
- **quiz_attempts** - Student quiz attempts with scores
- **quiz_attempt_answers** - Individual answers per attempt

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
  "roleName": "student" // or "teacher", "admin"
}
```

#### Login

```http
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
Response: { "token": "jwt_token" }
```

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

### Quizzes

#### Create Quiz (Teacher/Admin)

```http
POST /api/v1/quizzes/lesson/:lessonId
Authorization: Bearer {token}
{
  "title": "JavaScript Basics Quiz",
  "description": "Test your knowledge",
  "passingScore": 70,
  "timeLimitMinutes": 30,
  "maxAttempts": 3
}
```

#### Add Question (Teacher/Admin)

```http
POST /api/v1/quizzes/:quizId/questions
Authorization: Bearer {token}
{
  "questionText": "What is JavaScript?",
  "questionType": "single_choice",
  "points": 1,
  "orderIndex": 0,
  "options": [
    { "text": "A programming language", "isCorrect": true },
    { "text": "A coffee brand", "isCorrect": false }
  ]
}
```

#### Get Quiz (Authenticated)

```http
GET /api/v1/quizzes/:id
Authorization: Bearer {token}
# Students see questions without correct answers
# Teachers/Admins see full quiz data
```

#### Start Quiz Attempt (Student)

```http
POST /api/v1/quizzes/:quizId/attempts
Authorization: Bearer {token}
{
  "enrollmentId": 1
}
```

#### Submit Quiz Attempt (Student)

```http
POST /api/v1/quizzes/attempts/:attemptId/submit
Authorization: Bearer {token}
{
  "answers": [
    { "questionId": 1, "selectedOptionId": 2 },
    { "questionId": 2, "selectedOptionId": 5 }
  ]
}
```

#### Get Quiz Attempts (Student)

```http
GET /api/v1/quizzes/:quizId/attempts
Authorization: Bearer {token}
```

### Reviews & Feedback

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

## ✅ Quiz System Features

1. **Question Types**
   - Single choice (radio buttons)
   - Multiple choice (checkboxes)
   - Text answers (for manual grading)

2. **Quiz Configuration**
   - Set passing score threshold
   - Time limit per quiz
   - Maximum attempt limits
   - Point values per question

3. **Auto-Grading**
   - Automatic scoring for choice questions
   - Immediate feedback
   - Pass/fail determination
   - Detailed attempt history

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
