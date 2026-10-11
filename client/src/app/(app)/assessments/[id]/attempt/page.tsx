"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, ChevronLeft } from "lucide-react";

import {
  useAssessment,
  useAssessmentAttempts,
  useStartAssessmentAttempt,
} from "../../_feature/hooks";
import {
  assessmentCourseName,
  assessmentTypeLabel,
  attemptsLeft,
  attemptsUsed,
  canStartAttempt,
  enrollmentFor,
  latestAttempt,
  maxAttempts,
} from "../../_feature/model";
import { AttemptRunner, type SubmittedSummary } from "../../_feature/components/attempt-runner";
import { useMyEnrollments } from "@/app/(app)/courses/_feature/hooks";
import { AccessNotice } from "@/components/edu/access-notice";
import { LoadError, buttonClass, surface } from "@/components/edu/ui";
import { apiErrorCode, isAccessError } from "@/lib/api-error";
import { deadlineVi, minutesVi, timeDateVi } from "@/lib/format-vi";
import { cn } from "@/lib/utils";
import type { AssessmentAttempt } from "@/types/models";

// STU-05 Assessment Attempt (design: Desktop - Student 7e; mobile 4a/4f for
// the start and submitted states). Focus mode — no app sidebar.

function FocusFrame({ children, back }: { children: React.ReactNode; back: string }) {
  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center border-b border-line bg-white px-3 sm:px-5">
        <Link href={back} className={cn(buttonClass("ghost", "sm"), "h-11")}>
          <ChevronLeft aria-hidden className="h-5 w-5" />
          Bài tập &amp; Kết quả
        </Link>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto w-full max-w-[640px]">{children}</div>
      </div>
    </div>
  );
}

