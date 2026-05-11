"use client";

import Link from "next/link";
import {
  Award,
  BookOpen,
  Clock,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { useMyEnrollments } from "@/app/(app)/courses/_feature/hooks";
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

function getAverageProgress(enrollments: Enrollment[]) {
  if (enrollments.length === 0) {
    return 0;
  }

  const total = enrollments.reduce(
    (sum, enrollment) => sum + (enrollment.progress?.completion_percentage ?? 0),
    0,
  );

  return Math.round(total / enrollments.length);
}

export default function DashboardPage() {
  const { data: enrollments = [], isLoading } = useMyEnrollments();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-[2rem]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-[1.5rem]" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-[420px] rounded-[1.5rem]" />
          <Skeleton className="h-[420px] rounded-[1.5rem]" />
        </div>
      </div>
    );
  }

  const activeEnrollments = enrollments.filter(
    (enrollment: Enrollment) => enrollment.status === "active",
  );
  const completedEnrollments = enrollments.filter(
    (enrollment: Enrollment) => enrollment.status === "completed",
  );
  const totalMinutes = enrollments.reduce(
    (sum: number, enrollment: Enrollment) =>
      sum + (enrollment.progress?.total_time_spent_minutes ?? 0),
    0,
  );
  const averageProgress = getAverageProgress(activeEnrollments);
  const spotlightEnrollment = activeEnrollments
    .slice()
    .sort(
      (left, right) =>
        (right.progress?.completion_percentage ?? 0) -
        (left.progress?.completion_percentage ?? 0),
    )[0];

  return (
    <div className="space-y-6 pb-4">
      <section className="surface-float overflow-hidden rounded-[2rem] border border-white/70 px-6 py-7 lg:px-8 lg:py-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <Badge className="w-fit bg-primary/10 text-primary">
              Cognitive Clarity workspace
            </Badge>
            <div className="space-y-3">
              <h1 className="max-w-[12ch] text-4xl font-bold leading-tight lg:text-5xl">
                Steady progress, kept visible.
              </h1>
              <p className="font-reading reading-measure text-base leading-7 text-muted-foreground lg:text-lg">
                Your dashboard keeps active work, recent effort, and earned milestones
                in one calm surface so the next action stays obvious.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/courses">Continue learning</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/settings">Tune workspace</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <Card className="bg-white/85">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-label-caps text-secondary">Current momentum</p>
                    <CardTitle className="mt-1 text-xl">
                      {averageProgress}% average completion
                    </CardTitle>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={averageProgress} />
                <p className="font-reading text-sm leading-6 text-muted-foreground">
                  Progress bars stay soft and directional so advancement feels alive
                  without overwhelming the rest of the page.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/85">
              <CardHeader className="pb-3">
                <p className="text-label-caps text-gold">Milestone preview</p>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5 text-gold" />
                  Reward accents stay earned
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge className="border-gold/20 bg-gold/15 text-gold-foreground">
                  {completedEnrollments.length} completed
                </Badge>
                <Badge className="border-purple/20 bg-purple/15 text-purple">
                  Focus streak
                </Badge>
                <Badge className="border-secondary/20 bg-secondary/10 text-secondary">
                  {formatMinutes(totalMinutes)} invested
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white/85">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Active courses</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {activeEnrollments.length}
            </div>
            <p className="mt-2 font-reading text-sm leading-6 text-muted-foreground">
              Courses currently in motion.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/85">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Completed</CardTitle>
            <Award className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {completedEnrollments.length}
            </div>
            <p className="mt-2 font-reading text-sm leading-6 text-muted-foreground">
              Milestones already secured.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/85">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Study time</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {formatMinutes(totalMinutes)}
            </div>
            <p className="mt-2 font-reading text-sm leading-6 text-muted-foreground">
              Total guided effort across all enrollments.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/85">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Focus target</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {spotlightEnrollment?.progress?.completion_percentage ?? 0}%
            </div>
            <p className="mt-2 font-reading text-sm leading-6 text-muted-foreground">
              Best-positioned active course right now.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl">Continue learning</CardTitle>
              <CardDescription className="reading-measure">
                Pick up where momentum is strongest. Active lesson cards stay clean,
                measured, and explicit about time and completion state.
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/courses">Browse all courses</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activeEnrollments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {activeEnrollments.map((enrollment: Enrollment) => {
                  const progress = enrollment.progress?.completion_percentage ?? 0;
                  const minutes = enrollment.progress?.total_time_spent_minutes ?? 0;

                  return (
                    <div
                      key={enrollment.id}
                      className="rounded-[1.5rem] border border-white/80 bg-white/80 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-label-caps text-primary">Lesson card</p>
                          <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-foreground">
                            {enrollment.course?.title || "Untitled course"}
                          </h3>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {formatMinutes(minutes)}
                        </Badge>
                      </div>
                      <p className="mt-3 line-clamp-3 font-reading text-sm leading-6 text-muted-foreground">
                        {enrollment.course?.description || "No description available."}
                      </p>
                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold text-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                      <Button className="mt-5 w-full" asChild>
                        <Link href={`/courses/${enrollment.course_id}`}>Continue</Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-outline-variant bg-white/70 px-6 py-12 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold text-foreground">
                  No active courses yet
                </h3>
                <p className="mx-auto mt-3 max-w-reading font-reading text-sm leading-7 text-muted-foreground">
                  Start with a published course to populate this focused workspace
                  with your next lesson cards and progress milestones.
                </p>
                <Button className="mt-6" asChild>
                  <Link href="/courses">Browse courses</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Earned milestones</CardTitle>
            <CardDescription className="reading-measure">
              Completion moments use reserved reward accents so finished work feels
              distinct from everyday navigation and form controls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {completedEnrollments.length > 0 ? (
              <div className="space-y-4">
                {completedEnrollments.map((enrollment: Enrollment) => (
                  <div
                    key={enrollment.id}
                    className="rounded-[1.5rem] border border-gold/15 bg-gradient-to-r from-gold/10 via-white to-purple/10 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-label-caps text-gold">Completed course</p>
                        <h3 className="mt-2 text-lg font-semibold text-foreground">
                          {enrollment.course?.title || "Untitled course"}
                        </h3>
                      </div>
                      <Award className="h-5 w-5 text-gold" />
                    </div>
                    <p className="mt-3 font-reading text-sm leading-6 text-muted-foreground">
                      Completed on{" "}
                      {enrollment.completed_at
                        ? new Date(enrollment.completed_at).toLocaleDateString()
                        : "a previous session"}
                    </p>
                    <Button variant="outline" className="mt-4 w-full" asChild>
                      <Link href={`/courses/${enrollment.course_id}`}>Review course</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-white/80 bg-surface-low p-6">
                <p className="text-label-caps text-secondary">Next milestone</p>
                <h3 className="mt-3 text-xl font-semibold text-foreground">
                  Finish your first active course
                </h3>
                <p className="mt-3 font-reading text-sm leading-7 text-muted-foreground">
                  Completion badges and reward surfaces will appear here once a
                  course crosses the finish line.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
