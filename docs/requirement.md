# RESTful E-learning API Project Prompt (Node.js Express MVC)

This document outlines the requirements for developing a RESTful API for an E-learning platform tailored for schools. The API will be built using Node.js and Express.js, strictly following the Model-View-Controller (MVC) architectural pattern. The project structure is inspired by the provided GitHub repository: [https://github.com/anonystick/structure-api-mvc-express-nodejs/tree/main/](https://github.com/anonystick/structure-api-mvc-express-nodejs/tree/main/) to ensure modularity, scalability, and maintainability.

The API will interact with a PostgreSQL database (or a similar relational database) based on the detailed database schema that has been designed. This schema incorporates tables for `Users`, `Roles`, `Permissions`, `Courses`, `Modules`, `Activities`, `Quizzes`, `Assignments`, `QuestionBank`, `QuizAttempts`, `Submissions`, `QuestionOptions`, and `Category`.

---

## Core API Feature Requirements (aligned with previous discussions):

### 1. User & Authentication Management

- **Login/Logout:** Secure authentication (JWT preferred).
- **Registration:** For students and teachers, with default role assignment.
- **User Profiles:** Endpoints to retrieve and update user-specific information.
- **Role-Based Access Control (RBAC):** Middleware to enforce permissions based on user roles (`Student`, `Teacher`, `Admin`). The Admin role will have full access.
  - _Example Permissions:_ `course:create`, `course:read`, `course:update`, `quiz:grade`, `assignment:submit`.

### 2. Course Management (Admin/Teacher Only)

- **Create Course:** Allow teachers/admins to create new courses, assigning a primary teacher.
- **Retrieve Courses:** Get all courses or a specific course by ID.
- **Update Course:** Modify course details (name, description, dates, assigned teacher).
- **Delete Course:** Remove a course (with appropriate cascading or soft-delete mechanisms).

### 3. Module Management (Admin/Teacher Only)

- **Create Module:** Add a new module (e.g., "Week 1", "Introduction to Algebra") to a specific course.
- **Retrieve Modules:** Get all modules for a given course or a specific module by ID.
- **Update Module:** Modify module title, description, or order within the course.
- **Delete Module:** Remove a module and its associated activities.

### 4. Activity Management (Admin/Teacher Only)

- **Create Activity:** Add a new activity (Quiz, Assignment, etc.) to a specific module. This endpoint should be generic enough to create various `activity_type`s by linking to the corresponding detail tables (e.g., `quizzes`, `assignments`).
- **Retrieve Activity:** Get details of a specific activity by ID.
- **Update Activity:** Modify activity details (title, order, type-specific configuration).
- **Delete Activity:** Remove an activity and its specific details (e.g., corresponding entry in the `Quizzes` or `Assignments` table).

### 5. Quiz & Question Bank Management

#### For Teachers/Admins:

- **Create Quiz:** Define a new quiz (set duration, allowed attempts, passing grade).
- **Add/Remove Questions to Quiz:** Assign existing questions from the `QuestionBank` to a specific quiz.
- **Retrieve Quiz Details:** Get full details of a quiz, including its questions and options.
- **Create Question:** Add new questions (Multiple Choice, True/False, Essay) to the `QuestionBank`, categorized appropriately.
- **Update/Delete Question:** Modify question text, type, options, or remove questions.

#### For Students:

- **Take Quiz:**
  - Initiate a new `QuizAttempt`.
  - Submit answers for a quiz.
  - Receive automated scores for objective questions immediately after submission.
- **Review Quiz Attempts:** View past quiz attempts, scores, and potentially correct answers/feedback.

### 6. Assignment Management

#### For Teachers/Admins:

- **Create Assignment:** Define a new assignment (set due date, maximum grade, and submission type like 'file upload' or 'online text').

#### For Students:

- **Submit Assignment:** Upload files or submit text content directly via the API.

#### For Teachers:

- **Grade Assignment:** Provide a grade and feedback for student submissions.
- **Retrieve Assignment Submissions:** Get all submissions for a specific assignment (Teacher/Admin) or a student's own submission (Student).

### 7. Enrollment Management (Admin/Teacher Only)

- **Enroll Student:** Assign a student to a course.
- **Retrieve Course Enrollments:** Get all students enrolled in a specific course.
- **Unenroll Student:** Remove a student from a course.

---

## Project Structure & Implementation Details:

- **Folder Structure:** The project must adhere to the `controllers`, `models`, `routes`, `middleware`, `services`, `utils`, `config` directories as shown in the `anonystick/structure-api-mvc-express-nodejs` repository.
- **Models:** Define ORM models (e.g., Sequelize, TypeORM) for PostgreSQL that accurately represent each table in our designed ER diagram.
- **Controllers:** Responsible for handling incoming request and outgoing response logic, interacting with the services layer.
- **Routes:** Define API endpoints and link them to the appropriate controller methods.
- **Middleware:** Implement essential middleware for:
  - Authentication (JWT verification).
  - Authorization (Role-Based Access Control).
  - Error handling.
- **Services (Business Logic):** Abstract database interactions and complex business logic from controllers. This layer promotes reusability, testability, and separation of concerns.
- **Error Handling:** Implement robust error handling mechanisms, including custom error classes and a global error middleware.
- **Validation:** Utilize a data validation library (e.g., Joi, Express-validator) to validate incoming request data.
- **Environment Variables:** Manage sensitive information and configuration settings using `.env` files.
- **Documentation:** Include basic API endpoint documentation, outlining the available routes, expected request bodies, and example responses.

---

## Deliverables:

- **A fully functional Node.js Express.js API project** structured according to the specified pattern.
- **Database setup script** (e.g., SQL migration files) for creating the defined schema in PostgreSQL.
- **README.md** file providing clear instructions on how to set up the project, run the server, and a basic overview of the API endpoints.
- **An example Postman collection** or similar client configuration for testing core API endpoints (e.g., user authentication, course creation, quiz submission, assignment grading).
