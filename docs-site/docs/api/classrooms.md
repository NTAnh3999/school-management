---
sidebar_position: 3
---

# Classrooms

Manage classrooms — concrete instances of a course run for a specific group of students, with assigned teachers, a schedule, and enrollment rules.

:::info Relationship
**Course** defines the curriculum. **Classroom** is a real, operational run of that course: it has its own teachers, schedule, students, dates, and status lifecycle.
:::

## Base URL

```
/api/v1/classrooms
```

## Authentication

All endpoints require a valid Bearer token:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Roles & Permissions

| Action                              | Admin |    Teacher    |    Student    |
| ----------------------------------- | :---: | :-----------: | :-----------: |
| List classrooms                     |  ✅   |   Own only    | Enrolled only |
| View classroom detail               |  ✅   |   Assigned    |   Enrolled    |
| Create classroom                    |  ✅   |      ✅       |      ❌       |
| Edit classroom                      |  ✅   | ✅ (limited)  |      ❌       |
| Publish classroom                   |  ✅   |      ❌       |      ❌       |
| Start / Cancel / Complete / Archive |  ✅   | Complete only |      ❌       |
| Duplicate classroom                 |  ✅   |      ✅       |      ❌       |
| Assign teachers                     |  ✅   |      ❌       |      ❌       |
| Add / Remove / Transfer students    |  ✅   |      ✅       |      ❌       |
| View student roster                 |  ✅   |      ✅       |      ❌       |
| Manage sessions                     |  ✅   |      ✅       |      ❌       |
| View activity log                   |  ✅   |      ✅       |      ❌       |

---

## Classroom Lifecycle

```
Draft ──► Open ──► In Progress ──► Completed ──► Archived
  │         │           │
  │         ▼           ▼
  └──► Cancelled ──────────────────────────────► Archived
         (Full is an automatic sub-state of Open)
```

| Status        | Description                                              |
| ------------- | -------------------------------------------------------- |
| `draft`       | Newly created, not visible to students                   |
| `open`        | Published, accepting enrollments                         |
| `full`        | Max capacity reached; new enrollments blocked (auto-set) |
| `in_progress` | Classes have started                                     |
| `completed`   | All sessions done, classroom closed                      |
| `cancelled`   | Abandoned before or during operation                     |
| `archived`    | Read-only historical record                              |

---

## Endpoints

### List Classrooms

**`GET /api/v1/classrooms`**

Returns a paginated list of classrooms. Results are scoped by the caller's role.

**Query Parameters:**

| Parameter                 | Type    | Description                            |
| ------------------------- | ------- | -------------------------------------- |
| `keyword`                 | string  | Search by classroom code or name       |
| `status`                  | string  | Filter by status                       |
| `course_id`               | integer | Filter by parent course                |
| `teacher_id`              | integer | Filter by main teacher                 |
| `delivery_method`         | string  | `online` \| `offline` \| `hybrid`      |
| `date_from`               | date    | Filter by start date (≥)               |
| `date_to`                 | date    | Filter by start date (≤)               |
| `enrollment_availability` | string  | `available` \| `full`                  |
| `page`                    | integer | Page number (default: 1)               |
| `page_size`               | integer | Items per page (default: 20, max: 100) |

**Success Response (200):**

