"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseForm } from "@/features/courses/components/course-form";
import { CourseGrid } from "@/features/courses/components/course-grid";

export default function CoursesPage() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>New course</CardTitle>
          <p className="text-sm text-muted-foreground">
            Capture the basics, assign a teacher and publish when ready.
          </p>
        </CardHeader>
        <CardContent>
          <CourseForm />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">All courses</h2>
          <p className="text-sm text-muted-foreground">
            Query parameters are forwarded to the API through TanStack Query.
          </p>
        </div>
        <CourseGrid />
      </section>
    </div>
  );
}
