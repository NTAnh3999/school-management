"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  Clock,
  HelpCircle,
  LayoutGrid,
  Plus,
  Rocket,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { useMyEnrollments } from "@/app/(app)/courses/_feature/hooks";
import type { Enrollment } from "@/types/models";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

const SCHEDULE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SCHEDULE_TIMES = ["07:00", "10:00", "14:00"];

type ScheduleBlock = {
  key: string;
  dayIndex: number;
  time: string;
  category: string;
  title: string;
  subtitle: string;
  tone: "primary" | "secondary" | "tertiary";
};

const FALLBACK_CATALOG_LABELS = [
  "DEVELOPMENT",
  "DATA SCIENCE",
  "DESIGN",
  "LEADERSHIP",
  "MARKETING",
  "ENGINEERING",
  "FINANCE",
  "SECURITY",
  "PSYCHOLOGY",
  "CREATIVE",
  "AI",
  "OPERATIONS",
  "DEVOPS",
  "STRATEGY",
] as const;

const CATALOG_LABEL_TONES = [
  "text-primary",
  "text-[#8A6B00]",
  "text-secondary",
  "text-destructive",
] as const;

function getCourseLabel(enrollment: Enrollment, index: number) {
  const courseWithCategory = enrollment.course as
    | (NonNullable<Enrollment["course"]> & {
        category?: string;
        domain?: string;
      })
    | undefined;
  const category = courseWithCategory?.category || courseWithCategory?.domain;

  if (category) {
    return category.toUpperCase();
  }

  return FALLBACK_CATALOG_LABELS[index % FALLBACK_CATALOG_LABELS.length];
}

function getLabelTone(index: number) {
  return CATALOG_LABEL_TONES[index % CATALOG_LABEL_TONES.length];
}

function getScheduleTone(enrollment: Enrollment): ScheduleBlock["tone"] {
  const level = enrollment.course?.level;

  if (level === "intermediate") {
    return "secondary";
  }

  if (level === "advanced") {
    return "tertiary";
  }

  return "primary";
}

function scheduleBlockClass(tone: ScheduleBlock["tone"]) {
  if (tone === "secondary") {
    return "border-l-secondary bg-secondary/10";
  }

  if (tone === "tertiary") {
    return "border-l-tertiary bg-tertiary/10";
  }

  return "border-l-primary bg-primary/10";
}

