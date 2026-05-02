---
sidebar_position: 2
---

# Profiles

The Profile module manages **business profile data** for users in the system. It is the canonical source of identity information used by portals and downstream modules (Classroom, Enrollment, Reporting, etc.).

:::info Separation of Concerns
Profile answers **"who is this person in the educational context?"**  
IAM (auth/users) answers **"how does this person log in and what are their permissions?"**

Profile does **not** manage passwords, sessions, tokens, roles, or permissions.
:::

## Base URL

```
/api/v1/profiles
```

## Authentication

All endpoints require a valid Bearer token:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Roles & Permissions

| Action | Admin | Teacher | Student | Parent |
| --- | :---: | :---: | :---: | :---: |
| List profiles | ✅ | ✅ (limited) | ❌ | ❌ |
| View own profile | ✅ | ✅ | ✅ | ✅ |
| View other's profile | ✅ | ✅ scoped | ❌ | ✅ linked only |
| Create profile | ✅ | ❌ | ❌ | ❌ |
| Update profile (all fields) | ✅ | ❌ | ❌ | ❌ |
| Update own profile (limited) | ✅ | ✅ | ✅ | ✅ |
| Change profile status | ✅ | ❌ | ❌ | ❌ |
| Link parent to student | ✅ | ❌ | ❌ | ❌ |
| Revoke parent–student relationship | ✅ | ❌ | ❌ | ❌ |
| View linked students | ✅ | ❌ | ❌ | ✅ |
| View profile summary | ✅ | ✅ | ✅ | ✅ |
| View audit logs | ✅ | ❌ | ❌ | ❌ |

---

## Profile Lifecycle

```
Draft ──► Active ──► Inactive ──► Archived
                 ◄──────────
```

| Status | Description | Visible in portals |
| --- | --- | --- |
| `draft` | Newly created, incomplete | Admin/System only |
| `active` | Fully operational | Yes |
| `inactive` | Temporarily suspended | Hidden by default |
| `archived` | Permanently stored | Admin only |

---

## Profile Types

| Type | Description |
| --- | --- |
| `student` | Learner — has a `StudentProfile` extension |
| `parent` | Guardian — has a `ParentProfile` extension |
| `teacher` | Instructor — has a `TeacherProfile` extension |
| `staff` | Administrative staff |
| `admin` | Platform/school administrator |

---

## Endpoints

### List Profiles

Get a paginated list of profiles in the system.

**Endpoint:** `GET /api/v1/profiles`

**Access:** Admin, Teacher

**Query Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| profileType | string | No | Filter by type: `student`, `parent`, `teacher`, `staff`, `admin` |
| status | string | No | Filter by status: `draft`, `active`, `inactive`, `archived` |
| search | string | No | Search by full name, display name, or email |
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Results per page (default: 20, max: 100) |

**Success Response (200):**

