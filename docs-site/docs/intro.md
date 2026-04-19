---
sidebar_position: 1
---

# Welcome to School Management API

Welcome to the **School Management API** documentation! This is a comprehensive Learning Management System (LMS) API built with Node.js, Express, and MySQL.

## 🌟 Features

- 🔐 **User Authentication & Authorization** - Secure JWT-based authentication with role-based access control (Admin, Instructor, Student)
- 📚 **Course Management** - Create, publish, and manage courses with multiple difficulty levels
- 📖 **Content Management** - Organize courses into sections with lessons supporting videos, text, quizzes, and assignments
- 📊 **Progress Tracking** - Track student progress with real-time completion rates and time tracking
- ✅ **Quiz & Assessment System** - Multiple question types, auto-grading, and attempt limits
- 🏆 **Rewards & Achievements** - Certificates, badges, and points for gamification
- ⭐ **Reviews & Feedback** - Course ratings and lesson-specific feedback
- 🔔 **Notifications** - Real-time notifications for progress updates, assignments, and rewards

## 🚀 Quick Start

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Making Your First Request

1. **Register a new user:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
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
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

3. **Use the token to access protected endpoints:**

```bash
curl -X GET http://localhost:3000/api/v1/courses \
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

### Instructor

- Create and manage own courses
- Add sections, lessons, and quizzes to own courses
- View student progress in own courses
- Award rewards to students
- Cannot modify other instructors' content

### Student

- Browse and enroll in published courses
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
