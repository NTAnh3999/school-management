# Quick Start Guide - School Management System

## 🚀 Get Started in 5 Minutes

### Step 1: Backend Setup (2 min)

```bash
# 1. Create database
mysql -u root -p -e "CREATE DATABASE school_management;"

# 2. Import schema
cd api/src/database
mysql -u root -p school_management < schema.sql

# 3. Install & configure
cd ../../
npm install
echo "PORT=8080
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_management
JWT_SECRET=super_secret_key_change_in_production
NODE_ENV=development" > .env

# 4. Start backend
npm run dev
```

✅ Backend running at http://localhost:8080

### Step 2: Frontend Setup (2 min)

```bash
# 1. Install dependencies
cd ../client
npm install

# 2. Configure API
echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1" > .env.local

# 3. Start frontend
npm run dev
```

✅ Frontend running at http://localhost:3000

### Step 3: Test It! (1 min)

```bash
# Seed database with sample data
cd ../api/src/database
node seed.js
```

**Login credentials:**

- Admin: `admin@school.com` / `password123`
- Instructor: `instructor@school.com` / `password123`
- Student: `student@school.com` / `password123`

🎉 **Done!** Open http://localhost:3000 and login

## 📱 What You Can Do Now

### As Student

1. Browse courses at `/courses`
2. Enroll in a course
3. View course curriculum
4. Track your progress at `/dashboard`
5. Check rewards at `/rewards`
6. View notifications (bell icon)

### As Instructor

1. Create a new course
2. Add sections and lessons
3. Create quizzes
4. View student progress
5. Award rewards

### As Admin

- All instructor features
- Create rewards
- Manage all courses
- Full system access

## 🧪 Test with Postman

1. Import `docs/postman_collection.json` into Postman
2. Login request will save token automatically
3. Test all 50+ API endpoints

## 📖 Documentation

- **Setup Guide**: [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **API Docs**: [api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md)
- **Frontend Docs**: [client/FRONTEND_IMPLEMENTATION.md](client/FRONTEND_IMPLEMENTATION.md)
- **Project Summary**: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

## 🆘 Troubleshooting

**Backend won't start?**

- Check MySQL is running: `sudo service mysql status`
- Verify `.env` database credentials
- Check port 8080 is not in use

**Frontend won't start?**

- Verify backend is running first
- Check `.env.local` has correct API URL
- Clear cache: `rm -rf .next`

**Can't login?**

- Run seed script to create users
- Check browser console for errors
- Verify backend API is accessible

## 🎯 Next Steps

1. Explore the UI
2. Create a course
3. Customize the theme
4. Add more features (see PROJECT_SUMMARY.md)

Need help? Check the full documentation!
