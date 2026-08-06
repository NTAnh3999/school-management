---
sidebar_position: 3
---

# IAM

The IAM module manages login-adjacent identity data that sits below business profiles: user accounts, tenant memberships, scoped role assignments, permission checks, and session revocation.

## Implementation Status

This page documents the IAM backend implemented in `api/`. It covers the core FSD IAM flows for local authentication, tenant membership resolution, active tenant context, scoped role assignments, permission checks, session revocation, and IAM audit logging.

The broader Notion FSD also describes platform-level roles, SSO / External IdP integration, service-to-service authentication, and domain event publication. Those are not exposed by the current backend yet. Current role records are `admin`, `teacher`, `student`, and `parent`; tenant/platform-specific role naming such as Platform Admin or School Admin should be modeled as role records and permission mappings until first-class platform/SSO/service-client support is added.

## Base URL

```text
/api/v1/iam
```

## Authentication

All IAM endpoints require a valid Bearer token, and a session with an active tenant (see [Authentication](./authentication) for `switch-tenant`).

## Authorization Model

A user's effective role and permissions are resolved **fresh on every request** from `iam_role_assignments`, scoped to whichever tenant the session currently has active. There is no flat, global role stored on the user — the same person can hold different roles in different tenants, and different roles at different org-structure scopes within the same tenant (see below). Because this is recomputed per request, a role change or membership revocation takes effect on the caller's very next request — no re-login required.

### Scope: tenant → branch → campus → location

Every membership and role assignment carries a `scopeType` (`tenant`, `branch`, `campus`, or `location`) plus the matching `branchId` / `campusId` / `locationId` — exactly one of which must be set, matching `scopeType` (the other two must be `null`). Branches, campuses, and locations are managed under [Org Structure](./org-structure).

Scope is hierarchical, not an exact-match string: a `branch`-scoped grant automatically covers every campus and location under that branch; a `campus`-scoped grant covers every location under that campus; a `location`-scoped grant additionally covers any descendant location (nested via `parentLocationId`); a `tenant`-scoped grant covers everything in the tenant. A campus-scoped grant does **not** widen upward to cover its parent branch or other campuses.

This hierarchy is enforced everywhere scope matters — not just `POST /authorize`:

