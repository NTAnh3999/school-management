"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const questionPrompts = [
  {
    title: "Ask about the next lesson block",
    description:
      "Use Q&A to clarify what to study next when a course feels dense or unfamiliar.",
  },
  {
    title: "Review mentor answers",
    description:
      "Keep a lightweight record of guidance, explanations, and suggested follow-up reading.",
  },
  {
    title: "Share with family support",
    description:
      "Parent-facing summaries can turn course progress into simple next-step conversations at home.",
  },
];

export default function QaPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge className="bg-primary/10 text-primary">Q&amp;A</Badge>
        <h1 className="mt-3 text-3xl font-bold">Questions and mentor support</h1>
        <p className="mt-2 max-w-reading font-reading text-muted-foreground">
          This space is reserved for learner questions, mentor responses, and
          parent-friendly clarification around active courses.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {questionPrompts.map((item) => (
          <Card key={item.title} className="bg-white/85">
            <CardHeader>
              <CardTitle className="text-xl">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-[1.25rem] border border-white/80 bg-surface-low p-4">
                <p className="text-label-caps text-secondary">Coming next</p>
                <p className="mt-2 font-reading text-sm leading-6 text-muted-foreground">
                  A focused question flow can live here without turning the
                  workspace into a noisy discussion board.
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
