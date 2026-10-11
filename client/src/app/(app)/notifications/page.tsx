"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Award, Bell, BookOpen, ChartLine, Check, SquareCheck, Trash2 } from "lucide-react";

import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/_shared/notifications/hooks";
import {
  notificationTime,
  notificationTypeLabel,
  useNotificationList,
} from "@/_shared/notifications/view";
import {
  EmptyState,
  FilterChip,
  IconTile,
  LoadError,
  PageSkeleton,
  buttonClass,
  surface,
  type Tone,
} from "@/components/edu/ui";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { relativeTimeVi, timeDateVi } from "@/lib/format-vi";
import { useMediaQuery, WIDE_QUERY } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types/models";

// COMMON-06 Notification Center (design: Desktop - Student, 7h) —
// master-detail on desktop, detail in a bottom sheet below 1280px.

const typeStyle: Record<NotificationType, { icon: typeof Bell; tone: Tone }> = {
  progress: { icon: ChartLine, tone: "primary" },
  assignment: { icon: SquareCheck, tone: "secondary" },
  reward: { icon: Award, tone: "highlight" },
  course: { icon: BookOpen, tone: "primary" },
  general: { icon: Bell, tone: "neutral" },
};

function NotificationDetail({ item, onDeleted }: { item: Notification; onDeleted: () => void }) {
  const remove = useDeleteNotification();
  const [confirming, setConfirming] = useState(false);
  const time = notificationTime(item);

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(item.id);
      toast.success("Đã xoá thông báo.");
      onDeleted();
    } catch {
      toast.error("Không xoá được thông báo. Vui lòng thử lại.");
    }
  };

  return (
    <article className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <b className="text-ink-2">{notificationTypeLabel[item.notification_type] ?? "Thông báo"}</b>
        {time ? (
          <>
            <span aria-hidden>·</span>
            <span>{timeDateVi(time)}</span>
          </>
        ) : null}
        <span className="ml-auto flex items-center gap-1 font-semibold text-success-strong">
          <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />
          Đã đọc
        </span>
      </div>
      <h2 className="text-[22px] font-bold leading-snug">{item.title}</h2>
      {item.message ? (
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{item.message}</p>
      ) : null}
      <div className="mt-2 border-t border-line pt-4">
        {confirming ? (
          <div role="group" aria-label="Xác nhận xoá" className="flex flex-col gap-2.5 rounded-2xl bg-danger-soft p-3.5">
            <div className="text-sm font-semibold">Xoá thông báo này? Không thể hoàn tác.</div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setConfirming(false)} className={buttonClass("outline", "sm")}>
                Giữ lại
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={remove.isPending}
                className={buttonClass("destructive", "sm")}
              >
                {remove.isPending ? "Đang xoá…" : "Xoá"}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className={buttonClass("danger", "sm")}>
            <Trash2 aria-hidden className="h-4 w-4" />
            Xoá thông báo
          </button>
        )}
      </div>
    </article>
  );
}

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, isError, refetch } = useNotificationList();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const isWide = useMediaQuery(WIDE_QUERY);
  const [type, setType] = useState<NotificationType | "all">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const types = [...new Set(notifications.map((item) => item.notification_type))];
  const list = notifications.filter((item) => type === "all" || item.notification_type === type);
  const selected = list.find((item) => item.id === selectedId) ?? (isWide ? list[0] : undefined);

  const open = (item: Notification) => {
    setSelectedId(item.id);
    if (!item.is_read) markRead.mutate(item.id);
    if (!isWide) setSheetOpen(true);
  };

  if (isLoading) return <PageSkeleton label="Đang tải thông báo" />;
  if (isError) return <LoadError title="Không tải được thông báo." onRetry={() => refetch()} />;

  if (!notifications.length) {
    return (
      <EmptyState
        icon={Bell}
        title="Bạn chưa có thông báo nào."
        description="Nhắc hạn nộp, kết quả và tin từ giáo viên sẽ hiện ở đây."
        className={cn(surface, "mx-auto max-w-[640px]")}
      />
    );
  }

  return (
    <div className="grid content-start gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 flex-wrap gap-2" role="group" aria-label="Lọc theo loại">
          <FilterChip active={type === "all"} onClick={() => setType("all")} count={notifications.length}>
            Tất cả
          </FilterChip>
          {types.map((value) => (
            <FilterChip
              key={value}
              active={type === value}
              onClick={() => setType(value)}
              count={notifications.filter((item) => item.notification_type === value).length}
            >
              {notificationTypeLabel[value] ?? value}
            </FilterChip>
          ))}
        </div>
        <span className="text-[13px] text-muted-foreground">
          {unreadCount ? `${unreadCount} chưa đọc` : "Đã đọc tất cả"}
        </span>
        <button
          type="button"
          onClick={() => markAllRead.mutate()}
          disabled={!unreadCount || markAllRead.isPending}
          className={cn(buttonClass("outline", "sm"), unreadCount ? "text-secondary" : "")}
        >
          Đánh dấu đã đọc tất cả
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-start">
        {list.length ? (
          <ul className={cn(surface, "overflow-hidden rounded-2xl")}>
            {list.map((item) => {
              const style = typeStyle[item.notification_type] ?? typeStyle.general;
              const isSelected = isWide && selected?.id === item.id;
              const time = notificationTime(item);
              return (
                <li key={item.id} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    onClick={() => open(item)}
                    aria-current={isSelected ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors",
                      item.is_read ? "bg-white hover:bg-background" : "bg-primary-soft hover:bg-primary-soft/70",
                      isSelected && "shadow-[inset_4px_0_0_hsl(var(--primary))]",
                    )}
                  >
                    <IconTile icon={style.icon} tone={style.tone} size="sm" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[11px] text-muted-foreground">
                        <span className="font-semibold">{notificationTypeLabel[item.notification_type] ?? "Thông báo"}</span>
                        {time ? ` · ${relativeTimeVi(time)}` : ""}
                      </span>
                      <span className={cn("text-sm leading-snug text-ink", item.is_read ? "font-medium" : "font-bold")}>
                        {item.title}
                      </span>
                      {item.message ? (
                        <span className="line-clamp-2 text-[13px] leading-snug text-ink-2">{item.message}</span>
                      ) : null}
                    </span>
                    {!item.is_read ? (
                      <>
                        <span aria-hidden className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-highlight" />
                        <span className="sr-only">Chưa đọc</span>
                      </>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={Bell} tone="secondary" title="Không có thông báo phù hợp" description="Thử chọn loại thông báo khác.">
            <button type="button" onClick={() => setType("all")} className={buttonClass("outline", "md")}>
              Xoá bộ lọc
            </button>
          </EmptyState>
        )}

        {isWide && selected ? (
          <aside aria-label="Chi tiết thông báo" className={cn(surface, "sticky top-0 p-7")}>
            <NotificationDetail key={selected.id} item={selected} onDeleted={() => setSelectedId(null)} />
          </aside>
        ) : null}
      </div>

      {!isWide ? (
        <Sheet open={sheetOpen && !!selected} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white px-5 pb-8 pt-6">
            <SheetTitle className="sr-only">Chi tiết thông báo</SheetTitle>
            {selected ? (
              <NotificationDetail
                key={selected.id}
                item={selected}
                onDeleted={() => {
                  setSheetOpen(false);
                  setSelectedId(null);
                }}
              />
            ) : null}
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}
