---
sidebar_position: 15
---

# Schedules

The scheduling module manages classroom sessions, recurring series, live-session metadata, conflict detection, and import/export workflows.

## Base URL

```text
/api/v1/schedules
```

## Authentication

All schedule endpoints require a valid Bearer token.

## Enumerations

| Category | Values |
| --- | --- |
| Session statuses | `scheduled`, `rescheduled`, `cancelled`, `completed`, `archived` |
| Delivery modes | `Offline`, `Online`, `Hybrid` |
| Reschedule scopes | `this_session`, `this_and_following`, `entire_series` |

## Endpoint Summary

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/` | Authenticated | View schedule in a date range |
| `GET` | `/conflict-check` | Admin | Check for teacher, classroom, or location conflicts |
| `POST` | `/series` | Admin | Create a recurring series and sessions |
| `POST` | `/import` | Admin | Import sessions from an uploaded spreadsheet |
| `GET` | `/export` | Admin, Teacher | Export schedule to `.xlsx` |
| `POST` | `/` | Staff | Create one session |
| `PUT` | `/:id` | Staff | Update a session |
| `POST` | `/:id/cancel` | Staff | Cancel a session |
| `POST` | `/:id/reschedule` | Staff | Reschedule one or more sessions |
| `POST` | `/:id/live-metadata` | Staff | Attach online meeting metadata |
| `POST` | `/:id/complete` | Admin | Mark a session as completed |
| `POST` | `/:id/archive` | Admin | Archive a completed or cancelled session |
| `GET` | `/:id/history` | Admin | Read schedule change history |

## View Schedule

**Endpoint:** `GET /api/v1/schedules`

**Required Query Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `fromDate` | date | Inclusive range start |
| `toDate` | date | Inclusive range end |

**Optional Filters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `status` | string | Filter by session status |
| `deliveryMode` | string | Filter by delivery mode |
| `classroomId` | integer | Filter by classroom |
| `teacherId` | integer | Admin filter by teacher |
| `studentId` | integer | Admin filter by student's classroom enrollments |
| `campusId` | integer | Filter by campus |

Students only see sessions for their classroom enrollments, teachers only see sessions assigned to themselves, and admins can query across the whole system.

## Create Session

**Endpoint:** `POST /api/v1/schedules`

**Request Body:**

```json
{
  "classroomId": 4,
  "title": "Hooks Deep Dive",
  "description": "State and effects",
  "sessionDate": "2026-06-10",
  "startTime": "09:00:00",
  "endTime": "11:00:00",
  "deliveryMode": "Offline",
  "teacherId": 8,
  "location": "Room A301",
  "campusId": 1,
  "notes": "Bring lab exercises"
}
```

- `classroomId`, `title`, `sessionDate`, `startTime`, and `endTime` are required.
- Offline sessions require `location`.
- The service runs a conflict check before creation.
- `session_no` is assigned automatically inside the classroom.

## Conflict Check

**Endpoint:** `GET /api/v1/schedules/conflict-check`

**Query Parameters:**

| Parameter | Type | Required |
| --- | --- | --- |
| `startDatetime` | datetime | Yes |
| `endDatetime` | datetime | Yes |
| `teacherId` | integer | No |
| `classroomId` | integer | No |
| `location` | string | No |
| `excludeSessionId` | integer | No |

The response returns `conflict_found`, a `conflicts` array, and `override_allowed`.

## Create Recurring Series

**Endpoint:** `POST /api/v1/schedules/series`

**Request Body:**

```json
{
  "classroomId": 4,
  "recurrenceRule": {
    "type": "weekly",
    "days": ["mon", "wed"]
  },
  "startDate": "2026-06-01",
  "endDate": "2026-06-30",
  "startTime": "09:00:00",
  "endTime": "11:00:00",
  "deliveryMode": "Offline",
  "teacherId": 8,
  "location": "Room A301"
}
```

The service creates both a `schedule_series` record and the generated sessions. If any generated occurrence has a blocking conflict, the series creation is aborted.

## Reschedule Session

**Endpoint:** `POST /api/v1/schedules/:id/reschedule`

**Request Body:**

```json
{
  "scope": "this_session",
  "newDate": "2026-06-12",
  "newStartTime": "13:00:00",
  "newEndTime": "15:00:00",
  "newLocation": "Room B204",
  "reason": "Campus room maintenance"
}
```

For series-backed sessions, `scope` controls whether the change applies only to the current session, this session and following, or the entire series.

## Live Session Metadata

**Endpoint:** `POST /api/v1/schedules/:id/live-metadata`

```json
{
  "provider": "zoom",
  "roomId": "987654321",
  "joinUrl": "https://zoom.example/j/987654321",
  "hostUrl": "https://zoom.example/s/987654321",
  "providerStatus": "Created"
}
```

Students do not receive `hostUrl` in schedule reads.

## Import and Export

- `POST /import` expects a multipart upload with a `file` field.
- `GET /export` returns an `.xlsx` file download.
- `GET /:id/history` returns the audit-style change history for one session.