| Endpoint | What's scope-checked |
| --- | --- |
| `POST /memberships` | The scope being **granted** must be covered by one of the actor's own granting role assignments (a branch-scoped admin can't hand out tenant-wide or different-branch access). |
| `PATCH /memberships/:id` | Both the **existing** membership scope and the requested next scope must be covered, so a scoped admin cannot widen a membership while updating it. |
| `DELETE /memberships/:id` | The **existing** membership's scope must be covered. |
| `POST /users` | Same as granting a membership — the initial scope given to the new user must be covered. |
| `PATCH /users/:id` | A user can hold memberships at several scopes at once; **every** scope the target currently holds (within the actor's tenant) must be covered, since a role change propagates to all of them. |
| `POST /sessions/revoke` | Every scope the session owner holds must be covered. |
| `GET /users` | Not a single allow/deny — the returned list is **filtered** to users whose memberships fall within the actor's covered scope (tenant-wide viewers see everyone in the tenant). |
| `GET /audit-logs` | Same filtering approach, resolved per entry from its `entityType`/`entityId` (a `role` or `permission` entry has no scope of its own, so only tenant-wide viewers see those). |

A request that also names a **different tenant** than the caller's active one (e.g. `tenantId` in the body of `POST /memberships`) is always denied outright — nothing here lets a session act across tenants.

### Error codes

| Code | Meaning |
| --- | --- |
| `IAM_TENANT_CONTEXT_REQUIRED` | No active tenant on the session; call `switch-tenant` first. |
| `IAM_TENANT_ACCESS_DENIED` | No active membership in this tenant, or the request named a different tenant than the active one. |
| `IAM_PERMISSION_DENIED` | The permission code isn't held anywhere in the active tenant. |
| `IAM_SCOPE_ACCESS_DENIED` | The permission is held, but not at a scope covering the target. |
| `IAM_SCOPE_MISMATCH` | A membership/role-assignment write set a `branchId`/`campusId`/`locationId` that doesn't match its own `scopeType`. |

## Permission Model

IAM routes are guarded by fine-grained permissions rather than role-only checks.

| Permission | Purpose |
| --- | --- |
| `iam.user.view` | List IAM-backed user accounts (scope-filtered) |
| `iam.user.manage` | Create and update IAM users |
| `iam.membership.manage` | Assign, update, and revoke tenant memberships |
| `iam.role.view` | List roles |
| `iam.role.manage` | Create and update roles |
| `iam.permission.view` | List permissions |
| `iam.permission.manage` | Manage role-permission mappings |
| `iam.authorize` | Run explicit authorization decisions |
| `iam.session.revoke` | Revoke active sessions |
| `iam.audit.view` | Read IAM audit logs (scope-filtered) |
| `auth.tenant.switch` | Switch the session's active tenant |

`org.*` permissions (branches/campuses/locations) are documented under [Org Structure](./org-structure).

### Current role model

The backend seeds four role names: `admin`, `teacher`, `student`, and `parent`. `admin` receives all registered permissions by default, while the other seeded roles receive `auth.tenant.switch`. Additional administrative roles can be created through `POST /roles` and configured through `/role-permissions`.

The Notion FSD names actor groups such as Platform Admin and School Admin. In the current backend, those are operational actor concepts, not hard-coded role constants. Represent them as role records with appropriate permission mappings and IAM scope until platform-level and tenant-level role policy is implemented.

## Endpoint Summary

| Method | Endpoint | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/users` | `iam.user.view` | List IAM users with memberships, filtered to the viewer's tenant + covered scope |
| `POST` | `/users` | `iam.user.manage` | Create a user account and an initial membership (optionally scoped) |
| `PATCH` | `/users/:id` | `iam.user.manage` | Update IAM user account data and/or role |
| `POST` | `/memberships` | `iam.membership.manage` | Assign a tenant membership, optionally scoped to a branch/campus/location |
| `PATCH` | `/memberships/:id` | `iam.membership.manage` | Update membership scope or status |
| `DELETE` | `/memberships/:id` | `iam.membership.manage` | Revoke a membership |
| `GET` | `/roles` | `iam.role.view` | List roles with attached permissions |
| `POST` | `/roles` | `iam.role.manage` | Create a role |
| `PATCH` | `/roles/:id` | `iam.role.manage` | Rename a role |
| `GET` | `/permissions` | `iam.permission.view` | List registered permissions |
| `POST` | `/role-permissions` | `iam.permission.manage` | Map a permission to a role |
| `DELETE` | `/role-permissions` | `iam.permission.manage` | Remove a permission from a role |
| `POST` | `/authorize` | `iam.authorize` | Evaluate permission and scope access explicitly |
| `POST` | `/sessions/revoke` | `iam.session.revoke` | Revoke a session by `sessionId` or `refreshToken` |
| `GET` | `/audit-logs` | `iam.audit.view` | List audit log entries, filtered to the viewer's tenant + covered scope |

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
  "scopeType": "branch",
  "branchId": 4,
  "username": "new.teacher",
  "phone": "+84901234567"
}
```

**Notes:**

- `email`, `password`, and `fullName` are required.
- `roleId` or `roleName` is optional; if omitted, the user defaults to `student`.
- If `tenantId` is omitted, the actor's own active tenant is used.
- `scopeType` defaults to `tenant` if omitted. When set to `branch`/`campus`/`location`, the matching `branchId`/`campusId`/`locationId` is required (see [Scope](#scope-tenant--branch--campus--location)) — and it must be covered by the actor's own granting role assignment, or the request is denied with `IAM_SCOPE_ACCESS_DENIED`.
- Username and phone must be unique if supplied.

## Create Membership

**Endpoint:** `POST /api/v1/iam/memberships`

**Request Body:**

```json
{
  "userId": 42,
  "tenantId": 1,
  "scopeType": "branch",
  "branchId": 4,
  "status": "active",
  "roleName": "teacher"
}
```

If `roleId` or `roleName` is included, the service also creates or refreshes the role assignment at the same scope. Assigning a **different** role at the same `(tenantId, scopeType, branchId/campusId/locationId)` automatically revokes (not deletes) any prior active role assignment there — the old assignment stops granting access on the target user's very next request.

## Authorization Check

**Endpoint:** `POST /api/v1/iam/authorize`

**Request Body:**

```json
{
  "requiredPermission": "iam.user.view",
  "requestedScopeType": "campus",
  "requestedCampusId": 7
}
```

`requestedScopeType` is one of `tenant` / `branch` / `campus` / `location`, paired with the matching `requestedBranchId` / `requestedCampusId` / `requestedLocationId`. The response returns an allow/deny decision (`code` is one of the [error codes](#error-codes) above, or `ALLOW`) together with the resolved authorization context when access is granted.

## Revoke Session

**Endpoint:** `POST /api/v1/iam/sessions/revoke`

**Request Body:**

```json
{
  "sessionId": "b3f1c2d4-...",
  "reason": "manual_revoke"
}
```

You can revoke by either `sessionId` or `refreshToken`. Every scope the session's owner currently holds (within the actor's active tenant) must be covered by the actor's own scope.

## Audit Logs

**Endpoint:** `GET /api/v1/iam/audit-logs`

**Query Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `actorUserId` | integer | Optional filter, narrowing to actions performed by a specific user |

Results are always scoped to the caller's own active tenant (there's no cross-tenant `tenantId` filter) and further filtered to entries the caller's scope covers, resolved per entry from its `entityType`. The endpoint returns `metadata.logs`, ordered newest first.
