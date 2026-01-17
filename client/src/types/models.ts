export type Role = "admin" | "teacher" | "student";

export type PermissionCode =
  | "course:create"
  | "course:read"
  | "course:update"
  | "course:delete"
  | "quiz:grade"
  | "assignment:submit"
  | "assignment:grade"
  | "enrollment:manage";

export interface Permission {
  code: PermissionCode;
  description: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  permissions: PermissionCode[];
}

export interface Course {
  id: string;
  name: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  teacherId: string;
  status: "draft" | "published" | "archived";
  modules: Module[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  description?: string;
  activities: Activity[];
}

export type ActivityType = "quiz" | "assignment" | "discussion" | "resource";

export interface Activity {
  id: string;
  moduleId: string;
  title: string;
  type: ActivityType;
  order: number;
  dueDate?: string;
  status: "scheduled" | "open" | "closed";
}

export interface Quiz extends Activity {
  durationMinutes: number;
  allowedAttempts: number;
  passingScore: number;
  questionCount: number;
}

export interface Assignment extends Activity {
  maxScore: number;
  submissionType: "file" | "text";
  rubricUrl?: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  status: "active" | "completed" | "dropped";
  progress: number;
}

export interface Submission {
  id: string;
  activityId: string;
  studentId: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
}
