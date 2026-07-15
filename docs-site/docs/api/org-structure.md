---
sidebar_position: 4
---

# Org Structure

Branches, campuses, and locations model a tenant's physical organization — the hierarchy that [IAM scope](./iam#scope-tenant--branch--campus--location) is checked against: `tenant → branch → campus → location`, with locations optionally nesting under another location via `parentLocationId`.

## Base URL

```text
/api/v1/org
```

## Authentication

All endpoints require a valid Bearer token and an active tenant.

## Permission Model

| Permission | Purpose |
| --- | --- |
| `org.branch.view` | List branches |
| `org.branch.manage` | Create and update branches |
| `org.campus.view` | List campuses |
| `org.campus.manage` | Create and update campuses |
| `org.location.view` | List locations |
| `org.location.manage` | Create and update locations |

These are plain permission checks (no scope filtering) — org-structure management itself is not currently scope-restricted the way IAM's user/membership endpoints are.

## Endpoint Summary

| Method | Endpoint | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/branches` | `org.branch.view` | List branches, optionally filtered by `tenantId` |
| `POST` | `/branches` | `org.branch.manage` | Create a branch under a tenant |
| `PATCH` | `/branches/:id` | `org.branch.manage` | Update a branch's name or status |
| `GET` | `/campuses` | `org.campus.view` | List campuses, optionally filtered by `branchId`/`tenantId` |
| `POST` | `/campuses` | `org.campus.manage` | Create a campus under a branch |
| `PATCH` | `/campuses/:id` | `org.campus.manage` | Update a campus's name or status |
| `GET` | `/locations` | `org.location.view` | List locations, optionally filtered by `campusId`/`branchId`/`tenantId` |
| `POST` | `/locations` | `org.location.manage` | Create a location under a campus, optionally nested under a parent location |
| `PATCH` | `/locations/:id` | `org.location.manage` | Update a location's name, type, capacity, status, or metadata |

## Create Branch

**Endpoint:** `POST /api/v1/org/branches`

**Request Body:**

```json
{
  "tenantId": 1,
  "branchCode": "MAIN",
  "branchName": "Main Branch"
}
```

`branchCode` must be unique within the tenant. `status` defaults to `active`.

## Create Campus

**Endpoint:** `POST /api/v1/org/campuses`

**Request Body:**

```json
{
  "branchId": 4,
  "campusCode": "DOWNTOWN",
  "campusName": "Downtown Campus"
}
```

`campusCode` must be unique within the branch. **`tenantId` is always derived from the parent branch** — the service never trusts a client-supplied value for this denormalized column, so the hierarchy can't drift even though `tenantId`/`branchId` are duplicated onto `campuses` and `locations` for cheap scope comparisons.

## Create Location

**Endpoint:** `POST /api/v1/org/locations`

**Request Body:**

```json
{
  "campusId": 7,
  "parentLocationId": null,
  "locationCode": "BLDG-A",
  "locationName": "Building A",
  "locationType": "building",
  "capacity": 200
}
```

`locationCode` must be unique within the campus. `locationType` is one of `building`, `floor`, `room`, `hall`, `lab`, `outdoor`, `virtual` (defaults to `room`). If `parentLocationId` is set, it must reference a location under the **same** campus. `tenantId` and `branchId` are derived from the parent campus, same rule as campuses above.

Nesting example — a room inside a building:

```json
{
  "campusId": 7,
  "parentLocationId": 12,
  "locationCode": "BLDG-A-101",
  "locationName": "Room 101",
  "locationType": "room"
}
```

A [location-scoped IAM grant](./iam#scope-tenant--branch--campus--location) on Building A automatically covers Room 101 and any location nested under it.
