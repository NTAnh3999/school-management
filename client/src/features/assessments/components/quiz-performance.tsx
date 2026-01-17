"use client";

import { Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { mockActivities } from "@/data/mocks";

const sampleAttempts = [
  { quizId: "activity-1", student: "D. Carter", score: 84 },
  { quizId: "activity-1", student: "B. Holmes", score: 72 },
  { quizId: "activity-1", student: "M. Patel", score: 96 },
];

export function QuizPerformance() {
  const quiz = mockActivities.find((activity) => activity.type === "quiz");
  const average =
    sampleAttempts.reduce((total, attempt) => total + attempt.score, 0) /
    sampleAttempts.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Quiz insights</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Track performance, attempts and grading backlog.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">
            {quiz?.title ?? "Linear Functions Quiz"}
          </p>
          <p className="text-xs text-muted-foreground">
            {sampleAttempts.length} recent attempts
          </p>
          <Progress value={average} className="mt-2" />
          <p className="mt-1 text-sm text-muted-foreground">
            Avg score {average.toFixed(0)}%
          </p>
        </div>
        <div className="space-y-2">
          {sampleAttempts.map((attempt) => (
            <div
              key={attempt.student}
              className="flex items-center justify-between text-sm"
            >
              <span>{attempt.student}</span>
              <span className="font-mono">{attempt.score}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
