"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, LogOut, Settings2, UserRound } from "lucide-react";

import { useLogout } from "@/app/(auth)/_feature/hooks";
import { useMarkAllNotificationsRead, useMarkNotificationRead } from "@/_shared/notifications/hooks";
import { notificationTime, notificationTypeLabel, useNotificationList } from "@/_shared/notifications/view";
import { routeTitle } from "@/config/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials, relativeTimeVi, shortName } from "@/lib/format-vi";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import { useHeaderState } from "./page-header";
import { MobileNav } from "./sidebar";

// One polite status region for the badge: announces the count as a full
// phrase when it changes after the first load, never on mount and never by
// moving focus.
function useUnreadAnnouncement(unreadCount: number, isLoaded: boolean) {
  const [seenCount, setSeenCount] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // Adjusting state during render (not in an effect) when the count changes.
  if (isLoaded && seenCount !== unreadCount) {
    if (seenCount !== null) {
      setMessage(
        unreadCount > 0
          ? `Bạn có ${unreadCount} thông báo chưa đọc`
          : "Đã đọc tất cả thông báo",
      );
    }
    setSeenCount(unreadCount);
  }

  return message;
}

function NotificationBell() {
  const { notifications, unreadCount, isSuccess } = useNotificationList();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const announcement = useUnreadAnnouncement(unreadCount, isSuccess);
  const recent = notifications.slice(0, 6);

  return (
    <DropdownMenu>
      <span role="status" aria-atomic="true" className="sr-only">
        {announcement}
      </span>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative grid h-11 w-11 place-items-center rounded-[14px] border border-line bg-white text-ink-2 transition-colors hover:bg-accent active:bg-muted"
        >
          <Bell className="h-[22px] w-[22px]" strokeWidth={1.75} />
          {unreadCount > 0 ? (
            <span
              aria-hidden
              className="absolute right-[3px] top-1 grid h-[18px] min-w-[18px] place-items-center rounded-[9px] border-2 border-white bg-highlight-strong px-1 text-[10px] font-bold tabular-nums text-white"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
          <span className="sr-only">
            Thông báo{unreadCount > 0 ? `, ${unreadCount} chưa đọc` : ""}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] rounded-2xl p-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0 text-[15px] font-bold text-ink">
            Thông báo
          </DropdownMenuLabel>
          <button
            type="button"
            disabled={unreadCount === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
            className="rounded-lg px-2 py-1 text-[13px] font-semibold text-secondary disabled:text-muted-foreground"
          >
            Đọc hết
          </button>
        </div>
        <DropdownMenuSeparator />
        {recent.length ? (
          recent.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onSelect={(event) => {
                event.preventDefault();
                if (!item.is_read) markRead.mutate(item.id);
              }}
              className={cn(
                "flex items-start gap-3 rounded-xl px-3 py-2.5",
                !item.is_read && "bg-primary-soft focus:bg-primary-soft",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-muted-foreground">
                  <span className="font-semibold">
                    {notificationTypeLabel[item.notification_type] ?? "Thông báo"}
                  </span>
                  {" · "}
                  {relativeTimeVi(notificationTime(item))}
                </div>
                <div
                  className={cn(
                    "text-sm leading-snug text-ink",
                    item.is_read ? "font-medium" : "font-bold",
                  )}
                >
                  {item.title}
                </div>
                {item.message ? (
                  <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-2">
                    {item.message}
                  </div>
                ) : null}
              </div>
              {!item.is_read ? (
                <>
                  <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-highlight" />
                  <span className="sr-only">Chưa đọc</span>
                </>
              ) : null}
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-3 py-8 text-center text-sm text-ink-2">
            Bạn chưa có thông báo nào.
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center rounded-xl py-2.5 text-[13px] font-semibold text-secondary focus:text-secondary">
          <Link href="/notifications">Xem tất cả thông báo</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const user = useSessionStore((state) => state.user);
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Tài khoản: ${user?.fullName ?? "chưa đăng nhập"}`}
          className="flex h-11 items-center gap-2.5 rounded-full border border-line bg-white pl-1 pr-3 transition-colors hover:bg-accent active:bg-muted"
        >
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full bg-highlight-soft text-[13px] font-bold text-highlight-strong"
          >
            {initials(user?.fullName)}
          </span>
          <span className="hidden text-[13px] font-semibold text-ink sm:inline">
            {shortName(user?.fullName) || "Tài khoản"}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2">
        <DropdownMenuLabel className="flex flex-col px-2">
          <span className="text-sm font-bold text-ink">{user?.fullName ?? "Tài khoản"}</span>
          {user?.email ? (
            <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-xl">
          <Link href="/profile">
            <UserRound className="mr-2 h-4 w-4" />
            Hồ sơ của tôi
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-xl">
          <Link href="/settings">
            <Settings2 className="mr-2 h-4 w-4" />
            Cài đặt
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-xl text-danger focus:text-danger"
          disabled={logout.isPending}
          onSelect={(event) => {
            event.preventDefault();
            logout.mutate();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {logout.isPending ? "Đang đăng xuất…" : "Đăng xuất"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const header = useHeaderState();
  const title = header.title ?? routeTitle(pathname);

  return (
    <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-line bg-background px-4 lg:px-8">
      <MobileNav />
      {header.crumbs?.length ? (
        // Detail pages render their own <h1>; the header shows the trail.
        <nav aria-label="Đường dẫn" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
            {header.crumbs.map((crumb, index) => {
              const last = index === header.crumbs!.length - 1;
              return (
                <li key={`${crumb.label}-${index}`} className={cn("flex min-w-0 items-center gap-1.5", last && "font-bold text-ink")}>
                  {index > 0 ? <ChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0" /> : null}
                  {crumb.href && !last ? (
                    <Link href={crumb.href} className="shrink-0 text-secondary hover:underline">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? "page" : undefined} className="truncate">
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : (
        <h1 className="flex-1 truncate font-display text-[22px] font-bold text-ink">
          {title}
        </h1>
      )}
      <NotificationBell />
      <UserMenu />
    </header>
  );
}
