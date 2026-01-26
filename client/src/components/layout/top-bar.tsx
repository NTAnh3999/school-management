"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";

import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./sidebar";
import { NotificationDropdown } from "@/features/notifications/components/notification-dropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/stores/session-store";
import { useLogout } from "@/features/auth/hooks";

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, index) => ({
    label: segment.charAt(0).toUpperCase() + segment.slice(1),
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }));
  return [{ label: "Home", href: "/dashboard" }, ...crumbs];
}

export function TopBar() {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);
  const user = useSessionStore((state) => state.user);
  const logout = useLogout();

  return (
    <header className="flex flex-col gap-3 border-b bg-background/95 p-4 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MobileNav />
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            {crumbs.map((crumb, index) => (
              <span
                key={crumb.href + index}
                className="flex items-center gap-2"
              >
                {index > 0 && <ChevronRight className="h-3 w-3" />}
                <Link
                  href={crumb.href}
                  className={
                    index === crumbs.length - 1 ? "text-foreground" : ""
                  }
                >
                  {crumb.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <ThemeToggle />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {crumbs[crumbs.length - 1]?.label ?? "Overview"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Stay ahead of enrollments, assessments and learning progress.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user?.fullName
                    ?.split(" ")
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase() ?? "AD"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">
                {user?.fullName ?? "Admin User"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user?.email ?? "admin@schoolhub.io"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                logout.mutate();
              }}
              disabled={logout.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {logout.isPending ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
