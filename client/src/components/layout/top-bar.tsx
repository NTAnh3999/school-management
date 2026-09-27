"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Settings2 } from "lucide-react";

import { useLogout } from "@/app/(auth)/_feature/hooks";
import { useMarkAllNotificationsRead, useMarkNotificationRead } from "@/_shared/notifications/hooks";
import { notificationTypeLabel, useNotificationList } from "@/_shared/notifications/view";
import { findActiveRoute } from "@/config/navigation";
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
import { MobileNav } from "./sidebar";

function NotificationBell() {
  const { notifications, unreadCount } = useNotificationList();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const recent = notifications.slice(0, 6);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative grid h-11 w-11 place-items-center rounded-[14px] border border-line bg-white text-ink-2"
        >
          <Bell className="h-[22px] w-[22px]" strokeWidth={1.75} />
          {unreadCount > 0 ? (
            <span className="absolute right-[3px] top-1 grid h-[18px] min-w-[18px] place-items-center rounded-[9px] border-2 border-white bg-highlight px-1 text-[10px] font-bold text-white">
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
                  {relativeTimeVi(item.createdAt)}
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
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-highlight" />
              ) : null}
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-3 py-8 text-center text-sm text-ink-2">
            Bạn chưa có thông báo nào.
          </div>
        )}
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
          className="flex h-11 items-center gap-2.5 rounded-full border border-line bg-white pl-1 pr-3"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-highlight-soft text-[13px] font-bold text-highlight">
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
          <Link href="/settings">
            <Settings2 className="mr-2 h-4 w-4" />
            Cài đặt
          </Link>
        </DropdownMenuItem>
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
  const title = findActiveRoute(pathname)?.label ?? "";

  return (
    <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-line bg-background px-4 lg:px-8">
      <MobileNav />
      <h1 className="flex-1 truncate font-display text-[22px] font-bold text-ink">
        {title}
      </h1>
      <NotificationBell />
      <UserMenu />
    </header>
  );
}
