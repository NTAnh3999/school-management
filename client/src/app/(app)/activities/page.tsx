"use client";

import { ActivityBoard } from "./_feature/components/activity-board";
import { QuizPerformance } from "@/app/(app)/assessments/_feature/components/quiz-performance";

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <ActivityBoard />
      <QuizPerformance />
    </div>
  );
}
