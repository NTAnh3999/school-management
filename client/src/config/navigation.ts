import type { ComponentType, SVGProps } from "react";

import {
  Blocks,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Users,
  Award,
  Bell,
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
    description: "Your learning progress and enrolled courses",
  },
  {
    label: "Courses",
    href: "/courses",
    icon: BookOpen,
    description: "Browse and manage courses",
  },
  {
    label: "Modules",
    href: "/modules",
    icon: Blocks,
    description: "Course modules and lessons",
  },
  {
    label: "Activities",
    href: "/activities",
    icon: ClipboardList,
    description: "Assignments and activities",
  },
  {
    label: "Assessments",
    href: "/assessments",
    icon: GraduationCap,
    description: "Quizzes and assessments",
  },
  {
    label: "Rewards",
    href: "/rewards",
    icon: Award,
    description: "Your achievements and rewards",
  },
  {
    label: "People",
    href: "/people",
    icon: Users,
    description: "Students and instructors",
  },
];
