import { Course } from "@/types/models";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const averageRating =
    course.reviews && course.reviews.length > 0
      ? course.reviews.reduce((sum, review) => sum + review.rating, 0) /
        course.reviews.length
      : null;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{course.course_name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-2">
              {course.description || course.short_name}
            </CardDescription>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Badge variant="secondary">{course.course_code}</Badge>
          {course.course_type && (
            <Badge variant="outline">{course.course_type}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {course.department && (
            <div className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              <span>{course.department.department_name}</span>
            </div>
          )}
          {course.modules && course.modules.length > 0 && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{course.modules.length} modules</span>
            </div>
          )}
        </div>
        {averageRating !== null && (
          <div className="mt-3 text-sm text-muted-foreground">
            {averageRating.toFixed(1)}/5 ({course.reviews?.length} reviews)
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href={`/courses/${course.id}`} className="w-full">
          <Button className="w-full">View Course</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
