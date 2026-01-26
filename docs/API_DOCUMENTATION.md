# School Management API - Comprehensive Documentation

A complete Learning Management System (LMS) API built with Node.js, Express, and MySQL/Sequelize.

## 🌟 Features

- 🔐 **User Authentication & Authorization** (Admin, Instructor, Student roles)
- 📚 **Course Management** (Create, publish, enroll with multiple levels)
- 📖 **Content Management** (Sections, Lessons with videos/text/quizzes)
- 📊 **Progress Tracking** (Student progress, completion rates, time tracking)
- ✅ **Quiz & Assessment System** (Multiple question types, auto-grading, attempt limits)
- 🏆 **Rewards & Achievements** (Certificates, badges, points)
- ⭐ **Reviews & Feedback** (Course ratings, lesson feedback)
- 🔔 **Notifications** (Progress updates, assignments, rewards)

## 📋 Database Schema Overview

### Core Tables

- **users** - User accounts with roles
- **roles** - Admin, Instructor, Student
- **courses** - Course information with levels and status
- **course_sections** - Course modules/sections
- **lessons** - Individual lessons (video, text, quiz, assignment)
- **enrollments** - Student course enrollments
- **lesson_progress** - Student progress per lesson
- **student_course_progress** - Overall course completion tracking

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
  "roleName": "student" // or "instructor", "admin"
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
GET /api/v1/courses?level=beginner&status=published&instructorId=1
```

#### Get Course Details (Public)

```http
GET /api/v1/courses/:id
```

#### Create Course (Instructor/Admin)

```http
POST /api/v1/courses
Authorization: Bearer {token}
{
  "title": "Introduction to JavaScript",
  "description": "Learn JavaScript fundamentals",
  "level": "beginner",
  "price": 49.99
}
```

#### Update Course (Owner/Admin)

```http
PUT /api/v1/courses/:id
Authorization: Bearer {token}
{
  "title": "Updated title",
  "status": "published"
}
```

#### Delete Course (Owner/Admin)

```http
DELETE /api/v1/courses/:id
Authorization: Bearer {token}
```

#### Enroll in Course (Student)

```http
POST /api/v1/courses/:id/enroll
Authorization: Bearer {token}
```

#### Get My Enrollments (Student)

```http
GET /api/v1/courses/my/enrollments
Authorization: Bearer {token}
```

### Course Sections

#### Create Section (Instructor/Admin)

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

#### Delete Section (Owner/Admin)

```http
DELETE /api/v1/sections/:id
Authorization: Bearer {token}
```

### Lessons

#### Create Lesson (Instructor/Admin)

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

#### Get Course Progress (Instructor)

```http
GET /api/v1/progress/course/:courseId
Authorization: Bearer {token}
```

### Quizzes

#### Create Quiz (Instructor/Admin)

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

#### Add Question (Instructor/Admin)

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
# Instructors/Admins see full quiz data
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

#### Award Reward (Admin/Instructor)

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

### Instructor

- Create and manage own courses
- Add sections, lessons, quizzes to own courses
- View student progress in own courses
- Award rewards to students in own courses
- Cannot modify other instructors' content

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

3. **Instructor Dashboard**
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
   - Manual awards by instructors/admins

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
