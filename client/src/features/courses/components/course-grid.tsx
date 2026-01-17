"use client";

import Link from "next/link";
import { BookOpen, CalendarRange } from "lucide-react";

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
import { mockCourses } from "@/data/mocks";

export function CourseGrid() {
  const { data, isLoading } = useCourses();
  const courses = data ?? mockCourses;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {courses.map((course) => (
        <Card key={course.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <Badge
                variant={course.status === "published" ? "default" : "secondary"}
              >
                {course.status}
              </Badge>
              <CardTitle className="mt-2 text-lg">{course.name}</CardTitle>
            </div>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            <CardDescription>{course.description}</CardDescription>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarRange className="h-4 w-4" />
              <span>
                {course.startDate} - {course.endDate}
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {course.modules.length} modules
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
