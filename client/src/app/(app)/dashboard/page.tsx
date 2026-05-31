"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Flame,
  Play,
  Trophy,
} from "lucide-react";

import { useMyEnrollments } from "@/app/(app)/courses/_feature/hooks";
import { useMyRewards } from "@/app/(app)/rewards/_feature/hooks";
import { useSessionStore } from "@/stores/session-store";
import type { Enrollment } from "@/types/models";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DashboardReward = {
  id: number;
  earned_at?: string;
  reward?: {
    title?: string;
    reward_type?: string;
    points_value?: number;
  };
};

const MOCK_STATS = {
  streak: 14,
  cohortSessions: [
    {
      id: 1,
      month: "May",
      day: "15",
      title: "Reflection Circle: Digital Ethics",
      time: "2:00 PM",
      mentor: "Dr. Sarah Lane",
    },
    {
      id: 2,
      month: "May",
      day: "18",
      title: "Career Pathways Q&A",
      time: "4:30 PM",
      mentor: "Industry Guests",
    },
  ],
};

function formatMinutes(minutes: number) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }

  return `${minutes}m`;
}

function formatFirstName(name?: string | null) {
  if (!name) {
    return "Learner";
  }

  return name.split(" ")[0] || "Learner";
}

function formatEarnedDate(date?: string) {
  if (!date) {
    return "Recently earned";
  }

  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function PathwayCard({ enrollment }: { enrollment: Enrollment }) {
  const completion = enrollment.progress?.completion_percentage ?? 0;
  const totalTime = enrollment.progress?.total_time_spent_minutes ?? 0;

  return (
    <Card className="bg-white/85">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-label-caps text-primary">Active pathway</p>
            <CardTitle className="text-xl">
              {enrollment.course?.title}
            </CardTitle>
            <CardDescription>
              Measured progress with a stable reading rhythm and clear next
              step.
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-white/80">
            {completion}% complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <Progress value={completion} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.25rem] border border-white/80 bg-surface-low p-4">
            <p className="text-label-caps text-secondary">Time invested</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {formatMinutes(totalTime)}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-4">
            <p className="text-label-caps text-primary">Status</p>
            <p className="mt-2 text-lg font-semibold capitalize text-foreground">
              {enrollment.status.replace("_", " ")}
            </p>
          </div>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/courses/${enrollment.course_id}`}>
            Open pathway
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useSessionStore((state) => state.user);
  const { data: enrollments = [], isLoading: loadingEnrollments } =
    useMyEnrollments();
  const { data: rawRewards = [] } = useMyRewards();

  const rewards = rawRewards as DashboardReward[];

  const activeEnrollments = useMemo(
    () => enrollments.filter((enrollment) => enrollment.status === "active"),
    [enrollments],
  );

  const completedEnrollments = useMemo(
    () => enrollments.filter((enrollment) => enrollment.status === "completed"),
    [enrollments],
  );

  const spotlight = useMemo(
    () =>
      [...activeEnrollments].sort(
        (left, right) =>
          (right.progress?.completion_percentage ?? 0) -
          (left.progress?.completion_percentage ?? 0),
      )[0],
    [activeEnrollments],
  );

  const rewardPoints = useMemo(
    () =>
      rewards.reduce(
        (total, reward) => total + (reward.reward?.points_value ?? 0),
        0,
      ),
    [rewards],
  );

  const recentRewards = useMemo(() => rewards.slice(0, 3), [rewards]);
  const firstName = formatFirstName(user?.fullName);

  if (loadingEnrollments) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-6 pb-8">
        <Skeleton className="h-64 rounded-[2rem]" />
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <Skeleton className="h-72 rounded-[1.5rem]" />
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-64 rounded-[1.5rem]" />
              <Skeleton className="h-64 rounded-[1.5rem]" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-72 rounded-[1.5rem]" />
            <Skeleton className="h-64 rounded-[1.5rem]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 pb-8">
      <section className="surface-float overflow-hidden rounded-[2rem] border border-white/70 px-6 py-7 lg:px-8 lg:py-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold leading-tight lg:text-5xl">
            Welcome back, {firstName}.
          </h1>
          <p className="font-reading reading-measure text-base leading-7 text-muted-foreground lg:text-lg">
            {spotlight
              ? `Your strongest momentum is in ${spotlight.course?.title}. Stay with the same pathway today to protect a ${MOCK_STATS.streak}-day rhythm and keep progress cognitively light.`
              : "Your workspace is ready for a steady start. Choose one pathway, keep the surface quiet, and build the next useful study habit."}
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-label-caps text-primary">
                    Continue learning
                  </p>
                  <CardTitle className="text-2xl">
                    {spotlight?.course?.title || "Choose a pathway to begin"}
                  </CardTitle>
                  <CardDescription>
                    {spotlight
                      ? "A stable canvas keeps attention on the next useful step instead of the surrounding chrome."
                      : "Start with one course, then let progress signals stay calm and consistent."}
                  </CardDescription>
                </div>
                {spotlight ? (
                  <Badge variant="outline" className="bg-white/75">
                    <Clock3 className="mr-2 h-3.5 w-3.5" />
                    {formatMinutes(
                      spotlight.progress?.total_time_spent_minutes ?? 0,
                    )}{" "}
                    logged
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {spotlight ? (
                <>
                  <div className="rounded-[1.5rem] border border-white/80 bg-white/85 p-5">
                    <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                      <div className="space-y-3">
                        <p className="text-label-caps text-secondary">
                          Next useful step
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          Re-enter {spotlight.course?.title} and push the next
                          review block forward.
                        </p>
                        <p className="font-reading text-sm leading-6 text-muted-foreground">
                          Progress bars use movement sparingly so completion is
                          visible without turning the dashboard into a
                          scoreboard.
                        </p>
                      </div>
                      <div className="grid gap-3">
                        <div className="rounded-[1.25rem] border border-white/80 bg-surface-low p-4">
                          <p className="text-label-caps text-primary">
                            Completion
                          </p>
                          <p className="mt-2 text-lg font-semibold text-foreground">
                            {spotlight.progress?.completion_percentage ?? 0}%
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-4">
                          <p className="text-label-caps text-secondary">
                            Reward potential
                          </p>
                          <p className="mt-2 text-lg font-semibold text-foreground">
                            {rewardPoints} points earned so far
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={spotlight.progress?.completion_percentage ?? 0}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link href={`/courses/${spotlight.course_id}`}>
                        Resume lesson
                        <Play className="ml-2 h-4 w-4 fill-current" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/courses">Review all pathways</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-outline-variant bg-white/70 p-8 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-primary/40" />
                  <h3 className="mt-4 text-xl font-semibold text-foreground">
                    Your learning canvas is open.
                  </h3>
                  <p className="mx-auto mt-3 max-w-reading font-reading text-sm leading-7 text-muted-foreground">
                    Enroll in a course to unlock pathway tracking, measured
                    progress bars, and milestone rewards that stay rare enough
                    to matter.
                  </p>
                  <Button className="mt-5" asChild>
                    <Link href="/courses">Explore courses</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white/85">
              <CardHeader className="pb-3">
                <p className="text-label-caps text-secondary">
                  Cohort sessions
                </p>
                <CardTitle className="text-xl">
                  Upcoming guided moments
                </CardTitle>
                <CardDescription>
                  Scheduled touchpoints stay compact so the rest of the
                  workspace can remain quiet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {MOCK_STATS.cohortSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-start gap-4 rounded-[1.25rem] border border-white/80 bg-white/75 p-4"
                  >
                    <div className="flex w-14 shrink-0 flex-col rounded-[1rem] bg-surface-low px-2 py-3 text-center">
                      <span className="text-label-caps text-muted-foreground">
                        {session.month}
                      </span>
                      <span className="mt-1 text-lg font-semibold text-foreground">
                        {session.day}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        {session.title}
                      </p>
                      <p className="mt-1 font-reading text-sm leading-6 text-muted-foreground">
                        {session.time} with {session.mentor}
                      </p>
                    </div>
                    <CalendarDays className="mt-1 h-4 w-4 text-primary/60" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/85">
              <CardHeader className="pb-3">
                <p className="text-label-caps text-gold">Milestone preview</p>
                <CardTitle className="text-xl">
                  Rewards stay meaningful
                </CardTitle>
                <CardDescription>
                  Gold and purple only appear when progress is actually earned.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentRewards.length ? (
                  recentRewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="rounded-[1.25rem] border border-white/80 bg-white/80 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {reward.reward?.title || "Reward earned"}
                          </p>
                          <p className="mt-1 font-reading text-sm leading-6 text-muted-foreground">
                            {formatEarnedDate(reward.earned_at)}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "border",
                            reward.reward?.reward_type === "badge"
                              ? "border-purple/20 bg-purple/15 text-purple"
                              : "border-gold/20 bg-gold/15 text-gold-foreground",
                          )}
                        >
                          {reward.reward?.reward_type || "reward"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-5">
                    <p className="font-semibold text-foreground">
                      No rewards earned yet
                    </p>
                    <p className="mt-2 font-reading text-sm leading-6 text-muted-foreground">
                      Complete lessons and activities to surface the rare accent
                      colors reserved for milestones.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <aside className="space-y-6">
          <Card className="bg-white/85">
            <CardHeader className="pb-3">
              <p className="text-label-caps text-primary">Momentum</p>
              <CardTitle className="text-xl">
                Your progress at a glance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {MOCK_STATS.streak}
                      </p>
                      <p className="text-label-caps text-muted-foreground">
                        day streak
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {rewardPoints}
                      </p>
                      <p className="text-label-caps text-muted-foreground">
                        reward points
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {activeEnrollments.length}
                      </p>
                      <p className="text-label-caps text-muted-foreground">
                        active pathways
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-gold">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {completedEnrollments.length}
                      </p>
                      <p className="text-label-caps text-muted-foreground">
                        completed paths
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-secondary/15 bg-gradient-to-r from-secondary/10 to-success/20 p-4">
                <p className="text-label-caps text-secondary">Mentor note</p>
                <p className="mt-2 font-reading text-sm leading-6 text-muted-foreground">
                  Your dashboard now prioritizes one calm focal point, visible
                  progress, and milestone accents that remain special.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/85">
            <CardHeader className="pb-3">
              <p className="text-label-caps text-secondary">Reading fit</p>
              <CardTitle className="text-xl">
                Designed for steady scanning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.25rem] border border-white/80 bg-surface-low p-4">
                <p className="text-label-caps text-primary">Measured copy</p>
                <p className="mt-3 max-w-reading font-reading text-[17px] leading-8 text-foreground">
                  Long-form guidance stays inside a narrow measure so the eye
                  can track confidently through the next action.
                </p>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/settings">Adjust focus preferences</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Active learning pathways</h2>
            <p className="font-reading text-sm leading-6 text-muted-foreground">
              Wide dashboards can create noise. These cards keep each pathway
              compact, tactile, and easy to scan.
            </p>
          </div>
          <Button variant="link" className="px-0 text-primary" asChild>
            <Link href="/courses">
              View all tracks
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {activeEnrollments.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {activeEnrollments.map((enrollment) => (
              <PathwayCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-primary/40" />
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                No active pathways yet
              </h3>
              <p className="mx-auto mt-3 max-w-reading font-reading text-sm leading-7 text-muted-foreground">
                Start with a single course and let the dashboard surface
                progress, time invested, and milestones in a calmer way.
              </p>
              <Button className="mt-5" asChild>
                <Link href="/courses">Browse courses</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
