"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { appRoutes } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUiStore } from "@/stores/ui-store";

function NavigationList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-2">
      {appRoutes.map((route) => {
        const isActive =
          pathname === route.href ||
          (route.href !== "/" && pathname.startsWith(route.href));
        return (
          <Link
            key={route.href}
            href={route.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-all",
              isActive
                ? "border-primary/15 bg-primary/10 text-primary shadow-mentor"
                : "border-transparent text-muted-foreground hover:border-white/80 hover:bg-white/75 hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "mt-0.5 rounded-lg p-2 transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-container text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}
            >
              <route.icon className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">{route.label}</span>
              <span className="mt-1 text-xs leading-5 text-muted-foreground">
                {route.description}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-[308px] px-5 py-6 lg:block">
      <div className="surface-float sticky top-6 flex h-[calc(100vh-3rem)] flex-col rounded-[1.75rem] border border-white/70 px-5 py-6">
        <div className="mb-6 border-b border-border/70 pb-5">
          <p className="text-label-caps text-primary">Cognitive Clarity</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            SchoolHub
          </h1>
          <p className="mt-2 max-w-[22ch] text-sm leading-6 text-muted-foreground">
            A calm workspace for steady progress, structured practice, and visible small wins.
          </p>
        </div>
        <NavigationList pathname={pathname} />
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 rounded-r-[1.5rem] border-white/70 bg-white/90">
        <SheetHeader>
          <SheetTitle>SchoolHub</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <NavigationList pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
