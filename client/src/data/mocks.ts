import { type Activity, type Course, type Enrollment, type Module } from "@/types/models";

export const mockCourses: Course[] = [
  {
    id: "course-1",
    name: "Algebra I",
    description: "Introduction to algebraic thinking and foundational concepts.",
    category: "Mathematics",
    startDate: "2025-01-13",
    endDate: "2025-05-23",
    teacherId: "teacher-1",
    status: "published",
    modules: [],
  },
  {
    id: "course-2",
    name: "World History",
    description: "Explore major civilizations and global perspectives.",
    category: "Humanities",
    startDate: "2025-01-13",
    endDate: "2025-05-23",
    teacherId: "teacher-2",
    status: "draft",
    modules: [],
  },
];

export const mockModules: Module[] = [
  {
    id: "module-1",
    courseId: "course-1",
    title: "Linear Functions",
    order: 1,
    description: "Understanding slope-intercept form.",
    activities: [],
  },
  {
    id: "module-2",
    courseId: "course-1",
    title: "Systems of Equations",
    order: 2,
    activities: [],
  },
];

export const mockActivities: Activity[] = [
  {
    id: "activity-1",
    moduleId: "module-1",
    title: "Linear Quiz",
    type: "quiz",
    order: 1,
    status: "scheduled",
    dueDate: "2025-02-01",
  },
  {
    id: "activity-2",
    moduleId: "module-1",
    title: "Graphing Assignment",
    type: "assignment",
    order: 2,
    status: "open",
    dueDate: "2025-02-05",
  },
];

export const mockEnrollments: Enrollment[] = [
  {
    id: "enr-1",
    courseId: "course-1",
    userId: "student-1",
    status: "active",
    progress: 62,
  },
  {
    id: "enr-2",
    courseId: "course-2",
    userId: "student-2",
    status: "active",
    progress: 40,
  },
];
