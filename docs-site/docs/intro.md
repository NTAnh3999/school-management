---
sidebar_position: 1
---

# Welcome to SchoolHub API

Welcome to the **SchoolHub API** documentation! This is a comprehensive Learning Management System (LMS) API built with Node.js, Express, and MySQL.

## 🌟 Features

- 🔐 **User Authentication & Authorization** - Secure JWT-based authentication with role-based access control (Admin, Teacher, Student)
- 📚 **Course Management** - Create and manage courses with department grouping, credit hours, and prerequisite chains
- 📖 **Content Authoring** - Structured content versions (draft → published) with per-lesson learning items and rich media assets
- 📊 **Progress Tracking** - Track student progress with real-time completion rates and time tracking
- ✅ **Quiz & Assessment System** - Multiple question types, auto-grading, and attempt limits
- 🏆 **Rewards & Achievements** - Certificates, badges, and points for gamification
- ⭐ **Reviews & Feedback** - Course ratings and lesson-specific feedback
- 🔔 **Notifications** - Notifications for progress updates, assignments, and rewards

## 🚀 Quick Start

### Base URL

```
http://localhost:8080/api/v1
```

### Authentication

Most endpoints require a JWT access token in the `Authorization` header:

```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Making Your First Request

1. **Register a new user:**

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "fullName": "John Doe",
    "roleName": "student"
  }'
```

2. **Login to get your tokens:**

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

3. **Use the access token to call protected endpoints:**

```bash
curl -X GET http://localhost:8080/api/v1/courses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📖 API Documentation Structure

- **[Authentication](./api/authentication)** - Registration, login, token refresh, and logout
- **[Courses](./api/courses)** - Course creation, management, enrollment, and prerequisites
- **[Sections](./api/sections)** - Course module/section organization
- **[Lessons](./api/lessons)** - Lesson content management
- **[Learning Items](./api/learning-items)** - Granular content units inside a lesson
- **[Content Assets](./api/content-assets)** - Uploaded file metadata (video, image, document, audio)
- **[Content Versions](./api/content-versions)** - Versioned publishing workflow for course content
- **[Progress](./api/progress)** - Student progress tracking
- **[Quizzes](./api/quizzes)** - Quiz creation and submission
- **[Reviews](./api/reviews)** - Course and lesson reviews
- **[Notifications](./api/notifications)** - User notification management
- **[Rewards](./api/rewards)** - Achievement and reward system
- **[Users](./api/users)** - User profile management

## 🔒 Role-Based Access Control

The API implements three user roles:

### Admin

- Full system access
- Manage all users, courses, and rewards
- View all statistics and progress

### Teacher

- Create and manage own courses
- Add sections, lessons, and learning items to own courses
- View student progress in own courses
- Award rewards to students

### Student

- Browse and enroll in active courses
- Access enrolled course content
- Track own progress
- Take quizzes, leave reviews, earn rewards

## 📊 Response Format

All API responses use a consistent envelope:

### Success Response

```json
{
  "message": "OK",
  "code": 200,
  "metadata": {
    // response data here
  }
}
```

### Error Response

```json
{
  "error": true,
  "message": "Human-readable error message",
  "details": null
}
```

## 🔑 Default Seed Accounts

| Role    | Email                | Password    |
| ------- | -------------------- | ----------- |
| Admin   | admin@schoolhub.io   | Admin@123   |
| Teacher | teacher@schoolhub.io | Teacher@123 |
| Student | student@schoolhub.io | Student@123 |

---

Ready to get started? Head to the [Authentication](./api/authentication) guide to obtain your first token.

## 🚀 Quick Start

### Base URL

```
http://localhost:8080/api/v1
```

### Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Making Your First Request

1. **Register a new user:**

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "fullName": "John Doe",
    "roleName": "student"
  }'
```

2. **Login to get your token:**

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

3. **Use the token to access protected endpoints:**

```bash
curl -X GET http://localhost:8080/api/v1/courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📖 API Documentation Structure

This documentation is organized into the following sections:

- **[Authentication](./api/authentication)** - User registration, login, and token management
- **[Courses](./api/courses)** - Course creation, management, and enrollment
- **[Sections](./api/sections)** - Course section organization
- **[Lessons](./api/lessons)** - Lesson content management
- **[Progress](./api/progress)** - Student progress tracking
- **[Quizzes](./api/quizzes)** - Quiz creation and submission
- **[Reviews](./api/reviews)** - Course and lesson reviews
- **[Notifications](./api/notifications)** - User notification management
- **[Rewards](./api/rewards)** - Achievement and reward system
- **[Users](./api/users)** - User profile management

## 🔒 Role-Based Access Control

The API implements three user roles with different permissions:

### Admin

- Full system access
- Manage all users, courses, and rewards
- View all statistics and progress
- Delete any content

### Teacher

- Create and manage own courses
- Add sections, lessons, and quizzes to own courses
- View student progress in own courses
- Award rewards to students
- Cannot modify other teachers' content

### Student

- Browse and enroll in active courses
- Access enrolled course content
- Track own progress
- Take quizzes and view results
- Leave reviews and feedback
- Earn and view rewards

## 📊 Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## 🛠️ Need Help?

- Check the [API Reference](./api/authentication) for detailed endpoint documentation
- Review the [Database Schema](./database-schema) to understand the data model
- Visit the [GitHub Repository](https://github.com/school-management/school-management-api) for source code

---

Ready to get started? Check out the [Authentication](./api/authentication) guide to begin using the API!