export default function EnrollmentsPage() {
  const { data: enrollments = [], isLoading } = useMyEnrollments();
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<Enrollment | null>(null);

  const scheduleBlocks = useMemo<ScheduleBlock[]>(() => {
    const source = [...enrollments]
      .sort((left, right) => {
        const rightProgress = right.progress?.completion_percentage ?? 0;
        const leftProgress = left.progress?.completion_percentage ?? 0;

        return rightProgress - leftProgress;
      })
      .slice(0, 6);

    return source.map((enrollment, index) => {
      const dayIndex = index % 5;
      const time = SCHEDULE_TIMES[Math.floor(index / 2)] ?? "14:00";

      return {
        key: `${enrollment.id}-${dayIndex}-${time}`,
        dayIndex,
        time,
        category: `${enrollment.course?.id ?? "CRS"} SERIES`,
        title: enrollment.course?.title ?? "Untitled course",
        subtitle: `${enrollment.progress?.completion_percentage ?? 0}% complete`,
        tone: getScheduleTone(enrollment),
      };
    });
  }, [enrollments]);

  const scheduleMap = useMemo(() => {
    return new Map(
      scheduleBlocks.map((block) => [`${block.dayIndex}-${block.time}`, block]),
    );
  }, [scheduleBlocks]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-6 pb-8">
        <Skeleton className="h-72 rounded-[1.5rem]" />
        <Skeleton className="h-[30rem] rounded-[1.5rem]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-7 pb-8">
      <section className="rounded-[1.5rem] border border-outline-variant/60 bg-surface-container-lowest px-5 py-6 shadow-[0_1px_2px_rgba(25,28,35,0.04)] lg:px-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h1 className="text-4xl font-semibold leading-tight text-foreground lg:text-[2.25rem]">
            Course Catalog
          </h1>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Filter"
              className="h-12 w-12 rounded-full bg-surface-container-lowest"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Grid view"
              className="h-12 w-12 rounded-full bg-surface-container-lowest"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {enrollments.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {enrollments.map((enrollment, index) => {
              const isFeatured = index === 1;

              return (
                <article
                  key={enrollment.id}
                  onClick={() => setSelectedEnrollment(enrollment)}
                  className={`cursor-pointer rounded-[0.75rem] border bg-surface-container-lowest px-4 py-4 transition-shadow hover:shadow-md ${
                    isFeatured
                      ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
                      : "border-outline-variant"
                  }`}
                >
                  <p className={`text-label-caps ${getLabelTone(index)}`}>
                    {getCourseLabel(enrollment, index)}
                  </p>
                  <h2 className="mt-1 line-clamp-2 text-[1.05rem] font-semibold leading-[1.35] text-foreground">
                    {enrollment.course?.title || "Untitled course"}
                  </h2>
                </article>
              );
            })}
          </div>
        ) : (
          <Card className="border-outline-variant/70 bg-white/80">
            <CardContent className="py-10 text-center">
              <h2 className="text-xl font-semibold text-foreground">
                No enrollments yet
              </h2>
              <p className="mx-auto mt-3 max-w-reading font-reading text-sm leading-7 text-muted-foreground">
                Join your first course to start a focused learning pathway.
              </p>
              <Button className="mt-5" asChild>
                <Link href="/courses">Browse courses</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-outline-variant/60 bg-white/70 px-5 py-6 shadow-mentor lg:px-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold leading-tight text-foreground lg:text-4xl">
              Weekly Learning Schedule
            </h2>
            <p className="mt-1 font-reading text-sm leading-6 text-muted-foreground lg:text-base">
              Auto-organized focus blocks from your active pathways.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-outline-variant/80 bg-surface-low p-1">
              <Button size="sm" className="h-8 rounded-full px-4 text-xs">
                Schedule
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-4 text-xs"
              >
                Timeline
              </Button>
            </div>
            <Button size="sm" className="h-9 rounded-full px-4" asChild>
              <Link href="/courses">
                <Plus className="mr-1 h-4 w-4" />
                Add Session
              </Link>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[78px_repeat(7,minmax(90px,1fr))] gap-x-3 border-b border-outline-variant/70 pb-3 text-center">
              <p className="text-label-caps text-muted-foreground">Time</p>
              {SCHEDULE_DAYS.map((day, index) => (
                <div key={day}>
                  <p className="text-label-caps text-muted-foreground">{day}</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {12 + index}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-3">
              {SCHEDULE_TIMES.map((time) => (
                <div
                  key={time}
                  className="grid grid-cols-[78px_repeat(7,minmax(90px,1fr))] gap-x-3"
                >
                  <p className="pt-2 text-xs font-semibold tracking-wide text-muted-foreground">
                    {time}
                  </p>

                  {SCHEDULE_DAYS.map((_, dayIndex) => {
                    const block = scheduleMap.get(`${dayIndex}-${time}`);

                    return (
                      <div
                        key={`${dayIndex}-${time}`}
                        className="min-h-20 rounded-[0.875rem] border border-dashed border-outline-variant/70 p-1"
                      >
                        {block ? (
                          <article
                            className={`h-full rounded-[0.75rem] border-l-[3px] px-3 py-2 ${scheduleBlockClass(
                              block.tone,
                            )}`}
                          >
                            <p className="text-[10px] font-bold tracking-wide text-muted-foreground">
                              {block.category}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs font-semibold text-foreground">
                              {block.title}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {block.subtitle}
                            </p>
                          </article>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-[0.875rem] border border-outline-variant/70 bg-white/70 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Keep sessions lightweight and consistent to reduce cognitive
            switching cost.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <CalendarDays className="mr-1.5 h-4 w-4" />
              View Dashboard
            </Link>
          </Button>
        </div>
      </section>

      <CourseInsightsSheet
        enrollment={selectedEnrollment}
        scheduleMap={scheduleMap}
        onClose={() => setSelectedEnrollment(null)}
      />
    </div>
  );
}

// ─── Course Insights Sheet ────────────────────────────────────────────────────

const SCHEDULE_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function CourseInsightsSheet({
  enrollment,
  scheduleMap,
  onClose,
}: {
  enrollment: Enrollment | null;
  scheduleMap: Map<string, ScheduleBlock>;
  onClose: () => void;
}) {
  const course = enrollment?.course;

  const scheduleLabel = useMemo(() => {
    if (!enrollment) return null;
    for (const [key, block] of scheduleMap.entries()) {
      if (block.title === course?.title) {
        const [dayIndex, time] = key.split("-");
        const day = SCHEDULE_DAY_LABELS[Number(dayIndex)];
        return day ? `Session scheduled for ${day}, ${time} AM` : null;
      }
    }
    return null;
  }, [enrollment, scheduleMap, course?.title]);

  const totalMinutes = useMemo(() => {
    if (!course?.sections) return null;
    let mins = 0;
    for (const section of course.sections) {
      for (const lesson of section.lessons ?? []) {
        mins += lesson.duration_minutes ?? 0;
      }
    }
    return mins > 0 ? Math.round(mins / 60) : null;
  }, [course]);

  const quizCount = useMemo(() => {
    if (!course?.sections) return null;
    let count = 0;
    for (const section of course.sections) {
      for (const lesson of section.lessons ?? []) {
        if (lesson.lesson_type === "quiz") count++;
      }
    }
    return count > 0 ? count : null;
  }, [course]);

  const syllabusItems = useMemo(() => {
    if (!course?.sections?.length) return [];
    return course.sections.slice(0, 3).map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description ?? "",
    }));
  }, [course]);

  return (
    <Sheet open={!!enrollment} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full max-w-[420px] flex-col gap-0 overflow-y-auto p-0"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-outline-variant/60 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Course Insights
              </p>
              {scheduleLabel && (
                <p className="text-xs text-primary">{scheduleLabel}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-surface-container hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-5 px-6 py-5">
          {/* Category + title */}
          <div>
            <p className="text-label-caps text-primary">
              {course?.id ? `CS${course.id} SPECIALIZED` : "SPECIALIZED"}
            </p>
            <h2 className="mt-1 text-2xl font-bold leading-tight text-foreground">
              {course?.title ?? "Untitled course"}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {course?.level && (
                <Badge
                  variant="outline"
                  className="rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase"
                >
                  {course.level}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase"
              >
                Certificate Track
              </Badge>
            </div>
          </div>

          {/* Stats */}
          {(totalMinutes !== null || quizCount !== null) && (
            <div className="grid grid-cols-2 gap-3">
              {totalMinutes !== null && (
                <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low px-4 py-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <p className="text-[10px] font-bold tracking-widest uppercase">
                      Duration
                    </p>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {totalMinutes} Hours Total
                  </p>
                </div>
              )}
              {quizCount !== null && (
                <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low px-4 py-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <HelpCircle className="h-3.5 w-3.5" />
                    <p className="text-[10px] font-bold tracking-widest uppercase">
                      Quizzes
                    </p>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {quizCount} Graded
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Syllabus Highlights */}
          {syllabusItems.length > 0 && (
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                Syllabus Highlights
              </p>
              <ol className="space-y-3">
                {syllabusItems.map((item, i) => (
                  <li key={item.id} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Instructor */}
          {course?.instructor && (
            <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {course.instructor.fullName?.charAt(0) ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {course.instructor.fullName}
                  </p>
                  <p className="text-label-caps text-primary">
                    Lead Academic Mentor
                  </p>
                </div>
              </div>
              {course.description && (
                <p className="mt-3 font-reading text-xs italic leading-relaxed text-muted-foreground">
                  &ldquo;{course.description}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-outline-variant/60 px-6 py-4">
          <Button className="w-full gap-2 rounded-xl" size="lg" asChild>
            <Link href={`/courses/${course?.id}`}>
              <Rocket className="h-4 w-4" />
              Launch Session
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
