"use client";

import { useMyEnrollments } from "@/features/courses/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Award, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: enrollments, isLoading } = useMyEnrollments();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const activeEnrollments =
    enrollments?.filter((e: any) => e.status === "active") || [];
  const completedEnrollments =
    enrollments?.filter((e: any) => e.status === "completed") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's your learning progress
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEnrollments.length}</div>
            <p className="text-xs text-muted-foreground">Courses in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedEnrollments.length}
            </div>
            <p className="text-xs text-muted-foreground">Courses finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Enrolled
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {enrollments?.reduce(
                (acc: number, e: any) =>
                  acc + (e.progress?.total_time_spent_minutes || 0),
                0,
              ) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total minutes</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Continue Learning</h2>
          <Link href="/courses">
            <Button variant="outline">Browse All Courses</Button>
          </Link>
        </div>

        {activeEnrollments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeEnrollments.map((enrollment: any) => (
              <Card key={enrollment.id}>
                <CardHeader>
                  <CardTitle className="line-clamp-1">
                    {enrollment.course?.title || "Untitled Course"}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {enrollment.course?.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {enrollment.progress?.completion_percentage || 0}%
                      </span>
                    </div>
                    <Progress
                      value={enrollment.progress?.completion_percentage || 0}
                    />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {enrollment.progress?.total_time_spent_minutes || 0} minutes
                    spent
                  </div>

                  <Link href={`/courses/${enrollment.course_id}`}>
                    <Button className="w-full">Continue</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No active courses yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Start learning by enrolling in a course
              </p>
              <Link href="/courses">
                <Button>Browse Courses</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Courses */}
      {completedEnrollments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Completed Courses</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {completedEnrollments.map((enrollment: any) => (
              <Card
                key={enrollment.id}
                className="border-green-200 dark:border-green-800"
              >
                <CardHeader>
                  <Award className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-base line-clamp-2">
                    {enrollment.course?.title || "Untitled Course"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Completed on{" "}
                    {new Date(enrollment.completed_at).toLocaleDateString()}
                  </p>
                  <Link href={`/courses/${enrollment.course_id}`}>
                    <Button variant="outline" className="w-full mt-3">
                      View Course
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
