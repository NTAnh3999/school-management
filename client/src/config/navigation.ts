import type { ComponentType, SVGProps } from "react";

import {
  Blocks,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Users,
} from "lucide-react";

export type AppRoute = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  description: string;
};

export const appRoutes: AppRoute[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Snapshot of courses, assignments, quizzes and enrollments",
  },
  {
    label: "Courses",
    href: "/courses",
    icon: BookOpen,
    description: "Create, schedule and publish course outlines",
  },
  {
    label: "Modules",
    href: "/modules",
    icon: Blocks,
    description: "Sequence course modules and attach the right activities",
  },
  {
    label: "Activities",
    href: "/activities",
    icon: ClipboardList,
    description: "Manage quizzes, assignments, discussions and submissions",
  },
  {
    label: "Assessments",
    href: "/assessments",
    icon: GraduationCap,
    description: "Monitor quiz attempts, grades and rubric performance",
  },
  {
    label: "People",
    href: "/people",
    icon: Users,
    description: "Enroll students, invite teachers and assign roles",
  },
];
