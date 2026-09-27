"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { useCourses } from "./_feature/hooks";
import { CourseCard } from "./_feature/components/course-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesPage() {
  const [keyword, setKeyword] = useState("");
  const { data, isLoading, error } = useCourses({
    keyword: keyword || undefined,
    page_size: 50,
  });
  const courses = data?.courses ?? [];

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
          Explore active learning pathways and continue at a steady pace.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search courses by name or code..."
          className="pl-10"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className="h-[300px]" />
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="flex h-96 flex-col items-center justify-center text-center">
          <p className="text-lg text-muted-foreground">No courses found</p>
          <p className="mt-2 max-w-reading font-reading text-sm text-muted-foreground">
            Try a broader search to find a better fit.
          </p>
        </div>
      )}
    </div>
  );
}
