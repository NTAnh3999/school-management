# 🎓 School Management System (Learning Management System)

A modern, full-stack Learning Management System inspired by Moodle and Udemy, built with cutting-edge technologies.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![React](https://img.shields.io/badge/react-19-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-15-black.svg)

## ✨ Features

### 🎯 Core Features

- ✅ **User Authentication** - JWT-based auth with role-based access control
- ✅ **Course Management** - Complete CRUD for courses, sections, and lessons
- ✅ **Student Enrollment** - Easy course enrollment with progress tracking
- ✅ **Progress Tracking** - Real-time lesson and course completion tracking
- ✅ **Quiz System** - Create quizzes with auto-grading (single/multiple choice, text)
- ✅ **Reviews & Ratings** - 5-star rating system with text reviews
- ✅ **Rewards System** - Badges, certificates, and points for achievements
- ✅ **Notifications** - Real-time notifications with unread indicators
- ✅ **Dark Mode** - Beautiful dark theme support
- ✅ **Responsive Design** - Works seamlessly on mobile, tablet, and desktop

### 👥 User Roles

- **Admin** - Full system access
- **Instructor** - Create/manage courses, view student progress, award rewards
- **Student** - Enroll in courses, learn, take quizzes, earn rewards

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd school-management

# 2. Setup backend
cd api
npm install
# Create database and configure .env (see QUICKSTART.md)
npm run dev

# 3. Setup frontend (in new terminal)
cd ../client
npm install
# Configure .env.local
npm run dev
```

**📚 Detailed Instructions**: See [QUICKSTART.md](QUICKSTART.md)

## 🏗️ Technology Stack

### Backend

- **Node.js** + **Express.js** - Server framework
- **MySQL** + **Sequelize ORM** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **express-validator** - Input validation

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components (Radix UI)
- **TanStack Query** - Server state management
- **Zustand** - Global state management
- **Axios** - HTTP client

## 📁 Project Structure

```
school-management/
├── api/                    # Backend (Node.js + Express + MySQL)
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation, errors
│   │   └── database/       # Schema & seeds
│   └── package.json
│
├── client/                 # Frontend (Next.js + React + TypeScript)
│   ├── src/
│   │   ├── app/           # Next.js pages (App Router)
│   │   ├── components/    # UI components
│   │   ├── features/      # Feature modules
│   │   ├── services/      # HTTP client
│   │   ├── stores/        # State management
│   │   └── types/         # TypeScript types
│   └── package.json
│
└── docs/                   # Documentation & Postman
    ├── postman_collection.json
    ├── feature_req.md
    └── db-diagram.drawio
```

## 📖 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete project overview
- **[api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md)** - API endpoints reference
- **[client/FRONTEND_IMPLEMENTATION.md](client/FRONTEND_IMPLEMENTATION.md)** - Frontend architecture

## 🎨 Screenshots

### Dashboard

![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

### Course Catalog

![Courses](https://via.placeholder.com/800x400?text=Course+Catalog)

### Course Details

![Course Details](https://via.placeholder.com/800x400?text=Course+Details)

### Rewards

![Rewards](https://via.placeholder.com/800x400?text=Rewards+System)

## 🔌 API Endpoints

### Authentication

```
POST   /api/v1/auth/register    # Register user
POST   /api/v1/auth/login       # Login
GET    /api/v1/users/me         # Get profile
```

### Courses

```
GET    /api/v1/courses                  # List courses
GET    /api/v1/courses/:id              # Get course details
POST   /api/v1/courses                  # Create course
POST   /api/v1/courses/:id/enroll       # Enroll in course
GET    /api/v1/courses/my/enrollments   # My enrollments
```

### Progress & Quizzes

```
POST   /api/v1/progress/update          # Update lesson progress
GET    /api/v1/progress/course/:id      # Get course progress
POST   /api/v1/quizzes/:id/attempts     # Start quiz attempt
POST   /api/v1/quizzes/attempts/:id/submit  # Submit answers
```

**📚 Full API Reference**: See [api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md)

## 🧪 Testing

### Postman Collection

Import `docs/postman_collection.json` into Postman to test all 50+ API endpoints.

### Seed Database

```bash
cd api/src/database
node seed.js
```

Creates sample users:

- Admin: `admin@school.com` / `password123`
- Instructor: `instructor@school.com` / `password123`
- Student: `student@school.com` / `password123`

## 🛠️ Development

### Backend Development

```bash
cd api
npm run dev        # Start with nodemon (hot reload)
npm start          # Start production server
```

### Frontend Development

```bash
cd client
npm run dev        # Development server with hot reload
npm run build      # Build for production
npm start          # Start production server
```

## 🚢 Deployment

### Requirements

- Node.js 18+
- MySQL 8.0+
- Nginx (recommended for production)

### Environment Variables

**Backend (.env)**

```env
PORT=8080
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_management
JWT_SECRET=your_super_secret_key
NODE_ENV=production
```

**Frontend (.env.local)**

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api/v1
```

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed deployment instructions.

## 🎯 Roadmap

### Implemented ✅

- [x] User authentication & authorization
- [x] Course management (CRUD)
- [x] Student enrollment
- [x] Progress tracking
- [x] Quiz system with auto-grading
- [x] Reviews & ratings
- [x] Rewards system
- [x] Notifications
- [x] Dashboard
- [x] Dark mode

### Planned 📋

- [ ] Video player integration
- [ ] Quiz taking UI with timer
- [ ] Assignment submission with file upload
- [ ] Instructor analytics dashboard
- [ ] Real-time chat (Socket.io)
- [ ] Video conferencing integration
- [ ] Calendar view
- [ ] Email notifications
- [ ] Payment processing (Stripe)
- [ ] Mobile app (React Native)
- [ ] SSO/OAuth integration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by [Moodle](https://moodle.org/) and [Udemy](https://www.udemy.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📧 Support

For support, email support@yourschool.com or create an issue in the repository.

## 📊 Project Stats

- **Backend**: ~5,000 lines of code, 50+ files
- **Frontend**: ~4,000 lines of code, 60+ files
- **Database**: 20 tables with relationships
- **API Endpoints**: 50+ RESTful endpoints
- **UI Components**: 30+ reusable components
- **Documentation**: 5 comprehensive guides

---

Built with ❤️ using Node.js, React, and MySQL
