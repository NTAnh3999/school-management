"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { useCourses } from "./_feature/hooks";
import { CourseCard } from "./_feature/components/course-card";
import type { Course } from "@/types/models";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesPage() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");
  const { data: courses = [], isLoading, error } = useCourses();

  const visibleCourses = useMemo(() => {
    return (courses as Course[]).filter((course) => {
      if (course.status !== "published") {
        return false;
      }

      if (level !== "all" && course.level !== level) {
        return false;
      }

      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) {
        return true;
      }

      return (
        course.title.toLowerCase().includes(normalizedQuery) ||
        course.description.toLowerCase().includes(normalizedQuery) ||
        course.instructor?.fullName?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [courses, level, query]);

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">Failed to load courses</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Courses</h1>
        <p className="mt-1 font-reading text-muted-foreground">
          Explore published learning pathways and continue at a steady pace.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses, topics, or mentors..."
              className="pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className="h-[300px]" />
          ))}
        </div>
      ) : visibleCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="flex h-96 flex-col items-center justify-center text-center">
          <p className="text-lg text-muted-foreground">No courses found</p>
          <p className="mt-2 max-w-reading font-reading text-sm text-muted-foreground">
            Try a broader search or another level filter to find a better fit.
          </p>
        </div>
      )}
    </div>
  );
}
