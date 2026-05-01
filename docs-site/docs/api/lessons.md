---
sidebar_position: 4
---

# Lessons

Manage lesson content including videos, text, quizzes, and assignments.

## Base URL

```
/api/v1/lessons
```

## Lesson Types

- **video** - Video-based lesson with URL
- **text** - Text-based lesson content
- **quiz** - Quiz assessment (see [Quizzes](./quizzes))
- **assignment** - Student assignment

## Endpoints

### Create Lesson

Create a new lesson within a section.

**Endpoint:** `POST /api/v1/lessons/section/:sectionId`

**Access:** Course Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| sectionId | integer | Section ID  |

**Request Body:**

```json
{
  "title": "Variables and Data Types",
  "content": "In this lesson, we'll learn about...",
  "lessonType": "video",
  "videoUrl": "https://example.com/video.mp4",
  "durationMinutes": 15,
  "orderIndex": 0
}
```

| Field           | Type    | Required | Description                            |
| --------------- | ------- | -------- | -------------------------------------- |
| title           | string  | Yes      | Lesson title                           |
| content         | string  | Yes      | Lesson content/description             |
| lessonType      | string  | Yes      | `video`, `text`, `quiz`, `assignment`  |
| videoUrl        | string  | No       | Video URL (required for video lessons) |
| durationMinutes | integer | No       | Estimated duration                     |
| orderIndex      | integer | Yes      | Display order                          |

**Success Response (201):**

```json
{
  "data": {
    "id": 1,
    "section_id": 1,
    "title": "Variables and Data Types",
    "content": "In this lesson, we'll learn about...",
    "lesson_type": "video",
    "video_url": "https://example.com/video.mp4",
    "duration_minutes": 15,
    "order_index": 0,
    "created_at": "2026-03-22T10:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/lessons/section/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Variables and Data Types",
    "content": "In this lesson...",
    "lessonType": "video",
    "videoUrl": "https://example.com/video.mp4",
    "durationMinutes": 15,
    "orderIndex": 0
  }'
```

---

### List Lessons

Get all lessons in a section.

**Endpoint:** `GET /api/v1/lessons/section/:sectionId`

**Access:** Public

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| sectionId | integer | Section ID  |

**Success Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Variables and Data Types",
      "lesson_type": "video",
      "duration_minutes": 15,
      "order_index": 0,
      "has_quiz": true
    }
  ]
}
```

**Example:**

```bash
curl -X GET http://localhost:8080/api/v1/lessons/section/1
```

---

### Get Lesson Details

Get detailed information about a lesson.

**Endpoint:** `GET /api/v1/lessons/:id`

**Access:** Authenticated (enrolled students, course owner, admin)

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Lesson ID   |

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "title": "Variables and Data Types",
    "content": "In this lesson, we'll learn about...",
    "lesson_type": "video",
    "video_url": "https://example.com/video.mp4",
    "duration_minutes": 15,
    "order_index": 0,
    "section": {
      "id": 1,
      "title": "Getting Started",
      "course": {
        "id": 1,
        "title": "Introduction to JavaScript"
      }
    },
    "quiz": {
      "id": 1,
      "title": "Variables Quiz",
      "question_count": 5
    },
    "progress": {
      "status": "in_progress",
      "time_spent": 8,
      "completed_at": null
    }
  }
}
```

**Example:**

```bash
curl -X GET http://localhost:8080/api/v1/lessons/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Update Lesson

Update an existing lesson.

**Endpoint:** `PUT /api/v1/lessons/:id`

**Access:** Course Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Lesson ID   |

**Request Body:**

```json
{
  "title": "Updated Lesson Title",
  "videoUrl": "https://example.com/new-video.mp4",
  "durationMinutes": 20
}
```

All fields are optional.

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "title": "Updated Lesson Title",
    "video_url": "https://example.com/new-video.mp4",
    "duration_minutes": 20,
    "updated_at": "2026-03-22T10:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X PUT http://localhost:8080/api/v1/lessons/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Lesson Title",
    "durationMinutes": 20
  }'
```

---

### Delete Lesson

Delete a lesson.

**Endpoint:** `DELETE /api/v1/lessons/:id`

**Access:** Course Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Lesson ID   |

**Success Response (200):**

```json
{
  "data": {
    "message": "Lesson deleted successfully"
  }
}
```

**Example:**

```bash
curl -X DELETE http://localhost:8080/api/v1/lessons/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Archive Lesson

Soft-archive a lesson without deleting it. Sets `status = 'archived'`. Archived lessons are excluded from published content structures.

**Endpoint:** `PATCH /api/v1/lessons/:id/archive`

**Access:** Course Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Lesson ID   |

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "title": "Variables and Data Types",
    "status": "archived",
    "updated_at": "2026-04-27T10:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X PATCH http://localhost:8080/api/v1/lessons/1/archive \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Submit Lesson Feedback

Students can provide feedback on lessons.

**Endpoint:** `POST /api/v1/lessons/:id/feedback`

**Access:** Student (enrolled)

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Lesson ID   |

**Request Body:**

```json
{
  "feedbackText": "Great lesson! Very clear explanation.",
  "helpfulness": 5
}
```

| Field        | Type    | Required | Description      |
| ------------ | ------- | -------- | ---------------- |
| feedbackText | string  | Yes      | Feedback content |
| helpfulness  | integer | Yes      | Rating 1-5       |

**Success Response (201):**

```json
{
  "data": {
    "id": 1,
    "lesson_id": 1,
    "student_id": 5,
    "feedback_text": "Great lesson! Very clear explanation.",
    "helpfulness": 5,
    "created_at": "2026-03-22T10:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/lessons/1/feedback \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "feedbackText": "Great lesson!",
    "helpfulness": 5
  }'
```

---

## Lesson Best Practices

- **Video Lessons:** Keep videos 5-15 minutes for optimal engagement
- **Text Lessons:** Use clear formatting and include examples
- **Quiz Lessons:** Place quizzes after teaching concepts
- **Assignments:** Provide clear instructions and deadlines
