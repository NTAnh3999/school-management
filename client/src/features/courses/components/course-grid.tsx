"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { useCourses } from "../hooks";

export function CourseGrid() {
  const { data: courses, isLoading } = useCourses();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No courses available
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {courses.map((course: any) => (
        <Card key={course.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <Badge
                variant={course.status === "published" ? "default" : "secondary"}
              >
                {course.status}
              </Badge>
              <CardTitle className="mt-2 text-lg">{course.title}</CardTitle>
            </div>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            <CardDescription>{course.description}</CardDescription>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">${course.price}</span>
              <span>•</span>
              <span className="capitalize">{course.level}</span>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {course.sections?.length || 0} sections
            </span>
            <Button variant="ghost" asChild>
              <Link href={`/courses/${course.id}`}>Open</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