```json
{
  "message": "OK",
  "code": 200,
  "metadata": {
    "items": [
      {
        "id": 1,
        "classroom_code": "CLS-REACT-BASIC-202605-001",
        "classroom_name": "ReactJS Basic - Batch 01 - May 2026",
        "status": "open",
        "delivery_method": "hybrid",
        "start_date": "2026-05-15",
        "end_date": "2026-07-15",
        "max_capacity": 30,
        "enrolled_count": 12,
        "course": {
          "id": 5,
          "course_code": "REACT-BASIC",
          "title": "ReactJS Basic"
        },
        "teachers": [
          {
            "role_in_classroom": "main_teacher",
            "user": {
              "id": 3,
              "full_name": "Alice Nguyen",
              "email": "alice@example.com"
            }
          }
        ]
      }
    ],
    "total": 8,
    "page": 1,
    "page_size": 20
  }
}
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/v1/classrooms?status=open&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Get Classroom Detail

**`GET /api/v1/classrooms/:id`**

**Success Response (200):**

```json
{
  "message": "OK",
  "code": 200,
  "metadata": {
    "classroom": {
      "id": 1,
      "classroom_code": "CLS-REACT-BASIC-202605-001",
      "classroom_name": "ReactJS Basic - Batch 01 - May 2026",
      "description": "Beginner ReactJS class for May 2026 intake.",
      "status": "open",
      "delivery_method": "hybrid",
      "location": "Room A301",
      "online_meeting_link": "https://meet.example.com/react-01",
      "start_date": "2026-05-15",
      "end_date": "2026-07-15",
      "enrollment_mode": "manual",
      "min_capacity": 10,
      "max_capacity": 30,
      "enrolled_count": 12,
      "waitlist_enabled": true,
      "approval_required": false,
      "visibility": "internal",
      "course": {
        "id": 5,
        "course_code": "REACT-BASIC",
        "title": "ReactJS Basic",
        "status": "active"
      },
      "course_version": {
        "id": 3,
        "version_label": "v3.0",
        "version_no": 3,
        "status": "PUBLISHED"
      },
      "teachers": [
        {
          "role_in_classroom": "main_teacher",
          "active_flag": true,
          "user": { "id": 3, "full_name": "Alice Nguyen" }
        },
        {
          "role_in_classroom": "teaching_assistant",
          "active_flag": true,
          "user": { "id": 7, "full_name": "Bob Tran" }
        }
      ]
    }
  }
}
```

---

### Create Classroom

**`POST /api/v1/classrooms`**

**Access:** Admin, Teacher

**Request Body:**

```json
{
  "course_id": 5,
  "course_version_id": 3,
  "classroom_name": "ReactJS Basic - Batch 01 - May 2026",
  "classroom_code": "CLS-REACT-BASIC-202605-001",
  "description": "Beginner ReactJS class for May 2026 intake.",
  "delivery_method": "hybrid",
  "location": "Room A301",
  "online_meeting_link": "https://meet.example.com/react-01",
  "academic_year": "2026",
  "term": "May Intake",
  "language": "Vietnamese",
  "start_date": "2026-05-15",
  "end_date": "2026-07-15",
  "main_teacher_id": 3,
  "co_teacher_ids": [],
  "teaching_assistant_ids": [7],
  "enrollment_mode": "manual",
  "enrollment_start_date": "2026-04-01",
  "enrollment_end_date": "2026-05-14",
  "min_capacity": 10,
  "max_capacity": 30,
  "waitlist_enabled": true,
  "approval_required": false,
  "visibility": "internal"
}
```

| Field                    | Type      | Required | Description                                                            |
| ------------------------ | --------- | :------: | ---------------------------------------------------------------------- |
| `course_id`              | integer   |    ✅    | Must reference a published (`active`) course                           |
| `classroom_name`         | string    |    ✅    | Max 255 characters                                                     |
| `delivery_method`        | string    |    ✅    | `online` \| `offline` \| `hybrid`                                      |
| `start_date`             | date      |    ✅    | ISO 8601 date                                                          |
| `end_date`               | date      |    ✅    | Must be ≥ `start_date`                                                 |
| `max_capacity`           | integer   |    ✅    | Must be > 0                                                            |
| `classroom_code`         | string    |    ❌    | Auto-generated if omitted (format: `CLS-{COURSE_CODE}-{YYYYMM}-{SEQ}`) |
| `course_version_id`      | integer   |    ❌    | Defaults to latest published version                                   |
| `main_teacher_id`        | integer   |    ❌    | Required before publishing                                             |
| `co_teacher_ids`         | integer[] |    ❌    | Array of user IDs                                                      |
| `teaching_assistant_ids` | integer[] |    ❌    | Array of user IDs                                                      |
| `enrollment_mode`        | string    |    ❌    | `manual` (default) \| `self_enrollment` \| `invitation_only`           |
| `waitlist_enabled`       | boolean   |    ❌    | Allow waitlist when full (default: `false`)                            |
| `approval_required`      | boolean   |    ❌    | Require approval for self-enrollment (default: `false`)                |
| `visibility`             | string    |    ❌    | `public` \| `private` \| `internal` (default)                          |

**Success Response (201):**

```json
{
  "message": "Classroom created successfully",
  "code": 201,
  "metadata": {
    "classroom": {
      "id": 1,
      "classroom_code": "CLS-REACT-BASIC-202605-001",
      "classroom_name": "ReactJS Basic - Batch 01 - May 2026",
      "status": "draft",
      "created_at": "2026-05-01T10:30:00.000Z"
    }
  }
}
```

---

### Update Classroom

**`PUT /api/v1/classrooms/:id`**

**Access:** Admin, Teacher

Updates classroom fields. Which fields are editable depends on the current status:

| Field Group      | Draft | Open | Full | In Progress | Completed | Cancelled | Archived |
| ---------------- | :---: | :--: | :--: | :---------: | :-------: | :-------: | :------: |
| Basic info       |  ✅   |  ✅  |  ✅  | ⚠️ limited  |    ❌     |    ❌     |    ❌    |
| Course / Version |  ✅   |  ⚠️  |  ⚠️  |     ❌      |    ❌     |    ❌     |    ❌    |
| Schedule         |  ✅   |  ✅  |  ✅  |     ⚠️      |    ❌     |    ❌     |    ❌    |
| Capacity         |  ✅   |  ✅  |  ✅  |     ⚠️      |    ❌     |    ❌     |    ❌    |

:::warning
Decreasing `max_capacity` below the current `enrolled_count` will be rejected.
:::

---

### Publish Classroom

**`POST /api/v1/classrooms/:id/publish`**

**Access:** Admin only

Transitions classroom from `draft` → `open`. Validates all required fields:

- Course is published (active)
- Classroom name is set
- Main teacher is assigned
- Start and end dates are valid
- `max_capacity` > 0

Notifies all assigned teachers and TAs.

**Success Response (200):**

```json
{
  "message": "Classroom published",
  "code": 200,
  "metadata": {
    "classroom": { "id": 1, "status": "open" }
  }
}
```

---

### Start Classroom

**`POST /api/v1/classrooms/:id/start`**

**Access:** Admin only

Transitions `open` or `full` → `in_progress`.

---

### Complete Classroom

**`POST /api/v1/classrooms/:id/complete`**

**Access:** Admin, Teacher

Transitions `in_progress` → `completed`. Notifies all participants.

---

### Cancel Classroom

**`POST /api/v1/classrooms/:id/cancel`**

**Access:** Admin only

**Request Body (optional):**

```json
{ "reason": "Not enough enrollment" }
```

Notifies all enrolled students, teachers, and TAs.

---

### Archive Classroom

**`POST /api/v1/classrooms/:id/archive`**

**Access:** Admin only

Transitions `completed` or `cancelled` → `archived`. Archived classrooms are read-only.

---

### Duplicate Classroom

**`POST /api/v1/classrooms/:id/duplicate`**

**Access:** Admin, Teacher

Creates a new `draft` classroom with the same configuration (teachers copied, students **not** copied).

**Success Response (201):**

```json
{
  "message": "Classroom duplicated",
  "code": 201,
  "metadata": {
    "classroom": {
      "id": 2,
      "classroom_code": "CLS-REACT-BASIC-202605-002",
      "classroom_name": "ReactJS Basic - Batch 01 - May 2026 (Copy)",
      "status": "draft"
    }
  }
}
```

---

## Teacher Management

### Assign Teachers

**`PUT /api/v1/classrooms/:id/teachers`**

**Access:** Admin only

Updates teacher assignments. Sends notification to the new main teacher.

**Request Body:**

```json
{
  "main_teacher_id": 3,
  "co_teacher_ids": [8],
  "teaching_assistant_ids": [7, 9]
}
```

| Field                    | Type      | Description                      |
| ------------------------ | --------- | -------------------------------- |
| `main_teacher_id`        | integer   | Replaces existing main teacher   |
| `co_teacher_ids`         | integer[] | Replaces all co-teachers         |
| `teaching_assistant_ids` | integer[] | Replaces all teaching assistants |

:::note
Only fields provided are updated. Omit a field to leave that role group unchanged.
:::

---

## Student Management

### List Students

**`GET /api/v1/classrooms/:id/students`**

**Access:** Admin, Teacher

**Query Parameters:**

| Parameter   | Type    | Description                             |
| ----------- | ------- | --------------------------------------- |
| `status`    | string  | Filter by enrollment status (see below) |
| `page`      | integer | Page number                             |
| `page_size` | integer | Items per page (max: 100)               |

**Enrollment Statuses:**

| Status             | Description                |
| ------------------ | -------------------------- |
| `pending_approval` | Waiting for admin approval |
| `enrolled`         | Officially enrolled        |
| `waitlisted`       | In the waitlist queue      |
| `withdrawn`        | Withdrew from classroom    |
| `transferred`      | Moved to another classroom |
| `rejected`         | Enrollment was rejected    |
| `completed`        | Completed this classroom   |
| `failed`           | Did not complete           |

**Success Response (200):**

```json
{
  "metadata": {
    "items": [
      {
        "id": 10,
        "classroom_id": 1,
        "enrollment_status": "enrolled",
        "enrollment_date": "2026-04-20T09:00:00.000Z",
        "source": "manual",
        "student": {
          "id": 15,
          "full_name": "Nguyen Van A",
          "email": "a@example.com"
        }
      }
    ],
    "total": 12,
    "page": 1,
    "page_size": 50
  }
}
```

---

### Add Student

**`POST /api/v1/classrooms/:id/students`**

**Access:** Admin, Teacher

Adds a student to the classroom. Behavior depends on classroom settings:

- If `approval_required = true` → status is `pending_approval`
- If classroom is `full` and `waitlist_enabled = true` → status is `waitlisted`
- If classroom is `full` and `waitlist_enabled = false` → request is rejected

Notifies the student and the main teacher.

**Request Body:**

```json
{
  "student_id": 15,
  "source": "manual",
  "notes": "Late enrollment approved by director"
}
```

**Success Response (201):**

```json
{
  "message": "Student enrolled in classroom",
  "code": 201,
  "metadata": {
    "enrollment": {
      "id": 10,
      "classroom_id": 1,
      "student_id": 15,
      "enrollment_status": "enrolled"
    },
    "waitlisted": false
  }
}
```

---

### Remove Student

**`DELETE /api/v1/classrooms/:id/students/:studentId`**

**Access:** Admin, Teacher

Soft-removes the student (sets status to `withdrawn`). History is preserved.

**Request Body (optional):**

```json
{ "reason": "Student requested withdrawal" }
```

:::note
If the classroom was `full`, it will automatically revert to `open` after removal.
:::

---

### Transfer Student

**`POST /api/v1/classrooms/:id/students/:studentId/transfer`**

**Access:** Admin, Teacher

Moves a student to another classroom of the same course:

1. Sets source enrollment to `transferred`
2. Creates a new `enrolled` record in the target classroom
3. Updates `enrolled_count` for both classrooms

**Request Body:**

```json
{
  "target_classroom_id": 2,
  "notes": "Transferred due to schedule conflict"
}
```

---

### Update Student Enrollment Status

**`PUT /api/v1/classrooms/:id/students/:studentId/status`**

**Access:** Admin, Teacher

Manually update a student's enrollment status (e.g., approve a pending enrollment).

**Request Body:**

```json
{
  "status": "enrolled",
  "notes": "Approved by Training Admin"
}
```

---

## Session Management

### List Sessions

**`GET /api/v1/classrooms/:id/sessions`**

**Access:** Authenticated

Returns all sessions ordered by date and time.

**Success Response (200):**

```json
{
  "metadata": {
    "sessions": [
      {
        "id": 1,
        "session_no": 1,
        "session_title": "Introduction to React",
        "session_date": "2026-05-15",
        "start_time": "09:00:00",
        "end_time": "12:00:00",
        "status": "scheduled",
        "location": "Room A301",
        "teacher": { "id": 3, "full_name": "Alice Nguyen" }
      }
    ]
  }
}
```

---

### Generate Sessions (Recurrence)

**`POST /api/v1/classrooms/:id/sessions/generate`**

**Access:** Admin, Teacher

Auto-generates sessions across the classroom's date range based on a recurring weekly pattern. Replaces any existing `scheduled` sessions.

**Request Body:**

```json
{
  "start_time": "09:00:00",
  "end_time": "12:00:00",
  "session_days": ["mon", "wed", "fri"]
}
```

| Field          | Type     | Required | Description                                             |
| -------------- | -------- | :------: | ------------------------------------------------------- |
| `start_time`   | string   |    ✅    | `HH:MM:SS` format                                       |
| `end_time`     | string   |    ✅    | Must be after `start_time`                              |
| `session_days` | string[] |    ✅    | Any of: `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun` |

**Success Response (201):**

```json
{
  "message": "18 sessions generated",
  "code": 201,
  "metadata": {
    "sessions": [ ... ]
  }
}
```

---

### Create Session

**`POST /api/v1/classrooms/:id/sessions`**

**Access:** Admin, Teacher

Manually adds a single session. `session_no` is auto-incremented.

**Request Body:**

```json
{
  "session_date": "2026-05-20",
  "start_time": "14:00:00",
  "end_time": "17:00:00",
  "session_title": "State Management with Redux",
  "teacher_id": 3,
  "location": "Room B102",
  "notes": "Bring laptops"
}
```

---

### Update Session

**`PUT /api/v1/classrooms/:id/sessions/:sessionId`**

**Access:** Admin, Teacher

Updating the date or time automatically marks the session as `rescheduled` and stores the original values. Triggers notifications to all participants.

:::warning
Modifying a `completed` session requires Admin role.
:::

---

### Delete Session

**`DELETE /api/v1/classrooms/:id/sessions/:sessionId`**

**Access:** Admin, Teacher

- If session is `scheduled` → hard deleted
- If session is `completed` → set to `cancelled` (Admin only)

---

## Activity Log

### Get Activity Log

**`GET /api/v1/classrooms/:id/activity-log`**

**Access:** Admin, Teacher

Returns a full audit trail of all changes made to the classroom.

**Success Response (200):**

```json
{
  "metadata": {
    "logs": [
      {
        "id": 42,
        "action": "CHANGE_STATUS",
        "old_values": { "status": "draft" },
        "new_values": { "status": "open" },
        "changed_at": "2026-05-01T10:30:00.000Z",
        "changed_by_user": { "id": 1, "full_name": "System Admin" }
      }
    ]
  }
}
```

| Action          | Trigger           |
| --------------- | ----------------- |
| `CREATE`        | Classroom created |
| `UPDATE`        | Any field updated |
| `CHANGE_STATUS` | Status transition |
| `DELETE`        | Session deleted   |

---

## Error Reference

| Status | Error                                                            | Cause                          |
| ------ | ---------------------------------------------------------------- | ------------------------------ |
| 400    | `Classroom can only be created from a published (active) course` | Source course is not active    |
| 400    | `End date must be greater than or equal to start date`           | Invalid date range             |
| 400    | `Maximum capacity must be greater than 0`                        | Invalid capacity               |
| 400    | `Please assign a main teacher before publishing`                 | No main teacher assigned       |
| 400    | `Cannot change course once classroom is in progress`             | Attempted course change        |
| 400    | `This classroom has reached maximum capacity`                    | No waitlist and classroom full |
| 400    | `Cannot start classroom in status "completed"`                   | Invalid status transition      |
| 409    | `Classroom code already exists`                                  | Duplicate code                 |
| 409    | `This student is already enrolled in this classroom`             | Duplicate enrollment           |
| 403    | `Archived classroom cannot be edited`                            | Write on archived record       |
| 403    | `Only admins can modify a completed session`                     | Insufficient permissions       |
| 404    | `Classroom not found`                                            | Invalid ID                     |
| 404    | `Active enrollment not found`                                    | Student not in classroom       |
