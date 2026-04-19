---
sidebar_position: 9
---

# Rewards

Manage the gamification system with certificates, badges, and points.

## Base URL

```
/api/v1/rewards
```

## Reward Types

- **certificate** - Course completion certificates
- **badge** - Achievement badges
- **points** - Point-based rewards

## Endpoints

### Get All Rewards

Get all available rewards in the system.

**Endpoint:** `GET /api/v1/rewards`

**Access:** Authenticated

**Authentication:** Required

**Query Parameters:**

| Parameter  | Type   | Description                                      |
| ---------- | ------ | ------------------------------------------------ |
| rewardType | string | Filter by type: `certificate`, `badge`, `points` |

**Success Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Course Completion Certificate",
      "description": "Awarded for completing a course",
      "reward_type": "certificate",
      "points_value": 100,
      "icon_url": "https://example.com/certificate.png",
      "created_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "title": "Quick Learner Badge",
      "description": "Complete a course in under 1 week",
      "reward_type": "badge",
      "points_value": 50,
      "icon_url": "https://example.com/badge.png",
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

**Example:**

```bash
curl -X GET http://localhost:3000/api/v1/rewards \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Get My Rewards

Get all rewards earned by the authenticated student.

**Endpoint:** `GET /api/v1/rewards/my`

**Access:** Student

**Authentication:** Required

**Query Parameters:**

| Parameter  | Type   | Description    |
| ---------- | ------ | -------------- |
| rewardType | string | Filter by type |

**Success Response (200):**

```json
{
  "data": {
    "rewards": [
      {
        "id": 1,
        "student_id": 5,
        "reward": {
          "id": 1,
          "title": "Course Completion Certificate",
          "description": "Awarded for completing a course",
          "reward_type": "certificate",
          "points_value": 100,
          "icon_url": "https://example.com/certificate.png"
        },
        "enrollment": {
          "id": 10,
          "course": {
            "id": 1,
            "title": "Introduction to JavaScript"
          }
        },
        "earned_date": "2026-03-20T10:00:00.000Z"
      }
    ],
    "summary": {
      "total_rewards": 5,
      "total_points": 350,
      "certificates": 2,
      "badges": 3
    }
  }
}
```

**Example:**

```bash
curl -X GET http://localhost:3000/api/v1/rewards/my \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Create Reward

Create a new reward (admin only).

**Endpoint:** `POST /api/v1/rewards`

**Access:** Admin

**Authentication:** Required

**Request Body:**

```json
{
  "title": "Course Completion Certificate",
  "description": "Awarded for completing a course",
  "rewardType": "certificate",
  "pointsValue": 100,
  "iconUrl": "https://example.com/certificate.png"
}
```

| Field       | Type    | Required | Description                         |
| ----------- | ------- | -------- | ----------------------------------- |
| title       | string  | Yes      | Reward title                        |
| description | string  | Yes      | Reward description                  |
| rewardType  | string  | Yes      | `certificate`, `badge`, or `points` |
| pointsValue | integer | Yes      | Points value                        |
| iconUrl     | string  | No       | Reward icon/image URL               |

**Success Response (201):**

```json
{
  "data": {
    "id": 5,
    "title": "Course Completion Certificate",
    "description": "Awarded for completing a course",
    "reward_type": "certificate",
    "points_value": 100,
    "icon_url": "https://example.com/certificate.png",
    "created_at": "2026-03-22T10:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/rewards \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Course Completion Certificate",
    "description": "Awarded for completing a course",
    "rewardType": "certificate",
    "pointsValue": 100
  }'
```

---

### Award Reward

Award a reward to a student.

**Endpoint:** `POST /api/v1/rewards/award`

**Access:** Admin, Instructor

**Authentication:** Required

**Request Body:**

```json
{
  "studentId": 5,
  "rewardId": 2,
  "enrollmentId": 10
}
```

| Field        | Type    | Required | Description                             |
| ------------ | ------- | -------- | --------------------------------------- |
| studentId    | integer | Yes      | Student user ID                         |
| rewardId     | integer | Yes      | Reward ID to award                      |
| enrollmentId | integer | No       | Related enrollment (for course rewards) |

**Success Response (201):**

```json
{
  "data": {
    "id": 15,
    "student_id": 5,
    "reward_id": 2,
    "enrollment_id": 10,
    "earned_date": "2026-03-22T10:00:00.000Z",
    "reward": {
      "title": "Quick Learner Badge",
      "reward_type": "badge",
      "points_value": 50
    },
    "student": {
      "full_name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Reward already earned or student not enrolled
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Student, reward, or enrollment not found

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/rewards/award \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 5,
    "rewardId": 2,
    "enrollmentId": 10
  }'
```

---

### Update Reward

Update an existing reward (admin only).

**Endpoint:** `PUT /api/v1/rewards/:id`

**Access:** Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Reward ID   |

**Request Body:**

```json
{
  "title": "Updated Reward Title",
  "pointsValue": 150
}
```

All fields are optional.

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "title": "Updated Reward Title",
    "points_value": 150,
    "updated_at": "2026-03-22T10:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X PUT http://localhost:3000/api/v1/rewards/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pointsValue": 150
  }'
```

---

### Delete Reward

Delete a reward (admin only).

**Endpoint:** `DELETE /api/v1/rewards/:id`

**Access:** Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Reward ID   |

**Success Response (200):**

```json
{
  "data": {
    "message": "Reward deleted successfully"
  }
}
```

**Example:**

```bash
curl -X DELETE http://localhost:3000/api/v1/rewards/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Automatic Reward Triggers

The system can automatically award rewards based on:

### Course Completion

- Certificate awarded when student completes 100% of course
- Notification sent to student

### Quiz Performance

- Badges for perfect scores
- Points for passing quizzes

### Milestone Achievements

- Badges for completing first course
- Points for consistent learning streaks
- Special badges for fast completion

### Engagement

- Points for leaving reviews
- Badges for active participation
- Rewards for helping other students

---

## Gamification Strategy

### Points System

- **Course Completion:** 100 points
- **Quiz Passed:** 10-50 points (based on difficulty)
- **Perfect Score:** 25 bonus points
- **Course Review:** 5 points
- **Lesson Feedback:** 2 points

### Badge Hierarchy

- **Bronze:** Basic achievements
- **Silver:** Intermediate milestones
- **Gold:** Advanced accomplishments
- **Platinum:** Expert-level achievements

### Certificates

- **Course Completion:** Awarded for 100% completion
- **Specialization:** For completing course series
- **Excellence:** For maintaining high quiz scores

---

## Best Practices

- **Set Clear Goals:** Communicate what achievements unlock rewards
- **Balance Difficulty:** Make rewards achievable but meaningful
- **Regular Updates:** Add new rewards to maintain engagement
- **Celebrate Success:** Use notifications to celebrate achievements
- **Track Progress:** Show students how close they are to rewards
