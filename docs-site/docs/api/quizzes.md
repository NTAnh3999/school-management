---
sidebar_position: 6
---

# Quizzes

Create and manage quizzes with auto-grading and attempt tracking.

## Base URL

```
/api/v1/quizzes
```

## Question Types

- **single_choice** - Single correct answer (radio buttons)
- **multiple_choice** - Multiple correct answers (checkboxes)
- **text** - Text-based answer (for manual grading)

## Endpoints

### Create Quiz

Create a new quiz for a lesson.

**Endpoint:** `POST /api/v1/quizzes/lesson/:lessonId`

**Access:** Course Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| lessonId  | integer | Lesson ID   |

**Request Body:**

```json
{
  "title": "JavaScript Basics Quiz",
  "description": "Test your knowledge of JavaScript fundamentals",
  "passingScore": 70,
  "timeLimitMinutes": 30,
  "maxAttempts": 3
}
```

| Field            | Type    | Required | Description                   |
| ---------------- | ------- | -------- | ----------------------------- |
| title            | string  | Yes      | Quiz title                    |
| description      | string  | No       | Quiz description              |
| passingScore     | decimal | Yes      | Minimum score to pass (0-100) |
| timeLimitMinutes | integer | No       | Time limit (0 = unlimited)    |
| maxAttempts      | integer | No       | Max attempts (0 = unlimited)  |

**Success Response (201):**

```json
{
  "data": {
    "id": 1,
    "lesson_id": 5,
    "title": "JavaScript Basics Quiz",
    "description": "Test your knowledge...",
    "passing_score": 70,
    "time_limit_minutes": 30,
    "max_attempts": 3,
    "created_at": "2026-03-22T10:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/quizzes/lesson/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "JavaScript Basics Quiz",
    "passingScore": 70,
    "timeLimitMinutes": 30,
    "maxAttempts": 3
  }'
```

---

### Add Question

Add a question to a quiz.

**Endpoint:** `POST /api/v1/quizzes/:quizId/questions`

**Access:** Course Owner, Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| quizId    | integer | Quiz ID     |

**Request Body:**

```json
{
  "questionText": "What is JavaScript?",
  "questionType": "single_choice",
  "points": 1,
  "orderIndex": 0,
  "options": [
    {
      "text": "A programming language",
      "isCorrect": true,
      "orderIndex": 0
    },
    {
      "text": "A coffee brand",
      "isCorrect": false,
      "orderIndex": 1
    }
  ]
}
```

| Field        | Type    | Required | Description                                |
| ------------ | ------- | -------- | ------------------------------------------ |
| questionText | string  | Yes      | Question text                              |
| questionType | string  | Yes      | `single_choice`, `multiple_choice`, `text` |
| points       | decimal | Yes      | Points for correct answer                  |
| orderIndex   | integer | Yes      | Display order                              |
| options      | array   | Yes\*    | Answer options (\*not for text type)       |

**Success Response (201):**

```json
{
  "data": {
    "id": 1,
    "quiz_id": 1,
    "question_text": "What is JavaScript?",
    "question_type": "single_choice",
    "points": 1,
    "order_index": 0,
    "options": [
      {
        "id": 1,
        "text": "A programming language",
        "is_correct": true,
        "order_index": 0
      },
      {
        "id": 2,
        "text": "A coffee brand",
        "is_correct": false,
        "order_index": 1
      }
    ]
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/quizzes/1/questions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "What is JavaScript?",
    "questionType": "single_choice",
    "points": 1,
    "orderIndex": 0,
    "options": [
      {"text": "A programming language", "isCorrect": true, "orderIndex": 0},
      {"text": "A coffee brand", "isCorrect": false, "orderIndex": 1}
    ]
  }'
```

---

### Get Quiz

Get quiz details with questions.

**Endpoint:** `GET /api/v1/quizzes/:id`

**Access:** Authenticated

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | Quiz ID     |

