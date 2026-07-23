"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  action_url: string | null;
  type: "info" | "success" | "warning" | "danger";
  read_at: string | null;
  created_at: string;
}

const NOTIFICATIONS_KEY = ["notifications"] as const;

const typeDot: Record<NotificationItem["type"], string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function NotificationBell() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async () => {
      const { data } = await api.get<{
        data: { unread_count: number; notifications: NotificationItem[] };
      }>("/api/v1/notifications");
      return data.data;
    },
    refetchInterval: 60_000,
  });

  const readAll = useMutation({
    mutationFn: async () => {
      await api.post("/api/v1/notifications/read-all");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });

  const unread = data?.unread_count ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
      >
        <Bell className="size-4.5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1">
          <p className="text-xs font-medium text-muted-foreground">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              className="text-xs font-medium text-fruition-700 hover:underline"
              onClick={() => readAll.mutate()}
              disabled={readAll.isPending}
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {!data?.notifications.length ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {data.notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                render={
                  notification.action_url ? <Link href={notification.action_url} /> : undefined
                }
                className="items-start gap-2.5 py-2.5"
              >
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${typeDot[notification.type]} ${
                    notification.read_at ? "opacity-30" : ""
                  }`}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {notification.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {notification.body}
                  </span>
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
