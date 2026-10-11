"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ListTree,
  Play,
  RotateCw,
  WifiOff,
  X,
} from "lucide-react";

import { usePublishedContentStructure } from "../../../_feature/content-versions/hooks";
import { useLearningItems } from "../../../_feature/learning-items/hooks";
import { useMyEnrollments } from "../../../_feature/hooks";
import { LearningItemContent } from "../../../_feature/components/learning-item-content";
import {
  currentLessonId,
  flattenLessons,
  lessonMinutes,
  lessonState,
  lessonStatuses,
  sortedModules,
  type FlatLesson,
  type LessonState,
} from "../../../_feature/curriculum";
import { useEnrollmentProgress, useUpdateProgress } from "@/_shared/progress/hooks";
import { AccessNotice } from "@/components/edu/access-notice";
import { ProgressBar, buttonClass, surface } from "@/components/edu/ui";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { minutesVi } from "@/lib/format-vi";
import { useOnlineStatus } from "@/lib/use-online-status";
import { cn } from "@/lib/utils";
import type { CourseModule, LessonProgressStatus } from "@/types/models";

// STU-04 Learning Player (design: Desktop - Student, 7d) — focus mode: the
// app sidebar is hidden (see AppShell) and the course outline stays docked.

type SaveState = "idle" | "saving" | "saved" | "error";

const iconStyle: Record<LessonState, string> = {
  done: "bg-success text-white",
  current: "bg-primary text-white",
  todo: "border-2 border-line bg-white",
};

