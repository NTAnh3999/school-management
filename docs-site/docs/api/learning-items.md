---
sidebar_position: 11
---

# Learning Items

Learning items are granular content units inside a lesson. A single lesson can have multiple items of different types displayed in sequence.

## Base URL

```
/api/v1/learning-items
```

## Item Types

| Type        | Description                             |
| ----------- | --------------------------------------- |
| VIDEO       | Embedded video content via URL or asset |
| QUIZ        | Inline quiz linked to a quiz record     |
| INFOGRAPHIC | Image-based visual content              |
| DOCUMENT    | Downloadable file or embedded PDF       |
| TEXT        | Rich text / article content             |

## Endpoints

### List Learning Items

Get all learning items for a lesson, ordered by `display_order`.

**Endpoint:** `GET /api/v1/learning-items/lesson/:lessonId`

**Access:** Teacher, Admin

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
      "lesson_id": 3,
      "item_type": "VIDEO",
      "title": "Intro Video",
      "content_payload": { "url": "https://cdn.example.com/v1.mp4" },
      "asset_id": 2,
      "display_order": 0,
      "estimated_duration": 8.5,
      "is_required": true,
      "status": "draft"
    }
  ]
}
```

---

### Get Learning Item Detail

**Endpoint:** `GET /api/v1/learning-items/:id`

**Access:** Teacher, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description      |
| --------- | ------- | ---------------- |
| id        | integer | Learning Item ID |

**Success Response (200):** returns the learning item object.

---

### Create Learning Item

**Endpoint:** `POST /api/v1/learning-items/lesson/:lessonId`

**Access:** Teacher (course owner), Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| lessonId  | integer | Lesson ID   |

**Request Body:**

```json
{
  "itemType": "VIDEO",
  "title": "Intro Video",
  "contentPayload": { "url": "https://cdn.example.com/v1.mp4" },
  "assetId": 2,
  "displayOrder": 0,
  "estimatedDuration": 8.5,
  "isRequired": true
}
```

| Field             | Type    | Required | Description                                               |
| ----------------- | ------- | -------- | --------------------------------------------------------- |
| itemType          | string  | Yes      | One of `VIDEO`, `QUIZ`, `INFOGRAPHIC`, `DOCUMENT`, `TEXT` |
| title             | string  | Yes      | Item title                                                |
| contentPayload    | object  | No       | Type-specific JSON (e.g. `{ url }` for VIDEO)             |
| assetId           | integer | No       | FK to a registered `content_assets` record                |
| displayOrder      | integer | No       | Position within lesson (default 0)                        |
| estimatedDuration | decimal | No       | Duration in minutes                                       |
| isRequired        | boolean | No       | Required for lesson completion (default true)             |

**Success Response (201):** returns created learning item.

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/learning-items/lesson/3 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemType": "VIDEO",
    "title": "Intro Video",
    "contentPayload": { "url": "https://cdn.example.com/v1.mp4" },
    "displayOrder": 0
  }'
```

---

### Update Learning Item

**Endpoint:** `PATCH /api/v1/learning-items/:id`

**Access:** Teacher (course owner), Admin

**Authentication:** Required

All body fields are optional (same fields as create, excluding `itemType`).

**Success Response (200):** returns updated learning item.

---

### Archive Learning Item

Soft-archive a learning item. Sets `status = 'archived'`.

**Endpoint:** `PATCH /api/v1/learning-items/:id/archive`

**Access:** Teacher (course owner), Admin

**Authentication:** Required

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "status": "archived",
    "updated_at": "2026-04-27T10:00:00.000Z"
  }
}
```

---

### Reorder Learning Items

Update the display order of all items within a lesson.

**Endpoint:** `PATCH /api/v1/learning-items/lesson/:lessonId/reorder`

**Access:** Teacher (course owner), Admin

**Authentication:** Required

**Request Body:**

```json
{
  "orderedIds": [5, 3, 4]
}
```

| Field      | Type             | Required | Description                                    |
| ---------- | ---------------- | -------- | ---------------------------------------------- |
| orderedIds | array of integer | Yes      | Learning item IDs in the desired display order |

**Success Response (200):**

```json
{
  "data": {
    "message": "Learning items reordered successfully"
  }
}
```

**Example:**

```bash
curl -X PATCH http://localhost:8080/api/v1/learning-items/lesson/3/reorder \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "orderedIds": [5, 3, 4] }'
```
