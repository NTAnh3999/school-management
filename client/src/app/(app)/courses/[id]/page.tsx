"use client";

import { use, useMemo } from "react";
import { useCourse, useEnrollCourse, useMyEnrollments } from "../_feature/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RatingStars } from "@/components/ui/rating-stars";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers3,
  PlayCircle,
  Sparkles,
  Star,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function formatMinutes(minutes: number) {
  if (minutes <= 0) return "0m";
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const courseId = Number(id);
  const { data: course, isLoading, error } = useCourse(courseId);
  const { data: enrollments = [] } = useMyEnrollments();
  const enrollMutation = useEnrollCourse();

  const modules = course?.modules ?? [];
  const reviews = course?.reviews ?? [];

  const enrollment = useMemo(
    () => enrollments.find((e) => e.course_id === courseId),
    [enrollments, courseId],
  );
  const isEnrolled = !!enrollment;

  const totalLessons = useMemo(
    () => modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0),
    [modules],
  );
  const totalMinutes = useMemo(
    () =>
      modules.reduce(
        (sum, m) =>
          sum +
          (m.lessons ?? []).reduce(
            (lessonSum, lesson) => lessonSum + (lesson.duration_minutes ?? 0),
            0,
          ),
        0,
      ),
    [modules],
  );
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return (
      Math.round(
        (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10,
      ) / 10
    );
  }, [reviews]);

  const firstModule = modules[0];
  const firstLesson = firstModule?.lessons?.[0];

  const handleEnroll = async () => {
    try {
      await enrollMutation.mutateAsync(courseId);
      toast.success("Successfully enrolled in course!");
    } catch {
      toast.error("Failed to enroll in course");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-64 w-full rounded-[2rem]" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
          <Skeleton className="h-[760px] rounded-[2rem]" />
          <Skeleton className="h-[760px] rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">Failed to load course</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,#ffffff_0%,#f2f3fd_46%,#ecedf7_100%)] px-6 py-7 shadow-[0_4px_18px_rgba(0,91,191,0.05),0_24px_60px_rgba(0,91,191,0.04)] lg:px-8 lg:py-8">
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
          <div className="space-y-5">
            <Badge className="w-fit border border-primary/15 bg-primary/10 text-primary">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              {course.course_code}
            </Badge>

            <div className="space-y-3">
              <h1 className="max-w-[20ch] text-4xl font-bold leading-tight tracking-tight text-on-surface lg:text-5xl">
                {course.course_name}
              </h1>
              {course.description && (
                <p className="max-w-2xl font-reading text-base leading-7 text-muted-foreground lg:text-lg">
                  {course.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border border-secondary/15 bg-secondary/10 text-secondary">
                <Layers3 className="mr-2 h-3.5 w-3.5" />
                {modules.length} modules
              </Badge>
              <Badge className="border border-tertiary/15 bg-tertiary/10 text-tertiary">
                <Clock3 className="mr-2 h-3.5 w-3.5" />
                {totalLessons} lessons · {formatMinutes(totalMinutes)}
              </Badge>
              {course.department && (
                <Badge className="border border-outline-variant/60 bg-white/70 text-on-surface-variant">
                  <GraduationCap className="mr-2 h-3.5 w-3.5" />
                  {course.department.department_name}
                </Badge>
              )}
            </div>

            {reviews.length > 0 && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <RatingStars rating={averageRating} />
                  <span className="text-sm font-semibold text-on-surface-variant">
                    {averageRating}/5 ({reviews.length})
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {isEnrolled ? (
                firstLesson ? (
                  <Button asChild className="rounded-full px-6">
                    <Link href={`/courses/${courseId}/lessons/${firstLesson.id}`}>
                      Continue learning
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button disabled className="rounded-full px-6">
                    No lessons published yet
                  </Button>
                )
              ) : (
                <Button
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending}
                  className="rounded-full px-6"
                >
                  {enrollMutation.isPending ? "Joining..." : "Enroll in this course"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" asChild className="rounded-full px-6">
                <Link href="#curriculum">View curriculum</Link>
              </Button>
              <Button variant="outline" asChild className="rounded-full px-6">
                <Link href={`/courses/${courseId}/qa`}>Open Q&A</Link>
              </Button>
            </div>
          </div>

          <Card className="border-white/80 bg-white/85 shadow-[0_4px_18px_rgba(0,91,191,0.05)] backdrop-blur-sm">
            <CardHeader className="pb-3">
              <p className="text-label-caps text-primary">Course snapshot</p>
              <CardTitle className="mt-1 text-xl">
                {course.credit ? `${course.credit} credits` : course.course_type}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                  <p className="text-label-caps text-on-surface-variant">Modules</p>
                  <p className="mt-1 text-lg font-bold text-on-surface">{modules.length}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                  <p className="text-label-caps text-on-surface-variant">Lessons</p>
                  <p className="mt-1 text-lg font-bold text-on-surface">{totalLessons}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                  <p className="text-label-caps text-on-surface-variant">Time</p>
                  <p className="mt-1 text-lg font-bold text-on-surface">
                    {formatMinutes(totalMinutes)}
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                  <p className="text-label-caps text-on-surface-variant">Status</p>
                  <p className="mt-1 text-lg font-bold capitalize text-on-surface">
                    {isEnrolled ? enrollment?.status : "Not enrolled"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_4px_18px_rgba(0,91,191,0.04)]">
        <CardHeader className="space-y-4 border-b border-outline-variant/30 bg-surface-container-low/40">
          <div className="space-y-2">
            <CardTitle className="text-2xl">Course workspace</CardTitle>
            <CardDescription className="max-w-2xl">
              Switch between the curriculum and learner feedback for this course.
            </CardDescription>
          </div>

          <Tabs defaultValue="curriculum" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="curriculum" id="curriculum">
                Curriculum
              </TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="curriculum" className="mt-6 space-y-4">
              {modules.length === 0 && (
                <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-6 text-sm text-on-surface-variant">
                  This course does not have any published modules yet.
                </div>
              )}
              {modules.map((module, index) => {
                const moduleMinutes = formatMinutes(
                  (module.lessons ?? []).reduce(
                    (sum, lesson) => sum + (lesson.duration_minutes ?? 0),
                    0,
                  ),
                );

                return (
                  <Card key={module.id} className="border-white/70 bg-white/90 shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <p className="text-label-caps text-primary">Module {index + 1}</p>
                          <CardTitle className="text-xl">{module.title}</CardTitle>
                          {module.description && (
                            <CardDescription className="max-w-2xl">
                              {module.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge className="w-fit border border-outline-variant/60 bg-surface-container-low text-on-surface-variant">
                          <Clock3 className="mr-2 h-3.5 w-3.5" />
                          {module.lessons?.length ?? 0} lessons · {moduleMinutes}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {module.lessons && module.lessons.length > 0 ? (
                          module.lessons.map((lesson) => {
                            const lessonProgress = enrollment?.lesson_progress?.find(
                              (lp) => lp.lesson_id === lesson.id,
                            );
                            const isCompleted = lessonProgress?.status === "completed";
                            const content = (
                              <div className="flex items-center gap-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-4 transition-colors hover:border-primary/20 hover:bg-white">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                                  ) : (
                                    <PlayCircle className="h-5 w-5" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <p className="truncate text-sm font-semibold text-on-surface">
                                    {lesson.title}
                                  </p>
                                  {lesson.duration_minutes ? (
                                    <p className="text-xs text-on-surface-variant">
                                      {lesson.duration_minutes} min
                                    </p>
                                  ) : null}
                                </div>
                                {isCompleted && (
                                  <Badge className="border border-secondary/15 bg-secondary/10 text-secondary">
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            );

                            return isEnrolled ? (
                              <Link
                                key={lesson.id}
                                href={`/courses/${courseId}/lessons/${lesson.id}`}
                                className="block"
                              >
                                {content}
                              </Link>
                            ) : (
                              <div key={lesson.id} className="opacity-70">
                                {content}
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-6 text-sm text-on-surface-variant">
                            No lessons available for this module yet.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6 space-y-4">
              <Card className="border-white/70 bg-white/90 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="text-xl">Learner feedback</CardTitle>
                    </div>
                    {reviews.length > 0 && (
                      <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-tertiary shadow-sm">
                          <Star className="h-5 w-5 fill-current" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">
                            {averageRating}/5 average
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {reviews.length} reviews
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-2xl border border-outline-variant/40 bg-surface-container-low px-5 py-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-on-surface">
                                {review.student?.fullName || "Anonymous learner"}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <RatingStars rating={review.rating} />
                              </div>
                            </div>
                            <p className="text-xs text-on-surface-variant">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {review.review_text && (
                            <p className="mt-3 font-reading text-sm leading-7 text-on-surface-variant">
                              {review.review_text}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-6 text-sm text-on-surface-variant">
                      <BookOpen className="mx-auto mb-2 h-6 w-6 text-primary/40" />
                      No reviews yet for this course.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
}
