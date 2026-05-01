---
sidebar_position: 5
---

# Progress Tracking

Track student progress through courses and lessons with real-time completion tracking.

## Base URL

```
/api/v1/progress
```

## Endpoints

### Update Lesson Progress

Record student progress on a lesson.

**Endpoint:** `POST /api/v1/progress/update`

**Access:** Student

**Authentication:** Required

**Request Body:**

```json
{
  "enrollmentId": 1,
  "lessonId": 5,
  "status": "completed",
  "timeSpent": 15
}
```

| Field        | Type    | Required | Description                               |
| ------------ | ------- | -------- | ----------------------------------------- |
| enrollmentId | integer | Yes      | Enrollment ID                             |
| lessonId     | integer | Yes      | Lesson ID                                 |
| status       | string  | Yes      | `not_started`, `in_progress`, `completed` |
| timeSpent    | integer | No       | Time spent in minutes                     |

**Success Response (200):**

```json
{
  "data": {
    "lesson_progress": {
      "id": 1,
      "enrollment_id": 1,
      "lesson_id": 5,
      "status": "completed",
      "time_spent": 15,
      "completed_at": "2026-03-22T10:00:00.000Z"
    },
    "course_progress": {
      "completion_percentage": 45.5,
      "total_time_spent": 320,
      "last_accessed_at": "2026-03-22T10:00:00.000Z"
    }
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/progress/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enrollmentId": 1,
    "lessonId": 5,
    "status": "completed",
    "timeSpent": 15
  }'
```

---

### Get Student Progress

Get progress for a specific enrollment.

**Endpoint:** `GET /api/v1/progress/enrollment/:enrollmentId`

**Access:** Student (own), Teacher (own courses), Admin

**Authentication:** Required

**URL Parameters:**

| Parameter    | Type    | Description   |
| ------------ | ------- | ------------- |
| enrollmentId | integer | Enrollment ID |

**Success Response (200):**

```json
{
  "data": {
    "enrollment": {
      "id": 1,
      "course_id": 1,
      "course": {
        "title": "Introduction to JavaScript",
        "level": "beginner"
      }
    },
    "course_progress": {
      "completion_percentage": 45.5,
      "total_time_spent": 320,
      "last_accessed_at": "2026-03-22T10:00:00.000Z"
    },
    "lesson_progress": [
      {
        "lesson_id": 1,
        "lesson": {
          "title": "What is JavaScript?",
          "lesson_type": "video"
        },
        "status": "completed",
        "time_spent": 15,
        "completed_at": "2026-03-20T10:00:00.000Z"
      },
      {
        "lesson_id": 2,
        "lesson": {
          "title": "Variables and Data Types",
          "lesson_type": "video"
        },
        "status": "in_progress",
        "time_spent": 8,
        "completed_at": null
      }
    ]
  }
}
```

**Example:**

```bash
curl -X GET http://localhost:8080/api/v1/progress/enrollment/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Get Course Progress

Get progress for all students in a course (teacher/admin only).

**Endpoint:** `GET /api/v1/progress/course/:courseId`

**Access:** Course Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| courseId  | integer | Course ID   |

**Query Parameters:**

| Parameter   | Type    | Description                                        |
| ----------- | ------- | -------------------------------------------------- |
| status      | string  | Filter by status: `active`, `completed`, `dropped` |
| minProgress | integer | Minimum completion percentage (0-100)              |

**Success Response (200):**

```json
{
  "data": {
    "course": {
      "id": 1,
      "title": "Introduction to JavaScript"
    },
    "summary": {
      "total_enrollments": 150,
      "active_enrollments": 120,
      "completed_enrollments": 25,
      "average_completion": 42.5,
      "average_time_spent": 285
    },
    "students": [
      {
        "enrollment_id": 1,
        "student": {
          "id": 5,
          "full_name": "John Doe",
          "email": "john@example.com"
        },
        "completion_percentage": 45.5,
        "total_time_spent": 320,
        "last_accessed_at": "2026-03-22T10:00:00.000Z",
        "status": "active"
      }
    ]
  }
}
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/v1/progress/course/1?status=active&minProgress=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Progress Status

### Lesson Status

- **not_started** - Lesson not yet accessed
- **in_progress** - Lesson started but not completed
- **completed** - Lesson fully completed

### Course Completion

Course completion percentage is calculated based on:

- Number of completed lessons / Total lessons × 100
- Automatically updates enrollment status to "completed" when reaching 100%

## Progress Tracking Features

- **Real-time Updates:** Progress updates immediately
- **Time Tracking:** Tracks time spent on each lesson
- **Completion Tracking:** Monitors lesson and course completion
- **Teacher Dashboard:** Teachers can monitor all student progress
- **Student Dashboard:** Students can view their own progress
