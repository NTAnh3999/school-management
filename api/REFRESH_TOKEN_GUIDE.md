# Refresh Token Implementation

## Overview

This backend now implements a secure refresh token mechanism for JWT-based authentication. This provides better security and user experience by issuing short-lived access tokens and long-lived refresh tokens.

## How It Works

### Token Types

1. **Access Token** (JWT)
   - Short-lived (default: 15 minutes)
   - Used for API authentication
   - Contains user ID, email, and role
   - Sent in Authorization header: `Bearer <access_token>`

2. **Refresh Token**
   - Long-lived (default: 7 days)
   - Stored in database
   - Used to obtain new access tokens
   - Rotated on each use for security

### Authentication Flow

#### 1. Register/Login

```bash
POST /api/auth/register
POST /api/auth/login

Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Logged in",
  "metadata": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "a1b2c3d4e5f6..."
  }
}
```

#### 2. Use Access Token

```bash
GET /api/courses
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 3. Refresh Access Token (when expired)

```bash
POST /api/auth/refresh

Request:
{
  "refreshToken": "a1b2c3d4e5f6..."
}

Response:
{
  "success": true,
  "message": "Token refreshed",
  "metadata": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "g7h8i9j0k1l2..."  // New refresh token
  }
}
```

#### 4. Logout

```bash
POST /api/auth/logout

Request:
{
  "refreshToken": "a1b2c3d4e5f6..."
}

Response:
{
  "success": true,
  "message": "Logged out"
}
```

## Database Schema

### refresh_tokens table

```sql
CREATE TABLE refresh_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(500) NOT NULL UNIQUE,
  user_id INT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Configuration

### Environment Variables (.env)

```env
# Access Token
JWT_SECRET=your-secret-key-here
JWT_EXPIRES=15m

# Refresh Token
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRES=7d
```

## Security Features

1. **Token Rotation**: Refresh tokens are rotated (deleted and replaced) on each use
2. **Expiration**: Both token types have expiration times
3. **Database Storage**: Refresh tokens stored in DB for revocation capability
4. **Automatic Cleanup**: Expired tokens are automatically removed
5. **Secure Generation**: Refresh tokens use cryptographically secure random bytes
6. **Cascade Delete**: Tokens are deleted when user is deleted

## Migration

If you have an existing database, run the migration:

```bash
mysql -u root -p school_mgmt < src/database/migrations/add-refresh-tokens.sql
```

Or the server will automatically create the table on startup if using `sequelize.sync()`.

## Client Implementation Example

### Store Tokens

```javascript
// After login/register
const { accessToken, refreshToken } = response.data.metadata;
localStorage.setItem("accessToken", accessToken);
localStorage.setItem("refreshToken", refreshToken);
```

### API Interceptor (Auto-refresh)

```javascript
// Axios interceptor example
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If access token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post("/api/auth/refresh", { refreshToken });

        const { accessToken, refreshToken: newRefreshToken } = response.data.metadata;

        // Update stored tokens
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh token expired or invalid - redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Logout

```javascript
const refreshToken = localStorage.getItem("refreshToken");
await axios.post("/api/auth/logout", { refreshToken });
localStorage.removeItem("accessToken");
localStorage.removeItem("refreshToken");
```

## API Endpoints

| Endpoint             | Method | Description                       | Auth Required |
| -------------------- | ------ | --------------------------------- | ------------- |
| `/api/auth/register` | POST   | Register new user                 | No            |
| `/api/auth/login`    | POST   | Login user                        | No            |
| `/api/auth/refresh`  | POST   | Refresh access token              | No            |
| `/api/auth/logout`   | POST   | Logout (invalidate refresh token) | No            |

## Testing

### Test Login and Refresh

```bash
# 1. Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Response will include accessToken and refreshToken

# 2. Wait for access token to expire (or use expired token)

# 3. Refresh token
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token_from_login>"}'

# Response will include new accessToken and refreshToken
```

## Best Practices

1. **Store tokens securely**
   - Use httpOnly cookies (most secure) or localStorage
   - Never expose tokens in URLs

2. **Handle token expiration gracefully**
   - Implement automatic refresh in HTTP interceptor
   - Redirect to login only when refresh fails

3. **Clear tokens on logout**
   - Call logout endpoint to invalidate refresh token
   - Remove tokens from client storage

4. **Monitor token usage**
   - Log refresh token usage for security auditing
   - Implement rate limiting on refresh endpoint

5. **Regularly cleanup database**
   - Expired tokens are auto-deleted on new login
   - Consider scheduled cleanup job for old tokens