```json
{
  "message": "OK",
  "code": 200,
  "metadata": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "profiles": [
      {
        "id": 1,
        "tenant_id": 1,
        "user_id": 5,
        "profile_type": "student",
        "full_name": "Nguyen Van A",
        "display_name": null,
        "avatar_url": null,
        "status": "active",
        "student_profile": {
          "id": 1,
          "student_code": "STU-001",
          "current_level": "intermediate"
        }
      }
    ]
  }
}
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/v1/profiles?profileType=student&status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Get Profile by ID

Get the full detail of a single profile.

**Endpoint:** `GET /api/v1/profiles/:id`

**Access:** Authenticated (scope enforced server-side)

**Path Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| id | integer | Profile ID |

**Success Response (200):**

```json
{
  "message": "OK",
  "code": 200,
  "metadata": {
    "profile": {
      "id": 1,
      "tenant_id": 1,
      "user_id": 5,
      "profile_type": "teacher",
      "full_name": "Tran Thi B",
      "display_name": "Ms. B",
      "avatar_url": "https://cdn.example.com/avatars/5.jpg",
      "contact_email": "b@schoolhub.io",
      "phone_number": "0901234567",
      "address": "123 Main St",
      "status": "active",
      "visibility": "internal",
      "created_at": "2026-01-10T08:00:00.000Z",
      "teacher_profile": {
        "id": 1,
        "teacher_code": "TCH-001",
        "bio": "Experienced Math teacher",
        "expertise": ["Mathematics", "Physics"],
        "years_of_experience": 8,
        "public_profile_enabled": true
      }
    }
  }
}
```

---

### Get Profile Summary

Get a lightweight profile summary for use by portals and downstream modules.

**Endpoint:** `GET /api/v1/profiles/:id/summary`

**Access:** Authenticated

**Success Response (200):**

```json
{
  "message": "OK",
  "code": 200,
  "metadata": {
    "summary": {
      "id": 1,
      "user_id": 5,
      "tenant_id": 1,
      "profile_type": "student",
      "full_name": "Nguyen Van A",
      "display_name": null,
      "avatar_url": null,
      "status": "active",
      "student_profile": {
        "student_code": "STU-001"
      }
    }
  }
}
```

---

### Create Profile

Create a new business profile for an existing user identity.

**Endpoint:** `POST /api/v1/profiles`

**Access:** Admin only

**Request Body (Student):**

```json
{
  "userId": 5,
  "profileType": "student",
  "fullName": "Nguyen Van A",
  "displayName": "Van A",
  "contactEmail": "a@example.com",
  "phoneNumber": "0901234567",
  "status": "active",
  "studentCode": "STU-001",
  "dateOfBirth": "2008-05-15",
  "gender": "male",
  "currentLevel": "intermediate",
  "learningGoal": "Pass the final exam"
}
```

**Request Body (Parent):**

```json
{
  "userId": 6,
  "profileType": "parent",
  "fullName": "Nguyen Thi C",
  "contactEmail": "c@example.com",
  "phoneNumber": "0907654321",
  "status": "active",
  "parentCode": "PAR-001",
  "occupation": "Engineer",
  "contactPriority": 1,
  "emergencyContactFlag": true
}
```

**Request Body (Teacher):**

```json
{
  "userId": 7,
  "profileType": "teacher",
  "fullName": "Tran Thi B",
  "contactEmail": "b@schoolhub.io",
  "status": "active",
  "teacherCode": "TCH-001",
  "bio": "Experienced Math teacher",
  "expertise": ["Mathematics", "Physics"],
  "qualification": "M.Sc. Applied Mathematics",
  "yearsOfExperience": 8,
  "publicProfileEnabled": true
}
```

**Common Fields:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| userId | integer | Yes | IAM user identity ID |
| profileType | string | Yes | `student`, `parent`, `teacher`, `staff`, `admin` |
| fullName | string | Yes | Full name (2–120 chars) |
| displayName | string | No | Display name (defaults to fullName) |
| contactEmail | string | No | Contact email (may differ from login email) |
| phoneNumber | string | No | Phone number |
| address | string | No | Address |
| status | string | No | `draft` (default) or `active` |
| visibility | string | No | `internal` (default), `public`, `private` |

**Student Extension Fields:**

| Field | Type | Description |
| --- | --- | --- |
| studentCode | string | Unique student code within tenant |
| dateOfBirth | date | Date of birth (YYYY-MM-DD) |
| gender | string | `male`, `female`, `other`, `unspecified` |
| currentLevel | string | Current academic level |
| learningGoal | string | Personal learning goal |

**Parent Extension Fields:**

| Field | Type | Description |
| --- | --- | --- |
| parentCode | string | Unique parent code within tenant |
| occupation | string | Occupation |
| contactPriority | integer | Contact priority order |
| emergencyContactFlag | boolean | Emergency contact flag |

**Teacher Extension Fields:**

| Field | Type | Description |
| --- | --- | --- |
| teacherCode | string | Unique teacher code within tenant |
| bio | string | Short biography |
| expertise | array | List of expertise areas |
| qualification | string | Qualifications and certifications |
| yearsOfExperience | integer | Years of teaching experience |
| publicProfileEnabled | boolean | Show on public-facing pages |

**Success Response (201):**

```json
{
  "message": "Profile created",
  "code": 201,
  "metadata": {
    "profile": { "id": 1, "profile_type": "student", "status": "active" }
  }
}
```

**Error Responses:**

| Status | Reason |
| --- | --- |
| 400 | Missing required fields or invalid profileType |
| 403 | Caller is not Admin |
| 404 | User identity not found |
| 409 | Duplicate profile rule violation |

---

### Update Profile

Update profile data. Admins may update all fields; owners may only update permitted fields.

**Endpoint:** `PUT /api/v1/profiles/:id`

**Access:** Admin (all fields), Owner (limited fields)

**Owner-editable fields (all profile types):** `displayName`, `avatarUrl`, `phoneNumber`, `address`, `contactEmail`

**Owner-editable extension fields:**
- Student: `learningGoal`, `currentLevel`
- Parent: `occupation`, `contactPriority`, `emergencyContactFlag`
- Teacher: `bio`, `expertise`, `qualification`, `yearsOfExperience`

**Request Body:**

```json
{
  "displayName": "Van A",
  "avatarUrl": "https://cdn.example.com/avatars/new.jpg",
  "phoneNumber": "0901111111"
}
```

**Success Response (200):**

```json
{
  "message": "Profile updated",
  "code": 200,
  "metadata": {
    "profile": { "id": 1, "display_name": "Van A", "phone_number": "0901111111" }
  }
}
```

:::warning Restrictions
Profile update **cannot** change: `userId`, `profileType`, `tenantId`, `password`, `role`, or any authentication credential.
:::

---

### Change Profile Status

Transition a profile to a different lifecycle status.

**Endpoint:** `PATCH /api/v1/profiles/:id/status`

**Access:** Admin only

**Valid Transitions:**

| From | To |
| --- | --- |
| `draft` | `active` |
| `active` | `inactive` |
| `inactive` | `active`, `archived` |
| `archived` | *(terminal — no transitions)* |

**Request Body:**

```json
{
  "status": "inactive",
  "reason": "Student requested leave of absence"
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| status | string | Yes | Target status |
| reason | string | No | Reason for status change |

**Success Response (200):**

```json
{
  "message": "Profile status updated",
  "code": 200,
  "metadata": {
    "profile": { "id": 1, "status": "inactive" }
  }
}
```

---

### Link Parent to Student

Establish a parent–student relationship between two profiles in the same tenant.

**Endpoint:** `POST /api/v1/profiles/relationships/link`

**Access:** Admin only

**Request Body:**

```json
{
  "parentProfileId": 3,
  "studentProfileId": 1,
  "relationshipType": "mother"
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| parentProfileId | integer | Yes | ID of the ParentProfile |
| studentProfileId | integer | Yes | ID of the StudentProfile |
| relationshipType | string | No | `father`, `mother`, `guardian` (default), `other` |

**Success Response (201):**

```json
{
  "message": "Parent linked to student",
  "code": 201,
  "metadata": {
    "relationship": {
      "id": 1,
      "parent_profile_id": 3,
      "student_profile_id": 1,
      "relationship_type": "mother",
      "status": "active",
      "start_date": "2026-05-02T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**

| Status | Reason |
| --- | --- |
| 400 | Parent and student belong to different tenants |
| 404 | Parent or student profile not found |
| 409 | Active or pending relationship already exists |

---

### Revoke Parent–Student Relationship

Deactivate (revoke) an existing parent–student relationship.  
The record is **not deleted** — it is retained for audit history.

**Endpoint:** `PATCH /api/v1/profiles/relationships/:relationshipId/revoke`

**Access:** Admin only

**Request Body:**

```json
{
  "reason": "Student transferred to a different school"
}
```

**Success Response (200):**

```json
{
  "message": "Relationship revoked",
  "code": 200,
  "metadata": {
    "relationship": {
      "id": 1,
      "status": "revoked",
      "end_date": "2026-05-02T00:00:00.000Z",
      "reason": "Student transferred to a different school"
    }
  }
}
```

---

### Get Linked Students (for a Parent)

Return all students actively linked to a parent profile.

**Endpoint:** `GET /api/v1/profiles/parent/:parentProfileId/students`

**Access:** Admin, Parent (own relationships)

**Path Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| parentProfileId | integer | ID of the ParentProfile |

**Success Response (200):**

```json
{
  "message": "OK",
  "code": 200,
  "metadata": {
    "students": [
      {
        "relationship_id": 1,
        "relationship_type": "mother",
        "status": "active",
        "student_profile_id": 1,
        "student_code": "STU-001",
        "student": {
          "id": 1,
          "full_name": "Nguyen Van A",
          "display_name": null,
          "avatar_url": null,
          "status": "active"
        }
      }
    ]
  }
}
```

:::note
Only relationships with status `active` are returned. Revoked, suspended, or pending relationships are excluded.
:::

---

### View Profile Audit Log

View the change history for a profile.

**Endpoint:** `GET /api/v1/profiles/:id/audit-logs`

**Access:** Admin only

**Success Response (200):**

```json
{
  "message": "OK",
  "code": 200,
  "metadata": {
    "logs": [
      {
        "id": 10,
        "entity_name": "Profile",
        "entity_id": 1,
        "action": "CHANGE_STATUS",
        "old_values": { "status": "active" },
        "new_values": { "status": "inactive" },
        "changed_by": 2,
        "changed_at": "2026-05-02T09:30:00.000Z",
        "source": "Student requested leave of absence"
      }
    ]
  }
}
```

**Audit Actions:**

| Action | Triggered by |
| --- | --- |
| `CREATE` | Profile created |
| `UPDATE` | Profile fields updated |
| `CHANGE_STATUS` | Profile status changed |
| `LINK` | Parent–student relationship created |
| `UNLINK` | Parent–student relationship revoked |

---

## Business Rules

- Profile must be linked to a valid **user identity** (IAM).
- Profile must belong to a valid **tenant**.
- `parent` role users may only access student data when an **Active** relationship exists.
- `teacher` role users may only view students within their assigned classrooms/courses.
- Sensitive fields (DOB, phone, address) are filtered based on the caller's access scope.
- Profile status `archived` is terminal — it cannot be reversed without special admin action.
- Profiles that have downstream data (Enrollment, Classroom) should **not** be hard-deleted.
- All significant changes are recorded in the audit log.
