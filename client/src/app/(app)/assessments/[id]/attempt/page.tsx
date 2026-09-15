"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Flag,
  Save,
  Send,
} from "lucide-react";

import {
  getMockAssessment,
  type MockAssessmentQuestion,
} from "../../_feature/mock-assessments";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type AnswerValue = string | string[];
type AnswerMap = Record<string, AnswerValue>;

function formatRemaining(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function isAnswered(question: MockAssessmentQuestion, value: AnswerValue | undefined) {
  if (question.type === "multiple_choice") {
    return Array.isArray(value) && value.length > 0;
  }

  return typeof value === "string" && value.trim().length > 0;
}

function calculateAutoScore(questions: MockAssessmentQuestion[], answers: AnswerMap) {
  return questions.reduce((total, question) => {
    if (!question.correctOptionIds) return total;

    const value = answers[question.id];
    const selectedIds = Array.isArray(value) ? value : value ? [value] : [];
    const correctIds = [...question.correctOptionIds].sort();
    const normalizedSelectedIds = [...selectedIds].sort();
    const isCorrect = JSON.stringify(correctIds) === JSON.stringify(normalizedSelectedIds);

    return isCorrect ? total + question.points : total;
  }, 0);
}

function QuestionBlock({
  question,
  index,
  value,
  flagged,
  disabled,
  onChange,
  onToggleFlag,
}: {
  question: MockAssessmentQuestion;
  index: number;
  value: AnswerValue | undefined;
  flagged: boolean;
  disabled: boolean;
  onChange: (value: AnswerValue) => void;
  onToggleFlag: () => void;
}) {
  const answered = isAnswered(question, value);

  return (
    <section className="rounded-2xl border border-outline-variant/40 bg-white/90 p-5 shadow-[0_4px_18px_rgba(0,91,191,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-primary/15 bg-primary/10 text-primary">
              Question {index + 1}
            </Badge>
            <Badge className="border-outline-variant bg-surface-container-low text-on-surface-variant">
              {question.points} pts
            </Badge>
            {answered && (
              <Badge className="border-secondary/15 bg-secondary/10 text-secondary">
                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                Answered
              </Badge>
            )}
          </div>
          <h2 className="text-lg font-semibold leading-7 text-on-surface">{question.prompt}</h2>
        </div>

        <Button
          type="button"
          variant={flagged ? "secondary" : "outline"}
          size="sm"
          onClick={onToggleFlag}
          disabled={disabled}
        >
          <Flag className="mr-2 h-4 w-4" />
          {flagged ? "Flagged" : "Flag"}
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        {question.type === "single_choice" &&
          question.options?.map((option) => {
            const selected = value === option.id;

            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(option.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-on-surface"
                    : "border-outline-variant/50 bg-surface-container-low text-on-surface-variant hover:border-primary/30 hover:bg-white",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-primary bg-primary" : "border-outline-variant bg-white",
                  )}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                <span>{option.text}</span>
              </button>
            );
          })}

        {question.type === "multiple_choice" &&
          question.options?.map((option) => {
            const selectedIds = Array.isArray(value) ? value : [];
            const selected = selectedIds.includes(option.id);

            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  const next = selected
                    ? selectedIds.filter((id) => id !== option.id)
                    : [...selectedIds, option.id];
                  onChange(next);
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-on-surface"
                    : "border-outline-variant/50 bg-surface-container-low text-on-surface-variant hover:border-primary/30 hover:bg-white",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border",
                    selected ? "border-primary bg-primary" : "border-outline-variant bg-white",
                  )}
                >
                  {selected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                </span>
                <span>{option.text}</span>
              </button>
            );
          })}

        {question.type === "short_answer" && (
          <Textarea
            value={typeof value === "string" ? value : ""}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Type your answer here"
            className="min-h-28 resize-y bg-white"
          />
        )}

        {question.type === "essay" && (
          <Textarea
            value={typeof value === "string" ? value : ""}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Write your response here"
            className="min-h-44 resize-y bg-white"
          />
        )}
      </div>
    </section>
  );
}

