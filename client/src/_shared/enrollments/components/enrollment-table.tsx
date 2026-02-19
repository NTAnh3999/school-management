"use client";

import { Users } from "lucide-react";
import { useMyEnrollments } from "@/app/(app)/courses/_feature/hooks";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export function EnrollmentTable() {
  const { data: enrollments, isLoading } = useMyEnrollments();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Enrollment health</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : enrollments && enrollments.length > 0 ? (
          <Table>
            <TableCaption>
              Enrollment syncs automatically against the API.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment: any) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    {enrollment.student?.fullName || "Student"}
                  </TableCell>
                  <TableCell>{enrollment.course?.title || "Course"}</TableCell>
                  <TableCell className="capitalize">
                    {enrollment.status}
                  </TableCell>
                  <TableCell className="space-y-1">
                    <Progress
                      value={enrollment.progress?.completion_percentage || 0}
                    />
                    <span className="text-xs text-muted-foreground">
                      {enrollment.progress?.completion_percentage || 0}%
                      complete
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No enrollments found
          </p>
        )}
      </CardContent>
    </Card>
  );
}
