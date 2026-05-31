---
sidebar_position: 7
---

# Modules

Modules are the structural layer between courses and lessons. They replace the older `sections` route group in the current API surface.

## Base URL

```text
/api/v1/modules
```

## Access Rules

| Action | Access |
| --- | --- |
| List modules for a course | Public |
| View a module | Public |
| Create, update, delete, archive, reorder | Admin |

## Endpoint Summary

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/course/:courseId` | List modules for a course |
| `GET` | `/:id` | Get module detail |
| `POST` | `/course/:courseId` | Create a module |
| `PUT` | `/:id` | Update a module |
| `DELETE` | `/:id` | Delete a module |
| `PATCH` | `/:id/archive` | Archive a module |
| `PATCH` | `/course/:courseId/reorder` | Reorder modules within a course |

## List Modules

**Endpoint:** `GET /api/v1/modules/course/:courseId`

The response includes lessons nested under each module and is ordered by `display_order`.

**Success Response (200):**

```json
{
  "message": "OK",
  "code": 200,
  "metadata": {
    "modules": [
      {
        "id": 9,
        "course_id": 3,
        "title": "Getting Started",
        "description": "Core setup and orientation",
        "display_order": 0,
        "status": "draft",
        "lessons": []
      }
    ]
  }
}
```

## Create Module

**Endpoint:** `POST /api/v1/modules/course/:courseId`

**Request Body:**

```json
{
  "title": "Getting Started",
  "description": "Core setup and orientation",
  "displayOrder": 0
}
```

`title` is required. Newly created modules start in `draft`.

## Update Module

**Endpoint:** `PUT /api/v1/modules/:id`

All body fields are optional:

```json
{
  "title": "Updated Module Title",
  "description": "Updated description",
  "displayOrder": 1
}
```

## Archive Module

**Endpoint:** `PATCH /api/v1/modules/:id/archive`

Archiving sets `status` to `archived`.

## Reorder Modules

**Endpoint:** `PATCH /api/v1/modules/course/:courseId/reorder`

**Request Body:**

```json
{
  "orderedIds": [12, 9, 10]
}
```

The IDs must all belong to the target course.
