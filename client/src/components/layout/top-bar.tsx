"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, Settings2, Sparkles } from "lucide-react";

import { MobileNav } from "./sidebar";
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
import { useLogout } from "@/app/(auth)/_feature/hooks";

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
    <header className="sticky top-0 z-20 border-b border-white/60 bg-background/80 px-4 py-4 backdrop-blur-xl lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNav />
          <div className="hidden rounded-full bg-primary/10 px-3 py-1 text-label-caps text-primary md:inline-flex">
            Focused encouragement
          </div>
          <nav className="flex min-w-0 items-center gap-2 overflow-hidden text-sm text-muted-foreground">
            {crumbs.map((crumb, index) => (
              <span
                key={crumb.href + index}
                className="flex min-w-0 items-center gap-2"
              >
                {index > 0 && <ChevronRight className="h-3 w-3" />}
                <Link
                  href={crumb.href}
                  className={index === crumbs.length - 1 ? "truncate text-foreground" : "truncate"}
                >
                  {crumb.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="hidden min-[880px]:inline-flex"
          >
            <Link href="/settings">
              <Sparkles className="mr-2 h-4 w-4" />
              Tune workspace
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-auto rounded-full px-2 py-1.5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-white/80 shadow-mentor">
                    <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                    {user?.fullName
                      ?.split(" ")
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase() ?? "AD"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-left sm:flex sm:flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {user?.fullName ?? "Admin User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Patient mentor mode
                    </span>
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.email ?? "admin@schoolhub.io"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
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
      </div>
    </header>
  );
}
