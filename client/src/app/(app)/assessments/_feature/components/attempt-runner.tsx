"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, ChevronLeft, ChevronRight, Flag, Timer, WifiOff } from "lucide-react";

import { useSubmitAssessmentAttempt } from "../hooks";
import { assessmentCourseName, maxAttempts, questionTypeLabel } from "../model";
import { buttonClass, ProgressBar } from "@/components/edu/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiErrorCode } from "@/lib/api-error";
import { deadlineVi, numberVi } from "@/lib/format-vi";
import { useOnlineStatus } from "@/lib/use-online-status";
import { cn } from "@/lib/utils";
import type {
  Assessment,
  AssessmentAnswerPayload,
  AssessmentAttempt,
  AssessmentQuestion,
} from "@/types/models";

// STU-05 Assessment Attempt, in-progress state (design: Desktop - Student,
// 7e). The API only receives answers on submit, so answers are kept on this
// device (localStorage) after every change and restored on reload.

type Answer = { optionId?: number; optionIds?: number[]; text?: string };
type Answers = Record<number, Answer>;
type Draft = { answers: Answers; flags: number[]; savedAt?: string };

export type SubmittedSummary = {
  at: Date;
  answered: number;
  total: number;
  attemptNumber: number;
  timedOut: boolean;
};

const storageKey = (attemptId: number) => `assessment-attempt:${attemptId}`;

function loadDraft(attemptId: number): Draft {
  if (typeof window === "undefined") return { answers: {}, flags: [] };
  try {
    const raw = window.localStorage.getItem(storageKey(attemptId));
    if (raw) return JSON.parse(raw) as Draft;
  } catch {
    // Storage unavailable (private mode, blocked) — start empty.
  }
  return { answers: {}, flags: [] };
}

