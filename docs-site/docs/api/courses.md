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

Get a list of all active courses (public) or all courses (admin/teacher).

**Endpoint:** `GET /api/v1/courses`

**Access:** Public

**Query Parameters:**

| Parameter    | Type    | Description                                                 |
| ------------ | ------- | ----------------------------------------------------------- |
| keyword      | string  | Search by title or description                              |
| level        | string  | Filter by level: `beginner`, `intermediate`, `advanced`     |
| status       | string  | Filter by status: `draft`, `active`, `inactive`, `archived` |
| teacherId    | integer | Filter by teacher ID                                        |
| departmentId | integer | Filter by department ID                                     |
| courseType   | string  | Filter by course type                                       |
| page         | integer | Page number (default: 1)                                    |
| page_size    | integer | Items per page (default: 10, max: 100)                      |

**Success Response (200):**

```json
{
  "message": "OK",
  "code": 200,
  "metadata": {
    "courses": [
      {
        "id": 1,
        "course_code": "CS-101",
        "title": "Introduction to JavaScript",
        "description": "Learn JavaScript fundamentals",
        "course_type": "general",
        "level": "beginner",
        "price": "49.99",
        "thumbnail_url": "https://example.com/thumb.jpg",
        "status": "active",
        "teacher": {
          "id": 2,
          "full_name": "Jane Smith",
          "email": "teacher@schoolhub.io"
        },
        "created_at": "2026-03-01T10:00:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "page_size": 10
  }
}
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/v1/courses?level=beginner&page=1&page_size=10"
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
    "teacher": {
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
curl -X GET http://localhost:8080/api/v1/courses/1
```

---

### Create Course

Create a new course (Admin only).

**Endpoint:** `POST /api/v1/courses`

**Access:** Admin

**Authentication:** Required

**Request Body:**

```json
{
  "course_code": "CS-101",
  "title": "Introduction to JavaScript",
  "description": "Learn JavaScript fundamentals",
  "level": "beginner",
  "price": 49.99,
  "course_type": "general",
  "department_id": 1,
  "credit": 3.0,
  "duration_hours": 20.0
}
```

| Field          | Type    | Required | Description                               |
| -------------- | ------- | -------- | ----------------------------------------- |
| course_code    | string  | Yes      | Unique course code (e.g. `CS-101`)        |
| title          | string  | Yes      | Course title                              |
| description    | string  | No       | Course description                        |
| level          | string  | No       | `beginner`, `intermediate`, or `advanced` |
| price          | decimal | No       | Course price (default: 0)                 |
| course_type    | string  | No       | Course type (default: `general`)          |
| department_id  | integer | No       | Department ID                             |
| credit         | decimal | No       | Credit hours                              |
| duration_hours | decimal | No       | Total duration in hours                   |
| effective_from | date    | No       | Start date (`YYYY-MM-DD`)                 |
| effective_to   | date    | No       | End date (`YYYY-MM-DD`)                   |

**Success Response (201):**

```json
{
  "message": "Course created",
  "code": 201,
  "metadata": {
    "course": {
      "id": 10,
      "course_code": "CS-101",
      "title": "Introduction to JavaScript",
      "status": "draft",
      "teacher_id": 2,
      "created_at": "2026-03-22T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation error or duplicate `course_code`
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_code": "CS-101",
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
curl -X PUT http://localhost:8080/api/v1/courses/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
curl -X DELETE http://localhost:8080/api/v1/courses/1 \
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
curl -X POST http://localhost:8080/api/v1/courses/1/enroll \
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
        "teacher": {
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
curl -X GET http://localhost:8080/api/v1/courses/my/enrollments \
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
