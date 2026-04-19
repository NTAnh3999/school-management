---
sidebar_position: 10
---

# Users

Manage user profiles and account settings.

## Base URL

```
/api/v1/users
```

## Endpoints

### Get Current User

Get the authenticated user's profile information.

**Endpoint:** `GET /api/v1/users/me`

**Access:** Authenticated

**Authentication:** Required

**Success Response (200):**

```json
{
  "data": {
    "id": 5,
    "email": "john@example.com",
    "full_name": "John Doe",
    "profile_picture": "https://example.com/profile.jpg",
    "role": {
      "id": 3,
      "name": "student",
      "description": "Student role"
    },
    "created_at": "2026-01-15T10:00:00.000Z",
    "stats": {
      "enrolled_courses": 3,
      "completed_courses": 1,
      "total_points": 350,
      "total_rewards": 5
    }
  }
}
```

**Example:**

```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Update Profile

Update the authenticated user's profile.

**Endpoint:** `PUT /api/v1/users/me`

**Access:** Authenticated

**Authentication:** Required

**Request Body:**

```json
{
  "fullName": "John Smith",
  "profilePicture": "https://example.com/new-profile.jpg"
}
```

| Field          | Type   | Required | Description         |
| -------------- | ------ | -------- | ------------------- |
| fullName       | string | No       | User's full name    |
| profilePicture | string | No       | Profile picture URL |

**Success Response (200):**

```json
{
  "data": {
    "id": 5,
    "email": "john@example.com",
    "full_name": "John Smith",
    "profile_picture": "https://example.com/new-profile.jpg",
    "updated_at": "2026-03-22T10:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X PUT http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Smith"
  }'
```

---

### Change Password

Change the authenticated user's password.

**Endpoint:** `PUT /api/v1/users/me/password`

**Access:** Authenticated

**Authentication:** Required

**Request Body:**

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

| Field           | Type   | Required | Description                     |
| --------------- | ------ | -------- | ------------------------------- |
| currentPassword | string | Yes      | Current password                |
| newPassword     | string | Yes      | New password (min 6 characters) |

**Success Response (200):**

```json
{
  "data": {
    "message": "Password changed successfully"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation error or incorrect current password
- `401 Unauthorized` - Not authenticated

**Example:**

```bash
curl -X PUT http://localhost:3000/api/v1/users/me/password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldpassword123",
    "newPassword": "newpassword456"
  }'
```

---

### Get User by ID

Get a user's public profile (admin only for full details).

**Endpoint:** `GET /api/v1/users/:id`

**Access:** Public (limited), Admin (full)

**Authentication:** Optional

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | User ID     |

**Success Response (200):**

Public view (no authentication):

```json
{
  "data": {
    "id": 5,
    "full_name": "John Doe",
    "profile_picture": "https://example.com/profile.jpg",
    "role": {
      "name": "student"
    },
    "stats": {
      "completed_courses": 1,
      "total_points": 350
    }
  }
}
```

Admin view (with authentication):

```json
{
  "data": {
    "id": 5,
    "email": "john@example.com",
    "full_name": "John Doe",
    "profile_picture": "https://example.com/profile.jpg",
    "role": {
      "id": 3,
      "name": "student"
    },
    "created_at": "2026-01-15T10:00:00.000Z",
    "stats": {
      "enrolled_courses": 3,
      "completed_courses": 1,
      "total_points": 350,
      "total_rewards": 5
    }
  }
}
```

**Example:**

```bash
curl -X GET http://localhost:3000/api/v1/users/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### List Users

Get a list of all users (admin only).

**Endpoint:** `GET /api/v1/users`

**Access:** Admin

**Authentication:** Required

**Query Parameters:**

| Parameter | Type    | Description                  |
| --------- | ------- | ---------------------------- |
| roleId    | integer | Filter by role ID            |
| roleName  | string  | Filter by role name          |
| search    | string  | Search by name or email      |
| page      | integer | Page number (default: 1)     |
| limit     | integer | Items per page (default: 10) |

**Success Response (200):**

```json
{
  "data": {
    "users": [
      {
        "id": 5,
        "email": "john@example.com",
        "full_name": "John Doe",
        "role": {
          "id": 3,
          "name": "student"
        },
        "created_at": "2026-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "total_pages": 15
    }
  }
}
```

**Example:**

```bash
curl -X GET "http://localhost:3000/api/v1/users?roleName=student&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Update User

Update any user's information (admin only).

**Endpoint:** `PUT /api/v1/users/:id`

**Access:** Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | User ID     |

**Request Body:**

```json
{
  "fullName": "Updated Name",
  "roleId": 2
}
```

| Field          | Type    | Required | Description                                |
| -------------- | ------- | -------- | ------------------------------------------ |
| fullName       | string  | No       | User's full name                           |
| roleId         | integer | No       | Role ID (1=admin, 2=instructor, 3=student) |
| profilePicture | string  | No       | Profile picture URL                        |

**Success Response (200):**

```json
{
  "data": {
    "id": 5,
    "email": "john@example.com",
    "full_name": "Updated Name",
    "role_id": 2,
    "updated_at": "2026-03-22T10:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X PUT http://localhost:3000/api/v1/users/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Updated Name",
    "roleId": 2
  }'
```

---

### Delete User

Delete a user account (admin only).

**Endpoint:** `DELETE /api/v1/users/:id`

**Access:** Admin

**Authentication:** Required

**URL Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | User ID     |

**Success Response (200):**

```json
{
  "data": {
    "message": "User deleted successfully"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Cannot delete own account
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin
- `404 Not Found` - User not found

**Example:**

```bash
curl -X DELETE http://localhost:3000/api/v1/users/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## User Roles

The system has three user roles:

### Student (Role ID: 3)

- Enroll in courses
- Access course content
- Track progress
- Take quizzes
- Leave reviews
- Earn rewards

### Instructor (Role ID: 2)

- All student permissions
- Create and manage courses
- View student progress
- Award rewards
- Cannot access other instructors' courses

### Admin (Role ID: 1)

- Full system access
- Manage all users
- Manage all courses
- View all data
- System configuration

---

## Profile Information

### Public Information

- Full name
- Profile picture
- Role
- Completed courses count
- Total points earned

### Private Information (own profile only)

- Email address
- Enrolled courses
- Progress details
- Reward history
- Account creation date

---

## Best Practices

- **Keep Profile Updated:** Maintain accurate profile information
- **Use Strong Passwords:** Change password regularly
- **Profile Picture:** Use a professional photo
- **Privacy:** Be mindful of what information is public
- **Security:** Don't share account credentials