**Success Response (200):**

For students, correct answers are hidden:

```json
{
  "data": {
    "id": 1,
    "title": "JavaScript Basics Quiz",
    "description": "Test your knowledge...",
    "passing_score": 70,
    "time_limit_minutes": 30,
    "max_attempts": 3,
    "questions": [
      {
        "id": 1,
        "question_text": "What is JavaScript?",
        "question_type": "single_choice",
        "points": 1,
        "order_index": 0,
        "options": [
          {
            "id": 1,
            "text": "A programming language",
            "order_index": 0
          },
          {
            "id": 2,
            "text": "A coffee brand",
            "order_index": 1
          }
        ]
      }
    ],
    "total_points": 5,
    "question_count": 5,
    "user_attempts": 1,
    "best_score": 80
  }
}
```

**Example:**

```bash
curl -X GET http://localhost:8080/api/v1/quizzes/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Start Quiz Attempt

Start a new quiz attempt.

**Endpoint:** `POST /api/v1/quizzes/:quizId/attempts`

**Access:** Student

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| quizId    | integer | Quiz ID     |

**Request Body:**

```json
{
  "enrollmentId": 1
}
```

**Success Response (201):**

```json
{
  "data": {
    "id": 1,
    "quiz_id": 1,
    "enrollment_id": 1,
    "started_at": "2026-03-22T10:00:00.000Z",
    "expires_at": "2026-03-22T10:30:00.000Z",
    "quiz": {
      "title": "JavaScript Basics Quiz",
      "time_limit_minutes": 30,
      "question_count": 5
    }
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/quizzes/1/attempts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enrollmentId": 1
  }'
```

---

### Submit Quiz Attempt

Submit answers for a quiz attempt.

**Endpoint:** `POST /api/v1/quizzes/attempts/:attemptId/submit`

**Access:** Student

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| attemptId | integer | Attempt ID  |

**Request Body:**

```json
{
  "answers": [
    {
      "questionId": 1,
      "selectedOptionId": 2
    },
    {
      "questionId": 2,
      "selectedOptionIds": [3, 5]
    },
    {
      "questionId": 3,
      "textAnswer": "JavaScript is a programming language"
    }
  ]
}
```

**Success Response (200):**

```json
{
  "data": {
    "attempt_id": 1,
    "score": 80,
    "passed": true,
    "completed_at": "2026-03-22T10:15:00.000Z",
    "total_points": 5,
    "earned_points": 4,
    "correct_answers": 4,
    "total_questions": 5,
    "results": [
      {
        "question_id": 1,
        "question_text": "What is JavaScript?",
        "is_correct": true,
        "points_earned": 1,
        "correct_answer": "A programming language"
      }
    ]
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/quizzes/attempts/1/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"questionId": 1, "selectedOptionId": 2},
      {"questionId": 2, "selectedOptionIds": [3, 5]}
    ]
  }'
```

---

### Get Quiz Attempts

Get all attempts for a quiz.

**Endpoint:** `GET /api/v1/quizzes/:quizId/attempts`

**Access:** Student (own), Teacher (own courses), Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| quizId    | integer | Quiz ID     |

**Success Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "score": 80,
      "passed": true,
      "started_at": "2026-03-22T10:00:00.000Z",
      "completed_at": "2026-03-22T10:15:00.000Z"
    }
  ]
}
```

**Example:**

```bash
curl -X GET http://localhost:8080/api/v1/quizzes/1/attempts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Quiz Features

### Auto-Grading

- Single and multiple choice questions are automatically graded
- Text answers require manual review
- Immediate feedback on submission

### Attempt Limits

- Control maximum attempts per student
- Track best score across attempts
- Prevent excessive retakes

### Time Limits

- Optional time limits per quiz
- Countdown timer for students
- Auto-submit when time expires

### Scoring

- Point values per question
- Percentage-based scoring
- Pass/fail threshold
