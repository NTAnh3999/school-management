---
sidebar_position: 1
---

# Authentication

The authentication system provides secure JWT-based authentication with support for registration, login, token refresh, and logout.

## Base URL

All authentication endpoints are prefixed with:

```
/api/v1/auth
```

## Endpoints

### Register

Create a new user account.

**Endpoint:** `POST /api/v1/auth/register`

**Access:** Public

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "roleName": "student"
}
```

| Field    | Type   | Required | Description                                                |
| -------- | ------ | -------- | ---------------------------------------------------------- |
| email    | string | Yes      | Valid email address                                        |
| password | string | Yes      | Minimum 6 characters                                       |
| fullName | string | Yes      | User's full name                                           |
| roleName | string | No       | One of: `student`, `teacher`, `admin`, `parent` (default: `student`) |

**Success Response (201):**

```json
{
  "message": "Registered",
  "code": 201,
  "metadata": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "student",
      "createdAt": "2026-03-22T10:00:00.000Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "a3f8e1..."
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation error or email already exists
- `500 Internal Server Error` - Server error

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "fullName": "John Doe",
    "roleName": "student"
  }'
```

---

### Login

Authenticate and receive a JWT token.

**Endpoint:** `POST /api/v1/auth/login`

**Access:** Public

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

| Field    | Type   | Required | Description     |
| -------- | ------ | -------- | --------------- |
| email    | string | Yes      | User's email    |
| password | string | Yes      | User's password |

**Success Response (200):**

```json
{
  "message": "Logged in",
  "code": 200,
  "metadata": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "student"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "a3f8e1..."
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid credentials
- `500 Internal Server Error` - Server error

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@schoolhub.io",
    "password": "Admin@123"
  }'
```

---

### Refresh Token

Get a new access token using a refresh token.

**Endpoint:** `POST /api/v1/auth/refresh`

**Access:** Public

**Request Body:**

```json
{
  "refreshToken": "refresh_token_here"
}
```

| Field        | Type   | Required | Description         |
| ------------ | ------ | -------- | ------------------- |
| refreshToken | string | Yes      | Valid refresh token |

**Success Response (200):**

```json
{
  "message": "Token refreshed",
  "code": 200,
  "metadata": {
    "access_token": "new_access_token_here",
    "refresh_token": "new_refresh_token_here"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Missing refresh token
- `401 Unauthorized` - Invalid or expired refresh token

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token"
  }'
```

---

### Logout

Invalidate the current refresh token.

**Endpoint:** `POST /api/v1/auth/logout`

**Access:** Public

**Request Body:**

```json
{
  "refreshToken": "refresh_token_here"
}
```

| Field        | Type   | Required | Description                 |
| ------------ | ------ | -------- | --------------------------- |
| refreshToken | string | No       | Refresh token to invalidate |

**Success Response (200):**

```json
{
  "message": "Logged out",
  "code": 200
}
```

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token"
  }'
```

---

## Token Usage

After successful login, include the JWT token in the Authorization header for protected endpoints:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

Example:

```bash
curl -X GET http://localhost:8080/api/v1/courses \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Token Expiration

- **Access Token:** Expires in 15 minutes (configurable via `JWT_EXPIRES`)
- **Refresh Token:** Expires in 7 days (configurable via `JWT_REFRESH_EXPIRES`)

Use the `/api/v1/auth/refresh` endpoint to get a new access token using the refresh token.
