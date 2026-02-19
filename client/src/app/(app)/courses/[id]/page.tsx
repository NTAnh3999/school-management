"use client";

import { useCourse, useEnrollCourse } from "../_feature/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock, DollarSign, PlayCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { RatingStars } from "@/components/ui/rating-stars";

export default function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const courseId = parseInt(params.id);
  const { data: course, isLoading, error } = useCourse(courseId);
  const enrollMutation = useEnrollCourse();

  const handleEnroll = async () => {
    try {
      await enrollMutation.mutateAsync(courseId);
      toast.success("Successfully enrolled in course!");
    } catch (error) {
      toast.error("Failed to enroll in course");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Failed to load course</p>
      </div>
    );
  }

  const averageRating =
    course.reviews && course.reviews.length > 0
      ? course.reviews.reduce(
          (acc: number, review: any) => acc + review.rating,
          0,
        ) / course.reviews.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-3xl">{course.title}</CardTitle>
              <CardDescription className="text-base mt-2">
                {course.description}
              </CardDescription>

              <div className="flex flex-wrap gap-2 mt-4">
                <Badge>{course.level}</Badge>
                <Badge variant="outline">{course.status}</Badge>
              </div>

              {course.instructor && (
                <div className="mt-4 text-sm text-muted-foreground">
                  Instructor:{" "}
                  <span className="font-medium">
                    {course.instructor.fullName}
                  </span>
                </div>
              )}

              {course.reviews && course.reviews.length > 0 && (
                <div className="mt-2">
                  <RatingStars rating={averageRating} />
                  <span className="text-sm text-muted-foreground ml-2">
                    ({course.reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>

            <div className="lg:w-80">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">${course.price}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.sections?.length || 0} sections</span>
                  </div>
                  {course.enrollments && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      <span>{course.enrollments.length} students enrolled</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                    className="w-full"
                  >
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Course Content */}
      <Tabs defaultValue="curriculum" className="w-full">
        <TabsList>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum" className="space-y-4">
          {course.sections && course.sections.length > 0 ? (
            course.sections.map((section: any, index: number) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle>
                    Section {index + 1}: {section.title}
                  </CardTitle>
                  {section.description && (
                    <CardDescription>{section.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {section.lessons && section.lessons.length > 0 ? (
                    <div className="space-y-2">
                      {section.lessons.map((lesson: any) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <PlayCircle className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{lesson.title}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{lesson.duration_minutes} min</span>
                                <Badge variant="outline" className="ml-2">
                                  {lesson.lesson_type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No lessons in this section yet
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No curriculum available yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          {course.reviews && course.reviews.length > 0 ? (
            course.reviews.map((review: any) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {review.student?.fullName || "Anonymous"}
                      </CardTitle>
                      <div className="mt-1">
                        <RatingStars rating={review.rating} showValue={false} />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                {review.review_text && (
                  <CardContent>
                    <p className="text-muted-foreground">
                      {review.review_text}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No reviews yet. Be the first to review this course!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
