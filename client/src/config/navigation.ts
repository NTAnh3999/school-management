import type { ComponentType, SVGProps } from "react";

import {
  Award,
  BookOpen,
  ChartLine,
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
// design's "Lịch học" entry is omitted until a schedule page exists.
export const primaryRoutes: AppRoute[] = [
  { label: "Trang chủ", href: "/dashboard", icon: House },
  { label: "Khoá học", href: "/courses", icon: BookOpen },
  { label: "Bài tập & Kết quả", href: "/assessments", icon: SquareCheck },
  { label: "Tiến độ", href: "/progress", icon: ChartLine },
];

// Existing features the design doesn't cover yet — kept reachable below the
// main group so the redesign doesn't strand them.
export const secondaryRoutes: AppRoute[] = [
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

// Header titles for pages reached outside the sidebar (avatar menu, bell,
// in-page links). Checked before the nav routes, most specific first.
const extraTitles: Array<[string, string]> = [
  ["/courses/catalog", "Khám phá khoá học"],
  ["/notifications", "Thông báo"],
  ["/profile", "Hồ sơ của tôi"],
  ["/progress", "Tiến độ của tôi"],
  ["/courses", "Khoá học của tôi"],
];

export function routeTitle(pathname: string) {
  const extra = extraTitles.find(([href]) => isRouteActive(pathname, href));
  return extra?.[1] ?? findActiveRoute(pathname)?.label ?? "";
}
