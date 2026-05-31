---
sidebar_position: 3
---

# IAM

The IAM module manages login-adjacent identity data that sits below business profiles: user accounts, tenant memberships, role-permission mappings, authorization checks, and session revocation.

## Base URL

```text
/api/v1/iam
```

## Authentication

All IAM endpoints require a valid Bearer token.

## Permission Model

IAM routes are guarded by fine-grained permissions rather than role-only checks.

| Permission | Purpose |
| --- | --- |
| `iam.user.view` | List IAM-backed user accounts |
| `iam.user.manage` | Create and update IAM users |
| `iam.membership.manage` | Assign, update, and revoke tenant memberships |
| `iam.role.view` | List roles |
| `iam.role.manage` | Create and update roles |
| `iam.permission.view` | List permissions |
| `iam.permission.manage` | Manage role-permission mappings |
| `iam.authorize` | Run explicit authorization decisions |
| `iam.session.revoke` | Revoke active sessions |
| `iam.audit.view` | Read IAM audit logs |

## Endpoint Summary

| Method | Endpoint | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/users` | `iam.user.view` | List IAM users with memberships |
| `POST` | `/users` | `iam.user.manage` | Create a user account and default membership |
| `PATCH` | `/users/:id` | `iam.user.manage` | Update IAM user account data |
| `POST` | `/memberships` | `iam.membership.manage` | Assign a tenant membership |
| `PATCH` | `/memberships/:id` | `iam.membership.manage` | Update membership scope or status |
| `DELETE` | `/memberships/:id` | `iam.membership.manage` | Revoke a membership |
| `GET` | `/roles` | `iam.role.view` | List roles with attached permissions |
| `POST` | `/roles` | `iam.role.manage` | Create a role |
| `PATCH` | `/roles/:id` | `iam.role.manage` | Rename a role |
| `GET` | `/permissions` | `iam.permission.view` | List registered permissions |
| `POST` | `/role-permissions` | `iam.permission.manage` | Map a permission to a role |
| `DELETE` | `/role-permissions` | `iam.permission.manage` | Remove a permission from a role |
| `POST` | `/authorize` | `iam.authorize` | Evaluate permission and scope access |
| `POST` | `/sessions/revoke` | `iam.session.revoke` | Revoke a session by `sessionId` or `refreshToken` |
| `GET` | `/audit-logs` | `iam.audit.view` | List audit log entries |

## Create User

**Endpoint:** `POST /api/v1/iam/users`

**Request Body:**

```json
{
  "email": "new.teacher@example.com",
  "password": "Teacher@123",
  "fullName": "New Teacher",
  "roleName": "teacher",
  "tenantId": 1,
  "username": "new.teacher",
  "phone": "+84901234567"
}
```

**Notes:**

- `email`, `password`, and `fullName` are required.
- `roleId` or `roleName` is optional; if omitted, the user defaults to `student`.
- If `tenantId` is omitted, the service uses the `DEFAULT` tenant when available.
- Username and phone must be unique if supplied.

## Create Membership

**Endpoint:** `POST /api/v1/iam/memberships`

**Request Body:**

```json
{
  "userId": 42,
  "tenantId": 1,
  "scopeType": "tenant",
  "status": "active",
  "roleName": "teacher"
}
```

If `roleId` or `roleName` is included, the service also creates or refreshes the tenant-scoped role assignment.

## Authorization Check

**Endpoint:** `POST /api/v1/iam/authorize`

**Request Body:**

```json
{
  "requiredPermission": "iam.user.view",
  "requestedScopeType": "tenant",
  "requestedScopeRefId": 1
}
```

The response returns an allow or deny decision together with the resolved authorization context when access is granted.

## Revoke Session

**Endpoint:** `POST /api/v1/iam/sessions/revoke`

**Request Body:**

```json
{
  "sessionId": 10,
  "reason": "manual_revoke"
}
```

You can revoke by either `sessionId` or `refreshToken`.

## Audit Logs

**Endpoint:** `GET /api/v1/iam/audit-logs`

**Query Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `tenantId` | integer | Optional tenant filter |
| `actorUserId` | integer | Optional actor filter |

The endpoint returns `metadata.logs`, ordered newest first.
