"use client";

import { use, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, ClipboardList, Hourglass, RotateCcw, X } from "lucide-react";

import {
  useAssessment,
  useAssessmentAttempts,
  useAssessmentResults,
} from "../../_feature/hooks";
import {
  assessmentCourseId,
  assessmentCourseName,
  attemptsLeft,
  canStartAttempt,
  enrollmentFor,
  feedbackText,
  isPassed,
  latestAttempt,
  maxAttempts,
} from "../../_feature/model";
import { useMyEnrollments } from "@/app/(app)/courses/_feature/hooks";
import { AccessNotice } from "@/components/edu/access-notice";
import {
  EmptyState,
  LoadError,
  PageSkeleton,
  buttonClass,
  surface,
} from "@/components/edu/ui";
import { usePageHeader } from "@/components/layout/page-header";
import { apiErrorCode, isAccessError } from "@/lib/api-error";
import { deadlineVi, numberVi, timeDateVi } from "@/lib/format-vi";
import { cn } from "@/lib/utils";
import type { AssessmentAttemptAnswer } from "@/types/models";

// STU-06 Assessment Result (design: Desktop - Student 7f; mobile 4g–4j for
// pending / released states). Scores come only from GET /results, which the
// API restricts to published grades.

const REVIEW_PREVIEW = 8;

function AnswerRow({ number, answer, points }: { number: number; answer?: AssessmentAttemptAnswer; points: number }) {
  const correct = answer?.is_correct;
  const awarded = answer?.awarded_points != null ? Number(answer.awarded_points) : null;
  const state = correct === true ? "right" : correct === false ? "wrong" : "pending";
  const meta = {
    right: { icon: Check, box: "bg-success-soft text-success-strong", label: "Đúng", text: "text-success-strong" },
    wrong: { icon: X, box: "bg-danger-soft text-danger", label: "Chưa đúng", text: "text-danger" },
    pending: {
      icon: Hourglass,
      box: "bg-muted text-ink-2",
      label: answer ? "Giáo viên chấm" : "Không trả lời",
      text: "text-ink-2",
    },
  }[state];
  const Icon = meta.icon;
  return (
    <li className="flex items-center gap-2.5 border-t border-line px-4 py-3 sm:[&:nth-child(even)]:border-l">
      <span aria-hidden className={cn("grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full", meta.box)}>
        <Icon className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <span className="flex-1 text-sm">Câu {number}</span>
      <span className={cn("text-xs font-bold", meta.text)}>
        {meta.label}
        {awarded !== null && state !== "pending" ? (
          <span className="font-normal text-muted-foreground">
            {" "}
            · {numberVi(awarded)}/{numberVi(points)}
          </span>
        ) : null}
      </span>
    </li>
  );
}

