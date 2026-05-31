---
sidebar_position: 13
---

# Assessments

Assessments extend the quiz layer with publication workflow, attempt tracking, grading, exports, and audit logs.

## Base URL

```text
/api/v1/assessments
```

## Authentication

All assessment endpoints require a valid Bearer token.

## Assessment Types and Statuses

| Category | Values |
| --- | --- |
| Assessment types | `quiz`, `assignment`, `exam`, `survey`, `other` |
| Assessment statuses | `draft`, `published`, `closed`, `archived` |
| Grading methods | `auto`, `manual`, `hybrid` |
| Publish policies | `manual`, `auto_after_graded`, `scheduled` |
| Attempt statuses | `not_started`, `in_progress`, `submitted`, `graded`, `published`, `expired` |

## Endpoint Summary

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/` | Authenticated | List assessments in scope |
| `GET` | `/:id` | Authenticated | Get one assessment |
| `POST` | `/` | Staff | Create an assessment |
| `PATCH` | `/:id` | Staff | Update an assessment |
| `POST` | `/:id/publish` | Staff | Publish an assessment |
| `POST` | `/:id/close` | Staff | Close an assessment |
| `POST` | `/:id/archive` | Staff | Archive an assessment |
| `POST` | `/:id/questions` | Staff | Add a question |
| `POST` | `/:id/attempts` | Student | Start an attempt |
| `GET` | `/:id/attempts` | Authenticated | List attempts for an enrollment |
| `POST` | `/attempts/:attemptId/submit` | Student | Submit answers |
| `POST` | `/submissions/:submissionId/grade` | Staff | Grade a submission |
| `POST` | `/grades/:gradeId/publish` | Staff | Publish a grade |
| `GET` | `/:id/results` | Authenticated | Read results in scope |
| `GET` | `/:id/export` | Staff | Export results |
| `GET` | `/:id/audit-logs` | Staff | Read audit logs |

## Create Assessment

**Endpoint:** `POST /api/v1/assessments`

**Request Body:**

```json
{
  "title": "Module 1 Checkpoint",
  "lessonId": 14,
  "description": "Short readiness check",
  "assessmentType": "quiz",
  "classroomId": 2,
  "openAt": "2026-06-01T08:00:00.000Z",
  "closeAt": "2026-06-03T17:00:00.000Z",
  "durationMinutes": 30,
  "maxAttempts": 2,
  "maxScore": 100,
  "gradingMethod": "auto",
  "publishPolicy": "manual",
  "questions": [
    {
      "questionText": "What is React?",
      "questionType": "single_choice",
      "points": 10,
      "options": [
        { "text": "A library", "isCorrect": true },
        { "text": "A database", "isCorrect": false }
      ]
    }
  ]
}
```

- `title` and `lessonId` are required.
- `openAt` must be earlier than `closeAt`.
- The API stores assessments in the quiz-backed model and supports nested question creation at create time.

## Start Attempt

**Endpoint:** `POST /api/v1/assessments/:id/attempts`

**Request Body:**

```json
{
  "enrollmentId": 21
}
```

The service checks that the assessment is published and open, the caller owns the enrollment, and the max-attempt limit is not exceeded.

## Submit Attempt

**Endpoint:** `POST /api/v1/assessments/attempts/:attemptId/submit`

**Request Body:**

```json
{
  "answers": [
    {
      "questionId": 101,
      "selectedOptionId": 501
    }
  ]
}
```

Auto-graded submissions can move directly to `graded` or `published` depending on the publish policy. Manual and hybrid flows create a submission record and wait for staff grading.

## Grade Submission

**Endpoint:** `POST /api/v1/assessments/submissions/:submissionId/grade`

**Request Body:**

```json
{
  "score": 82,
  "feedback": "Strong work on the short answers.",
  "reason": "Manual grading complete"
}
```

## Results and Publication

- `GET /:id/results` returns role-scoped results.
- Students and parents can only read results after publication.
- `POST /grades/:gradeId/publish` marks the result as published and updates the linked attempt state.
- `GET /:id/export` returns an export payload inside the normal response envelope.
- `GET /:id/audit-logs` exposes the assessment audit trail for staff.
