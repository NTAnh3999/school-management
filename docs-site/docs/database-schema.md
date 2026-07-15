# Database Schema

The School Management API uses a relational MySQL database with the following structure:

## Core Tables

### Users

Stores login credentials only. There is **no `role_id` column** — a user's role is not a fixed,
global attribute. It's resolved per request from `iam_role_assignments`, scoped to whichever
tenant (and optionally branch/campus/location) the session currently has active. See
[IAM Tables](#iam-tables) below and the [IAM API docs](./api/iam#authorization-model).

| Column        | Type         | Description                |
| ------------- | ------------ | --------------------------- |
| id            | INT          | Primary key                 |
| email         | VARCHAR(120) | Unique email address        |
| password_hash | VARCHAR(200) | Hashed password              |
| full_name     | VARCHAR(120) | User's full name             |
| created_at    | DATETIME     | Account creation timestamp  |
| updated_at    | DATETIME     | Last update timestamp       |

### Roles

Named roles (`admin`, `teacher`, `student`, `parent`, ...). A role only carries meaning through
the permissions mapped to it (`role_permissions`) and the scoped grants that assign it to a user
(`iam_role_assignments`).

| Column | Type        | Description |
| ------ | ----------- | ------------ |
| id     | INT         | Primary key  |
| name   | VARCHAR(50) | Role name    |

### Courses

Main course information.

| Column         | Type          | Description                                     |
| -------------- | ------------- | ----------------------------------------------- |
| id             | INT           | Primary key                                     |
| course_code    | VARCHAR(50)   | Unique course code (e.g. `CS-101`)              |
| department_id  | INT           | FK to departments (nullable)                    |
| title          | VARCHAR(255)  | Course title                                    |
| description    | TEXT          | Course description                              |
| course_type    | VARCHAR(50)   | Course type (default `general`)                 |
| credit         | DECIMAL(5,2)  | Credit hours (nullable)                         |
| duration_hours | DECIMAL(6,2)  | Total duration in hours (nullable)              |
| level          | ENUM          | `beginner`, `intermediate`, `advanced`          |
| price          | DECIMAL(10,2) | Course price                                    |
| thumbnail_url  | VARCHAR(500)  | Course thumbnail image                          |
| status         | ENUM          | `draft`, `active`, `inactive`, `archived`       |
| effective_from | DATE          | Date from which course is effective (nullable)  |
| effective_to   | DATE          | Date until which course is effective (nullable) |
| teacher_id     | INT           | FK to users (teacher)                           |
| is_deleted     | BOOLEAN       | Soft-delete flag (default `false`)              |
| created_by     | INT           | FK to users (creator)                           |
| updated_by     | INT           | FK to users (last editor)                       |
| created_at     | DATETIME      | Creation timestamp                              |
| updated_at     | DATETIME      | Last update timestamp                           |

### Course Sections

Organize courses into sections/modules.

| Column      | Type         | Description               |
| ----------- | ------------ | ------------------------- |
| id          | INT          | Primary key               |
| course_id   | INT          | Foreign key to courses    |
| title       | VARCHAR(255) | Section title             |
| description | TEXT         | Section description       |
| order_index | INT          | Display order             |
| status      | ENUM         | `draft`, `archived`       |
| created_by  | INT          | FK to users (author)      |
| updated_by  | INT          | FK to users (last editor) |
| created_at  | DATETIME     | Creation timestamp        |
| updated_at  | DATETIME     | Last update timestamp     |

### Lessons

Individual lesson content.

| Column             | Type         | Description                         |
| ------------------ | ------------ | ----------------------------------- |
| id                 | INT          | Primary key                         |
| section_id         | INT          | Foreign key to course_sections      |
| title              | VARCHAR(255) | Lesson title                        |
| content            | TEXT         | Lesson content                      |
| lesson_type        | ENUM         | video, text, quiz, assignment       |
| video_url          | VARCHAR(500) | Video URL (if applicable)           |
| duration_minutes   | INT          | Legacy estimated duration (minutes) |
| estimated_duration | DECIMAL(6,2) | Precise duration in minutes         |
| order_index        | INT          | Display order                       |
| status             | ENUM         | `draft`, `archived`                 |
| created_by         | INT          | FK to users (author)                |
| updated_by         | INT          | FK to users (last editor)           |
| created_at         | DATETIME     | Creation timestamp                  |
| updated_at         | DATETIME     | Last update timestamp               |

### Enrollments

Student course enrollments.

| Column          | Type     | Description                |
| --------------- | -------- | -------------------------- |
| id              | INT      | Primary key                |
| student_id      | INT      | Foreign key to users       |
| course_id       | INT      | Foreign key to courses     |
| enrollment_date | DATETIME | Enrollment timestamp       |
| status          | ENUM     | active, completed, dropped |
| completion_date | DATETIME | Course completion date     |
| created_at      | DATETIME | Creation timestamp         |
| updated_at      | DATETIME | Last update timestamp      |

## Progress Tracking Tables

### Lesson Progress

Tracks individual lesson completion.

| Column        | Type     | Description                         |
| ------------- | -------- | ----------------------------------- |
| id            | INT      | Primary key                         |
| enrollment_id | INT      | Foreign key to enrollments          |
| lesson_id     | INT      | Foreign key to lessons              |
| status        | ENUM     | not_started, in_progress, completed |
| time_spent    | INT      | Time spent in minutes               |
| completed_at  | DATETIME | Completion timestamp                |
| created_at    | DATETIME | Creation timestamp                  |
| updated_at    | DATETIME | Last update timestamp               |

### Student Course Progress

Overall course progress tracking.

| Column                | Type         | Description                |
| --------------------- | ------------ | -------------------------- |
| id                    | INT          | Primary key                |
| enrollment_id         | INT          | Foreign key to enrollments |
| completion_percentage | DECIMAL(5,2) | Progress percentage        |
| total_time_spent      | INT          | Total time in minutes      |
| last_accessed_at      | DATETIME     | Last access timestamp      |
| created_at            | DATETIME     | Creation timestamp         |
| updated_at            | DATETIME     | Last update timestamp      |

## Assessment Tables

### Quizzes

Quiz definitions.

| Column             | Type         | Description                      |
| ------------------ | ------------ | -------------------------------- |
| id                 | INT          | Primary key                      |
| lesson_id          | INT          | Foreign key to lessons           |
| title              | VARCHAR(255) | Quiz title                       |
| description        | TEXT         | Quiz description                 |
| passing_score      | DECIMAL(5,2) | Minimum passing percentage       |
| time_limit_minutes | INT          | Time limit (0 = unlimited)       |
| max_attempts       | INT          | Maximum attempts (0 = unlimited) |
| created_at         | DATETIME     | Creation timestamp               |
| updated_at         | DATETIME     | Last update timestamp            |

### Quiz Questions

Individual quiz questions.

| Column        | Type         | Description                          |
| ------------- | ------------ | ------------------------------------ |
| id            | INT          | Primary key                          |
| quiz_id       | INT          | Foreign key to quizzes               |
| question_text | TEXT         | Question text                        |
| question_type | ENUM         | single_choice, multiple_choice, text |
| points        | DECIMAL(5,2) | Points for correct answer            |
| order_index   | INT          | Display order                        |
| created_at    | DATETIME     | Creation timestamp                   |
| updated_at    | DATETIME     | Last update timestamp                |

### Quiz Options

Answer options for questions.

| Column      | Type     | Description                   |
| ----------- | -------- | ----------------------------- |
| id          | INT      | Primary key                   |
| question_id | INT      | Foreign key to quiz_questions |
| option_text | TEXT     | Option text                   |
| is_correct  | BOOLEAN  | Whether option is correct     |
| order_index | INT      | Display order                 |
| created_at  | DATETIME | Creation timestamp            |
| updated_at  | DATETIME | Last update timestamp         |

### Quiz Attempts

Student quiz attempts.

| Column        | Type         | Description                |
| ------------- | ------------ | -------------------------- |
| id            | INT          | Primary key                |
| quiz_id       | INT          | Foreign key to quizzes     |
| enrollment_id | INT          | Foreign key to enrollments |
| score         | DECIMAL(5,2) | Score percentage           |
| passed        | BOOLEAN      | Whether attempt passed     |
| started_at    | DATETIME     | Attempt start time         |
| completed_at  | DATETIME     | Attempt completion time    |
| created_at    | DATETIME     | Creation timestamp         |
| updated_at    | DATETIME     | Last update timestamp      |

### Quiz Attempt Answers

Individual answers in a quiz attempt.

| Column             | Type     | Description                            |
| ------------------ | -------- | -------------------------------------- |
| id                 | INT      | Primary key                            |
| attempt_id         | INT      | Foreign key to quiz_attempts           |
| question_id        | INT      | Foreign key to quiz_questions          |
| selected_option_id | INT      | Foreign key to quiz_options (nullable) |
| text_answer        | TEXT     | Text answer (for text questions)       |
| is_correct         | BOOLEAN  | Whether answer is correct              |
| created_at         | DATETIME | Creation timestamp                     |
| updated_at         | DATETIME | Last update timestamp                  |

## Engagement Tables

### Rewards

Available rewards in the system.

| Column       | Type         | Description                |
| ------------ | ------------ | -------------------------- |
| id           | INT          | Primary key                |
| title        | VARCHAR(255) | Reward title               |
| description  | TEXT         | Reward description         |
| reward_type  | ENUM         | certificate, badge, points |
| points_value | INT          | Points value               |
| icon_url     | VARCHAR(500) | Reward icon image          |
| created_at   | DATETIME     | Creation timestamp         |
| updated_at   | DATETIME     | Last update timestamp      |

### Student Rewards

Rewards earned by students.

| Column        | Type     | Description                           |
| ------------- | -------- | ------------------------------------- |
| id            | INT      | Primary key                           |
| student_id    | INT      | Foreign key to users                  |
| reward_id     | INT      | Foreign key to rewards                |
| enrollment_id | INT      | Foreign key to enrollments (nullable) |
| earned_date   | DATETIME | Date reward was earned                |
| created_at    | DATETIME | Creation timestamp                    |
| updated_at    | DATETIME | Last update timestamp                 |

### Course Reviews

Student course reviews and ratings.

| Column      | Type     | Description            |
| ----------- | -------- | ---------------------- |
| id          | INT      | Primary key            |
| course_id   | INT      | Foreign key to courses |
| student_id  | INT      | Foreign key to users   |
| rating      | INT      | Rating (1-5)           |
| review_text | TEXT     | Review content         |
| created_at  | DATETIME | Creation timestamp     |
| updated_at  | DATETIME | Last update timestamp  |

### Lesson Feedback

Lesson-specific feedback.

| Column        | Type     | Description              |
| ------------- | -------- | ------------------------ |
| id            | INT      | Primary key              |
| lesson_id     | INT      | Foreign key to lessons   |
| student_id    | INT      | Foreign key to users     |
| feedback_text | TEXT     | Feedback content         |
| helpfulness   | INT      | Helpfulness rating (1-5) |
| created_at    | DATETIME | Creation timestamp       |
| updated_at    | DATETIME | Last update timestamp    |

### Notifications

User notifications.

| Column     | Type         | Description                                   |
| ---------- | ------------ | --------------------------------------------- |
| id         | INT          | Primary key                                   |
| user_id    | INT          | Foreign key to users                          |
| type       | ENUM         | progress, assignment, reward, course, general |
| title      | VARCHAR(255) | Notification title                            |
| message    | TEXT         | Notification message                          |
| is_read    | BOOLEAN      | Read status                                   |
| created_at | DATETIME     | Creation timestamp                            |
| updated_at | DATETIME     | Last update timestamp                         |

### Refresh Tokens

JWT refresh tokens for authentication.

| Column     | Type         | Description           |
| ---------- | ------------ | --------------------- |
| id         | INT          | Primary key           |
| user_id    | INT          | Foreign key to users  |
| token      | VARCHAR(500) | Refresh token         |
| expires_at | DATETIME     | Expiration timestamp  |
| created_at | DATETIME     | Creation timestamp    |
| updated_at | DATETIME     | Last update timestamp |

## Course Content Authoring Tables

### Content Assets

File/media metadata registry. Assets are created after upload to cloud/object storage.

| Column           | Type         | Description                           |
| ---------------- | ------------ | ------------------------------------- |
| id               | INT          | Primary key                           |
| filename         | VARCHAR(255) | Original filename                     |
| media_type       | ENUM         | `video`, `image`, `document`, `audio` |
| mime_type        | VARCHAR(100) | MIME type (e.g. `video/mp4`)          |
| size_bytes       | BIGINT       | File size in bytes                    |
| duration_seconds | INT          | Duration for audio/video assets       |
| storage_key      | VARCHAR(500) | Path/key in cloud storage             |
| thumbnail_url    | VARCHAR(500) | Thumbnail image URL                   |
| uploaded_by      | INT          | FK to users (uploader)                |
| uploaded_at      | DATETIME     | Upload timestamp                      |
| created_at       | DATETIME     | Creation timestamp                    |
| updated_at       | DATETIME     | Last update timestamp                 |

### Learning Items

Granular content units within a lesson. Each lesson may contain multiple items.

| Column             | Type         | Description                                        |
| ------------------ | ------------ | -------------------------------------------------- |
| id                 | INT          | Primary key                                        |
| lesson_id          | INT          | FK to lessons                                      |
| item_type          | ENUM         | `VIDEO`, `QUIZ`, `INFOGRAPHIC`, `DOCUMENT`, `TEXT` |
| title              | VARCHAR(255) | Item title                                         |
| content_payload    | JSON         | Type-specific content (URL, text, quiz ref, etc.)  |
| asset_id           | INT          | FK to content_assets (nullable)                    |
| display_order      | INT          | Order within the lesson                            |
| estimated_duration | DECIMAL(6,2) | Estimated completion time in minutes               |
| is_required        | BOOLEAN      | Whether item is mandatory for lesson completion    |
| status             | ENUM         | `draft`, `archived`                                |
| created_by         | INT          | FK to users (author)                               |
| updated_by         | INT          | FK to users (last editor)                          |
| created_at         | DATETIME     | Creation timestamp                                 |
| updated_at         | DATETIME     | Last update timestamp                              |

### Content Versions

Versioned snapshots of a course's published content. Supports the DRAFT → REVIEW → PUBLISHED → ARCHIVED workflow.

| Column        | Type         | Description                                          |
| ------------- | ------------ | ---------------------------------------------------- |
| id            | INT          | Primary key                                          |
| course_id     | INT          | FK to courses                                        |
| version_label | VARCHAR(100) | Human-readable label (e.g. "v1.0 - Initial Release") |
| version_no    | INT          | Auto-incremented version number                      |
| status        | ENUM         | `DRAFT`, `REVIEW`, `PUBLISHED`, `ARCHIVED`           |
| changelog     | TEXT         | Description of changes in this version               |
| snapshot_ref  | JSON         | Full course structure snapshot at publish time       |
| published_at  | DATETIME     | Timestamp when version was published                 |
| published_by  | INT          | FK to users (publisher)                              |
| created_by    | INT          | FK to users (creator)                                |
| created_at    | DATETIME     | Creation timestamp                                   |
| updated_at    | DATETIME     | Last update timestamp                                |

## Relationships

### One-to-Many

- Users → Courses (teacher)
- Users → Enrollments (student)
- Courses → Sections
- Sections → Lessons
- Lessons → Learning Items
- Learning Items → Content Assets
- Courses → Content Versions
- Courses → Enrollments
- Lessons → Quizzes
- Quizzes → Questions
- Questions → Options
- Quizzes → Attempts
- Enrollments → Lesson Progress
- Enrollments → Course Progress
- Users → Notifications
- Users → Rewards (through Student Rewards)
- Classrooms → Classroom Enrollments
- Classrooms → Classroom Sessions
- Classrooms → Classroom Teachers

### Many-to-Many

- Users ↔ Courses (through Enrollments)
- Students ↔ Rewards (through Student Rewards)
- Users ↔ Classrooms (through Classroom Teachers)
- Students ↔ Classrooms (through Classroom Enrollments)
- Parents ↔ Students (through Parent–Student Relationships)

---

## IAM Tables

See [IAM API docs](./api/iam) for the full authorization model. These tables hold identity,
membership, and scoped role-assignment data — separate from `users`' bare login credentials.

### IAM User Accounts

One-to-one extension of `users` with login-related state.

| Column         | Type         | Description                                    |
| -------------- | ------------ | ----------------------------------------------- |
| id             | INT          | Primary key                                     |
| user_id        | INT          | FK to users (unique)                            |
| username       | VARCHAR(100) | Optional unique username (nullable)             |
| phone          | VARCHAR(30)  | Optional unique phone (nullable)                |
| status         | ENUM         | `active`, `inactive`, `locked`, `suspended`, `deactivated` |
| login_methods  | JSON         | Array of enabled login methods                  |
| last_login_at  | DATETIME     | Last successful login (nullable)                |
| created_at     | DATETIME     | Creation timestamp                              |
| updated_at     | DATETIME     | Last update timestamp                           |

### IAM Memberships

Which tenants a user belongs to, and at what scope.

| Column      | Type     | Description                                                        |
| ----------- | -------- | -------------------------------------------------------------------|
| id          | INT      | Primary key                                                        |
| user_id     | INT      | FK to users                                                        |
| tenant_id   | INT      | FK to tenants                                                      |
| scope_type  | ENUM     | `tenant`, `branch`, `campus`, `location`                           |
| branch_id   | INT      | FK to branches (nullable; set only when `scope_type = branch`)     |
| campus_id   | INT      | FK to campuses (nullable; set only when `scope_type = campus`)     |
| location_id | INT      | FK to locations (nullable; set only when `scope_type = location`)  |
| status      | ENUM     | `active`, `inactive`, `revoked`, `expired`                         |
| expires_at  | DATETIME | Optional expiry (nullable)                                         |
| created_by  | INT      | FK to users                                                        |
| updated_by  | INT      | FK to users                                                        |
| created_at  | DATETIME | Creation timestamp                                                 |
| updated_at  | DATETIME | Last update timestamp                                              |

### IAM Role Assignments

Which role a user holds, and at what scope — the source of truth for authorization (see
[Authorization Model](./api/iam#authorization-model)). Assigning a different role at the same
`(user, tenant, scope)` automatically revokes the prior active assignment there.

| Column      | Type     | Description                                    |
| ----------- | -------- | ----------------------------------------------- |
| id          | INT      | Primary key                                    |
| user_id     | INT      | FK to users                                    |
| role_id     | INT      | FK to roles                                    |
| tenant_id   | INT      | FK to tenants                                  |
| scope_type  | ENUM     | `tenant`, `branch`, `campus`, `location`       |
| branch_id   | INT      | FK to branches (nullable)                      |
| campus_id   | INT      | FK to campuses (nullable)                      |
| location_id | INT      | FK to locations (nullable)                     |
| status      | ENUM     | `active`, `inactive`, `revoked`                |
| expires_at  | DATETIME | Optional expiry (nullable)                     |
| assigned_by | INT      | FK to users                                    |
| created_at  | DATETIME | Creation timestamp                             |
| updated_at  | DATETIME | Last update timestamp                          |

### IAM Sessions

One row per issued refresh token / login session.

| Column           | Type     | Description                              |
| ---------------- | -------- | ------------------------------------------|
| id               | UUID     | Primary key                              |
| user_id          | INT      | FK to users                              |
| active_tenant_id | INT      | FK to tenants (nullable until selected)  |
| refresh_token    | VARCHAR  | Unique refresh token                     |
| status           | ENUM     | `active`, `revoked`, `expired`           |
| expires_at       | DATETIME | Expiry timestamp                         |
| last_used_at     | DATETIME | Last request timestamp (nullable)        |
| created_at       | DATETIME | Creation timestamp                       |
| updated_at       | DATETIME | Last update timestamp                    |

### IAM Audit Logs

Append-only log of IAM/org-structure actions (`iam.role_assignment.supersede`,
`org.branch.create`, ...), consumed by `GET /api/v1/iam/audit-logs`.

| Column        | Type     | Description                                     |
| ------------- | -------- | ------------------------------------------------ |
| id            | INT      | Primary key                                      |
| actor_user_id | INT      | FK to users (who performed the action)          |
| tenant_id     | INT      | FK to tenants                                    |
| action        | VARCHAR  | Action code, e.g. `iam.user.create`             |
| entity_type   | VARCHAR  | `user`, `membership`, `role_assignment`, `branch`, `campus`, `location`, `role`, `role_permission`, `session` |
| entity_id     | VARCHAR  | ID of the affected entity                        |
| status        | VARCHAR  | `success` (default) or an error status          |
| details       | JSON     | Action-specific payload                          |
| created_at    | DATETIME | Creation timestamp                               |

---

## Profile Module Tables

The Profile module stores **business profile data** separately from IAM user accounts. It is the canonical source of educational identity used by portals and downstream modules.

:::info
Profile answers "who is this person in the educational context?"  
The `users` table (IAM) answers "how does this person log in and what are their permissions?"
:::

### Tenants

Represents a school or training center. All profile data is scoped to a tenant.

| Column      | Type         | Description                          |
| ----------- | ------------ | ------------------------------------ |
| id          | INT          | Primary key                          |
| tenant_code | VARCHAR(50)  | Unique tenant code (e.g. `DEFAULT`)  |
| tenant_name | VARCHAR(255) | Display name                         |
| status      | ENUM         | `active`, `inactive`                 |
| created_at  | DATETIME     | Creation timestamp                   |
| updated_at  | DATETIME     | Last update timestamp                |

### Branches, Campuses, Locations

The physical org structure a tenant is divided into — see [Org Structure API](./api/org-structure)
and how [IAM scope](./api/iam#scope-tenant--branch--campus--location) is checked against this
hierarchy. `tenant_id` (and `branch_id` on campuses/locations) is denormalized onto child tables
for cheap scope comparisons; the API always derives it from the parent record rather than
trusting client input, so it can't drift from the true hierarchy.

**`branches`** — `id`, `tenant_id` (FK), `branch_code`, `branch_name`, `status` (`active`/`inactive`). Unique on `(tenant_id, branch_code)`.

**`campuses`** — `id`, `tenant_id` (FK, derived), `branch_id` (FK), `campus_code`, `campus_name`, `status`. Unique on `(branch_id, campus_code)`.

**`locations`** — `id`, `tenant_id` (FK, derived), `branch_id` (FK, derived), `campus_id` (FK), `parent_location_id` (FK to `locations`, nullable, for nesting), `location_code`, `location_name`, `location_type` (`building`/`floor`/`room`/`hall`/`lab`/`outdoor`/`virtual`), `capacity`, `status`, `metadata` (JSON). Unique on `(campus_id, location_code)`.

### Profiles

Core profile entity. Links an IAM user identity to their business profile data.

| Column        | Type         | Description                                          |
| ------------- | ------------ | ---------------------------------------------------- |
| id            | INT          | Primary key                                          |
| tenant_id     | INT          | FK to tenants                                        |
| user_id       | INT          | FK to users (IAM reference — not auth ownership)     |
| profile_type  | ENUM         | `student`, `parent`, `teacher`, `staff`, `admin`     |
| full_name     | VARCHAR(120) | Full name (required, 2–120 chars)                    |
| display_name  | VARCHAR(120) | Display name (nullable; defaults to full_name)       |
| avatar_url    | VARCHAR(500) | Avatar image URL (nullable)                          |
| contact_email | VARCHAR(120) | Contact email (may differ from login email)          |
| phone_number  | VARCHAR(30)  | Phone number (nullable)                              |
| address       | TEXT         | Address (nullable)                                   |
| status        | ENUM         | `draft`, `active`, `inactive`, `archived`            |
| visibility    | ENUM         | `internal`, `public`, `private`                      |
| created_by    | INT          | FK to users (creator)                                |
| updated_by    | INT          | FK to users (last editor)                            |
| created_at    | DATETIME     | Creation timestamp                                   |
| updated_at    | DATETIME     | Last update timestamp                                |

### Student Profiles

One-to-one extension of `profiles` for learners.

| Column         | Type         | Description                                    |
| -------------- | ------------ | ---------------------------------------------- |
| id             | INT          | Primary key                                    |
| profile_id     | INT          | FK to profiles (unique)                        |
| student_code   | VARCHAR(50)  | Unique student code within tenant (nullable)   |
| date_of_birth  | DATE         | Date of birth (nullable)                       |
| gender         | ENUM         | `male`, `female`, `other`, `unspecified`        |
| current_level  | VARCHAR(100) | Current academic level (nullable)              |
| learning_goal  | TEXT         | Personal learning goal (nullable)              |
| student_status | ENUM         | `active`, `inactive`, `graduated`, `suspended` |
| created_at     | DATETIME     | Creation timestamp                             |
| updated_at     | DATETIME     | Last update timestamp                          |

### Parent Profiles

One-to-one extension of `profiles` for guardians/parents.

| Column                | Type        | Description                              |
| --------------------- | ----------- | ---------------------------------------- |
| id                    | INT         | Primary key                              |
| profile_id            | INT         | FK to profiles (unique)                  |
| parent_code           | VARCHAR(50) | Unique parent code within tenant         |
| occupation            | VARCHAR(150)| Occupation (nullable)                    |
| contact_priority      | INT         | Contact priority order (default: 1)      |
| emergency_contact_flag| BOOLEAN     | Is emergency contact (default: false)    |
| created_at            | DATETIME    | Creation timestamp                       |
| updated_at            | DATETIME    | Last update timestamp                    |

### Teacher Profiles

One-to-one extension of `profiles` for instructors.

| Column                 | Type        | Description                                      |
| ---------------------- | ----------- | ------------------------------------------------ |
| id                     | INT         | Primary key                                      |
| profile_id             | INT         | FK to profiles (unique)                          |
| teacher_code           | VARCHAR(50) | Unique teacher code within tenant                |
| bio                    | TEXT        | Short biography (nullable)                       |
| expertise              | JSON        | Array of expertise areas (nullable)              |
| qualification          | TEXT        | Qualifications and certifications (nullable)     |
| years_of_experience    | INT         | Years of experience (default: 0)                 |
| public_profile_enabled | BOOLEAN     | Show on public-facing pages (default: false)     |
| created_at             | DATETIME    | Creation timestamp                               |
| updated_at             | DATETIME    | Last update timestamp                            |

### Parent–Student Relationships

Maps parent profiles to student profiles. Controls parent portal access scope.

| Column             | Type     | Description                                           |
| ------------------ | -------- | ----------------------------------------------------- |
| id                 | INT      | Primary key                                           |
| tenant_id          | INT      | FK to tenants (parent and student must share tenant)  |
| parent_profile_id  | INT      | FK to parent_profiles                                 |
| student_profile_id | INT      | FK to student_profiles                                |
| relationship_type  | ENUM     | `father`, `mother`, `guardian`, `other`               |
| status             | ENUM     | `pending`, `active`, `suspended`, `revoked`           |
| start_date         | DATETIME | Relationship start date (nullable)                    |
| end_date           | DATETIME | Relationship end date (nullable)                      |
| reason             | TEXT     | Reason for status change (nullable)                   |
| created_by         | INT      | FK to users (creator)                                 |
| updated_by         | INT      | FK to users (last editor)                             |
| created_at         | DATETIME | Creation timestamp                                    |
| updated_at         | DATETIME | Last update timestamp                                 |

**Relationship Status Rules:**

| Status | Parent can access student data? |
| --- | --- |
| `pending` | No |
| `active` | Yes |
| `suspended` | No |
| `revoked` | No |

---

## Classroom Module Tables

### Classrooms

Operational instances of a course with assigned teachers, schedule, and enrollment rules.

| Column                | Type         | Description                                                                  |
| --------------------- | ------------ | ---------------------------------------------------------------------------- |
| id                    | INT          | Primary key                                                                  |
| classroom_code        | VARCHAR(100) | Unique code (auto-generated: `CLS-{COURSE_CODE}-{YYYYMM}-{SEQ}`)             |
| classroom_name        | VARCHAR(255) | Display name                                                                 |
| description           | TEXT         | Classroom description                                                        |
| course_id             | INT          | FK to courses                                                                |
| course_version_id     | INT          | FK to content_versions (nullable)                                            |
| status                | ENUM         | `draft`, `open`, `full`, `in_progress`, `completed`, `cancelled`, `archived` |
| delivery_method       | ENUM         | `online`, `offline`, `hybrid`                                                |
| location              | VARCHAR(255) | Physical location (nullable)                                                 |
| online_meeting_link   | VARCHAR(500) | Online meeting URL (nullable)                                                |
| academic_year         | VARCHAR(20)  | Academic year label (nullable)                                               |
| term                  | VARCHAR(100) | Term/semester label (nullable)                                               |
| language              | VARCHAR(50)  | Instruction language                                                         |
| start_date            | DATE         | First day of classes                                                         |
| end_date              | DATE         | Last day of classes                                                          |
| enrollment_mode       | ENUM         | `manual`, `self_enrollment`, `invitation_only`                               |
| enrollment_start_date | DATE         | Enrollment opens (nullable)                                                  |
| enrollment_end_date   | DATE         | Enrollment closes (nullable)                                                 |
| min_capacity          | INT          | Minimum students required                                                    |
| max_capacity          | INT          | Maximum students allowed                                                     |
| enrolled_count        | INT          | Cached count of active enrollments                                           |
| waitlist_enabled      | BOOLEAN      | Allow waitlist when full                                                     |
| approval_required     | BOOLEAN      | Require admin approval for enrollment                                        |
| visibility            | ENUM         | `public`, `private`, `internal`                                              |
| cancel_reason         | TEXT         | Reason if cancelled (nullable)                                               |
| created_by            | INT          | FK to users                                                                  |
| updated_by            | INT          | FK to users                                                                  |
| is_deleted            | BOOLEAN      | Soft-delete flag                                                             |
| created_at            | DATETIME     | Creation timestamp                                                           |
| updated_at            | DATETIME     | Last update timestamp                                                        |

### Classroom Teachers

Maps teachers and TAs to a classroom.

| Column            | Type     | Description                                        |
| ----------------- | -------- | -------------------------------------------------- |
| id                | INT      | Primary key                                        |
| classroom_id      | INT      | FK to classrooms                                   |
| user_id           | INT      | FK to users                                        |
| role_in_classroom | ENUM     | `main_teacher`, `co_teacher`, `teaching_assistant` |
| active_flag       | BOOLEAN  | Whether assignment is currently active             |
| assigned_by       | INT      | FK to users (who made the assignment)              |
| assigned_at       | DATETIME | Assignment timestamp                               |
| created_at        | DATETIME | Creation timestamp                                 |
| updated_at        | DATETIME | Last update timestamp                              |

### Classroom Sessions

Individual scheduled class sessions within a classroom.

| Column              | Type         | Description                                          |
| ------------------- | ------------ | ---------------------------------------------------- |
| id                  | INT          | Primary key                                          |
| classroom_id        | INT          | FK to classrooms                                     |
| session_no          | INT          | Session number (sequential)                          |
| session_title       | VARCHAR(255) | Session title (nullable)                             |
| session_date        | DATE         | Date of the session                                  |
| start_time          | TIME         | Start time                                           |
| end_time            | TIME         | End time                                             |
| status              | ENUM         | `scheduled`, `completed`, `cancelled`, `rescheduled` |
| location            | VARCHAR(255) | Override location (nullable)                         |
| online_meeting_link | VARCHAR(500) | Override meeting link (nullable)                     |
| teacher_id          | INT          | FK to users (session teacher, nullable)              |
| notes               | TEXT         | Session notes (nullable)                             |
| original_date       | DATE         | Original date before reschedule (nullable)           |
| original_start_time | TIME         | Original start time before reschedule (nullable)     |
| original_end_time   | TIME         | Original end time before reschedule (nullable)       |
| created_at          | DATETIME     | Creation timestamp                                   |
| updated_at          | DATETIME     | Last update timestamp                                |

### Classroom Enrollments

Per-classroom enrollment records for students.

| Column                      | Type     | Description                                                                                                 |
| --------------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| id                          | INT      | Primary key                                                                                                 |
| classroom_id                | INT      | FK to classrooms                                                                                            |
| student_id                  | INT      | FK to users                                                                                                 |
| enrollment_status           | ENUM     | `pending_approval`, `enrolled`, `waitlisted`, `withdrawn`, `transferred`, `rejected`, `completed`, `failed` |
| enrollment_date             | DATETIME | When enrollment was created                                                                                 |
| enrollment_end_date         | DATETIME | When enrollment ended (nullable)                                                                            |
| source                      | ENUM     | `manual`, `self_enrollment`, `transfer`, `invitation`                                                       |
| notes                       | TEXT     | Admin/teacher notes (nullable)                                                                              |
| transferred_to_classroom_id | INT      | FK to classrooms if transferred (nullable)                                                                  |
| created_by                  | INT      | FK to users                                                                                                 |
| updated_by                  | INT      | FK to users                                                                                                 |
| created_at                  | DATETIME | Creation timestamp                                                                                          |
| updated_at                  | DATETIME | Last update timestamp                                                                                       |

---

For more information about using the database, see the [API Reference](./api/authentication).
