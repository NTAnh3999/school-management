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
import { BookOpen, DollarSign } from "lucide-react";
import Link from "next/link";

interface CourseCardProps {
  course: Course;
}

const getLevelVariant = (level: string) => {
  switch (level) {
    case "beginner":
      return "default";
    case "intermediate":
      return "secondary";
    case "advanced":
      return "destructive";
    default:
      return "default";
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "published":
      return "default";
    case "draft":
      return "secondary";
    case "archived":
      return "outline";
    default:
      return "secondary";
  }
};

export function CourseCard({ course }: CourseCardProps) {

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
          <Badge variant={getLevelVariant(course.level)}>{course.level}</Badge>
          <Badge variant={getStatusVariant(course.status)}>{course.status}</Badge>
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
