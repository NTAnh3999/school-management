# School Management API (E-learning)

A Node.js + Express MVC API with Sequelize and MySQL for school-oriented e-learning features. Implements authentication (JWT), RBAC (Admin/Teacher/Student), user profiles, and course CRUD as a baseline.

## Prerequisites

- Node.js 18+
- MySQL server

## Environment Variables

Create a `.env` file in the project root:

```
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_mgmt

JWT_SECRET=super_secret_key
JWT_EXPIRES=7d
```

## Install & Run

```
npm install
npm run dev
```

On first run, the app will:
- Connect to MySQL using Sequelize.
- Sync models to create tables if missing.
- Seed default roles (`Admin`, `Teacher`, `Student`) along with demo accounts for each role.

## Default Accounts

The API seeds three demo users for quick testing. Override the email/password with the env vars shown below if desired.

| Role    | Email                  | Password    | Env overrides                |
| ------- | ---------------------- | ----------- | --------------------------- |
| Admin   | `admin@schoolhub.io`   | `Admin@123` | `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
| Teacher | `teacher@schoolhub.io` | `Teacher@123` | `TEACHER_EMAIL`, `TEACHER_PASSWORD` |
| Student | `student@schoolhub.io` | `Student@123` | `STUDENT_EMAIL`, `STUDENT_PASSWORD` |

Alternatively, you can create tables manually:

```
mysql -u root -p school_mgmt < src/database/schema.sql
```

## API Base URL

`/api/v1`

## Endpoints

### Health
- `GET /api/v1/health` → `{ status: "ok" }`

### Auth
- `POST /api/v1/auth/register`
  - Body: `{ email, password, fullName, roleName? }`
  - Returns: `{ token }`
- `POST /api/v1/auth/login`
  - Body: `{ email, password }`
  - Returns: `{ token }`
- `POST /api/v1/auth/logout` → Stateless; returns OK.

### Users
- `GET /api/v1/users/me` (Bearer token)
- `PUT /api/v1/users/me` (Bearer token)
  - Body: `{ fullName }`

### Courses
- `POST /api/v1/courses` (Admin/Teacher)
  - Body: `{ name, description?, startDate?, endDate?, teacherId }`
- `GET /api/v1/courses` (Authenticated)
- `GET /api/v1/courses/:id` (Authenticated)
- `PUT /api/v1/courses/:id` (Admin/Teacher)
  - Body: any of `{ name, description, startDate, endDate, teacherId }`
- `DELETE /api/v1/courses/:id` (Admin/Teacher)

## Validation

- Uses `express-validator` with a middleware wrapper returning `422` on validation errors.

## Error Handling

- Custom error classes with a global error middleware returning structured JSON.

## Next Features

- Modules, Activities, Quizzes, Assignments, QuestionBank, Enrollment.
- RBAC permission checks per action.
- Postman collection for all endpoints.

## Project Scripts

- `npm run dev` – start with watch.
- `npm run lint` – lint code.
- `npm run format` – format with Prettier.