export default function AssessmentResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const assessmentId = Number(id);
  usePageHeader(undefined, [
    { label: "Bài tập & Kết quả", href: "/assessments" },
    { label: "Kết quả bài làm" },
  ]);

  const assessmentQuery = useAssessment(assessmentId);
  const { data: enrollments = [], isLoading: loadingEnrollments } = useMyEnrollments();
  const assessment = assessmentQuery.data;
  const enrollment = assessment ? enrollmentFor(assessment, enrollments) : undefined;
  const attemptsQuery = useAssessmentAttempts(assessmentId, enrollment?.id);
  const attempts = attemptsQuery.data ?? [];
  const hasSubmission = attempts.some((attempt) =>
    ["submitted", "graded", "published"].includes(attempt.status),
  );
  const resultsQuery = useAssessmentResults(assessmentId, hasSubmission);
  const [showAll, setShowAll] = useState(false);

  if (assessmentQuery.isLoading || loadingEnrollments || attemptsQuery.isLoading || (hasSubmission && resultsQuery.isLoading)) {
    return <PageSkeleton label="Đang tải kết quả" />;
  }
  if (isAccessError(assessmentQuery.error) || (assessment && !enrollment)) {
    return (
      <AccessNotice
        title="Bạn chưa có quyền xem kết quả này"
        message="Bài kiểm tra có thể không còn thuộc khoá học bạn đang học."
        ctaLabel="Về Bài tập & Kết quả"
        ctaHref="/assessments"
      />
    );
  }
  if (assessmentQuery.isError || !assessment) {
    return <LoadError title="Không tải được kết quả." onRetry={() => assessmentQuery.refetch()} />;
  }

  const courseId = assessmentCourseId(assessment);
  const courseHref = courseId ? `/courses/${courseId}` : "/courses";
  const latest = latestAttempt(attempts);
  const notPublished =
    resultsQuery.isError && apiErrorCode(resultsQuery.error) === "ASM_ERR_RESULT_NOT_PUBLISHED";
  const result = [...(resultsQuery.data ?? [])].sort((a, b) => b.attempt_number - a.attempt_number)[0];
  const left = attemptsLeft(assessment, attempts);
  const retake = canStartAttempt(assessment, attempts) && left > 0;
  const subtitle = [assessmentCourseName(assessment), assessment.title].filter(Boolean).join(" · ");

  if (!latest) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Bạn chưa làm bài này."
        description={subtitle}
        className={cn(surface, "mx-auto max-w-[640px]")}
      >
        <Link href={`/assessments/${assessment.id}/attempt`} className={buttonClass("primary", "md")}>
          Làm bài
        </Link>
      </EmptyState>
    );
  }

  const sideActions = (
    <div className="grid content-start gap-3">
      {retake ? (
        <>
          <Link
            href={`/assessments/${assessment.id}/attempt`}
            className={buttonClass(result && isPassed(result.percentage_score, assessment) ? "outline" : "primary", "lg")}
          >
            <RotateCcw aria-hidden className="h-[18px] w-[18px]" />
            Làm lại · còn {left} lượt
          </Link>
          {assessment.close_at ? (
            <div className="-mt-1 text-center text-xs text-muted-foreground">
              Làm lại trước {deadlineVi(assessment.close_at)}
            </div>
          ) : null}
        </>
      ) : null}
      <Link href={courseHref} className={buttonClass("outline", "md")}>
        Về khoá học
      </Link>
      {!retake && result ? (
        <div className="text-center text-xs text-muted-foreground">
          {left === 0 ? "Đã dùng hết lượt làm bài này." : "Bài kiểm tra đã đóng."}
        </div>
      ) : null}
    </div>
  );

  // Not released yet (submitted & waiting, or graded but unpublished).
  if (!result) {
    const waitingForTeacher = latest.status === "submitted";
    return (
      <div className="grid content-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid content-start gap-4">
          <section className="flex flex-col items-center gap-2.5 rounded-[20px] border-[1.5px] border-dashed border-[#D9D1C5] bg-white px-5 py-7 text-center">
            <div className="text-xs text-muted-foreground">{subtitle}</div>
            <span aria-hidden className="mt-1 grid h-16 w-16 place-items-center rounded-full bg-muted text-ink-2">
              <Hourglass className="h-[30px] w-[30px]" strokeWidth={1.75} />
            </span>
            <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-line bg-background px-3 text-[13px] font-bold text-ink-2">
              {waitingForTeacher ? "Đang chờ chấm" : "Chưa công bố kết quả"}
            </span>
            <h1 className="text-[17px] font-bold leading-snug">
              {waitingForTeacher
                ? "Bài làm của bạn đang chờ giáo viên chấm."
                : "Kết quả chưa được công bố."}
            </h1>
            <p className="max-w-[360px] text-[13px] leading-relaxed text-ink-2">
              {assessment.result_publish_at
                ? `Điểm và nhận xét sẽ có sau ${deadlineVi(assessment.result_publish_at)}.`
                : "Điểm sẽ hiện ở đây khi giáo viên công bố — bạn cũng sẽ nhận thông báo."}
            </p>
          </section>
          <dl className={cn(surface, "px-4 py-1 text-sm")}>
            {[
              ["Nộp lúc", latest.submitted_at ? timeDateVi(latest.submitted_at) : "—"],
              ["Lượt làm", `Lần ${latest.attempt_number} / ${maxAttempts(assessment)}`],
              ["Điểm", "Chưa có"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-line py-3 last:border-0">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className={cn("text-right font-semibold", value === "Chưa có" && "text-muted-foreground")}>{value}</dd>
              </div>
            ))}
          </dl>
          {resultsQuery.isError && !notPublished ? (
            <LoadError title="Không tải được kết quả." onRetry={() => resultsQuery.refetch()} />
          ) : null}
        </div>
        {sideActions}
      </div>
    );
  }

  const percentage = result.percentage_score ?? 0;
  const passed = isPassed(result.percentage_score, assessment);
  const threshold = Number(assessment.passing_score ?? 0);
  const maxScore = result.max_score ?? Number(assessment.max_score ?? 0);
  const neededPoints =
    !passed && maxScore && result.raw_score !== null
      ? Math.max(0, (threshold / 100) * maxScore - result.raw_score)
      : 0;
  const reviewAttempt = attempts.find((attempt) => attempt.id === result.attempt_id);
  const answersById = new Map((reviewAttempt?.answers ?? []).map((answer) => [answer.question_id, answer]));
  const questions = assessment.questions ?? [];
  const correctCount = questions.filter((q) => answersById.get(q.id)?.is_correct === true).length;
  const hasAutoGrading = questions.some((q) => answersById.get(q.id)?.is_correct != null);
  const visibleQuestions = showAll ? questions : questions.slice(0, REVIEW_PREVIEW);
  const feedback = feedbackText(result.feedback);

  return (
    <div className="grid content-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid content-start gap-4">
        <section className={cn(surface, "grid items-center gap-7 rounded-[20px] p-6 md:grid-cols-[auto_1fr]")}>
          <div>
            <div className="text-xs text-muted-foreground">{subtitle}</div>
            <h1 className="sr-only">Kết quả: {assessment.title}</h1>
            <div className="mt-1.5 flex items-end gap-2.5">
              <div className="text-[56px] font-bold leading-none tabular-nums">
                {result.raw_score !== null ? numberVi(result.raw_score) : "—"}
              </div>
              <div className="pb-2 text-base text-muted-foreground">
                / {numberVi(maxScore)} · {numberVi(percentage)}%
              </div>
            </div>
            {passed === null ? null : passed ? (
              <span className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-full bg-success px-3 text-sm font-bold text-white">
                <Check aria-hidden className="h-4 w-4" strokeWidth={3} />
                Đạt
              </span>
            ) : (
              <span className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-full border-[1.5px] border-warning bg-warning-soft px-3 text-sm font-bold text-warning">
                <AlertCircle aria-hidden className="h-4 w-4" strokeWidth={2.5} />
                Chưa đạt
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3.5">
            {threshold ? (
              <div>
                <div
                  role="img"
                  aria-label={`Đạt ${numberVi(percentage)} phần trăm, ngưỡng đạt ${threshold} phần trăm`}
                  className="relative h-2.5 rounded-full bg-background"
                >
                  <div
                    className={cn("h-full rounded-full", passed ? "bg-success" : "bg-warning")}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                  <span aria-hidden className="absolute -top-1 h-[18px] w-0.5 bg-ink" style={{ left: `${threshold}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                  <span>0</span>
                  <b className="text-ink-2">
                    Ngưỡng đạt {threshold}%{neededPoints > 0 ? ` · cần thêm ${numberVi(neededPoints)} điểm` : ""}
                  </b>
                  <span>100%</span>
                </div>
              </div>
            ) : null}
            <dl className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>
                <dt>Lượt làm</dt>
                <dd className="text-[15px] font-bold text-ink">
                  {result.attempt_number} / {maxAttempts(assessment)}
                </dd>
              </div>
              {hasAutoGrading ? (
                <div>
                  <dt>Đúng</dt>
                  <dd className="text-[15px] font-bold text-ink">
                    {correctCount}/{questions.length} câu
                  </dd>
                </div>
              ) : null}
              {result.submitted_at ? (
                <div>
                  <dt>Nộp</dt>
                  <dd className="text-[15px] font-bold text-ink">{timeDateVi(result.submitted_at)}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>

        {feedback ? (
          <section className={cn(surface, "flex flex-col gap-2 p-[18px]")}>
            <h2 className="text-[15px] font-bold">Nhận xét</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed">{feedback}</p>
          </section>
        ) : null}

        {questions.length ? (
          <section className={cn(surface, "overflow-hidden")}>
            <div className="flex items-baseline justify-between px-[18px] pb-2.5 pt-4">
              <h2 className="text-[15px] font-bold">Xem lại câu trả lời</h2>
              <span className="text-xs text-muted-foreground">{questions.length} câu</span>
            </div>
            <ul id="answer-review" className="grid sm:grid-cols-2">
              {visibleQuestions.map((question) => (
                <AnswerRow
                  key={question.id}
                  number={questions.indexOf(question) + 1}
                  answer={answersById.get(question.id)}
                  points={Number(question.points || 0)}
                />
              ))}
            </ul>
            {questions.length > REVIEW_PREVIEW ? (
              <button
                type="button"
                aria-expanded={showAll}
                aria-controls="answer-review"
                onClick={() => setShowAll((value) => !value)}
                className="block w-full border-t border-line px-[18px] py-3 text-left text-[13px] font-semibold text-secondary hover:underline"
              >
                {showAll ? "Thu gọn" : `Xem tất cả ${questions.length} câu`}
              </button>
            ) : null}
          </section>
        ) : null}
      </div>
      {sideActions}
    </div>
  );
}