export default function AssessmentAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const assessmentId = Number(id);

  const assessmentQuery = useAssessment(assessmentId);
  const { data: enrollments = [], isLoading: loadingEnrollments } = useMyEnrollments();
  const assessment = assessmentQuery.data;
  const enrollment = assessment ? enrollmentFor(assessment, enrollments) : undefined;
  const attemptsQuery = useAssessmentAttempts(assessmentId, enrollment?.id);
  const start = useStartAssessmentAttempt(assessmentId);
  const [activeAttempt, setActiveAttempt] = useState<AssessmentAttempt | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedSummary | null>(null);

  if (assessmentQuery.isLoading || loadingEnrollments || (enrollment && attemptsQuery.isLoading)) {
    return (
      <FocusFrame back="/assessments">
        <div role="status" aria-label="Đang tải bài kiểm tra" className={cn(surface, "h-80 motion-safe:animate-pulse")} />
      </FocusFrame>
    );
  }

  if (isAccessError(assessmentQuery.error) || (assessment && !enrollment)) {
    return (
      <AccessNotice
        title="Bạn chưa có quyền làm bài kiểm tra này"
        message="Bài kiểm tra có thể chưa được công bố, đã đóng hoặc không thuộc khoá học bạn đang học."
        ctaLabel="Về Bài tập & Kết quả"
        ctaHref="/assessments"
      />
    );
  }
  if (assessmentQuery.isError || !assessment || !enrollment) {
    return <LoadError title="Không tải được bài kiểm tra." onRetry={() => assessmentQuery.refetch()} />;
  }

  if (submitted) {
    return (
      <FocusFrame back="/assessments">
        <div className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col items-center gap-2.5 text-center">
            <span
              aria-hidden
              className="grid h-20 w-20 place-items-center rounded-full bg-success text-white shadow-[0_0_0_8px_hsl(var(--success-soft))]"
            >
              <Check className="h-[38px] w-[38px]" strokeWidth={3} />
            </span>
            <h1 className="mt-2.5 font-display text-2xl font-bold">Đã nộp bài!</h1>
            <p role="status" className="max-w-[320px] text-sm leading-normal text-ink-2">
              {submitted.timedOut
                ? "Hết giờ — bài làm đã được tự động nộp. Bạn sẽ nhận thông báo khi có kết quả."
                : "Bài làm đã được gửi an toàn. Bạn sẽ nhận thông báo khi có kết quả."}
            </p>
          </div>
          <dl className={cn(surface, "px-4 py-1 text-sm")}>
            {[
              ["Bài kiểm tra", assessment.title],
              ["Nộp lúc", timeDateVi(submitted.at)],
              ["Đã trả lời", `${submitted.answered} / ${submitted.total} câu`],
              ["Lượt làm", `Lần ${submitted.attemptNumber} / ${maxAttempts(assessment)}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-line py-3 last:border-0">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <Link href={`/assessments/${assessment.id}/result`} className={buttonClass("primary", "lg")}>
            Xem kết quả
          </Link>
          <Link href="/assessments" className={buttonClass("outline", "md")}>
            Về Bài tập &amp; Kết quả
          </Link>
        </div>
      </FocusFrame>
    );
  }

  if (activeAttempt) {
    return (
      <AttemptRunner
        key={activeAttempt.id}
        assessment={assessment}
        attempt={activeAttempt}
        onSubmitted={(summary) => {
          setActiveAttempt(null);
          setSubmitted(summary);
        }}
      />
    );
  }

  // Start / resume (mobile 4a "Bắt đầu — hướng dẫn").
  const attempts = attemptsQuery.data ?? [];
  const latest = latestAttempt(attempts);
  const resumable =
    latest?.status === "in_progress" && (!latest.expired_at || new Date(latest.expired_at) > new Date());
  const startable = canStartAttempt(assessment, attempts);
  const used = attemptsUsed(attempts);
  const questionCount = assessment.questions?.length ?? 0;
  const notOpenYet = assessment.open_at && new Date(assessment.open_at) > new Date();

  const handleStart = async () => {
    try {
      const attempt = await start.mutateAsync(enrollment.id);
      setActiveAttempt(attempt);
    } catch (error) {
      const code = apiErrorCode(error);
      toast.error(
        code === "ASM_ERR_MAX_ATTEMPT"
          ? "Bạn đã dùng hết lượt làm bài này."
          : code === "ASM_ERR_CLOSED" || code === "ASM_ERR_NOT_OPEN"
            ? "Bài kiểm tra hiện không mở."
            : "Không bắt đầu được bài làm. Vui lòng thử lại.",
      );
    }
  };

  const instructions = [
    assessment.time_limit_minutes
      ? "Đồng hồ bắt đầu khi bạn nhấn “Bắt đầu làm bài” và không dừng khi thoát ra."
      : null,
    "Câu trả lời được lưu trên thiết bị này mỗi khi bạn chọn hoặc gõ — hãy nộp bài trên cùng thiết bị.",
    `Dùng “Đánh dấu xem lại” cho câu muốn xem lại.${assessment.time_limit_minutes ? " Hết giờ, bài sẽ tự nộp." : ""}`,
  ].filter((item): item is string => !!item);

  return (
    <FocusFrame back="/assessments">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-semibold uppercase tracking-[.04em] text-muted-foreground">
            {[assessmentCourseName(assessment), assessmentTypeLabel[assessment.assessment_type]].filter(Boolean).join(" · ")}
          </div>
          <h1 className="text-balance text-2xl font-bold leading-tight">{assessment.title}</h1>
          {assessment.description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">{assessment.description}</p>
          ) : null}
        </div>

        <dl className={cn(surface, "grid grid-cols-2 overflow-hidden rounded-2xl")}>
          {[
            ["Thời gian làm", assessment.time_limit_minutes ? minutesVi(assessment.time_limit_minutes) : "Không giới hạn"],
            ["Số câu", `${questionCount} câu`],
            [
              "Lượt làm",
              attemptsLeft(assessment, attempts) || resumable
                ? `Lần ${resumable ? latest!.attempt_number : used + 1} / ${maxAttempts(assessment)}`
                : `Đã dùng hết ${maxAttempts(assessment)} lượt`,
            ],
            ["Hạn nộp", assessment.close_at ? deadlineVi(assessment.close_at) : "Không có hạn"],
          ].map(([label, value], index) => (
            <div
              key={label}
              className={cn("px-3.5 py-3", index % 2 === 0 && "border-r border-line", index < 2 && "border-b border-line")}
            >
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-base font-bold">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-3">
          <h2 className="text-[15px] font-bold">Hướng dẫn</h2>
          <ol className="grid gap-3">
            {instructions.map((text, index) => (
              <li key={text} className="flex gap-2.5 text-sm leading-normal text-ink-2">
                <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-ink">
                  {index + 1}
                </span>
                {text}
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-[14px] bg-muted px-3.5 py-3 text-[13px] leading-normal text-ink-2">
          Cần kết nối mạng ổn định khi bắt đầu và khi nộp bài. Nếu mất mạng giữa chừng, câu trả lời vẫn được giữ trên máy.
        </div>

        {resumable || startable ? (
          <button type="button" onClick={handleStart} disabled={start.isPending} className={buttonClass("primary", "lg")}>
            {start.isPending ? "Đang mở bài…" : resumable ? "Tiếp tục làm bài" : "Bắt đầu làm bài"}
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <span aria-disabled className={cn(buttonClass("outline", "lg"), "border-dashed bg-background text-muted-foreground")}>
              {notOpenYet && assessment.open_at
                ? `Mở lúc ${deadlineVi(assessment.open_at)}`
                : used >= maxAttempts(assessment)
                  ? "Đã dùng hết lượt làm bài"
                  : "Bài kiểm tra đã đóng"}
            </span>
            {latest ? (
              <Link href={`/assessments/${assessment.id}/result`} className={buttonClass("outline", "md")}>
                Xem kết quả bài làm
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </FocusFrame>
  );
}
