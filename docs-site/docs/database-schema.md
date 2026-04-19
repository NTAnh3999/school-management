# Database Schema

The School Management API uses a relational MySQL database with the following structure:

## Core Tables

### Users

Stores user account information and authentication data.

| Column         | Type         | Description                |
| -------------- | ------------ | -------------------------- |
| id             | INT          | Primary key                |
| email          | VARCHAR(255) | Unique email address       |
| password       | VARCHAR(255) | Hashed password            |
| full_name       | VARCHAR(255) | User's full name           |
| role_id         | INT          | Foreign key to roles table |
| profile_picture | VARCHAR(500) | URL to profile image       |
| created_at      | DATETIME     | Account creation timestamp |
| updated_at      | DATETIME     | Last update timestamp      |

### Roles

Defines user roles and permissions.

| Column      | Type        | Description                            |
| ----------- | ----------- | -------------------------------------- |
| id          | INT         | Primary key                            |
| name        | VARCHAR(50) | Role name (admin, instructor, student) |
| description | TEXT        | Role description                       |

### Courses

Main course information.

| Column       | Type          | Description                       |
| ------------ | ------------- | --------------------------------- |
| id           | INT           | Primary key                       |
| title        | VARCHAR(255)  | Course title                      |
| description  | TEXT          | Course description                |
| instructor_id | INT           | Foreign key to users (instructor) |
| level        | ENUM          | beginner, intermediate, advanced  |
| price        | DECIMAL(10,2) | Course price                      |
| thumbnail_url | VARCHAR(500)  | Course thumbnail image            |
| status       | ENUM          | draft, published, archived        |
| created_at    | DATETIME      | Creation timestamp                |
| updated_at    | DATETIME      | Last update timestamp             |

### Course Sections

Organize courses into sections/modules.

| Column      | Type         | Description            |
| ----------- | ------------ | ---------------------- |
| id          | INT          | Primary key            |
| course_id    | INT          | Foreign key to courses |
| title       | VARCHAR(255) | Section title          |
| description | TEXT         | Section description    |
| order_index  | INT          | Display order          |
| created_at   | DATETIME     | Creation timestamp     |
| updated_at   | DATETIME     | Last update timestamp  |

### Lessons

Individual lesson content.

| Column          | Type         | Description                    |
| --------------- | ------------ | ------------------------------ |
| id              | INT          | Primary key                    |
| section_id       | INT          | Foreign key to course_sections |
| title           | VARCHAR(255) | Lesson title                   |
| content         | TEXT         | Lesson content                 |
| lesson_type      | ENUM         | video, text, quiz, assignment  |
| video_url        | VARCHAR(500) | Video URL (if applicable)      |
| duration_minutes | INT          | Estimated duration             |
| order_index      | INT          | Display order                  |
| created_at       | DATETIME     | Creation timestamp             |
| updated_at       | DATETIME     | Last update timestamp          |

### Enrollments

Student course enrollments.

| Column         | Type     | Description                |
| -------------- | -------- | -------------------------- |
| id             | INT      | Primary key                |
| student_id      | INT      | Foreign key to users       |
| course_id       | INT      | Foreign key to courses     |
| enrollment_date | DATETIME | Enrollment timestamp       |
| status         | ENUM     | active, completed, dropped |
| completion_date | DATETIME | Course completion date     |
| created_at      | DATETIME | Creation timestamp         |
| updated_at      | DATETIME | Last update timestamp      |

## Progress Tracking Tables

### Lesson Progress

Tracks individual lesson completion.

| Column       | Type     | Description                         |
| ------------ | -------- | ----------------------------------- |
| id           | INT      | Primary key                         |
| enrollment_id | INT      | Foreign key to enrollments          |
| lesson_id     | INT      | Foreign key to lessons              |
| status       | ENUM     | not_started, in_progress, completed |
| time_spent    | INT      | Time spent in minutes               |
| completed_at  | DATETIME | Completion timestamp                |
| created_at    | DATETIME | Creation timestamp                  |
| updated_at    | DATETIME | Last update timestamp               |

### Student Course Progress

Overall course progress tracking.

| Column               | Type         | Description                |
| -------------------- | ------------ | -------------------------- |
| id                   | INT          | Primary key                |
| enrollment_id         | INT          | Foreign key to enrollments |
| completion_percentage | DECIMAL(5,2) | Progress percentage        |
| total_time_spent       | INT          | Total time in minutes      |
| last_accessed_at       | DATETIME     | Last access timestamp      |
| created_at            | DATETIME     | Creation timestamp         |
| updated_at            | DATETIME     | Last update timestamp      |

## Assessment Tables

### Quizzes

Quiz definitions.

| Column           | Type         | Description                      |
| ---------------- | ------------ | -------------------------------- |
| id               | INT          | Primary key                      |
| lesson_id         | INT          | Foreign key to lessons           |
| title            | VARCHAR(255) | Quiz title                       |
| description      | TEXT         | Quiz description                 |
| passing_score     | DECIMAL(5,2) | Minimum passing percentage       |
| time_limit_minutes | INT          | Time limit (0 = unlimited)       |
| max_attempts      | INT          | Maximum attempts (0 = unlimited) |
| created_at        | DATETIME     | Creation timestamp               |
| updated_at        | DATETIME     | Last update timestamp            |

### Quiz Questions

Individual quiz questions.

| Column       | Type         | Description                          |
| ------------ | ------------ | ------------------------------------ |
| id           | INT          | Primary key                          |
| quiz_id       | INT          | Foreign key to quizzes               |
| question_text | TEXT         | Question text                        |
| question_type | ENUM         | single_choice, multiple_choice, text |
| points       | DECIMAL(5,2) | Points for correct answer            |
| order_index   | INT          | Display order                        |
| created_at    | DATETIME     | Creation timestamp                   |
| updated_at    | DATETIME     | Last update timestamp                |

