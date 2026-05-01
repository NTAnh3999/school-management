---
sidebar_position: 12
---

# Content Assets

Content assets are file metadata records that link uploaded files (stored in cloud/object storage) to course content. After uploading a file to storage, register its metadata here so learning items and other entities can reference it.

## Base URL

```
/api/v1/content-assets
```

## Media Types

| Type     | Description                     |
| -------- | ------------------------------- |
| video    | MP4, WebM, or other video files |
| image    | PNG, JPG, GIF, WebP images      |
| document | PDF, DOCX, PPTX documents       |
| audio    | MP3, WAV, OGG audio files       |

## Endpoints

### List Content Assets

**Endpoint:** `GET /api/v1/content-assets`

**Access:** Teacher, Admin

**Authentication:** Required

**Query Parameters:**

| Parameter  | Type    | Description                      |
| ---------- | ------- | -------------------------------- |
| mediaType  | string  | Filter by `video`, `image`, etc. |
| uploadedBy | integer | Filter by uploader user ID       |

**Success Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "filename": "lecture-01.mp4",
      "media_type": "video",
      "mime_type": "video/mp4",
      "size_bytes": 104857600,
      "duration_seconds": 510,
      "storage_key": "courses/cs101/lecture-01.mp4",
      "thumbnail_url": "https://cdn.example.com/thumb/lecture-01.jpg",
      "uploaded_by": 2,
      "uploaded_at": "2026-04-20T08:00:00.000Z"
    }
  ]
}
```

---

### Get Content Asset Detail

**Endpoint:** `GET /api/v1/content-assets/:id`

**Access:** Teacher, Admin

**Authentication:** Required

**Success Response (200):** returns full asset object.

---

### Register Content Asset

Register metadata for a file that has already been uploaded to storage.

**Endpoint:** `POST /api/v1/content-assets`

**Access:** Teacher, Admin

**Authentication:** Required

**Request Body:**

```json
{
  "filename": "lecture-01.mp4",
  "mediaType": "video",
  "mimeType": "video/mp4",
  "sizeBytes": 104857600,
  "durationSeconds": 510,
  "storageKey": "courses/cs101/lecture-01.mp4",
  "thumbnailUrl": "https://cdn.example.com/thumb/lecture-01.jpg"
}
```

| Field           | Type    | Required | Description                            |
| --------------- | ------- | -------- | -------------------------------------- |
| filename        | string  | Yes      | Original filename                      |
| mediaType       | string  | Yes      | `video`, `image`, `document`, `audio`  |
| mimeType        | string  | Yes      | MIME type (e.g. `video/mp4`)           |
| sizeBytes       | integer | No       | File size in bytes                     |
| durationSeconds | integer | No       | Duration in seconds (audio/video only) |
| storageKey      | string  | Yes      | Storage path/key in cloud storage      |
| thumbnailUrl    | string  | No       | URL to thumbnail image                 |

**Success Response (201):** returns created asset record.

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/content-assets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "lecture-01.mp4",
    "mediaType": "video",
    "mimeType": "video/mp4",
    "storageKey": "courses/cs101/lecture-01.mp4"
  }'
```

---

### Update Content Asset Metadata

Update mutable metadata fields of an existing asset.

**Endpoint:** `PATCH /api/v1/content-assets/:id`

**Access:** Teacher (uploader), Admin

**Authentication:** Required

**Request Body:** All fields optional.

```json
{
  "thumbnailUrl": "https://cdn.example.com/thumb/updated.jpg",
  "durationSeconds": 525
}
```

**Success Response (200):** returns updated asset record.