function Outline({
  modules,
  statuses,
  currentId,
  activeLessonId,
  courseId,
  pct,
  onNavigate,
}: {
  modules: CourseModule[];
  statuses: Map<number, LessonProgressStatus>;
  currentId?: number;
  activeLessonId: number;
  courseId: number;
  pct: number;
  onNavigate?: () => void;
}) {
  const activeModuleId = modules.find((m) => m.lessons?.some((l) => l.id === activeLessonId))?.id;
  const [open, setOpen] = useState<Set<number>>(() => new Set(activeModuleId ? [activeModuleId] : []));
  const toggle = (moduleId: number) =>
    setOpen((previous) => {
      const next = new Set(previous);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });

  return (
    <div className="flex flex-col gap-2.5 px-3.5 py-[18px]">
      <div className="flex flex-col gap-1.5 px-1.5">
        <div className="text-sm font-bold">Nội dung khoá học</div>
        <div className="flex items-center gap-2">
          <ProgressBar pct={pct} className="bg-secondary" />
          <span className="text-xs font-bold tabular-nums">{pct}%</span>
        </div>
      </div>
      {modules.map((courseModule, index) => {
        const lessons = courseModule.lessons ?? [];
        const done = lessons.filter((lesson) => statuses.get(lesson.id) === "completed").length;
        const isOpen = open.has(courseModule.id);
        return (
          <div key={courseModule.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(courseModule.id)}
              className="flex w-full items-center gap-2 rounded-lg px-1.5 pb-1 pt-2 text-left text-[11px] font-bold uppercase tracking-[.06em] text-muted-foreground hover:text-ink"
            >
              <span className="min-w-0 flex-1">
                Chương {index + 1} · {courseModule.title}
                <span className="ml-1 font-semibold normal-case tracking-normal">
                  ({done}/{lessons.length})
                </span>
              </span>
              <ChevronDown aria-hidden className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen ? (
              <ul className="mt-1 grid gap-1">
                {lessons.map((lesson) => {
                  const state = lessonState(lesson.id, statuses, currentId);
                  const active = lesson.id === activeLessonId;
                  const minutes = lessonMinutes(lesson);
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={`/courses/${courseId}/lessons/${lesson.id}`}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-start gap-2.5 rounded-xl p-2.5 transition-colors",
                          active ? "bg-primary-soft" : "hover:bg-background",
                        )}
                      >
                        <span aria-hidden className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full", iconStyle[state])}>
                          {state === "done" ? (
                            <Check className="h-3 w-3" strokeWidth={3} />
                          ) : state === "current" ? (
                            <Play className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block break-words text-[13px] font-semibold text-ink">{lesson.title}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {[
                              minutes ? minutesVi(minutes) : null,
                              state === "done" ? "Đã hoàn thành" : state === "current" ? "Đang học" : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function NeighbourLink({ target, direction, courseId }: { target?: FlatLesson; direction: "prev" | "next"; courseId: number }) {
  if (!target) return <span />;
  const prev = direction === "prev";
  return (
    <Link
      href={`/courses/${courseId}/lessons/${target.lesson.id}`}
      aria-label={`${prev ? "Bài trước" : "Bài tiếp theo"}: ${target.lesson.title}`}
      className={cn(buttonClass("outline", "md"), "min-w-0 max-w-[260px] px-3.5")}
    >
      {prev ? <ChevronLeft aria-hidden className="h-[18px] w-[18px] shrink-0" /> : null}
      <span className="truncate">
        <span className="sm:hidden">{prev ? "Trước" : "Tiếp"}</span>
        <span className="hidden sm:inline">
          {prev ? "Trước" : "Tiếp"}: {target.lesson.title}
        </span>
      </span>
      {prev ? null : <ChevronRight aria-hidden className="h-[18px] w-[18px] shrink-0" />}
    </Link>
  );
}

export default function LessonPlayerPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId: lessonIdParam } = use(params);
  const courseId = Number(id);
  const lessonId = Number(lessonIdParam);
  const online = useOnlineStatus();

  const structureQuery = usePublishedContentStructure(courseId);
  const itemsQuery = useLearningItems(lessonId);
  const { data: enrollments = [], isLoading: loadingEnrollments } = useMyEnrollments();
  const enrollment = enrollments.find(
    (item) => item.course_id === courseId && (item.status === "active" || item.status === "completed"),
  );
  const progressQuery = useEnrollmentProgress(enrollment?.id ?? 0);
  const { mutate: saveProgress, mutateAsync: saveProgressAsync, isPending } = useUpdateProgress();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [stateLessonId, setStateLessonId] = useState(lessonId);
  const openedAt = useRef(0);

  // Next.js keeps this component mounted across lessons; reset per lesson.
  if (stateLessonId !== lessonId) {
    setStateLessonId(lessonId);
    setSaveState("idle");
    setSavedAt(null);
  }
  const startedFor = useRef<number | null>(null);

  const modules = useMemo(() => sortedModules(structureQuery.data?.structure), [structureQuery.data]);
  const flat = useMemo(() => flattenLessons(modules), [modules]);
  const statuses = useMemo(() => lessonStatuses(enrollment, progressQuery.data), [enrollment, progressQuery.data]);
  const currentId = currentLessonId(flat, statuses);
  const index = flat.findIndex(({ lesson }) => lesson.id === lessonId);
  const current = index >= 0 ? flat[index] : undefined;
  const previous = index > 0 ? flat[index - 1] : undefined;
  const next = index >= 0 && index < flat.length - 1 ? flat[index + 1] : undefined;
  const isCompleted = statuses.get(lessonId) === "completed";
  const canTrack = enrollment?.status === "active";
  const coursePct = Math.round(enrollment?.progress?.completion_percentage ?? 0);
  const items = useMemo(
    () => [...(itemsQuery.data ?? [])].sort((a, b) => a.display_order - b.display_order),
    [itemsQuery.data],
  );

  // Record that the lesson was opened. Waits for lesson_progress so a
  // completed lesson is never downgraded (POST /progress/update overwrites
  // the status).
  useEffect(() => {
    if (!canTrack || !enrollment || !current || !progressQuery.isSuccess) return;
    if (startedFor.current === lessonId) return;
    startedFor.current = lessonId;
    openedAt.current = Date.now();
    if (statuses.get(lessonId) === "completed") return;
    saveProgress({ enrollment_id: enrollment.id, lesson_id: lessonId, status: "in_progress", time_spent_minutes: 0 });
  }, [canTrack, enrollment, current, progressQuery.isSuccess, lessonId, statuses, saveProgress]);

  const handleComplete = async () => {
    if (!enrollment) return;
    setSaveState("saving");
    try {
      await saveProgressAsync({
        enrollment_id: enrollment.id,
        lesson_id: lessonId,
        status: "completed",
        time_spent_minutes: openedAt.current ? Math.round((Date.now() - openedAt.current) / 60000) : 0,
      });
      setSaveState("saved");
      setSavedAt(new Date());
    } catch {
      setSaveState("error");
    }
  };

  if (structureQuery.isLoading || loadingEnrollments) {
    return (
      <div role="status" aria-label="Đang tải bài học" className="flex h-dvh flex-col motion-safe:animate-pulse">
        <div className="h-16 border-b border-line bg-white" />
        <div className="grid flex-1 lg:grid-cols-[320px_1fr]">
          <div className="hidden border-r border-line bg-white lg:block" />
          <div className="mx-auto w-full max-w-[860px] p-8">
            <div className="h-8 w-1/2 rounded-lg bg-line" />
            <div className={cn(surface, "mt-6 h-64")} />
          </div>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <AccessNotice
        title="Bạn chưa ghi danh khoá học này"
        message="Ghi danh khoá học để xem và học các bài học."
        ctaLabel="Xem khoá học"
        ctaHref={`/courses/${courseId}`}
      />
    );
  }
  if (structureQuery.isError || !current) {
    return (
      <AccessNotice
        title={structureQuery.isError ? "Khoá học chưa có nội dung được công bố" : "Bài học này không còn khả dụng"}
        message={
          structureQuery.isError
            ? "Nội dung sẽ xuất hiện khi giáo viên hoàn tất và công bố khoá học."
            : "Bài học có thể đã được cập nhật trong phiên bản mới của khoá học. Tiến độ các bài khác không bị ảnh hưởng."
        }
        ctaLabel="Về khoá học"
        ctaHref={`/courses/${courseId}`}
      />
    );
  }

  const courseName = enrollment.course?.course_name ?? "";
  const minutes = lessonMinutes(current.lesson);
  const done = isCompleted || saveState === "saved";

  const outline = (
    <Outline
      key={current.module.id}
      modules={modules}
      statuses={statuses}
      currentId={currentId}
      activeLessonId={lessonId}
      courseId={courseId}
      pct={coursePct}
      onNavigate={() => setOutlineOpen(false)}
    />
  );

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2.5 border-b border-line bg-white px-3 sm:gap-3 sm:px-5">
        <Link href={`/courses/${courseId}`} className={cn(buttonClass("outline", "sm"), "h-11 shrink-0")}>
          <X aria-hidden className="h-[18px] w-[18px]" />
          Thoát
        </Link>
        <button
          type="button"
          onClick={() => setOutlineOpen(true)}
          className={cn(buttonClass("outline", "sm"), "h-11 shrink-0 lg:hidden")}
        >
          <ListTree aria-hidden className="h-[18px] w-[18px]" />
          <span className="sr-only sm:not-sr-only">Nội dung</span>
        </button>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-xs text-muted-foreground">
            {courseName} · {current.module.title}
          </div>
          <h1 className="truncate text-[15px] font-bold">{current.lesson.title}</h1>
        </div>
        <span role="status" className="shrink-0">
          {saveState === "saving" || isPending ? (
            <span className="flex h-[30px] items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-bold text-ink-2">
              Đang lưu…
            </span>
          ) : saveState === "error" ? (
            <span className="flex h-[30px] items-center gap-1.5 rounded-full bg-warning-soft px-3 text-xs font-bold text-warning">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-warning" />
              Chưa đồng bộ
            </span>
          ) : savedAt ? (
            <span className="flex h-[30px] items-center gap-1.5 rounded-full bg-success-soft px-3 text-xs font-bold text-success-strong">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
              Đã lưu {savedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : null}
        </span>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <nav aria-label="Nội dung khoá học" className="hidden overflow-y-auto border-r border-line bg-white lg:block">
          {outline}
        </nav>

        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
            <article className="mx-auto grid w-full max-w-[860px] gap-6">
              {!online ? (
                <div role="status" className="flex items-start gap-2.5 rounded-[14px] bg-ink px-3.5 py-3 text-white">
                  <WifiOff aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="text-[13px] leading-normal">
                    <b>Mất kết nối — đang kết nối lại…</b>
                    <br />
                    Nội dung đã tải vẫn xem được. Hãy đánh dấu hoàn thành khi có mạng trở lại.
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <h2 className="text-[22px] font-bold leading-snug">{current.lesson.title}</h2>
                <div className="text-[13px] text-muted-foreground">
                  {[`Chương ${current.moduleIndex + 1} · ${current.module.title}`, minutes ? minutesVi(minutes) : null]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                {current.lesson.objective ? (
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{current.lesson.objective}</p>
                ) : null}
              </div>

              {itemsQuery.isLoading ? (
                <div className={cn(surface, "h-64 motion-safe:animate-pulse")} />
              ) : itemsQuery.isError ? (
                <div role="alert" className={cn(surface, "flex flex-col items-center gap-3 rounded-[20px] px-5 py-8 text-center")}>
                  <div className="text-lg font-bold">Không tải được nội dung học này.</div>
                  <div className="max-w-[340px] text-[13px] leading-relaxed text-ink-2">
                    Hãy thử tải lại. Nếu vẫn không được, báo cho giáo viên để được hỗ trợ — tiến độ các bài trước không bị ảnh hưởng.
                  </div>
                  <button type="button" onClick={() => itemsQuery.refetch()} className={buttonClass("dark", "md")}>
                    <RotateCw aria-hidden className="h-4 w-4" />
                    Tải lại
                  </button>
                </div>
              ) : !items.length ? (
                <div className={cn(surface, "px-5 py-10 text-center text-sm text-ink-2")}>
                  Bài học này chưa có nội dung.
                </div>
              ) : (
                items.map((item, itemIndex) => {
                  const grouped = itemIndex > 0 && items[itemIndex - 1].group_with_next;
                  return (
                    <section key={item.id} aria-label={item.title} className="grid gap-3">
                      {!grouped ? (
                        <h3 className="flex items-center gap-2 text-base font-bold">
                          {item.title}
                          {item.is_required ? (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-ink-2">
                              Bắt buộc
                            </span>
                          ) : null}
                        </h3>
                      ) : null}
                      <LearningItemContent item={item} courseId={courseId} />
                    </section>
                  );
                })
              )}
            </article>
          </div>

          <footer className="flex h-[76px] shrink-0 items-center gap-2 border-t border-line bg-white px-3 sm:gap-3 sm:px-8">
            <NeighbourLink target={previous} direction="prev" courseId={courseId} />
            <div className="flex-1" />
            {canTrack ? (
              done ? (
                <span
                  aria-live="polite"
                  className="flex h-12 items-center gap-1.5 rounded-[14px] bg-success-soft px-4 text-sm font-bold text-success-strong"
                >
                  <Check aria-hidden className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  Đã hoàn thành
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={saveState === "saving" || !online}
                  className={cn(buttonClass("outline", "md"), "border-ink")}
                >
                  <Check aria-hidden className="h-[18px] w-[18px]" strokeWidth={2.25} />
                  {saveState === "error" ? "Thử lại" : "Hoàn thành bài"}
                </button>
              )
            ) : null}
            {next ? (
              done ? (
                <Link
                  href={`/courses/${courseId}/lessons/${next.lesson.id}`}
                  aria-label={`Bài tiếp theo: ${next.lesson.title}`}
                  className={cn(buttonClass("primary", "md"), "min-w-0 max-w-[260px] px-3.5")}
                >
                  <span className="truncate">
                    <span className="sm:hidden">Tiếp</span>
                    <span className="hidden sm:inline">Tiếp: {next.lesson.title}</span>
                  </span>
                  <ChevronRight aria-hidden className="h-[18px] w-[18px] shrink-0" />
                </Link>
              ) : (
                <NeighbourLink target={next} direction="next" courseId={courseId} />
              )
            ) : null}
          </footer>
        </div>
      </div>

      <Sheet open={outlineOpen} onOpenChange={setOutlineOpen}>
        <SheetContent side="left" className="w-[320px] overflow-y-auto bg-white p-0">
          <SheetTitle className="sr-only">Nội dung khoá học</SheetTitle>
          {outline}
        </SheetContent>
      </Sheet>
    </div>
  );
}
