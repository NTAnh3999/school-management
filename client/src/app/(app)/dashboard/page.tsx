"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CourseGrid } from "@/features/courses/components/course-grid";
import { ActivityBoard } from "@/features/activities/components/activity-board";
import { ModuleRoadmap } from "@/features/modules/components/module-roadmap";
import { QuizPerformance } from "@/features/assessments/components/quiz-performance";
import { EnrollmentTable } from "@/features/enrollments/components/enrollment-table";
import { mockCourses, mockEnrollments } from "@/data/mocks";

const stats = [
  {
    label: "Active courses",
    value: mockCourses.length,
    helper: "Across all categories",
  },
  {
    label: "Enrollments",
    value: mockEnrollments.length,
    helper: "Students in-progress this term",
  },
  {
    label: "Assignments due",
    value: 6,
    helper: "Next 7 days",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className="text-3xl font-semibold">{stat.value}</div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stat.helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Course catalog</h2>
            <p className="text-sm text-muted-foreground">
              Manage inventory, owners and schedules.
            </p>
          </div>
        </div>
        <CourseGrid />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ActivityBoard />
        <ModuleRoadmap />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <QuizPerformance />
        <EnrollmentTable />
      </section>
    </div>
  );
}