function saveDraft(attemptId: number, draft: Draft) {
  try {
    window.localStorage.setItem(storageKey(attemptId), JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

function clearDraft(attemptId: number) {
  try {
    window.localStorage.removeItem(storageKey(attemptId));
  } catch {
    // ignore
  }
}

export function isAnswered(question: AssessmentQuestion, answer?: Answer) {
  if (!answer) return false;
  switch (question.question_type) {
    case "single_choice":
      return answer.optionId != null;
    case "multiple_choice":
      return !!answer.optionIds?.length;
    case "text":
    case "essay":
      return !!answer.text?.trim();
    default:
      return false;
  }
}

function toPayload(questions: AssessmentQuestion[], answers: Answers): AssessmentAnswerPayload[] {
  return questions.map((question) => {
    const answer = answers[question.id] ?? {};
    if (question.question_type === "single_choice") {
      return { questionId: question.id, selectedOptionId: answer.optionId };
    }
    if (question.question_type === "multiple_choice") {
      return { questionId: question.id, selectedOptionIds: answer.optionIds ?? [] };
    }
    return { questionId: question.id, textAnswer: answer.text?.trim() || undefined };
  });
}

function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

function Navigator({
  questions,
  answers,
  flags,
  index,
  onGo,
}: {
  questions: AssessmentQuestion[];
  answers: Answers;
  flags: Set<number>;
  index: number;
  onGo: (index: number) => void;
}) {
  const answeredCount = questions.filter((q) => isAnswered(q, answers[q.id])).length;
  return (
    <div className="flex flex-col gap-4">
      <div className="text-[15px] font-bold">Danh sách câu hỏi</div>
      <ol className="grid grid-cols-5 gap-2.5">
        {questions.map((question, i) => {
          const answered = isAnswered(question, answers[question.id]);
          const flagged = flags.has(question.id);
          const current = i === index;
          return (
            <li key={question.id}>
              <button
                type="button"
                onClick={() => onGo(i)}
                aria-current={current ? "step" : undefined}
                aria-label={`Câu ${i + 1}: ${answered ? "đã trả lời" : "chưa trả lời"}${flagged ? ", đã đánh dấu" : ""}${current ? ", đang xem" : ""}`}
                className={cn(
                  "relative grid h-12 w-full place-items-center rounded-xl text-sm font-bold tabular-nums transition-colors",
                  answered
                    ? "bg-primary text-primary-foreground hover:bg-primary-strong"
                    : "border-[1.5px] border-dashed border-muted-foreground bg-white text-ink hover:bg-accent",
                  current && "outline outline-[3px] outline-offset-2 outline-ink",
                )}
              >
                {i + 1}
                {flagged ? (
                  <span
                    aria-hidden
                    className="absolute -right-[7px] -top-[7px] grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-highlight-strong text-white"
                  >
                    <Flag className="h-2.5 w-2.5 fill-current" strokeWidth={2} />
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="grid grid-cols-2 gap-2 text-xs text-ink-2">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-4 w-4 rounded-[5px] bg-primary" />
          Đã làm ({answeredCount})
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-4 w-4 rounded-[5px] border-[1.5px] border-dashed border-muted-foreground" />
          Chưa làm ({questions.length - answeredCount})
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="grid h-4 w-4 place-items-center rounded-full bg-highlight-strong text-white">
            <Flag className="h-2 w-2 fill-current" strokeWidth={2} />
          </span>
          Đánh dấu ({flags.size})
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-4 w-4 rounded-[5px] outline outline-2 outline-offset-1 outline-ink" />
          Đang xem
        </span>
      </div>
    </div>
  );
}

export function AttemptRunner({
  assessment,
  attempt,
  onSubmitted,
}: {
  assessment: Assessment;
  attempt: AssessmentAttempt;
  onSubmitted: (summary: SubmittedSummary) => void;
}) {
  const questions = assessment.questions ?? [];
  const submit = useSubmitAssessmentAttempt(assessment.id);
  const online = useOnlineStatus();

  const [draft] = useState(() => loadDraft(attempt.id));
  const [answers, setAnswers] = useState<Answers>(draft.answers);
  const [flags, setFlags] = useState<Set<number>>(() => new Set(draft.flags));
  const [savedAt, setSavedAt] = useState<Date | null>(draft.savedAt ? new Date(draft.savedAt) : null);
  const [savedLocally, setSavedLocally] = useState(true);
  const [index, setIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const answersRef = useRef(answers);
  const flagsRef = useRef(flags);
  const submittingRef = useRef(false);

  const expiresAt = attempt.expired_at ? new Date(attempt.expired_at).getTime() : null;
  const remaining = expiresAt ? expiresAt - now : null;
  const lowTime = remaining !== null && remaining < 5 * 60 * 1000;
  const question = questions[index];
  const answeredCount = questions.filter((q) => isAnswered(q, answers[q.id])).length;
  const unanswered = questions
    .map((q, i) => (isAnswered(q, answers[q.id]) ? null : i + 1))
    .filter((n): n is number => n !== null);

  const persist = (nextAnswers: Answers, nextFlags: Set<number>) => {
    const at = new Date();
    setSavedLocally(saveDraft(attempt.id, { answers: nextAnswers, flags: [...nextFlags], savedAt: at.toISOString() }));
    setSavedAt(at);
  };

  const setAnswer = (questionId: number, answer: Answer) => {
    const next = { ...answersRef.current, [questionId]: answer };
    answersRef.current = next;
    setAnswers(next);
    persist(next, flagsRef.current);
  };

  const toggleFlag = (questionId: number) => {
    const next = new Set(flagsRef.current);
    if (next.has(questionId)) next.delete(questionId);
    else next.add(questionId);
    flagsRef.current = next;
    setFlags(next);
    persist(answersRef.current, next);
  };

  const doSubmit = async (timedOut: boolean) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError(null);
    try {
      await submit.mutateAsync({ attemptId: attempt.id, answers: toPayload(questions, answersRef.current) });
      clearDraft(attempt.id);
      onSubmitted({
        at: new Date(),
        answered: questions.filter((q) => isAnswered(q, answersRef.current[q.id])).length,
        total: questions.length,
        attemptNumber: attempt.attempt_number,
        timedOut,
      });
    } catch (error) {
      submittingRef.current = false;
      const code = apiErrorCode(error);
      setSubmitError(
        code === "ASM_ERR_ATTEMPT_EXPIRED"
          ? "Đã hết thời gian làm bài nên hệ thống không nhận bài nộp này. Câu trả lời vẫn được giữ trên máy — hãy báo giáo viên."
          : code === "ASM_ERR_DUPLICATE_SUBMISSION"
            ? "Bài này đã được nộp trước đó."
            : "Chưa nộp được bài. Kiểm tra kết nối mạng rồi thử lại — câu trả lời vẫn được giữ trên máy.",
      );
      setConfirmOpen(true);
    }
  };

  const doSubmitRef = useRef(doSubmit);
  useEffect(() => {
    doSubmitRef.current = doSubmit;
  });

  // Countdown; submits automatically when time runs out.
  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= expiresAt) {
        window.clearInterval(timer);
        void doSubmitRef.current(true);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  if (!question) {
    return (
      <div className="grid h-dvh place-items-center p-6 text-center text-sm text-ink-2">
        Bài kiểm tra chưa có câu hỏi. Hãy báo giáo viên.
      </div>
    );
  }

  const answer = answers[question.id] ?? {};
  const flagged = flags.has(question.id);
  const isChoice = question.question_type === "single_choice" || question.question_type === "multiple_choice";
  const savedText = savedAt
    ? `Đã lưu trên máy ${savedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
    : "Câu trả lời được lưu trên máy";

  const navigator = (
    <Navigator questions={questions} answers={answers} flags={flags} index={index} onGo={setIndex} />
  );

  return (
    <div className="flex h-dvh flex-col bg-white">
      <header className="flex min-h-[72px] shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-2 sm:px-6">
        <Link href="/assessments" className={cn(buttonClass("outline", "sm"), "h-11")}>
          Lưu &amp; thoát
        </Link>
        <div className="min-w-0 flex-1 leading-snug">
          <div className="truncate text-xs text-muted-foreground">
            {[
              assessmentCourseName(assessment),
              `Lần ${attempt.attempt_number} / ${maxAttempts(assessment)}`,
              assessment.close_at ? `Hạn ${deadlineVi(assessment.close_at)}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
          <h1 className="truncate text-base font-bold">{assessment.title}</h1>
        </div>
        <div className="hidden w-[220px] flex-col gap-1 md:flex">
          <div className="flex justify-between gap-2 text-xs">
            <b className="tabular-nums">
              {answeredCount}/{questions.length} đã làm
            </b>
            <span role="status" className={cn("truncate font-semibold", savedLocally ? "text-success-strong" : "text-warning")}>
              {savedLocally ? savedText : "Không lưu được trên máy"}
            </span>
          </div>
          <ProgressBar pct={(answeredCount / questions.length) * 100} />
        </div>
        <div
          role="timer"
          aria-label={
            remaining === null
              ? "Không giới hạn thời gian"
              : `${lowTime ? "Sắp hết giờ, còn" : "Còn"} ${Math.ceil(remaining / 60000)} phút`
          }
          className={cn(
            "flex h-10 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-[15px] font-bold tabular-nums",
            lowTime ? "border-warning bg-warning-soft text-warning" : "border-line",
          )}
        >
          <Timer aria-hidden className="h-4 w-4" strokeWidth={2} />
          {remaining === null ? (
            <span className="text-[13px]">Không giới hạn</span>
          ) : (
            <>
              <span aria-hidden>{formatClock(remaining)}</span>
              <span aria-hidden className={cn("text-[11px]", lowTime ? "font-semibold" : "font-medium text-muted-foreground")}>
                {lowTime ? "sắp hết giờ" : "còn lại"}
              </span>
            </>
          )}
        </div>
      </header>

      {!online ? (
        <div role="status" className="flex items-start gap-2.5 bg-ink px-6 py-3 text-white">
          <WifiOff aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-[13px] leading-normal">
            <b>Mất kết nối — đang thử kết nối lại.</b> Câu trả lời của bạn không bị mất: chúng được giữ trên máy. Bạn cứ tiếp tục làm bài và nộp khi có mạng.
          </div>
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-y-auto px-4 py-8 sm:px-10 lg:px-14 lg:py-9">
          <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
            {lowTime ? (
              <div className="flex items-start gap-2.5 rounded-[14px] bg-warning-soft px-3.5 py-3 text-[13px] leading-normal">
                <Timer aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <span>
                  <b>Còn khoảng {Math.max(1, Math.ceil((remaining ?? 0) / 60000))} phút.</b> Bạn đã làm {answeredCount}/
                  {questions.length} câu. Hết giờ, bài sẽ tự nộp.
                </span>
              </div>
            ) : null}

            <div className="flex justify-between gap-3">
              <b className="text-sm tabular-nums">
                Câu {index + 1} / {questions.length}
              </b>
              <span className="text-[13px] text-muted-foreground">
                {questionTypeLabel[question.question_type]} · {numberVi(Number(question.points || 0))} điểm
              </span>
            </div>
            <h2 id={`q-${question.id}`} className="whitespace-pre-line text-xl font-semibold leading-normal">
              {question.question_text}
            </h2>

            {isChoice ? (
              <fieldset aria-labelledby={`q-${question.id}`} className="grid gap-3 sm:grid-cols-2">
                {question.question_type === "multiple_choice" ? (
                  <legend className="sr-only">Chọn một hoặc nhiều đáp án</legend>
                ) : null}
                {(question.options ?? []).map((option, i) => {
                  const multiple = question.question_type === "multiple_choice";
                  const checked = multiple
                    ? !!answer.optionIds?.includes(option.id)
                    : answer.optionId === option.id;
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        "flex min-h-[60px] cursor-pointer items-center gap-3 rounded-[14px] px-4 py-2.5 text-base transition-colors",
                        "has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                        checked ? "border-2 border-primary bg-primary-soft" : "border-[1.5px] border-line hover:bg-background",
                      )}
                    >
                      <input
                        type={multiple ? "checkbox" : "radio"}
                        name={`question-${question.id}`}
                        className="sr-only"
                        checked={checked}
                        onChange={() => {
                          if (multiple) {
                            const current = new Set(answer.optionIds ?? []);
                            if (current.has(option.id)) current.delete(option.id);
                            else current.add(option.id);
                            setAnswer(question.id, { optionIds: [...current] });
                          } else {
                            setAnswer(question.id, { optionId: option.id });
                          }
                        }}
                      />
                      <span
                        aria-hidden
                        className={cn(
                          "grid h-[34px] w-[34px] shrink-0 place-items-center text-[13px] font-bold",
                          multiple ? "rounded-lg" : "rounded-full",
                          checked ? "bg-primary text-primary-foreground" : "border-[1.5px] border-line text-ink",
                        )}
                      >
                        {checked && multiple ? <Check className="h-4 w-4" strokeWidth={3} /> : String.fromCharCode(65 + i)}
                      </span>
                      <span className="min-w-0 break-words">{option.option_text}</span>
                    </label>
                  );
                })}
              </fieldset>
            ) : question.question_type === "file_upload" ? (
              <div className="rounded-[14px] bg-background px-4 py-3 text-sm text-ink-2">
                Câu hỏi nộp tệp chưa được hỗ trợ trên ứng dụng. Hãy liên hệ giáo viên để nộp phần này.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`answer-${question.id}`} className="sr-only">
                  Câu trả lời
                </label>
                <textarea
                  id={`answer-${question.id}`}
                  value={answer.text ?? ""}
                  onChange={(event) => setAnswer(question.id, { text: event.target.value })}
                  placeholder="Nhập câu trả lời của bạn…"
                  className={cn(
                    "w-full resize-y rounded-[14px] border-[1.5px] border-line p-3.5 text-[15px] leading-normal text-ink placeholder:text-muted-foreground focus:border-primary",
                    question.question_type === "essay" ? "min-h-[180px]" : "min-h-[96px]",
                  )}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                aria-pressed={flagged}
                onClick={() => toggleFlag(question.id)}
                className={cn(
                  buttonClass("outline", "sm"),
                  "h-11",
                  flagged && "border-highlight-strong bg-highlight-soft hover:bg-highlight-soft",
                )}
              >
                <Flag aria-hidden className={cn("h-4 w-4", flagged && "fill-current text-highlight-strong")} />
                {flagged ? "Đã đánh dấu xem lại" : "Đánh dấu xem lại"}
              </button>
              <div className="flex-1" />
              <button
                type="button"
                disabled={index === 0}
                onClick={() => setIndex((value) => Math.max(0, value - 1))}
                className={buttonClass("outline", "md")}
              >
                <ChevronLeft aria-hidden className="h-[18px] w-[18px]" />
                Câu trước
              </button>
              {index < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))}
                  className={buttonClass("dark", "md")}
                >
                  Câu tiếp
                  <ChevronRight aria-hidden className="h-[18px] w-[18px]" />
                </button>
              ) : (
                <button type="button" onClick={() => setConfirmOpen(true)} className={buttonClass("primary", "md")}>
                  Nộp bài
                </button>
              )}
            </div>

            <div className="border-t border-line pt-6 lg:hidden">{navigator}</div>
          </div>
        </div>

        <aside aria-label="Danh sách câu hỏi" className="hidden flex-col gap-4 overflow-y-auto border-l border-line bg-background p-6 lg:flex">
          {navigator}
          <div className="flex-1" />
          <div className="text-xs leading-normal text-muted-foreground">
            Bấm “Nộp bài” sẽ mở hộp xác nhận, nêu số câu chưa trả lời trước khi nộp.
          </div>
          <button type="button" onClick={() => setConfirmOpen(true)} className={buttonClass("primary", "lg")}>
            Nộp bài
          </button>
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(open) => !submit.isPending && setConfirmOpen(open)}>
        <DialogContent className="max-w-md gap-4 rounded-3xl border-line bg-white p-6">
          <DialogTitle className="text-xl font-bold">Nộp bài kiểm tra?</DialogTitle>
          {unanswered.length ? (
            <div className="flex items-start gap-2.5 rounded-[14px] bg-warning-soft px-3.5 py-3">
              <AlertCircle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div className="text-sm leading-normal">
                <b>Bạn còn {unanswered.length} câu chưa trả lời.</b>
                <br />
                Câu {unanswered.slice(0, 12).join(", ")}
                {unanswered.length > 12 ? "…" : ""}
              </div>
            </div>
          ) : null}
          <DialogDescription className="text-sm leading-normal text-ink-2">
            Sau khi nộp, bạn không thể sửa câu trả lời.
          </DialogDescription>
          {submitError ? (
            <div role="alert" className="rounded-[14px] bg-danger-soft px-3.5 py-3 text-sm leading-normal text-danger">
              {submitError}
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2.5">
            {/* First focusable = the safe choice (design: focus defaults to "Xem lại bài"). */}
            <button
              type="button"
              disabled={submit.isPending}
              onClick={() => setConfirmOpen(false)}
              className={buttonClass("outline", "lg")}
            >
              Xem lại bài
            </button>
            <button
              type="button"
              disabled={submit.isPending || !online}
              onClick={() => void doSubmit(false)}
              className={buttonClass("primary", "lg")}
            >
              {submit.isPending ? "Đang nộp…" : "Nộp bài"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
