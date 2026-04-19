---
sidebar_position: 8
---

# Notifications

Manage user notifications for progress updates, assignments, rewards, and course announcements.

## Base URL

```
/api/v1/notifications
```

## Notification Types

- **progress** - Course or lesson progress updates
- **assignment** - New assignments or quizzes
- **reward** - Earned rewards and achievements
- **course** - Course updates or announcements
- **general** - System-wide notifications

## Endpoints

### Get Notifications

Get all notifications for the authenticated user.

**Endpoint:** `GET /api/v1/notifications`

**Access:** Authenticated

**Authentication:** Required

**Query Parameters:**

| Parameter | Type    | Description                      |
| --------- | ------- | -------------------------------- |
| unread    | boolean | Filter unread notifications only |
| type      | string  | Filter by notification type      |
| page      | integer | Page number (default: 1)         |
| limit     | integer | Items per page (default: 20)     |

**Success Response (200):**

```json
{
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": "reward",
        "title": "Achievement Unlocked!",
        "message": "You earned the 'Course Completion' badge for finishing JavaScript Basics!",
        "is_read": false,
        "created_at": "2026-03-22T10:00:00.000Z"
      },
      {
        "id": 2,
        "type": "progress",
        "title": "Course Progress Update",
        "message": "You completed 50% of Introduction to JavaScript",
        "is_read": true,
        "created_at": "2026-03-21T15:30:00.000Z"
      }
    ],
    "unread_count": 5,
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 32,
      "total_pages": 2
    }
  }
}
```

**Example:**

```bash
curl -X GET "http://localhost:3000/api/v1/notifications?unread=true&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Mark as Read

Mark a notification as read.

**Endpoint:** `PUT /api/v1/notifications/:id/read`

**Access:** Notification Owner

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description     |
| --------- | ------- | --------------- |
| id        | integer | Notification ID |

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "is_read": true,
    "updated_at": "2026-03-22T10:30:00.000Z"
  }
}
```

**Example:**

```bash
curl -X PUT http://localhost:3000/api/v1/notifications/1/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Mark All as Read

Mark all notifications as read for the authenticated user.

**Endpoint:** `PUT /api/v1/notifications/read-all`

**Access:** Authenticated

**Authentication:** Required

**Success Response (200):**

```json
{
  "data": {
    "message": "All notifications marked as read",
    "count": 5
  }
}
```

**Example:**

```bash
curl -X PUT http://localhost:3000/api/v1/notifications/read-all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Delete Notification

Delete a specific notification.

**Endpoint:** `DELETE /api/v1/notifications/:id`

**Access:** Notification Owner

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description     |
| --------- | ------- | --------------- |
| id        | integer | Notification ID |

**Success Response (200):**

```json
{
  "data": {
    "message": "Notification deleted successfully"
  }
}
```

**Example:**

```bash
curl -X DELETE http://localhost:3000/api/v1/notifications/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Create Notification (Admin/Instructor)

Create a notification for users.

**Endpoint:** `POST /api/v1/notifications`

**Access:** Admin, Instructor

**Authentication:** Required

**Request Body:**

```json
{
  "userId": 5,
  "type": "course",
  "title": "New Course Update",
  "message": "We've added new content to Introduction to JavaScript!"
}
```

| Field   | Type    | Required | Description                                  |
| ------- | ------- | -------- | -------------------------------------------- |
| userId  | integer | Yes      | Target user ID (or array for multiple users) |
| type    | string  | Yes      | Notification type                            |
| title   | string  | Yes      | Notification title                           |
| message | string  | Yes      | Notification message                         |

**Success Response (201):**

```json
{
  "data": {
    "id": 10,
    "user_id": 5,
    "type": "course",
    "title": "New Course Update",
    "message": "We've added new content to Introduction to JavaScript!",
    "is_read": false,
    "created_at": "2026-03-22T10:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 5,
    "type": "course",
    "title": "New Course Update",
    "message": "New content added!"
  }'
```

---

## Automatic Notifications

The system automatically creates notifications for:

### Progress Notifications

- Lesson completion
- Section completion
- Course completion (50%, 75%, 100%)

### Reward Notifications

- Badge earned
- Certificate earned
- Points awarded

### Assignment Notifications

- New quiz available
- Quiz deadline approaching
- Assignment graded

### Course Notifications

- New lesson added
- Course update
- Course announcement

---

## Notification Best Practices

- **Check regularly:** Stay informed of your progress and achievements
- **Enable notifications:** Get timely updates on course activities
- **Clear old notifications:** Keep your inbox manageable
- **Read important notifications:** Don't miss deadlines or updates
