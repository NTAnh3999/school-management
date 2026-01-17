"use client";

import { QuizPerformance } from "@/features/assessments/components/quiz-performance";
import { EnrollmentTable } from "@/features/enrollments/components/enrollment-table";

export default function AssessmentsPage() {
  return (
    <div className="space-y-6">
      <QuizPerformance />
      <EnrollmentTable />
    </div>
  );
}
