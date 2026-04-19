---
sidebar_position: 2
---

# Courses

Manage courses including creation, updates, enrollment, and listing.

## Base URL

```
/api/v1/courses
```

## Endpoints

### List Courses

Get a list of all published courses (public) or all courses (admin/instructor).

**Endpoint:** `GET /api/v1/courses`

**Access:** Public

**Query Parameters:**

| Parameter    | Type    | Description                                             |
| ------------ | ------- | ------------------------------------------------------- |
| level        | string  | Filter by level: `beginner`, `intermediate`, `advanced` |
| status       | string  | Filter by status: `draft`, `published`, `archived`      |
| instructorId | integer | Filter by instructor ID                                 |
| page         | integer | Page number (default: 1)                                |
| limit        | integer | Items per page (default: 10)                            |

**Success Response (200):**

```json
{
  "data": {
    "courses": [
      {
        "id": 1,
        "title": "Introduction to JavaScript",
        "description": "Learn JavaScript fundamentals",
        "level": "beginner",
        "price": 49.99,
        "thumbnail_url": "https://example.com/thumb.jpg",
        "status": "published",
        "instructor": {
          "id": 2,
          "full_name": "Jane Smith",
          "email": "instructor@example.com"
        },
        "created_at": "2026-03-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "total_pages": 3
    }
  }
}
```

**Example:**

```bash
curl -X GET "http://localhost:3000/api/v1/courses?level=beginner&page=1&limit=10"
```

---

### Get Course Details

Get detailed information about a specific course.

**Endpoint:** `GET /api/v1/courses/:id`

**Access:** Public

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Course ID   |

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "title": "Introduction to JavaScript",
    "description": "Learn JavaScript fundamentals...",
    "level": "beginner",
    "price": 49.99,
    "thumbnail_url": "https://example.com/thumb.jpg",
    "status": "published",
    "instructor": {
      "id": 2,
      "full_name": "Jane Smith",
      "profile_picture": "https://example.com/profile.jpg"
    },
    "sections": [
      {
        "id": 1,
        "title": "Getting Started",
        "description": "Introduction to the course",
        "order_index": 0,
        "lessons": [
          {
            "id": 1,
            "title": "What is JavaScript?",
            "lesson_type": "video",
            "duration_minutes": 10,
            "order_index": 0
          }
        ]
      }
    ],
    "enrollment_count": 150,
    "average_rating": 4.5,
    "review_count": 42,
    "created_at": "2026-03-01T10:00:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found` - Course not found
- `500 Internal Server Error` - Server error

**Example:**

```bash
curl -X GET http://localhost:3000/api/v1/courses/1
```

---

### Create Course

Create a new course (instructor or admin only).

**Endpoint:** `POST /api/v1/courses`

**Access:** Instructor, Admin

**Authentication:** Required

**Request Body:**

```json
{
  "title": "Introduction to JavaScript",
  "description": "Learn JavaScript fundamentals",
  "level": "beginner",
  "price": 49.99,
  "thumbnailUrl": "https://example.com/thumb.jpg"
}
```

| Field        | Type    | Required | Description                               |
| ------------ | ------- | -------- | ----------------------------------------- |
| title        | string  | Yes      | Course title                              |
| description  | string  | Yes      | Course description                        |
| level        | string  | Yes      | `beginner`, `intermediate`, or `advanced` |
| price        | decimal | Yes      | Course price (0 for free)                 |
| thumbnailUrl | string  | No       | Course thumbnail image URL                |

**Success Response (201):**

```json
{
  "data": {
    "id": 10,
    "title": "Introduction to JavaScript",
    "description": "Learn JavaScript fundamentals",
    "level": "beginner",
    "price": 49.99,
    "thumbnail_url": "https://example.com/thumb.jpg",
    "status": "draft",
    "instructor_id": 2,
    "created_at": "2026-03-22T10:00:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Server error

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to JavaScript",
    "description": "Learn JavaScript fundamentals",
    "level": "beginner",
    "price": 49.99
  }'
```

---

### Update Course

Update an existing course (owner or admin only).

**Endpoint:** `PUT /api/v1/courses/:id`

**Access:** Course Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Course ID   |

**Request Body:**

```json
{
  "title": "Updated Course Title",
  "status": "published",
  "price": 59.99
}
```

All fields are optional. Only provided fields will be updated.

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "title": "Updated Course Title",
    "description": "Learn JavaScript fundamentals",
    "level": "beginner",
    "price": 59.99,
    "status": "published",
    "updated_at": "2026-03-22T10:00:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not course owner
- `404 Not Found` - Course not found
- `500 Internal Server Error` - Server error

**Example:**

```bash
curl -X PUT http://localhost:3000/api/v1/courses/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published",
    "price": 59.99
  }'
```

---

### Delete Course

Delete a course (owner or admin only).

**Endpoint:** `DELETE /api/v1/courses/:id`

**Access:** Course Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Course ID   |

**Success Response (200):**

```json
{
  "data": {
    "message": "Course deleted successfully"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not course owner
- `404 Not Found` - Course not found
- `500 Internal Server Error` - Server error

**Example:**

```bash
curl -X DELETE http://localhost:3000/api/v1/courses/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Enroll in Course

Enroll a student in a course.

**Endpoint:** `POST /api/v1/courses/:id/enroll`

**Access:** Student

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Course ID   |

**Success Response (201):**

```json
{
  "data": {
    "id": 50,
    "student_id": 5,
    "course_id": 1,
    "enrollment_date": "2026-03-22T10:00:00.000Z",
    "status": "active",
    "course": {
      "id": 1,
      "title": "Introduction to JavaScript",
      "level": "beginner"
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Already enrolled
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a student role
- `404 Not Found` - Course not found
- `500 Internal Server Error` - Server error

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/courses/1/enroll \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Get My Enrollments

Get all courses the authenticated student is enrolled in.

**Endpoint:** `GET /api/v1/courses/my/enrollments`

**Access:** Student

**Authentication:** Required

**Query Parameters:**

| Parameter | Type   | Description                                        |
| --------- | ------ | -------------------------------------------------- |
| status    | string | Filter by status: `active`, `completed`, `dropped` |

**Success Response (200):**

```json
{
  "data": [
    {
      "id": 50,
      "enrollment_date": "2026-03-22T10:00:00.000Z",
      "status": "active",
      "completion_date": null,
      "course": {
        "id": 1,
        "title": "Introduction to JavaScript",
        "level": "beginner",
        "thumbnail_url": "https://example.com/thumb.jpg",
        "instructor": {
          "full_name": "Jane Smith"
        }
      },
      "progress": {
        "completion_percentage": 45.5,
        "total_time_spent": 320,
        "last_accessed_at": "2026-03-21T15:30:00.000Z"
      }
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

**Example:**

```bash
curl -X GET http://localhost:3000/api/v1/courses/my/enrollments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Course Status

Courses can have one of three statuses:

- **draft** - Course is being created, not visible to students
- **published** - Course is live and available for enrollment
- **archived** - Course is no longer accepting new enrollments

## Course Levels

- **beginner** - Introductory course
- **intermediate** - Requires some prior knowledge
- **advanced** - Expert-level course
