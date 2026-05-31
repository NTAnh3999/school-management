"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  LayoutGrid,
  LogOut,
  Search,
  Settings2,
} from "lucide-react";

import { useMyEnrollments } from "@/app/(app)/courses/_feature/hooks";
import { appRoutes } from "@/config/navigation";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogout } from "@/app/(auth)/_feature/hooks";
import { useSessionStore } from "@/stores/session-store";

function getInitials(name?: string | null) {
  if (!name) {
    return "LP";
  }

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function FeatureMenu() {
  return (
    <div className="group relative hidden md:block">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full text-muted-foreground hover:text-foreground"
      >
        <LayoutGrid className="h-5 w-5" />
        <span className="sr-only">Open categories</span>
      </Button>

      <div className="pointer-events-none absolute left-0 top-full z-50 w-[340px] translate-y-2 pt-3 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <Card className="bg-white/95 shadow-focus backdrop-blur-xl">
          <CardHeader className="pb-3">
            <p className="text-label-caps text-primary">Categories</p>
            <CardTitle className="text-lg">Explore learning features</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {appRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="flex items-start gap-3 rounded-[1rem] border border-transparent bg-white/60 px-3 py-3 transition-all hover:border-primary/10 hover:bg-primary/5"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <route.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {route.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {route.description}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function TopBar() {
  const user = useSessionStore((state) => state.user);
  const logout = useLogout();
  const { data: enrollments = [], isLoading } = useMyEnrollments();

  const courseList = useMemo(() => {
    return enrollments
      .filter((enrollment) => enrollment.course?.title)
      .sort((left, right) => {
        const leftActive = left.status === "active" ? 1 : 0;
        const rightActive = right.status === "active" ? 1 : 0;

        if (leftActive !== rightActive) {
          return rightActive - leftActive;
        }

        return (
          (right.progress?.completion_percentage ?? 0) -
          (left.progress?.completion_percentage ?? 0)
        );
      })
      .slice(0, 6);
  }, [enrollments]);

  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 lg:px-8">
        <Link href="/dashboard" className="shrink-0 leading-none">
          <p className="text-[15px] font-bold tracking-tight text-primary lg:text-[18px]">
            Lumina Learning
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Patient Mentor
          </p>
        </Link>

        <FeatureMenu />

        <div className="hidden flex-1 justify-center lg:flex">
          <div className="relative w-full max-w-[580px]">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              aria-label="Search lessons, topics, or mentors"
              placeholder="Search lessons, topics, or mentors..."
              className="h-12 rounded-full border-white/80 bg-[#eef1ff] pl-14 shadow-none focus-visible:bg-white"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 lg:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="hidden rounded-full px-3 text-sm font-semibold text-foreground md:inline-flex"
              >
                My Learning
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>My Courses</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isLoading ? (
                <DropdownMenuItem disabled>Loading courses...</DropdownMenuItem>
              ) : courseList.length ? (
                courseList.map((enrollment) => (
                  <DropdownMenuItem key={enrollment.id} asChild>
                    <Link
                      href={`/courses/${enrollment.course_id}`}
                      className="flex flex-col items-start"
                    >
                      <span className="line-clamp-1 font-medium">
                        {enrollment.course?.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {enrollment.progress?.completion_percentage ?? 0}% complete
                        {" | "}
                        {enrollment.status.replace("_", " ")}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No courses yet</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/courses">View all courses</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full text-muted-foreground hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-destructive" />
            <span className="sr-only">Notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-auto rounded-full p-1.5">
                <Avatar className="h-10 w-10 border border-white/80 shadow-mentor">
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                    {getInitials(user?.fullName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.fullName ?? "Learner Profile"}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user?.email ?? "learner@luminahub.io"}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Preferences
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
