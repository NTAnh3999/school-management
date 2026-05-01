---
sidebar_position: 13
---

# Content Versions

Content versions provide a structured publishing workflow for course content. A version captures a snapshot of the course's modules, lessons, and learning items at a point in time.

## Base URL

```
/api/v1/content
```

## Version Status Flow

```
DRAFT → REVIEW → PUBLISHED
                     ↓
                 ARCHIVED
```

Only **one** version can be `PUBLISHED` at a time. Publishing a new version automatically archives the previous published version.

## Endpoints

### List Versions

Get all content versions for a course.

**Endpoint:** `GET /api/v1/content/courses/:courseId/versions`

**Access:** Teacher, Admin

**Authentication:** Required

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
      "course_id": 5,
      "version_label": "v1.0 - Initial Release",
      "version_no": 1,
      "status": "PUBLISHED",
      "changelog": "First stable version.",
      "published_at": "2026-04-10T12:00:00.000Z",
      "published_by": 2,
      "created_by": 2,
      "created_at": "2026-04-08T09:00:00.000Z"
    }
  ]
}
```

---

### Create Version

Create a new DRAFT version with a snapshot of the current course structure.

**Endpoint:** `POST /api/v1/content/courses/:courseId/versions`

**Access:** Teacher (course owner), Admin

**Authentication:** Required

**Request Body:**

```json
{
  "versionLabel": "v2.0 - Updated Content",
  "changelog": "Added new module on advanced topics."
}
```

| Field        | Type   | Required | Description                  |
| ------------ | ------ | -------- | ---------------------------- |
| versionLabel | string | Yes      | Human-readable version label |
| changelog    | string | No       | Description of changes       |

**Success Response (201):** returns created content version with `status: "DRAFT"`.

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/content/courses/5/versions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "versionLabel": "v2.0 - Updated Content",
    "changelog": "Added new module on advanced topics."
  }'
```

---

### Get Version Detail

**Endpoint:** `GET /api/v1/content/versions/:id`

**Access:** Teacher, Admin

**Authentication:** Required

**Success Response (200):** returns full version object including `snapshot_ref`.

---

### Publish Version

Publish a content version. The previous PUBLISHED version is automatically archived.

**Endpoint:** `POST /api/v1/content/versions/:id/publish`

**Access:** Teacher (course owner), Admin

**Authentication:** Required

**Business rules:**

- Course must have at least 1 module with at least 1 lesson in its draft structure
- Only one PUBLISHED version allowed per course at a time
- A new snapshot is built from the current draft structure at publish time

**Success Response (200):**

```json
{
  "data": {
    "id": 2,
    "status": "PUBLISHED",
    "published_at": "2026-04-27T10:00:00.000Z",
    "published_by": 2
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/content/versions/2/publish \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Archive Version

Manually archive a version (Admin only).

**Endpoint:** `PATCH /api/v1/content/versions/:id/archive`

**Access:** Admin only

**Authentication:** Required

**Success Response (200):** returns version with `status: "ARCHIVED"`.

---

### Get Published Structure

Returns the `snapshot_ref` of the currently published version. This is the authoritative structure consumed by the Assessment engine, Progress tracker, and Student Portal.

**Endpoint:** `GET /api/v1/content/courses/:courseId/published`

**Access:** Any authenticated user

**Authentication:** Required

**Success Response (200):**

```json
{
  "data": {
    "courseId": 5,
    "versionId": 2,
    "versionLabel": "v2.0 - Updated Content",
    "publishedAt": "2026-04-27T10:00:00.000Z",
    "structure": {
      "modules": [
        {
          "id": 1,
          "title": "Getting Started",
          "order_index": 0,
          "lessons": [
            {
              "id": 1,
              "title": "Intro",
              "lesson_type": "video",
              "learning_items": [...]
            }
          ]
        }
      ]
    }
  }
}
```

**Example:**

```bash
curl -X GET http://localhost:8080/api/v1/content/courses/5/published \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Preview Draft

Returns a real-time preview of the current draft structure without creating a version or affecting student progress records.

**Endpoint:** `GET /api/v1/content/courses/:courseId/preview`

**Access:** Teacher, Admin

**Authentication:** Required

**Success Response (200):** same structure as published, with `status: "DRAFT"` on items.

**Example:**

```bash
curl -X GET http://localhost:8080/api/v1/content/courses/5/preview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
