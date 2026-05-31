"use client";

import { useMemo } from "react";
import { useCourse, useEnrollCourse } from "../_feature/hooks";
import type { CourseReview, CourseSection, Lesson } from "@/types/models";
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
  Award,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers3,
  PlayCircle,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type CurriculumLesson = {
  id: number;
  title: string;
  durationMinutes: number;
  lessonType: string;
};

type CurriculumSection = {
  id: number;
  title: string;
  description?: string;
  lessons: CurriculumLesson[];
};

type ReviewPreview = {
  id: number;
  author: string;
  rating: number;
  text: string;
  date: string;
};

const MOCK_CURRICULUM: CurriculumSection[] = [
  {
    id: 1,
    title: "Orientation and Foundations",
    description:
      "Set the shared vocabulary and core mental model before the deeper work begins.",
    lessons: [
      { id: 101, title: "What this course is solving", durationMinutes: 12, lessonType: "video" },
      { id: 102, title: "Core concepts and shared language", durationMinutes: 18, lessonType: "reading" },
      { id: 103, title: "Warm-up checkpoint", durationMinutes: 8, lessonType: "quiz" },
    ],
  },
  {
    id: 2,
    title: "Applied Practice",
    description:
      "Turn ideas into action through guided examples, repetition, and small wins.",
    lessons: [
      { id: 201, title: "Worked example walkthrough", durationMinutes: 16, lessonType: "video" },
      { id: 202, title: "Structured practice session", durationMinutes: 20, lessonType: "assignment" },
      { id: 203, title: "Knowledge pulse", durationMinutes: 6, lessonType: "quiz" },
    ],
  },
  {
    id: 3,
    title: "Retention and Review",
    description:
      "Close the loop with reflection, retrieval practice, and a clear next step.",
    lessons: [
      { id: 301, title: "Spaced review recap", durationMinutes: 14, lessonType: "reading" },
      { id: 302, title: "Final reflection", durationMinutes: 10, lessonType: "text" },
    ],
  },
];

const MOCK_REVIEWS: ReviewPreview[] = [
  {
    id: 1,
    author: "Maya Chen",
    rating: 5,
    text:
      "The pacing is calm but still moves quickly enough to keep me engaged. The examples make each idea feel practical.",
    date: "May 6, 2026",
  },
  {
    id: 2,
    author: "Jordan Lee",
    rating: 4.5,
    text:
      "The structure makes it easy to come back after a break. I always know exactly what to do next.",
    date: "May 2, 2026",
  },
  {
    id: 3,
    author: "Ava Patel",
    rating: 5,
    text:
      "The reward moments are subtle, which keeps the page focused, but still give a real sense of progress.",
    date: "Apr 28, 2026",
  },
];

const COURSE_HIGHLIGHTS = [
  "A clear path from orientation to application",
  "Short lessons that reduce cognitive load",
  "Built-in review checkpoints and retrieval practice",
  "Small reward moments to keep momentum visible",
];

function formatMinutes(minutes: number) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
}

function formatPrice(price: number) {
  if (price <= 0) {
    return "Free";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function toCurriculumSections(courseSections?: CourseSection[]) {
  if (!courseSections || courseSections.length === 0) {
    return MOCK_CURRICULUM;
  }

  return courseSections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    lessons: (section.lessons ?? []).map((lesson: Lesson) => ({
      id: lesson.id,
      title: lesson.title,
      durationMinutes: lesson.duration_minutes,
      lessonType: lesson.lesson_type,
    })),
  }));
}

function toReviewPreviews(courseReviews?: CourseReview[]) {
  if (!courseReviews || courseReviews.length === 0) {
    return MOCK_REVIEWS;
  }

  return courseReviews.map((review) => ({
    id: review.id,
    author: review.student?.fullName || "Anonymous learner",
    rating: review.rating,
    text:
      review.review_text ||
      "This learner left a short review without additional notes.",
    date: new Date(review.createdAt).toLocaleDateString(),
  }));
}

function getAverageRating(reviews: ReviewPreview[]) {
  if (reviews.length === 0) {
    return 0;
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}

function getTotalLessons(sections: CurriculumSection[]) {
  return sections.reduce((sum, section) => sum + section.lessons.length, 0);
}

function getTotalMinutes(sections: CurriculumSection[]) {
  return sections.reduce(
    (sum, section) =>
      sum + section.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.durationMinutes, 0),
    0,
  );
}

function capitalizeLevel(level?: string) {
  if (!level) {
    return "Course";
  }

  return level.charAt(0).toUpperCase() + level.slice(1);
}

