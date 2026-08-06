---
sidebar_position: 5
---

# Enrollments

The enrollment module controls learner access to courses. It covers eligibility checks, state transitions, access-state queries, and payment-driven activation flows.

## Base URL

```text
/api/v1/enrollments
```

## Authentication

All enrollment endpoints require a valid Bearer token.

## Enrollment Statuses

| Status       | Meaning                                                    |
| ------------ | ---------------------------------------------------------- |
| `pending`    | Waiting for a follow-up action such as approval or payment |
| `active`     | Learner can access the course                              |
| `suspended`  | Access is temporarily blocked                              |
| `cancelled`  | Enrollment was cancelled                                   |
| `completed`  | Enrollment finished successfully                           |
| `rejected`   | Request failed eligibility or policy checks                |
| `waitlisted` | Learner is queued for a seat                               |

## Endpoint Summary

| Method         | Endpoint                    | Access                 | Description                                                  |
| -------------- | --------------------------- | ---------------------- | ------------------------------------------------------------ |
| `GET`          | `/`                         | Authenticated          | List enrollments visible to the caller                       |
| `GET`          | `/eligibility`              | Admin, Teacher         | Validate whether a learner can enroll                        |
| `GET`          | `/access-state`             | Authenticated          | Resolve whether a learner currently has access               |
| `POST`         | `/`                         | Admin, Student         | Request an enrollment                                        |
| `GET`          | `/export`                   | Admin                  | Export enrollments using the same filter/scope rules as list |
| `POST`         | `/events/payment-confirmed` | Admin                  | Mark payment as confirmed                                    |
| `POST`         | `/events/payment-failed`    | Admin                  | Mark payment as failed or expired                            |
| `GET`          | `/:id`                      | Authenticated          | Get enrollment detail                                        |
| `GET`          | `/:id/history`              | Authenticated          | Get status-change history                                    |
| `POST`         | `/:id/eligibility`          | Admin, Teacher         | Re-validate an existing enrollment                           |
| `POST` / `PUT` | `/:id/activate`             | Admin                  | Activate an enrollment                                       |
| `POST` / `PUT` | `/:id/suspend`              | Admin                  | Suspend an enrollment                                        |
| `POST` / `PUT` | `/:id/resume`               | Admin                  | Resume a suspended enrollment                                |
| `POST` / `PUT` | `/:id/cancel`               | Admin, Student, Parent | Cancel an enrollment                                         |
| `POST` / `PUT` | `/:id/complete`             | Admin                  | Complete an enrollment                                       |

## List Enrollments

**Endpoint:** `GET /api/v1/enrollments`

The response is role-scoped:

- Admin: all enrollments
- Teacher: enrollments for courses they teach
- Student: only their own enrollments

**Query Parameters:**

| Parameter                         | Type     | Description                                                |
| --------------------------------- | -------- | ---------------------------------------------------------- |
| `status`                          | string   | Filter by lifecycle status                                 |
| `course_id`                       | integer  | Filter by course                                           |
| `classroom_id`                    | integer  | Filter by classroom-level target                           |
| `learner_id`                      | integer  | Admin-only learner filter                                  |
| `learner_profile_id`              | integer  | Admin-only learner profile filter                          |
| `tenant_id`                       | integer  | Admin-only tenant filter when no active tenant is selected |
| `enrollment_level`                | string   | `course` or `classroom`                                    |
| `request_source`                  | string   | `student`, `parent`, `admin`, `system`, `import`           |
| `requested_from` / `requested_to` | ISO date | Requested-at date range                                    |
| `page`                            | integer  | Page number                                                |
| `page_size`                       | integer  | Page size, max `100`                                       |

## Validate Eligibility

**Endpoint:** `GET /api/v1/enrollments/eligibility`

**Query Parameters:**

| Parameter    | Type    | Required |
| ------------ | ------- | -------- |
| `learner_id` | integer | Yes      |
| `course_id`  | integer | Yes      |

The API persists the result into `eligibility_results` and returns it as `metadata.eligibility`.

The checks currently cover learner existence, course availability, duplicate enrollments, and prerequisite completion.

## Request Enrollment

**Endpoint:** `POST /api/v1/enrollments`

**Request Body:**

```json
{
  "tenant_id": 1,
  "learner_id": 12,
  "learner_profile_id": 44,
  "course_id": 3,
  "classroom_id": 9,
  "request_source": "student",
  "payment_reference": "INV-2026-001",
  "idempotency_key": "request-abc-123"
}
```

**Notes:**

- Students can only request enrollment for themselves.
- Parents can request/cancel for active linked children.
- Teachers cannot create enrollments.
- If `classroom_id` is provided, the enrollment is stored as `enrollment_level = classroom` and validates classroom/course mapping plus capacity.
- Successful eligible requests become `active` immediately in the current implementation.
- Failed eligibility checks create a rejected enrollment and return a `422` response.

## Query Access State

**Endpoint:** `GET /api/v1/enrollments/access-state`

**Query Parameters:**

| Parameter      | Type    | Required |
| -------------- | ------- | -------- |
| `learner_id`   | integer | Yes      |
| `course_id`    | integer | Yes      |
| `classroom_id` | integer | No       |

**Typical Response:**

```json
{
  "message": "OK",
  "code": 200,
  "metadata": {
    "access": {
      "allowed": true,
      "status": "active",
      "enrollment_id": 5
    }
  }
}
```

Inactive states return `allowed: false` with a machine-readable reason such as `ENROLLMENT_PENDING` or `ENROLLMENT_SUSPENDED`.

## Export Enrollments

**Endpoint:** `GET /api/v1/enrollments/export`

Supports the same filter and server-side access scope as list. The response is an `.xlsx` file and export is audit logged.

## Payment Events

These endpoints are intended for admin-controlled integrations or webhook relays.

### Confirm Payment

**Endpoint:** `POST /api/v1/enrollments/events/payment-confirmed`

```json
{
  "enrollment_id": 5,
  "billing_reference": "BILL-001",
  "event_id": "evt_123"
}
```

If the enrollment is still `pending`, the service attempts to activate it and initialize baseline progress.

### Mark Payment Failed

**Endpoint:** `POST /api/v1/enrollments/events/payment-failed`

```json
{
  "enrollment_id": 5,
  "billing_reference": "BILL-001",
  "event_id": "evt_124",
  "reason": "PAYMENT_FAILED"
}
```

If the enrollment is `pending`, the current implementation cancels it.

## Detail, History, and State Changes

- `GET /:id` returns the current enrollment, related course, student, and progress.
- `GET /:id/history` returns the ordered status-change log.
- `PUT /:id/activate`, `/suspend`, `/resume`, `/cancel`, and `/complete` enforce lifecycle transition rules before updating status.
- Successful lifecycle changes append `enrollment_histories`, write audit context, and enqueue an event in `enrollment_event_outbox` for downstream retry/consume.
