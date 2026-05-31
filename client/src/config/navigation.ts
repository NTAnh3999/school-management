import type { ComponentType, SVGProps } from "react";

import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Settings2,
  Award,
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
    description: "Your progress, streaks, and current learning focus",
  },
  {
    label: "Enrollments",
    href: "/enrollments",
    icon: ClipboardList,
    description: "Track active pathways, completion, and course status",
  },
  {
    label: "My Courses",
    href: "/courses",
    icon: BookOpen,
    description: "Browse pathways, lessons, and guided study content",
  },
  {
    label: "Q&A",
    href: "/qa",
    icon: MessageSquare,
    description: "Ask mentors, review answers, and keep learning moving",
  },
  {
    label: "Achievements",
    href: "/rewards",
    icon: Award,
    description: "Rewards, points, and milestones earned over time",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings2,
    description: "Profile, focus, and family-friendly workspace preferences",
  },
];
