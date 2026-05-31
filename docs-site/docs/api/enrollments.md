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

| Status | Meaning |
| --- | --- |
| `pending` | Waiting for a follow-up action such as approval or payment |
| `active` | Learner can access the course |
| `suspended` | Access is temporarily blocked |
| `cancelled` | Enrollment was cancelled |
| `completed` | Enrollment finished successfully |
| `rejected` | Request failed eligibility or policy checks |
| `waitlisted` | Learner is queued for a seat |

## Endpoint Summary

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/` | Authenticated | List enrollments visible to the caller |
| `GET` | `/eligibility` | Admin, Teacher | Validate whether a learner can enroll |
| `GET` | `/access-state` | Authenticated | Resolve whether a learner currently has access |
| `POST` | `/` | Admin, Student | Request an enrollment |
| `POST` | `/events/payment-confirmed` | Admin | Mark payment as confirmed |
| `POST` | `/events/payment-failed` | Admin | Mark payment as failed or expired |
| `GET` | `/:id` | Authenticated | Get enrollment detail |
| `GET` | `/:id/history` | Authenticated | Get status-change history |
| `PUT` | `/:id/activate` | Admin | Activate an enrollment |
| `PUT` | `/:id/suspend` | Admin | Suspend an enrollment |
| `PUT` | `/:id/resume` | Admin | Resume a suspended enrollment |
| `PUT` | `/:id/cancel` | Admin, Student | Cancel an enrollment |
| `PUT` | `/:id/complete` | Admin | Complete an enrollment |

## List Enrollments

**Endpoint:** `GET /api/v1/enrollments`

The response is role-scoped:

- Admin: all enrollments
- Teacher: enrollments for courses they teach
- Student: only their own enrollments

**Query Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `status` | string | Filter by lifecycle status |
| `course_id` | integer | Filter by course |
| `learner_id` | integer | Admin-only learner filter |
| `request_source` | string | `student`, `parent`, `admin`, `system`, `import` |
| `page` | integer | Page number |
| `page_size` | integer | Page size, max `100` |

## Validate Eligibility

**Endpoint:** `GET /api/v1/enrollments/eligibility`

**Query Parameters:**

| Parameter | Type | Required |
| --- | --- | --- |
| `learner_id` | integer | Yes |
| `course_id` | integer | Yes |

The API persists the result into `eligibility_results` and returns it as `metadata.eligibility`.

The checks currently cover learner existence, course availability, duplicate enrollments, and prerequisite completion.

## Request Enrollment

**Endpoint:** `POST /api/v1/enrollments`

**Request Body:**

```json
{
  "learner_id": 12,
  "course_id": 3,
  "request_source": "student",
  "payment_reference": "INV-2026-001"
}
```

**Notes:**

- Students can only request enrollment for themselves.
- Teachers cannot create enrollments.
- Successful eligible requests become `active` immediately in the current implementation.
- Failed eligibility checks create a rejected enrollment and return a `422` response.

## Query Access State

**Endpoint:** `GET /api/v1/enrollments/access-state`

**Query Parameters:**

| Parameter | Type | Required |
| --- | --- | --- |
| `learner_id` | integer | Yes |
| `course_id` | integer | Yes |

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
