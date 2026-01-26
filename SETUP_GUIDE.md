# School Management System - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Git

## Backend Setup

### 1. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE school_management;
exit

# Import schema
cd api/src/database
mysql -u root -p school_management < schema.sql
```

### 2. Backend Configuration

```bash
cd api
npm install

# Create .env file
cat > .env << EOL
PORT=8080
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_management
DB_PORT=3306
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
EOL
```

### 3. Start Backend

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Backend will run on: http://localhost:8080

## Frontend Setup

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Frontend Configuration

```bash
# Create .env.local file
cat > .env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_API_TIMEOUT=10000
EOL
```

### 3. Start Frontend

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Frontend will run on: http://localhost:3000

## Testing the Application

### 1. Seed Database (Optional)

```bash
cd api/src/database
node seed.js
```

This will create:

- Admin user: admin@school.com / password123
- Instructor user: instructor@school.com / password123
- Student user: student@school.com / password123
- Sample courses with sections and lessons

### 2. Test with Postman

Import the Postman collection:

```
docs/postman_collection.json
```

### 3. Login to Frontend

1. Navigate to http://localhost:3000
2. Login with one of the seeded accounts
3. Explore the dashboard and courses

## Project Structure

```
school-management/
├── api/                    # Backend (Node.js + Express)
│   ├── src/
│   │   ├── app.js         # Express app setup
│   │   ├── server.js      # Server entry point
│   │   ├── configs/       # Database config
│   │   ├── controllers/   # Route controllers
│   │   ├── database/      # Schema & seeds
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── models/        # Sequelize models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helper functions
│   └── package.json
│
├── client/                 # Frontend (Next.js + React)
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   ├── components/    # UI components
│   │   ├── config/        # App configuration
│   │   ├── features/      # Feature modules
│   │   ├── lib/           # Utilities
│   │   ├── services/      # HTTP client
│   │   ├── stores/        # State management
│   │   └── types/         # TypeScript types
│   └── package.json
│
└── docs/                   # Documentation
    ├── feature_req.md      # Requirements
    ├── requirement.md      # Additional specs
    ├── db-diagram.drawio   # Database diagram
    └── postman_collection.json
```

## API Endpoints

### Authentication

- POST `/api/v1/auth/register` - Register new user
- POST `/api/v1/auth/login` - Login

### Users

- GET `/api/v1/users/me` - Get current user
- PUT `/api/v1/users/me` - Update profile

### Courses

- GET `/api/v1/courses` - List courses
- GET `/api/v1/courses/:id` - Get course details
- POST `/api/v1/courses` - Create course (instructor/admin)
- PUT `/api/v1/courses/:id` - Update course
- DELETE `/api/v1/courses/:id` - Delete course
- POST `/api/v1/courses/:id/enroll` - Enroll in course
- GET `/api/v1/courses/my/enrollments` - My enrollments

### Sections

- GET `/api/v1/sections/course/:courseId` - Get course sections
- POST `/api/v1/sections/course/:courseId` - Create section
- PUT `/api/v1/sections/:id` - Update section
- DELETE `/api/v1/sections/:id` - Delete section

### Lessons

- GET `/api/v1/lessons/section/:sectionId` - Get section lessons
- POST `/api/v1/lessons/section/:sectionId` - Create lesson
- PUT `/api/v1/lessons/:id` - Update lesson
- DELETE `/api/v1/lessons/:id` - Delete lesson

### Progress

- POST `/api/v1/progress/update` - Update lesson progress
- GET `/api/v1/progress/enrollment/:enrollmentId` - Get enrollment progress
- GET `/api/v1/progress/course/:courseId` - Get course progress

### Quizzes

- GET `/api/v1/quizzes/:id` - Get quiz
- POST `/api/v1/quizzes/lesson/:lessonId` - Create quiz
- POST `/api/v1/quizzes/:quizId/questions` - Add question
- POST `/api/v1/quizzes/:quizId/attempts` - Start attempt
- POST `/api/v1/quizzes/attempts/:attemptId/submit` - Submit attempt

### Reviews

- GET `/api/v1/reviews/course/:courseId` - Get course reviews
- POST `/api/v1/reviews/course/:courseId` - Create review
- PUT `/api/v1/reviews/:id` - Update review
- DELETE `/api/v1/reviews/:id` - Delete review

### Notifications

- GET `/api/v1/notifications` - List notifications
- PUT `/api/v1/notifications/:id/read` - Mark as read
- PUT `/api/v1/notifications/read-all` - Mark all as read
- DELETE `/api/v1/notifications/:id` - Delete notification

### Rewards

- GET `/api/v1/rewards` - List all rewards (admin)
- GET `/api/v1/rewards/my` - My rewards
- POST `/api/v1/rewards` - Create reward (admin)
- POST `/api/v1/rewards/award` - Award reward (admin)

## Features

### Implemented Features

✅ User authentication & authorization (JWT)
✅ Role-based access control (admin, instructor, student)
✅ Course management (CRUD)
✅ Course sections & lessons
✅ Student enrollment
✅ Progress tracking
✅ Quizzes with auto-grading
✅ Course reviews & ratings
✅ Rewards system (badges, certificates, points)
✅ Real-time notifications
✅ Dashboard with analytics
✅ Dark mode support
✅ Responsive design

### User Roles

#### Student

- Browse and enroll in courses
- View course content (sections & lessons)
- Take quizzes
- Track progress
- Submit reviews
- View rewards and notifications

#### Instructor

- Create and manage courses
- Create sections and lessons
- Create quizzes
- View student progress
- Award rewards

#### Admin

- All instructor permissions
- Create rewards
- Manage users
- Full system access

## Troubleshooting

### Backend Issues

**Database Connection Error**

```bash
# Check MySQL is running
sudo service mysql status

# Verify credentials in .env
# Make sure database exists
mysql -u root -p -e "SHOW DATABASES;"
```

**Port Already in Use**

```bash
# Change PORT in .env to different port
PORT=5001
```

### Frontend Issues

**API Connection Error**

```bash
# Verify backend is running
curl http://localhost:8080/api/v1/health

# Check NEXT_PUBLIC_API_URL in .env.local
```

**Build Errors**

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Development Tips

### Backend

- Use Postman collection for API testing
- Check `api/src/database/seed.js` for sample data
- Logs are in console (development mode)
- Use JWT token from login response in Authorization header

### Frontend

- React Query DevTools available in development
- Session token stored in localStorage
- Use browser DevTools Network tab to debug API calls
- Dark mode toggle in top bar

## Production Deployment

### Backend

```bash
cd api
npm run build  # If using TypeScript
NODE_ENV=production npm start
```

### Frontend

```bash
cd client
npm run build
npm start
```

### Environment Variables (Production)

- Change JWT_SECRET to secure random string
- Use production database credentials
- Set NODE_ENV=production
- Configure CORS for production frontend URL
- Use HTTPS in production
- Set secure cookie options

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
