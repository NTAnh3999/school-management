"use client";

import { QuizPerformance } from "./_feature/components/quiz-performance";
import { EnrollmentTable } from "@/_shared/enrollments/components/enrollment-table";

export default function AssessmentsPage() {
  return (
    <div className="space-y-6">
      <QuizPerformance />
      <EnrollmentTable />
    </div>
  );
}
