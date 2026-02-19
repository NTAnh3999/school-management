"use client";

import {
  useNotifications,
  useMarkNotificationRead,
  useDeleteNotification,
} from "@/_shared/notifications/hooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, X } from "lucide-react";
import { toast } from "sonner";

export function NotificationDropdown() {
  const { data } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const deleteMutation = useDeleteNotification();

  const unreadCount =
    data.notifications?.filter((n: any) => !n.is_read).length || 0;

  const handleMarkRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markReadMutation.mutateAsync(id);
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification: any) => (
              <div
                key={notification.id}
                className={`p-3 border-b hover:bg-accent cursor-pointer ${
                  !notification.is_read ? "bg-blue-50 dark:bg-blue-950" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!notification.is_read && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => handleMarkRead(notification.id, e)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => handleDelete(notification.id, e)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No notifications
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
