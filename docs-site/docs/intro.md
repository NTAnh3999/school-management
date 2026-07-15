---
sidebar_position: 1
---

# Welcome to SchoolHub API

SchoolHub is a multi-module LMS API built with Node.js, Express, Sequelize, and MySQL. This site documents the route surface currently mounted under `/api/v1`.

## What is covered

- JWT authentication and refresh-token flows
- IAM permissions, tenant memberships, and session revocation
- Course authoring with modules, lessons, learning items, assets, and content versions
- Enrollments, progress tracking, quizzes, and assessments
- Operational classroom scheduling, notifications, rewards, and reviews

## Base URL

```text
http://localhost:8080/api/v1
```

## Authentication

Most endpoints require a Bearer token:

```text
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Quick Start

1. Register:

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

2. Log in:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

3. Call a protected endpoint:

```bash
curl -X GET http://localhost:8080/api/v1/courses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## API Reference

- **[Authentication](./api/authentication)** - register, login, refresh, logout
- **[IAM](./api/iam)** - user accounts, memberships, scoped role assignments, authorization checks
- **[Org Structure](./api/org-structure)** - branches, campuses, and locations that IAM scope is checked against
- **[Profiles](./api/profiles)** - business profile data for students, parents, teachers, and staff
- **[Courses](./api/courses)** - course catalog and lifecycle
- **[Enrollments](./api/enrollments)** - eligibility, enrollment state, activation, suspension, completion
- **[Classrooms](./api/classrooms)** - operational delivery of courses
- **[Modules](./api/modules)** - course structure between courses and lessons
- **[Lessons](./api/lessons)** - lesson authoring and ordering
- **[Learning Items](./api/learning-items)** - granular lesson content units
- **[Content Assets](./api/content-assets)** - uploaded media registry
- **[Content Versions](./api/content-versions)** - versioned course publishing
- **[Progress](./api/progress)** - lesson and course progress
- **[Assessments](./api/assessments)** - assessments, attempts, grading, result publication
- **[Quizzes](./api/quizzes)** - quiz-specific authoring and attempts
- **[Schedules](./api/schedules)** - session planning, recurring series, conflict checks, import/export
- **[Reviews](./api/reviews)** - course and lesson feedback
- **[Notifications](./api/notifications)** - inbox and read state
- **[Rewards](./api/rewards)** - badges, points, certificates
- **[Users](./api/users)** - core user management

## Response Envelope

Successful responses use the common API envelope:

```json
{
  "message": "OK",
  "code": 200,
  "metadata": {}
}
```

Errors use the shared error format:

```json
{
  "error": true,
  "message": "Human-readable error message",
  "details": null
}
```

## Default Seed Accounts

| Role    | Email                | Password    |
| ------- | -------------------- | ----------- |
| Admin   | admin@schoolhub.io   | Admin@123   |
| Teacher | teacher@schoolhub.io | Teacher@123 |
| Student | student@schoolhub.io | Student@123 |
| Parent  | parent@schoolhub.io  | Parent@123  |

Start with [Authentication](./api/authentication) if you need a token first.