export default function AssessmentAttemptPage({ params }: { params: { id: string } }) {
  const assessment = getMockAssessment(params.id);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [submitted, setSubmitted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    () => (assessment?.durationMinutes ?? 0) * 60,
  );

  const manualReviewRequired = assessment?.questions.some(
    (question) => !question.correctOptionIds,
  );
  const answeredCount = useMemo(() => {
    if (!assessment) return 0;
    return assessment.questions.filter((question) => isAnswered(question, answers[question.id]))
      .length;
  }, [answers, assessment]);
  const progress = assessment ? Math.round((answeredCount / assessment.questions.length) * 100) : 0;
  const autoScore = assessment ? calculateAutoScore(assessment.questions, answers) : 0;
  const timeWarning = remainingSeconds <= 300;

  useEffect(() => {
    if (!assessment || submitted) return undefined;

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setSubmitted(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [assessment, submitted]);

  useEffect(() => {
    if (!assessment || submitted || saveState !== "saving") return undefined;

    const saveTimer = window.setTimeout(() => setSaveState("saved"), 500);
    return () => window.clearTimeout(saveTimer);
  }, [answers, assessment, saveState, submitted]);

  if (!assessment) {
    return (
      <div className="space-y-4 pb-8">
        <Button asChild variant="ghost" className="w-fit px-0 hover:bg-transparent">
          <Link href="/assessments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Assessments
          </Link>
        </Button>
        <section className="rounded-3xl border border-white/70 bg-white/90 px-6 py-6 shadow-[0_4px_18px_rgba(0,91,191,0.05)]">
          <h1 className="text-2xl font-bold text-on-surface">Assessment not found</h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            This mock assessment is not available in the current queue.
          </p>
        </section>
      </div>
    );
  }

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setSaveState("saving");
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedIds((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId],
    );
  };

  const handleSubmit = () => {
    const unanswered = assessment.questions.length - answeredCount;
    const confirmed =
      unanswered === 0 ||
      window.confirm(`You still have ${unanswered} unanswered question(s). Submit now?`);

    if (confirmed) {
      setSubmitted(true);
      setSaveState("saved");
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" className="w-fit px-0 hover:bg-transparent">
          <Link href="/assessments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Assessments
          </Link>
        </Button>

        <div
          className={cn(
            "flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold",
            timeWarning
              ? "border-destructive/15 bg-destructive/10 text-destructive"
              : "border-primary/15 bg-primary/10 text-primary",
          )}
        >
          <Clock3 className="h-4 w-4" />
          {formatRemaining(remainingSeconds)}
        </div>
      </div>

      <section className="rounded-3xl border border-white/70 bg-white/90 px-6 py-6 shadow-[0_4px_18px_rgba(0,91,191,0.05)]">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-primary/15 bg-primary/10 text-primary">
                Attempt {Math.max(assessment.attemptNumber, 1)}/{assessment.attemptLimit}
              </Badge>
              <Badge className="border-outline-variant bg-surface-container-low text-on-surface-variant">
                {assessment.gradingMethod}
              </Badge>
              <Badge className="border-secondary/15 bg-secondary/10 text-secondary">
                {saveState === "saving" ? (
                  <Save className="mr-2 h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                )}
                {saveState === "saving" ? "Saving" : "Saved"}
              </Badge>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-on-surface">
                {assessment.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
                {assessment.courseTitle} / {assessment.lessonTitle}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-container-low px-4 py-4">
            <div className="mb-2 flex items-center justify-between text-sm font-semibold text-on-surface-variant">
              <span>{answeredCount} answered</span>
              <span>{assessment.questions.length - answeredCount} left</span>
            </div>
            <Progress value={progress} />
            <p className="mt-2 text-xs font-semibold text-on-surface-variant">
              {flaggedIds.length} flagged for review
            </p>
          </div>
        </div>
      </section>

      {submitted && (
        <div className="rounded-2xl border border-secondary/15 bg-secondary/10 p-5 text-secondary">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Submission received</p>
              <p className="mt-1 text-sm leading-6">
                {manualReviewRequired
                  ? "This assessment is waiting for grading before results are released."
                  : `Auto score: ${autoScore}/${assessment.maxScore}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {!submitted && timeWarning && (
        <div className="rounded-2xl border border-destructive/15 bg-destructive/10 p-4 text-destructive">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-semibold">Five minutes or less remain.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          {assessment.questions.map((question, index) => (
            <QuestionBlock
              key={question.id}
              question={question}
              index={index}
              value={answers[question.id]}
              flagged={flaggedIds.includes(question.id)}
              disabled={submitted}
              onChange={(value) => handleAnswerChange(question.id, value)}
              onToggleFlag={() => handleToggleFlag(question.id)}
            />
          ))}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card className="border-white/80 bg-white/90 shadow-[0_4px_18px_rgba(0,91,191,0.04)]">
            <CardHeader>
              <CardTitle className="text-xl">Review</CardTitle>
              <CardDescription>
                {assessment.questions.length} questions / {assessment.maxScore} pts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {assessment.questions.map((question, index) => {
                  const answered = isAnswered(question, answers[question.id]);
                  const flagged = flaggedIds.includes(question.id);

                  return (
                    <div
                      key={question.id}
                      className={cn(
                        "flex h-10 items-center justify-center rounded-xl border text-sm font-bold",
                        answered
                          ? "border-secondary/20 bg-secondary/10 text-secondary"
                          : "border-outline-variant bg-surface-container-low text-on-surface-variant",
                        flagged && "border-tertiary bg-tertiary/10 text-tertiary",
                      )}
                    >
                      {index + 1}
                    </div>
                  );
                })}
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={handleSubmit}
                disabled={submitted}
              >
                <Send className="mr-2 h-4 w-4" />
                Submit
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