export default function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const courseId = Number(params.id);
  const { data: course, isLoading, error } = useCourse(courseId);
  const enrollMutation = useEnrollCourse();

  const curriculumSections = useMemo(
    () => toCurriculumSections(course?.sections),
    [course?.sections],
  );
  const reviewPreviews = useMemo(
    () => toReviewPreviews(course?.reviews),
    [course?.reviews],
  );
  const averageRating = useMemo(
    () => getAverageRating(reviewPreviews),
    [reviewPreviews],
  );
  const totalLessons = useMemo(
    () => getTotalLessons(curriculumSections),
    [curriculumSections],
  );
  const totalMinutes = useMemo(
    () => getTotalMinutes(curriculumSections),
    [curriculumSections],
  );
  const courseLevel = capitalizeLevel(course?.level);
  const nextSection = curriculumSections[0];
  const nextLesson = nextSection?.lessons[0];
  const sectionCount = curriculumSections.length;
  const learnerCount = course?.enrollments?.length ?? 0;

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
              {courseLevel} course experience
            </Badge>

            <div className="space-y-3">
              <h1 className="max-w-[14ch] text-4xl font-bold leading-tight tracking-tight text-on-surface lg:text-5xl">
                {course.title}
              </h1>
              <p className="max-w-2xl font-reading text-base leading-7 text-muted-foreground lg:text-lg">
                {course.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border border-secondary/15 bg-secondary/10 text-secondary">
                <BookOpen className="mr-2 h-3.5 w-3.5" />
                {sectionCount} sections
              </Badge>
              <Badge className="border border-tertiary/15 bg-tertiary/10 text-tertiary">
                <Clock3 className="mr-2 h-3.5 w-3.5" />
                {totalLessons} lessons · {formatMinutes(totalMinutes)}
              </Badge>
              <Badge className="border border-outline-variant/60 bg-white/70 text-on-surface-variant">
                <Users className="mr-2 h-3.5 w-3.5" />
                {learnerCount} learners enrolled
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <RatingStars rating={averageRating} />
                <span className="text-sm font-semibold text-on-surface-variant">
                  {averageRating > 0 ? averageRating : 0}/5
                </span>
              </div>

              {course.instructor && (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Users className="h-4 w-4 text-primary" />
                  <span>
                    Guided by{" "}
                    <span className="font-semibold text-on-surface">
                      {course.instructor.fullName}
                    </span>
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
                className="rounded-full px-6"
              >
                {enrollMutation.isPending ? "Joining..." : "Start learning"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" asChild className="rounded-full px-6">
                <Link href="#curriculum">View curriculum</Link>
              </Button>
              <Button variant="outline" asChild className="rounded-full px-6">
                <Link href={`/courses/${courseId}/qa`}>Open Q&A</Link>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-white/80 bg-white/85 shadow-[0_4px_18px_rgba(0,91,191,0.05)] backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-label-caps text-primary">Course snapshot</p>
                    <CardTitle className="mt-1 text-xl">
                      {formatPrice(course.price)}
                    </CardTitle>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Curriculum depth</span>
                    <span className="font-semibold text-on-surface">
                      {Math.min(100, Math.round((sectionCount / 3) * 100))}%
                    </span>
                  </div>
                  <Progress value={Math.min(100, Math.round((sectionCount / 3) * 100))} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                    <p className="text-label-caps text-on-surface-variant">Sections</p>
                    <p className="mt-1 text-lg font-bold text-on-surface">{sectionCount}</p>
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
                    <p className="text-label-caps text-on-surface-variant">Rating</p>
                    <p className="mt-1 text-lg font-bold text-on-surface">
                      {averageRating > 0 ? averageRating : 0}/5
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/80 bg-white/85 shadow-[0_4px_18px_rgba(0,91,191,0.05)]">
              <CardHeader className="pb-3">
                <p className="text-label-caps text-secondary">Next up</p>
                <CardTitle className="text-xl">
                  {nextSection?.title || "Ready-to-start curriculum"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {nextLesson ? (
                  <div className="rounded-2xl border border-secondary/15 bg-secondary/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-secondary shadow-sm">
                        <PlayCircle className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-on-surface">
                          {nextLesson.title}
                        </p>
                        <p className="mt-1 text-sm text-on-surface-variant">
                          {nextLesson.durationMinutes} minutes · {nextLesson.lessonType}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-sm text-on-surface-variant">
                    No lessons are available yet. This course will fall back to the
                    curated mock curriculum when the API does not provide sections.
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
                    <Target className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant">
                        Learning focus
                      </p>
                      <p className="text-sm font-semibold text-on-surface">Clarity first</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
                    <CalendarDays className="h-4 w-4 text-secondary" />
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant">
                        Recommended pace
                      </p>
                      <p className="text-sm font-semibold text-on-surface">
                        1 section per session
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_4px_18px_rgba(0,91,191,0.04)]">
          <CardHeader className="space-y-4 border-b border-outline-variant/30 bg-surface-container-low/40">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">Course workspace</CardTitle>
                <CardDescription className="max-w-2xl">
                  A focused layout for learning, reviewing, and resuming without
                  visual noise. The tabs below switch between overview, curriculum,
                  and learner feedback.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-outline-variant/60 bg-white px-3 py-2 text-xs font-semibold text-on-surface-variant">
                <Layers3 className="h-3.5 w-3.5 text-primary" />
                Structured learning path
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="curriculum" id="curriculum">
                  Curriculum
                </TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Card className="border-white/70 bg-white/90 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-lg">What you&apos;ll get</CardTitle>
                        <Award className="h-5 w-5 text-tertiary" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {COURSE_HIGHLIGHTS.map((highlight) => (
                        <div
                          key={highlight}
                          className="flex items-start gap-3 text-sm text-on-surface-variant"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary" />
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-white/70 bg-white/90 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-lg">Learning rhythm</CardTitle>
                        <Clock3 className="h-5 w-5 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-2xl bg-surface-container-low px-4 py-4">
                        <p className="text-label-caps text-on-surface-variant">
                          Estimated completion
                        </p>
                        <p className="mt-2 text-2xl font-bold text-on-surface">
                          {formatMinutes(totalMinutes)}
                        </p>
                      </div>
                      <p className="font-reading text-sm leading-6 text-on-surface-variant">
                        The course is intentionally segmented into smaller pieces so
                        each session can end with a clear stopping point.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-white/70 bg-white/90 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-lg">Support signal</CardTitle>
                        <BadgeCheck className="h-5 w-5 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                        <p className="text-sm font-semibold text-on-surface">
                          You are not expected to rush.
                        </p>
                        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                          Move through one section at a time, then return for the
                          recap when the energy is fresh again.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="curriculum" className="mt-6 space-y-4">
                {curriculumSections.map((section, index) => {
                  const sectionMinutes = formatMinutes(
                    section.lessons.reduce(
                      (sum, lesson) => sum + lesson.durationMinutes,
                      0,
                    ),
                  );

                  return (
                    <Card key={section.id} className="border-white/70 bg-white/90 shadow-sm">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <p className="text-label-caps text-primary">Section {index + 1}</p>
                            <CardTitle className="text-xl">{section.title}</CardTitle>
                            {section.description && (
                              <CardDescription className="max-w-2xl">
                                {section.description}
                              </CardDescription>
                            )}
                          </div>
                          <Badge className="w-fit border border-outline-variant/60 bg-surface-container-low text-on-surface-variant">
                            <Clock3 className="mr-2 h-3.5 w-3.5" />
                            {section.lessons.length} lessons · {sectionMinutes}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {section.lessons.length > 0 ? (
                            section.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-4 transition-colors hover:border-primary/20 hover:bg-white"
                              >
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                                  <PlayCircle className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <p className="truncate text-sm font-semibold text-on-surface">
                                    {lesson.title}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                                    <span>{lesson.durationMinutes} min</span>
                                    <span className="h-1 w-1 rounded-full bg-outline-variant" />
                                    <span>{lesson.lessonType}</span>
                                  </div>
                                </div>
                                <Badge className="border border-secondary/15 bg-secondary/10 text-secondary">
                                  Ready
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-6 text-sm text-on-surface-variant">
                              No lesson content is available for this section yet.
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
                        <CardDescription className="mt-1">
                          Course ratings stay visible so learners can judge fit
                          quickly and see the tone of the experience.
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-tertiary shadow-sm">
                          <Star className="h-5 w-5 fill-current" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">
                            {averageRating > 0 ? averageRating : 0}/5 average
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {reviewPreviews.length} reviews
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reviewPreviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-2xl border border-outline-variant/40 bg-surface-container-low px-5 py-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-on-surface">
                                {review.author}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <RatingStars rating={review.rating} />
                              </div>
                            </div>
                            <p className="text-xs text-on-surface-variant">{review.date}</p>
                          </div>
                          <p className="mt-3 font-reading text-sm leading-7 text-on-surface-variant">
                            {review.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card className="border-white/80 bg-white/90 shadow-[0_4px_18px_rgba(0,91,191,0.05)]">
            <CardHeader className="pb-3">
              <p className="text-label-caps text-primary">Course action</p>
              <CardTitle className="text-xl">Resume the next step</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                      Current status
                    </p>
                    <p className="mt-2 text-lg font-bold text-on-surface">
                      Ready to begin
                    </p>
                  </div>
                  <Target className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                  <p className="text-label-caps text-on-surface-variant">Price</p>
                  <p className="mt-1 text-lg font-bold text-on-surface">
                    {formatPrice(course.price)}
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                  <p className="text-label-caps text-on-surface-variant">Level</p>
                  <p className="mt-1 text-lg font-bold text-on-surface">{courseLevel}</p>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-4">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-secondary" />
                  <div>
                    <p className="text-sm font-semibold text-on-surface">
                      Recommended session length
                    </p>
                    <p className="text-xs text-on-surface-variant">45 to 60 minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-tertiary" />
                  <div>
                    <p className="text-sm font-semibold text-on-surface">
                      Earned momentum
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Completion and review badges appear here
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
                className="w-full rounded-full px-6"
              >
                {enrollMutation.isPending ? "Joining..." : "Start learning"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/90 shadow-[0_4px_18px_rgba(0,91,191,0.05)]">
            <CardHeader className="pb-3">
              <p className="text-label-caps text-secondary">Why it works</p>
              <CardTitle className="text-xl">Focused encouragement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-on-surface-variant">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary" />
                <span>Soft surfaces keep the page calm and easy to scan.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-on-surface-variant">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary" />
                <span>Progress and timing are visible without becoming noisy.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-on-surface-variant">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary" />
                <span>
                  Mock-safe sections and reviews keep the page useful even when the
                  API is sparse.
                </span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}