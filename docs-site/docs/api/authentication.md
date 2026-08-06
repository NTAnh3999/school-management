---
sidebar_position: 1
---

# Authentication

Authentication is backed by IAM sessions. Login, refresh, logout, tenant listing, and tenant switching all work with `iam_sessions`, `iam_memberships`, `iam_role_assignments`, and `iam_user_accounts`.

## Base URL

```text
/api/v1/auth
```

## Session and Tenant Context

Access tokens are JWTs that reference an IAM session by `sessionId`. Protected requests reload the current user, account status, active membership, roles, and permissions from the database on every request.

If a user belongs to exactly one tenant, login can create a session with `activeTenantId` already set. If the user belongs to multiple tenants and `tenantId` is not provided at login, the response has `tenantContextRequired: true`; the client must call `POST /switch-tenant` before using IAM-protected endpoints.

## Response Shape

Auth endpoints that issue tokens return this metadata shape:

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "opaque-refresh-token",
  "session": {
    "id": "b3f1c2d4-...",
    "userId": 1,
    "activeTenantId": 1,
    "status": "active",
    "expiresAt": "2026-08-02T10:00:00.000Z",
    "lastUsedAt": "2026-07-26T10:00:00.000Z",
    "revokedAt": null,
    "revokedReason": null
  },
  "tenantContextRequired": false,
  "activeTenant": {
    "id": 1,
    "tenantCode": "DEFAULT",
    "tenantName": "Default School",
    "status": "active"
  },
  "tenants": [],
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "student",
    "activeTenantId": 1,
    "roles": [],
    "permissions": [],
    "memberships": []
  }
}
```

## Endpoints

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/register` | Public | Create a user, default tenant membership, default role assignment, and session |
| `POST` | `/login` | Public | Authenticate with email/password and create an IAM session |
| `POST` | `/refresh` | Public | Rotate refresh token and issue a new access token |
| `POST` | `/logout` | Public / optional Bearer token | Revoke the current session or the session matching `refreshToken` |
| `GET` | `/tenants` | Bearer token | List active tenant memberships for the current user |
| `POST` | `/switch-tenant` | Bearer token | Set the active tenant on the current session and issue updated tokens |
| `POST` | `/forgot-password` | Public | Accept a reset request without revealing whether the email exists |

## Register

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "roleName": "student"
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | Minimum 6 characters |
| `fullName` | string | Yes | User's full name |
| `roleName` | string | No | One of `student`, `teacher`, `admin`, `parent`; defaults to `student` |

Register creates the user, ensures an IAM account, grants membership in the default tenant if present, assigns the requested role, creates an IAM session, and returns the standard auth response.

## Login

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "tenantId": 1
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `email` | string | Yes | User's email |
| `password` | string | Yes | User's password |
| `tenantId` | integer | No | Tenant to activate immediately, if the user has membership |

If `tenantId` is omitted and the user has multiple active tenant memberships, the session is created without an active tenant and `tenantContextRequired` is `true`.

## Refresh Token

**Endpoint:** `POST /api/v1/auth/refresh`

**Request Body:**

```json
{
  "refreshToken": "opaque-refresh-token"
}
```

Refresh requires the IAM session to be active and unexpired, the user account to be active, and the active tenant membership to still be valid. The refresh token is rotated on success.

## Logout

**Endpoint:** `POST /api/v1/auth/logout`

**Request Body:**

```json
{
  "refreshToken": "opaque-refresh-token"
}
```

`refreshToken` is optional if the request includes a valid Bearer token; in that case the current `sessionId` is used. Logout revokes the matching IAM session and records an audit log.

## Get Tenant Memberships

**Endpoint:** `GET /api/v1/auth/tenants`

**Access:** Bearer token

**Success metadata:**

```json
{
  "activeTenantId": 1,
  "tenants": []
}
```

## Switch Tenant

**Endpoint:** `POST /api/v1/auth/switch-tenant`

**Access:** Bearer token

**Request Body:**

```json
{
  "selectedTenantId": 1
}
```

The selected tenant must be one of the current user's active memberships. On success, the session's `activeTenantId` is updated and a standard auth response is returned.

## Forgot Password

**Endpoint:** `POST /api/v1/auth/forgot-password`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

The endpoint always returns a generic success message and currently logs the reset request server-side.

## Token Usage

Include the access token in protected requests:

```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Token Expiration

- Access token: `JWT_EXPIRES`, default `15m`.
- Refresh session: `JWT_REFRESH_EXPIRES`, default `7d`.

Use `POST /api/v1/auth/refresh` to rotate the refresh token and receive an updated access token.
