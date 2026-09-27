"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { branding } from "@/config/branding";
import {
  isRouteActive,
  primaryRoutes,
  secondaryRoutes,
  type AppRoute,
} from "@/config/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUiStore } from "@/stores/ui-store";

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5 px-2 pb-[18px]">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-primary font-display text-lg font-bold text-primary-foreground">
        {branding.logoLetter}
      </div>
      <div className="font-display text-[15px] font-bold leading-tight text-ink">
        {branding.name}
      </div>
    </div>
  );
}

function NavItem({
  route,
  active,
  onNavigate,
}: {
  route: AppRoute;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={route.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
        active
          ? "bg-primary-soft font-bold text-primary-strong"
          : "font-medium text-ink-2 hover:bg-background",
      )}
    >
      <route.icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
      {route.label}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-1.5 px-3.5 py-5">
      <BrandMark />
      <nav aria-label="Điều hướng chính" className="flex flex-col gap-1.5">
        {primaryRoutes.map((route) => (
          <NavItem
            key={route.href}
            route={route}
            active={isRouteActive(pathname, route.href)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
      <nav
        aria-label="Tiện ích khác"
        className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4"
      >
        {secondaryRoutes.map((route) => (
          <NavItem
            key={route.href}
            route={route}
            active={isRouteActive(pathname, route.href)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden overflow-y-auto border-r border-line bg-white lg:block">
      <SidebarContent />
    </aside>
  );
}

export function MobileNav() {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-[14px] border border-line bg-white text-ink-2 lg:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Mở điều hướng</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] bg-white p-0">
        <SheetTitle className="sr-only">Điều hướng</SheetTitle>
        <SidebarContent onNavigate={() => setSidebarOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
