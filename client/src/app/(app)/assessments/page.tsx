"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Lock,
  RotateCcw,
} from "lucide-react";

import { mockAssessments, type MockAssessment } from "./_feature/mock-assessments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusMeta(status: MockAssessment["status"]) {
  if (status === "open") {
    return {
      label: "Open",
      className: "border-primary/15 bg-primary/10 text-primary",
      icon: ClipboardCheck,
    };
  }

  if (status === "released") {
    return {
      label: "Released",
      className: "border-secondary/15 bg-secondary/10 text-secondary",
      icon: CheckCircle2,
    };
  }

  if (status === "submitted") {
    return {
      label: "Submitted",
      className: "border-tertiary/20 bg-tertiary/10 text-tertiary",
      icon: Clock3,
    };
  }

  return {
    label: "Scheduled",
    className: "border-outline-variant bg-surface-container-low text-on-surface-variant",
    icon: Lock,
  };
}

function getAssessmentProgress(assessment: MockAssessment) {
  if (assessment.status === "released") return 100;
  if (assessment.status === "submitted") return 72;
  if (assessment.status === "open") return 24;
  return 0;
}

function AssessmentRow({ assessment }: { assessment: MockAssessment }) {
  const statusMeta = getStatusMeta(assessment.status);
  const StatusIcon = statusMeta.icon;
  const progress = getAssessmentProgress(assessment);
  const isOpen = assessment.status === "open";

  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-white/85 p-4 shadow-[0_4px_18px_rgba(0,91,191,0.04)]">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("w-fit", statusMeta.className)}>
              <StatusIcon className="mr-2 h-3.5 w-3.5" />
              {statusMeta.label}
            </Badge>
            <Badge className="w-fit border-outline-variant bg-surface-container-low text-on-surface-variant">
              {assessment.gradingMethod}
            </Badge>
            {assessment.attemptNumber > 0 && (
              <Badge className="w-fit border-secondary/15 bg-secondary/10 text-secondary">
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                Attempt {assessment.attemptNumber}/{assessment.attemptLimit}
              </Badge>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-on-surface">{assessment.title}</h2>
            <p className="mt-1 text-sm leading-6 text-on-surface-variant">
              {assessment.courseTitle} / {assessment.lessonTitle}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-container-low px-3 py-2">
              <p className="text-xs font-semibold text-on-surface-variant">Questions</p>
              <p className="mt-1 text-sm font-bold text-on-surface">
                {assessment.questions.length}
              </p>
            </div>
            <div className="rounded-xl bg-surface-container-low px-3 py-2">
              <p className="text-xs font-semibold text-on-surface-variant">Time</p>
              <p className="mt-1 text-sm font-bold text-on-surface">
                {assessment.durationMinutes} min
              </p>
            </div>
            <div className="rounded-xl bg-surface-container-low px-3 py-2">
              <p className="text-xs font-semibold text-on-surface-variant">Due</p>
              <p className="mt-1 text-sm font-bold text-on-surface">
                {formatDateTime(assessment.dueAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl bg-surface-container-low px-3 py-3">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-on-surface-variant">
              <span>Readiness</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {isOpen ? (
            <Button asChild className="w-full">
              <Link href={`/assessments/${assessment.id}/attempt`}>
                Start attempt
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button disabled variant="outline" className="w-full">
              {assessment.status === "scheduled" ? "Not open yet" : "View later"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AssessmentsPage() {
  const openCount = mockAssessments.filter((assessment) => assessment.status === "open").length;
  const releasedCount = mockAssessments.filter(
    (assessment) => assessment.status === "released",
  ).length;
  const pendingCount = mockAssessments.length - openCount - releasedCount;

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-3xl border border-white/70 bg-white/85 px-6 py-6 shadow-[0_4px_18px_rgba(0,91,191,0.05)]">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="space-y-3">
            <Badge className="w-fit border-primary/15 bg-primary/10 text-primary">
              <ClipboardCheck className="mr-2 h-3.5 w-3.5" />
              Assessment workspace
            </Badge>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
                My assessments
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
                Open checks, submitted work, and released results in one focused queue.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-primary/10 px-4 py-3 text-primary">
              <p className="text-xs font-semibold">Open</p>
              <p className="mt-1 text-2xl font-bold">{openCount}</p>
            </div>
            <div className="rounded-2xl bg-secondary/10 px-4 py-3 text-secondary">
              <p className="text-xs font-semibold">Released</p>
              <p className="mt-1 text-2xl font-bold">{releasedCount}</p>
            </div>
            <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-on-surface-variant">
              <p className="text-xs font-semibold">Pending</p>
              <p className="mt-1 text-2xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {mockAssessments.map((assessment) => (
            <AssessmentRow key={assessment.id} assessment={assessment} />
          ))}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card className="border-white/80 bg-white/90 shadow-[0_4px_18px_rgba(0,91,191,0.04)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CalendarClock className="h-5 w-5 text-primary" />
                Next deadline
              </CardTitle>
              <CardDescription>{formatDateTime(mockAssessments[0].dueAt)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <p className="text-sm font-semibold text-on-surface">
                  {mockAssessments[0].title}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {mockAssessments[0].durationMinutes} minutes / {mockAssessments[0].maxScore} pts
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href={`/assessments/${mockAssessments[0].id}/attempt`}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-outline-variant/40 bg-white/80 p-4 text-sm leading-6 text-on-surface-variant">
            Results are only shown after release. Hybrid or manual assessments stay in a pending
            state until grading is finished.
          </div>
        </aside>
      </div>
    </div>
  );
}
