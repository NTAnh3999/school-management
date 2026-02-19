"use client";

import { Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function QuizPerformance() {
  // TODO: Implement quiz attempts API integration
  const attempts: any[] = [];
  const average = attempts.length > 0
    ? attempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / attempts.length
    : 0;

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
        {attempts.length > 0 ? (
          <>
            <div>
              <p className="text-sm font-medium">Recent Quiz Attempts</p>
              <p className="text-xs text-muted-foreground">
                {attempts.length} attempts
              </p>
              <Progress value={average} className="mt-2" />
              <p className="mt-1 text-sm text-muted-foreground">
                Avg score {average.toFixed(0)}%
              </p>
            </div>
            <div className="space-y-2">
              {attempts.slice(0, 5).map((attempt: any) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{attempt.enrollment?.student?.fullName || "Student"}</span>
                  <span className="font-mono">{attempt.score || 0}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No quiz attempts yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