### Quiz Options

Answer options for questions.

| Column     | Type     | Description                   |
| ---------- | -------- | ----------------------------- |
| id         | INT      | Primary key                   |
| question_id | INT      | Foreign key to quiz_questions |
| option_text | TEXT     | Option text                   |
| is_correct  | BOOLEAN  | Whether option is correct     |
| order_index | INT      | Display order                 |
| created_at  | DATETIME | Creation timestamp            |
| updated_at  | DATETIME | Last update timestamp         |

### Quiz Attempts

Student quiz attempts.

| Column       | Type         | Description                |
| ------------ | ------------ | -------------------------- |
| id           | INT          | Primary key                |
| quiz_id       | INT          | Foreign key to quizzes     |
| enrollment_id | INT          | Foreign key to enrollments |
| score        | DECIMAL(5,2) | Score percentage           |
| passed       | BOOLEAN      | Whether attempt passed     |
| started_at    | DATETIME     | Attempt start time         |
| completed_at  | DATETIME     | Attempt completion time    |
| created_at    | DATETIME     | Creation timestamp         |
| updated_at    | DATETIME     | Last update timestamp      |

### Quiz Attempt Answers

Individual answers in a quiz attempt.

| Column           | Type     | Description                            |
| ---------------- | -------- | -------------------------------------- |
| id               | INT      | Primary key                            |
| attempt_id        | INT      | Foreign key to quiz_attempts           |
| question_id       | INT      | Foreign key to quiz_questions          |
| selected_option_id | INT      | Foreign key to quiz_options (nullable) |
| text_answer       | TEXT     | Text answer (for text questions)       |
| is_correct        | BOOLEAN  | Whether answer is correct              |
| created_at        | DATETIME | Creation timestamp                     |
| updated_at        | DATETIME | Last update timestamp                  |

## Engagement Tables

### Rewards

Available rewards in the system.

| Column      | Type         | Description                |
| ----------- | ------------ | -------------------------- |
| id          | INT          | Primary key                |
| title       | VARCHAR(255) | Reward title               |
| description | TEXT         | Reward description         |
| reward_type  | ENUM         | certificate, badge, points |
| points_value | INT          | Points value               |
| icon_url     | VARCHAR(500) | Reward icon image          |
| created_at   | DATETIME     | Creation timestamp         |
| updated_at   | DATETIME     | Last update timestamp      |

### Student Rewards

Rewards earned by students.

| Column       | Type     | Description                           |
| ------------ | -------- | ------------------------------------- |
| id           | INT      | Primary key                           |
| student_id    | INT      | Foreign key to users                  |
| reward_id     | INT      | Foreign key to rewards                |
| enrollment_id | INT      | Foreign key to enrollments (nullable) |
| earned_date   | DATETIME | Date reward was earned                |
| created_at    | DATETIME | Creation timestamp                    |
| updated_at    | DATETIME | Last update timestamp                 |

### Course Reviews

Student course reviews and ratings.

| Column     | Type     | Description            |
| ---------- | -------- | ---------------------- |
| id         | INT      | Primary key            |
| course_id   | INT      | Foreign key to courses |
| student_id  | INT      | Foreign key to users   |
| rating     | INT      | Rating (1-5)           |
| review_text | TEXT     | Review content         |
| created_at  | DATETIME | Creation timestamp     |
| updated_at  | DATETIME | Last update timestamp  |

### Lesson Feedback

Lesson-specific feedback.

| Column       | Type     | Description              |
| ------------ | -------- | ------------------------ |
| id           | INT      | Primary key              |
| lesson_id     | INT      | Foreign key to lessons   |
| student_id    | INT      | Foreign key to users     |
| feedback_text | TEXT     | Feedback content         |
| helpfulness  | INT      | Helpfulness rating (1-5) |
| created_at    | DATETIME | Creation timestamp       |
| updated_at    | DATETIME | Last update timestamp    |

### Notifications

User notifications.

| Column    | Type         | Description                                   |
| --------- | ------------ | --------------------------------------------- |
| id        | INT          | Primary key                                   |
| user_id    | INT          | Foreign key to users                          |
| type      | ENUM         | progress, assignment, reward, course, general |
| title     | VARCHAR(255) | Notification title                            |
| message   | TEXT         | Notification message                          |
| is_read    | BOOLEAN      | Read status                                   |
| created_at | DATETIME     | Creation timestamp                            |
| updated_at | DATETIME     | Last update timestamp                         |

### Refresh Tokens

JWT refresh tokens for authentication.

| Column    | Type         | Description           |
| --------- | ------------ | --------------------- |
| id        | INT          | Primary key           |
| user_id    | INT          | Foreign key to users  |
| token     | VARCHAR(500) | Refresh token         |
| expires_at | DATETIME     | Expiration timestamp  |
| created_at | DATETIME     | Creation timestamp    |
| updated_at | DATETIME     | Last update timestamp |

## Relationships

### One-to-Many

- Users → Courses (instructor)
- Users → Enrollments (student)
- Courses → Sections
- Sections → Lessons
- Courses → Enrollments
- Lessons → Quizzes
- Quizzes → Questions
- Questions → Options
- Quizzes → Attempts
- Enrollments → Lesson Progress
- Enrollments → Course Progress
- Users → Notifications
- Users → Rewards (through Student Rewards)

### Many-to-Many

- Users ↔ Courses (through Enrollments)
- Students ↔ Rewards (through Student Rewards)

---

For more information about using the database, see the [API Reference](./api/authentication).


