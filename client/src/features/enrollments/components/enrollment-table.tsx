"use client";

import { Users } from "lucide-react";

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
import { mockEnrollments, mockCourses } from "@/data/mocks";

export function EnrollmentTable() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Enrollment health</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>Enrollment syncs automatically against the API.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockEnrollments.map((enrollment) => {
              const course = mockCourses.find((c) => c.id === enrollment.courseId);
              return (
                <TableRow key={enrollment.id}>
                  <TableCell>Student {enrollment.userId}</TableCell>
                  <TableCell>{course?.name}</TableCell>
                  <TableCell className="capitalize">{enrollment.status}</TableCell>
                  <TableCell className="space-y-1">
                    <Progress value={enrollment.progress} />
                    <span className="text-xs text-muted-foreground">
                      {enrollment.progress}% complete
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
