// ─── User Types ─────────────────────────────────────────────────────────────

export type UserRole = "admin" | "teacher" | "student";

export type UserStatus = "active" | "inactive" | "suspended";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Course Types ────────────────────────────────────────────────────────────

export type CourseStatus = "draft" | "published" | "archived";

export interface Course {
  id: number;
  title: string;
  description: string;
  instructorId: number;
  instructorName: string;
  status: CourseStatus;
  enrollmentCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Classroom Types ─────────────────────────────────────────────────────────

export type ClassroomStatus = "active" | "upcoming" | "completed";

export interface Classroom {
  id: number;
  name: string;
  courseId: number;
  courseName: string;
  instructorId: number;
  instructorName: string;
  maxStudents: number;
  enrolledStudents: number;
  status: ClassroomStatus;
  startDate: string;
  endDate: string;
}

// ─── Enrollment Types ────────────────────────────────────────────────────────

export type EnrollmentStatus = "active" | "completed" | "dropped";

export interface Enrollment {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  status: EnrollmentStatus;
  progress: number;
  enrolledAt: string;
}

// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalEnrollments: number;
  activeClassrooms: number;
  avgCompletionRate: number;
}
