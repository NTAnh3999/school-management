---
sidebar_position: 3
---

# Sections

Manage course sections to organize lessons into modules.

## Base URL

```
/api/v1/sections
```

## Endpoints

### Create Section

Create a new section within a course.

**Endpoint:**: `POST /api/v1/sections/course/:courseId`

**Access:** Course Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| courseId  | integer | Course ID   |

**Request Body:**

```json
{
  "title": "Getting Started",
  "description": "Introduction to the course",
  "orderIndex": 0
}
```

| Field       | Type    | Required | Description             |
| ----------- | ------- | -------- | ----------------------- |
| title       | string  | Yes      | Section title           |
| description | string  | No       | Section description     |
| orderIndex  | integer | Yes      | Display order (0-based) |

**Success Response (201):**

```json
{
  "data": {
    "id": 1,
    "course_id": 1,
    "title": "Getting Started",
    "description": "Introduction to the course",
    "order_index": 0,
    "created_at": "2026-03-22T10:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/sections/course/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started",
    "description": "Introduction to the course",
    "orderIndex": 0
  }'
```

---

### List Sections

Get all sections for a course.

**Endpoint:** `GET /api/v1/sections/course/:courseId`

**Access:** Public

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| courseId  | integer | Course ID   |

**Success Response (200):**

```json
{
  "data": [
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
  ]
}
```

**Example:**

```bash
curl -X GET http://localhost:8080/api/v1/sections/course/1
```

---

### Update Section

Update an existing section.

**Endpoint:** `PUT /api/v1/sections/:id`

**Access:** Course Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Section ID  |

**Request Body:**

```json
{
  "title": "Updated Section Title",
  "orderIndex": 1
}
```

All fields are optional.

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "title": "Updated Section Title",
    "description": "Introduction to the course",
    "order_index": 1,
    "updated_at": "2026-03-22T10:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X PUT http://localhost:8080/api/v1/sections/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Section Title"
  }'
```

---

### Delete Section

Delete a section and all its lessons.

**Endpoint:** `DELETE /api/v1/sections/:id`

**Access:** Course Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Section ID  |

**Success Response (200):**

```json
{
  "data": {
    "message": "Section deleted successfully"
  }
}
```

**Example:**

```bash
curl -X DELETE http://localhost:8080/api/v1/sections/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Archive Section

Soft-archive a section without deleting it. Sets `status = 'archived'`. Archived sections are hidden from the published structure.

**Endpoint:** `PATCH /api/v1/sections/:id/archive`

**Access:** Course Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Section ID  |

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "title": "Getting Started",
    "status": "archived",
    "updated_at": "2026-04-27T10:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X PATCH http://localhost:8080/api/v1/sections/1/archive \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Reorder Sections

Update the display order of all sections within a course by providing a reordered list of section IDs.

**Endpoint:** `PATCH /api/v1/sections/course/:courseId/reorder`

**Access:** Course Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| courseId  | integer | Course ID   |

**Request Body:**

```json
{
  "orderedIds": [3, 1, 2]
}
```

| Field      | Type             | Required | Description                              |
| ---------- | ---------------- | -------- | ---------------------------------------- |
| orderedIds | array of integer | Yes      | Section IDs in the desired display order |

**Success Response (200):**

```json
{
  "data": {
    "message": "Sections reordered successfully"
  }
}
```

**Example:**

```bash
curl -X PATCH http://localhost:8080/api/v1/sections/course/1/reorder \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "orderedIds": [3, 1, 2] }'
```

---

## Section Organization

Sections help organize course content into logical modules. Each section can contain multiple lessons and uses `orderIndex` to control the display order.

Best practices:

- Use descriptive section titles
- Order sections logically (basics to advanced)
- Group related lessons together
- Include 3-7 lessons per section for optimal learning
- Use **archive** instead of delete to preserve historical content references
  }
  }

````

**Example:**

```bash
curl -X DELETE http://localhost:8080/api/v1/sections/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
````

---

## Section Organization

Sections help organize course content into logical modules. Each section can contain multiple lessons and uses `orderIndex` to control the display order.

Best practices:

- Use descriptive section titles
- Order sections logically (basics to advanced)
- Group related lessons together
- Include 3-7 lessons per section for optimal learning
