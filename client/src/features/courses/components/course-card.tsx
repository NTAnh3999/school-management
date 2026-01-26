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
import { BookOpen, Clock, DollarSign } from "lucide-react";
import Link from "next/link";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const levelColors = {
    beginner:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    intermediate:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  const statusColors = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    published: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    archived:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{course.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-2">
              {course.description}
            </CardDescription>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Badge className={levelColors[course.level]}>{course.level}</Badge>
          <Badge className={statusColors[course.status]}>{course.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>${course.price}</span>
          </div>
          {course.sections && course.sections.length > 0 && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{course.sections.length} sections</span>
            </div>
          )}
        </div>
        {course.instructor && (
          <div className="mt-3 text-sm text-muted-foreground">
            by {course.instructor.fullName}
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
