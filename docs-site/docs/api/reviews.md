---
sidebar_position: 7
---

# Reviews

Manage course reviews and lesson feedback from students.

## Base URL

```
/api/v1/reviews
```

## Endpoints

### Create Course Review

Submit a review for a course.

**Endpoint:** `POST /api/v1/reviews/course/:courseId`

**Access:** Student (enrolled)

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| courseId  | integer | Course ID   |

**Request Body:**

```json
{
  "rating": 5,
  "reviewText": "Excellent course! Very well structured and easy to follow."
}
```

| Field      | Type    | Required | Description     |
| ---------- | ------- | -------- | --------------- |
| rating     | integer | Yes      | Rating from 1-5 |
| reviewText | string  | No       | Review content  |

**Success Response (201):**

```json
{
  "data": {
    "id": 1,
    "course_id": 1,
    "student_id": 5,
    "rating": 5,
    "review_text": "Excellent course! Very well structured and easy to follow.",
    "student": {
      "full_name": "John Doe",
      "profile_picture": "https://example.com/profile.jpg"
    },
    "created_at": "2026-03-22T10:00:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Already reviewed or not enrolled
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Course not found

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/reviews/course/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "reviewText": "Excellent course!"
  }'
```

---

### Update Review

Update an existing review.

**Endpoint:** `PUT /api/v1/reviews/:id`

**Access:** Review Owner

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Review ID   |

**Request Body:**

```json
{
  "rating": 4,
  "reviewText": "Good course, but could use more examples."
}
```

All fields are optional.

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "rating": 4,
    "review_text": "Good course, but could use more examples.",
    "updated_at": "2026-03-22T10:30:00.000Z"
  }
}
```

**Example:**

```bash
curl -X PUT http://localhost:8080/api/v1/reviews/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "reviewText": "Good course, but could use more examples."
  }'
```

---

### Get Course Reviews

Get all reviews for a course.

**Endpoint:** `GET /api/v1/reviews/course/:courseId`

**Access:** Public

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| courseId  | integer | Course ID   |

**Query Parameters:**

| Parameter | Type    | Description                  |
| --------- | ------- | ---------------------------- |
| rating    | integer | Filter by rating (1-5)       |
| page      | integer | Page number (default: 1)     |
| limit     | integer | Items per page (default: 10) |

**Success Response (200):**

```json
{
  "data": {
    "reviews": [
      {
        "id": 1,
        "rating": 5,
        "review_text": "Excellent course!",
        "student": {
          "id": 5,
          "full_name": "John Doe",
          "profile_picture": "https://example.com/profile.jpg"
        },
        "created_at": "2026-03-22T10:00:00.000Z"
      }
    ],
    "summary": {
      "average_rating": 4.5,
      "total_reviews": 42,
      "rating_distribution": {
        "5": 25,
        "4": 10,
        "3": 5,
        "2": 1,
        "1": 1
      }
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "total_pages": 5
    }
  }
}
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/v1/reviews/course/1?page=1&limit=10"
```

---

### Delete Review

Delete a review.

**Endpoint:** `DELETE /api/v1/reviews/:id`

**Access:** Review Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Review ID   |

**Success Response (200):**

```json
{
  "data": {
    "message": "Review deleted successfully"
  }
}
```

**Example:**

```bash
curl -X DELETE http://localhost:8080/api/v1/reviews/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Get Lesson Feedback

Get feedback for a specific lesson.

**Endpoint:** `GET /api/v1/reviews/lesson/:lessonId/feedback`

**Access:** Course Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| lessonId  | integer | Lesson ID   |

**Success Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "feedback_text": "Great lesson! Very clear explanation.",
      "helpfulness": 5,
      "student": {
        "full_name": "John Doe"
      },
      "created_at": "2026-03-22T10:00:00.000Z"
    }
  ],
  "summary": {
    "average_helpfulness": 4.7,
    "total_feedback": 15
  }
}
```

**Example:**

```bash
curl -X GET http://localhost:8080/api/v1/reviews/lesson/1/feedback \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Review Guidelines

### Rating Scale

- **5 stars** - Excellent, exceeded expectations
- **4 stars** - Very good, met expectations
- **3 stars** - Good, with room for improvement
- **2 stars** - Fair, needs significant improvement
- **1 star** - Poor, did not meet expectations

### Review Best Practices

- Provide constructive feedback
- Be specific about what you liked/disliked
- Help other students make informed decisions
- Keep reviews respectful and professional
