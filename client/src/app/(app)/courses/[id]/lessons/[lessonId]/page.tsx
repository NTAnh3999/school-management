"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Layers3,
} from "lucide-react";

import { usePublishedContentStructure } from "../../../_feature/content-versions/hooks";
import { useLearningItems } from "../../../_feature/learning-items/hooks";
import { useMyEnrollments } from "../../../_feature/hooks";
import { LearningItemContent } from "../../../_feature/components/learning-item-content";
import { useUpdateProgress } from "@/_shared/progress/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CourseModule, Lesson } from "@/types/models";

interface FlatLesson {
  lesson: Lesson;
  moduleTitle: string;
}

function flattenLessons(modules: CourseModule[]): FlatLesson[] {
  return modules.flatMap((courseModule) =>
    (courseModule.lessons ?? []).map((lesson) => ({
      lesson,
      moduleTitle: courseModule.title,
    })),
  );
}

export default function LessonViewerPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId: lessonIdParam } = use(params);
  const courseId = Number(id);
  const lessonId = Number(lessonIdParam);
  const router = useRouter();

  const { data: structure, isLoading: isLoadingStructure, error: structureError } =
    usePublishedContentStructure(courseId);
  const { data: items, isLoading: isLoadingItems } = useLearningItems(lessonId);
  const { data: enrollments = [] } = useMyEnrollments();
  const updateProgress = useUpdateProgress();

  const enrollment = useMemo(
    () => enrollments.find((e) => e.course_id === courseId),
    [enrollments, courseId],
  );

  const flatLessons = useMemo(
    () => (structure ? flattenLessons(structure.structure) : []),
    [structure],
  );

  const currentIndex = flatLessons.findIndex((fl) => fl.lesson.id === lessonId);
  const current = currentIndex >= 0 ? flatLessons[currentIndex] : undefined;
  const previous = currentIndex > 0 ? flatLessons[currentIndex - 1] : undefined;
  const next =
    currentIndex >= 0 && currentIndex < flatLessons.length - 1
      ? flatLessons[currentIndex + 1]
      : undefined;

  const lessonProgress = enrollment?.lesson_progress?.find((lp) => lp.lesson_id === lessonId);
  const isCompleted = lessonProgress?.status === "completed";

  const sortedItems = useMemo(
    () => (items ? [...items].sort((a, b) => a.display_order - b.display_order) : []),
    [items],
  );

  const handleMarkComplete = async () => {
    if (!enrollment) return;
    try {
      await updateProgress.mutateAsync({
        enrollment_id: enrollment.id,
        lesson_id: lessonId,
        status: "completed",
      });
      toast.success("Lesson marked as complete");
      if (next) {
        router.push(`/courses/${courseId}/lessons/${next.lesson.id}`);
      }
    } catch {
      toast.error("Failed to update progress");
    }
  };

  if (isLoadingStructure) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-6 pb-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (structureError) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-4 pb-8 text-center">
        <p className="text-lg font-semibold text-foreground">
          This course does not have published content yet.
        </p>
        <Button variant="outline" asChild>
          <Link href={`/courses/${courseId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to course
          </Link>
        </Button>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-4 pb-8 text-center">
        <p className="text-lg font-semibold text-foreground">
          You need to enroll in this course to view its lessons.
        </p>
        <Button asChild>
          <Link href={`/courses/${courseId}`}>Go to course page</Link>
        </Button>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-4 pb-8 text-center">
        <p className="text-lg font-semibold text-foreground">Lesson not found.</p>
        <Button variant="outline" asChild>
          <Link href={`/courses/${courseId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to course
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-8">
      <Link
        href={`/courses/${courseId}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to course
      </Link>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-2 lg:sticky lg:top-24 lg:self-start">
          <Card className="border-white/80 bg-white/85">
            <CardContent className="max-h-[70vh] overflow-y-auto p-3">
              {structure?.structure.map((courseModule) => (
                <div key={courseModule.id} className="mb-3">
                  <p className="mb-1 flex items-center gap-1.5 px-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <Layers3 className="h-3.5 w-3.5" />
                    {courseModule.title}
                  </p>
                  <div className="space-y-0.5">
                    {(courseModule.lessons ?? []).map((lesson) => {
                      const lp = enrollment.lesson_progress?.find(
                        (item) => item.lesson_id === lesson.id,
                      );
                      const done = lp?.status === "completed";
                      const active = lesson.id === lessonId;
                      return (
                        <Link
                          key={lesson.id}
                          href={`/courses/${courseId}/lessons/${lesson.id}`}
                          className={`flex items-center gap-2 rounded-xl px-2 py-2 text-sm transition-colors ${
                            active
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-on-surface-variant hover:bg-surface-container-low"
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-outline-variant" />
                          )}
                          <span className="line-clamp-1">{lesson.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-6">
          <div className="space-y-2">
            <p className="text-label-caps text-primary">{current.moduleTitle}</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-on-surface">{current.lesson.title}</h1>
              {isCompleted && (
                <Badge className="border border-secondary/15 bg-secondary/10 text-secondary">
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Completed
                </Badge>
              )}
            </div>
            {current.lesson.objective && (
              <p className="font-reading text-base leading-7 text-muted-foreground">
                {current.lesson.objective}
              </p>
            )}
          </div>

          <div className="space-y-8">
            {isLoadingItems ? (
              <div className="space-y-4">
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
              </div>
            ) : sortedItems.length === 0 ? (
              <Card className="border-dashed border-outline-variant bg-surface-container-low">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  This lesson does not have any content yet.
                </CardContent>
              </Card>
            ) : (
              sortedItems.map((item, index) => {
                const precedingItem = index > 0 ? sortedItems[index - 1] : undefined;
                const suppressHeading = !!precedingItem?.group_with_next;
                return (
                  <div key={item.id}>
                    {!suppressHeading && (
                      <div className="mb-3 flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-on-surface">{item.title}</h2>
                        {item.is_required && (
                          <Badge variant="outline" className="text-[10px]">
                            required
                          </Badge>
                        )}
                      </div>
                    )}
                    <LearningItemContent item={item} courseId={courseId} />
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/40 pt-6">
            <div>
              {previous ? (
                <Button variant="outline" asChild>
                  <Link href={`/courses/${courseId}/lessons/${previous.lesson.id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {previous.lesson.title}
                  </Link>
                </Button>
              ) : (
                <span />
              )}
            </div>
            <div className="flex items-center gap-3">
              {!isCompleted && (
                <Button onClick={handleMarkComplete} disabled={updateProgress.isPending}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {updateProgress.isPending ? "Saving..." : "Mark as complete"}
                </Button>
              )}
              {next && (
                <Button variant={isCompleted ? "default" : "outline"} asChild>
                  <Link href={`/courses/${courseId}/lessons/${next.lesson.id}`}>
                    {next.lesson.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
