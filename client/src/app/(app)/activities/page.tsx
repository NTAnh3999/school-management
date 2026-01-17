"use client";

import { ActivityBoard } from "@/features/activities/components/activity-board";
import { QuizPerformance } from "@/features/assessments/components/quiz-performance";

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <ActivityBoard />
      <QuizPerformance />
    </div>
  );
}
