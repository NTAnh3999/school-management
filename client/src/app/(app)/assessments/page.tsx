"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  ClipboardList,
  Clock,
  Hourglass,
  Lock,
  PenLine,
  SquareCheck,
} from "lucide-react";

import { useAssessments, useAttemptsForAssessments } from "./_feature/hooks";
import {
  assessmentCourseName,
  assessmentState,
  assessmentTypeLabel,
  enrollmentFor,
  latestAttempt,
  type AssessmentState,
} from "./_feature/model";
import { useMyEnrollments } from "@/app/(app)/courses/_feature/hooks";
import {
  EmptyState,
  FilterChip,
  IconTile,
  LoadError,
  PageSkeleton,
  Pill,
  surface,
  type Tone,
} from "@/components/edu/ui";
import { deadlineVi, minutesVi } from "@/lib/format-vi";
import { cn } from "@/lib/utils";

// "Bài tập & Kết quả" — student assessment list (GET /assessments) with each
// item's state derived from its attempt history.

const stateMeta: Record<
  AssessmentState,
  { label: string; tone: Tone; icon: typeof Check; order: number }
> = {
  in_progress: { label: "Đang làm", tone: "highlight", icon: PenLine, order: 0 },
  open: { label: "Cần làm", tone: "primary", icon: SquareCheck, order: 1 },
  upcoming: { label: "Sắp mở", tone: "secondary", icon: Clock, order: 2 },
  submitted: { label: "Chờ chấm", tone: "neutral", icon: Hourglass, order: 3 },
  graded: { label: "Đã chấm", tone: "success", icon: Check, order: 4 },
  closed: { label: "Đã đóng", tone: "neutral", icon: Lock, order: 5 },
};

type FilterKey = "todo" | "waiting" | "graded" | "all";

const FILTERS: Array<{ key: FilterKey; label: string; match: AssessmentState[] }> = [
  { key: "todo", label: "Cần làm", match: ["in_progress", "open", "upcoming"] },
  { key: "waiting", label: "Chờ chấm", match: ["submitted"] },
  { key: "graded", label: "Đã chấm", match: ["graded"] },
  { key: "all", label: "Tất cả", match: ["in_progress", "open", "upcoming", "submitted", "graded", "closed"] },
];

export default function AssessmentsPage() {
  const assessmentsQuery = useAssessments();
  const { data: enrollments = [] } = useMyEnrollments();
  const [filterChoice, setFilterChoice] = useState<FilterKey | null>(null);
  // Render-stable "now" for due-soon highlighting.
  const [now] = useState(() => Date.now());

  const rows = useMemo(
    () =>
      (assessmentsQuery.data ?? []).map((assessment) => ({
        assessment,
        enrollment: enrollmentFor(assessment, enrollments),
      })),
    [assessmentsQuery.data, enrollments],
  );
  const attemptQueries = useAttemptsForAssessments(
    rows.map((row) => ({ assessmentId: row.assessment.id, enrollmentId: row.enrollment?.id })),
  );

  const items = rows
    .map((row, index) => {
      const attempts = attemptQueries[index]?.data ?? [];
      return { ...row, attempts, state: assessmentState(row.assessment, attempts) };
    })
    .sort((a, b) => {
      const byState = stateMeta[a.state].order - stateMeta[b.state].order;
      if (byState) return byState;
      const due = (value?: string | null) => new Date(value ?? "9999-12-31").getTime();
      return due(a.assessment.close_at) - due(b.assessment.close_at);
    });

  const counts = Object.fromEntries(
    FILTERS.map((filter) => [filter.key, items.filter((item) => filter.match.includes(item.state)).length]),
  ) as Record<FilterKey, number>;
  const filterKey: FilterKey = filterChoice ?? (counts.todo ? "todo" : "all");
  const filter = FILTERS.find((item) => item.key === filterKey)!;
  const list = items.filter((item) => filter.match.includes(item.state));

  if (assessmentsQuery.isLoading) return <PageSkeleton label="Đang tải bài tập" />;
  if (assessmentsQuery.isError) {
    return <LoadError title="Không tải được bài tập." onRetry={() => assessmentsQuery.refetch()} />;
  }
  if (!items.length) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Chưa có bài tập hoặc bài kiểm tra nào."
        description="Bài kiểm tra giáo viên giao trong các khoá học của bạn sẽ xuất hiện ở đây."
        className={cn(surface, "mx-auto max-w-[640px]")}
      />
    );
  }

  return (
    <div className="mx-auto grid max-w-[960px] content-start gap-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <FilterChip
            key={item.key}
            active={item.key === filterKey}
            count={counts[item.key]}
            onClick={() => setFilterChoice(item.key)}
          >
            {item.label}
          </FilterChip>
        ))}
      </div>

      {list.length ? (
        <ul className={cn(surface, "overflow-hidden")}>
          {list.map(({ assessment, attempts, state }) => {
            const meta = stateMeta[state];
            const hasAttempt = !!latestAttempt(attempts);
            const href =
              state === "submitted" || state === "graded" || (state === "closed" && hasAttempt)
                ? `/assessments/${assessment.id}/result`
                : `/assessments/${assessment.id}/attempt`;
            const closeAt = assessment.close_at ? new Date(assessment.close_at) : null;
            const dueSoon =
              (state === "open" || state === "in_progress") &&
              closeAt &&
              closeAt.getTime() - now < 86400000;
            const details = [
              assessment.questions?.length ? `${assessment.questions.length} câu` : null,
              assessment.time_limit_minutes ? minutesVi(assessment.time_limit_minutes) : null,
            ].filter(Boolean);
            return (
              <li key={assessment.id} className="border-b border-line last:border-0">
                <Link href={href} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-background">
                  <IconTile icon={meta.icon} tone={meta.tone} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-muted-foreground">
                      {[assessmentCourseName(assessment), assessmentTypeLabel[assessment.assessment_type]]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <span className="block break-words text-[15px] font-semibold text-ink">{assessment.title}</span>
                    <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-2">
                      {details.length ? <span>{details.join(" · ")}</span> : null}
                      {state === "upcoming" && assessment.open_at ? (
                        <span>Mở lúc {deadlineVi(assessment.open_at)}</span>
                      ) : closeAt && state !== "graded" && state !== "closed" ? (
                        <span className={cn("inline-flex items-center gap-1", dueSoon && "font-semibold text-warning")}>
                          {dueSoon ? <Clock aria-hidden className="h-3.5 w-3.5" /> : null}
                          Hạn {deadlineVi(closeAt)}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <Pill tone={meta.tone}>{meta.label}</Pill>
                  <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={ClipboardList} tone="secondary" title={`Không có bài nào ở mục “${filter.label}”.`}>
          <button
            type="button"
            onClick={() => setFilterChoice("all")}
            className="text-[13px] font-semibold text-secondary hover:underline"
          >
            Xem tất cả
          </button>
        </EmptyState>
      )}
    </div>
  );
}
