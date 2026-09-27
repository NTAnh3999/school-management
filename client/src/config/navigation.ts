import type { ComponentType, SVGProps } from "react";

import {
  Award,
  BookOpen,
  ClipboardList,
  House,
  MessageSquare,
  Settings2,
  SquareCheck,
} from "lucide-react";

export type AppRoute = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

// Student sidebar from the desktop design (Desktop - Student, NAV_S). The
// design's "Tiến độ" and "Lịch học" entries are omitted until those pages
// exist.
export const primaryRoutes: AppRoute[] = [
  { label: "Trang chủ", href: "/dashboard", icon: House },
  { label: "Khoá học", href: "/courses", icon: BookOpen },
  { label: "Bài tập & Kết quả", href: "/assessments", icon: SquareCheck },
];

// Existing features the design doesn't cover yet — kept reachable below the
// main group so the redesign doesn't strand them.
export const secondaryRoutes: AppRoute[] = [
  { label: "Ghi danh", href: "/enrollments", icon: ClipboardList },
  { label: "Hỏi đáp", href: "/qa", icon: MessageSquare },
  { label: "Thành tích", href: "/rewards", icon: Award },
  { label: "Cài đặt", href: "/settings", icon: Settings2 },
];

export const appRoutes: AppRoute[] = [...primaryRoutes, ...secondaryRoutes];

export function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findActiveRoute(pathname: string) {
  return appRoutes.find((route) => isRouteActive(pathname, route.href));
}
