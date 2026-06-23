"use client";

import { MouseEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X, Trash2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminNotification {
  id: number;
  type: string;
  title: string;
  description?: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
}

export default function AdminNotificationPanel() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const query = filter === "unread" ? "&unreadOnly=true" : "";
      const response = await fetch(
        `/api/notifications?limit=20&offset=0${query}`,
        {
          cache: "no-store"
        }
      );      if (response.ok) {
        const data = await response.json();
        const mapped = (data.notifications || []).map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          description: n.description,
          isRead: n.is_read,
          actionUrl: n.action_url,
          createdAt: n.created_at,
          relatedEntityType: n.related_entity_type,
          relatedEntityId: n.related_entity_id,
        }));
        setNotifications(mapped);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
      fetchNotifications();

      const interval = setInterval(() => {
        fetchNotifications();
      }, 5000); // every 5 sec

      return () => clearInterval(interval);
    }, [filter]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-read", notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const buildNotificationTargetUrl = (notification: AdminNotification): string | null => {
    const fallbackByType: Record<string, string> = {
      booking: "/admin?tab=bookings",
      quote: "/admin?tab=quotes",
      payment: "/admin?tab=payments",
      invoice: "/admin?tab=invoices",
      file: "/admin?tab=files",
    };

    const baseUrl =
      notification.actionUrl ||
      (notification.relatedEntityType
        ? fallbackByType[notification.relatedEntityType] || "/admin?tab=notifications"
        : "/admin?tab=notifications");

    try {
      const url = new URL(baseUrl, window.location.origin);
      url.searchParams.set("notificationId", String(notification.id));

      if (notification.relatedEntityType) {
        url.searchParams.set("entityType", notification.relatedEntityType);
      }
      if (notification.relatedEntityId != null) {
        url.searchParams.set("entityId", String(notification.relatedEntityId));
      }

      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return baseUrl;
    }
  };

  const navigateToActionUrl = (targetUrl?: string | null) => {
    if (!targetUrl) return;

    if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
      window.location.href = targetUrl;
      return;
    }

    router.push(targetUrl);
  };

  const handleNotificationClick = async (notification: AdminNotification) => {
    const targetUrl = buildNotificationTargetUrl(notification);
    if (!targetUrl) return;

    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    navigateToActionUrl(targetUrl);
  };

  const getTypeColor = (type: string) => {
    if (type.includes("booking")) return "bg-blue-500/20 text-blue-300";
    if (type.includes("invoice")) return "bg-amber-500/20 text-amber-300";
    if (type.includes("payment")) return "bg-emerald-500/20 text-emerald-300";
    if (type.includes("quote")) return "bg-purple-500/20 text-purple-300";
    if (type.includes("file")) return "bg-cyan-500/20 text-cyan-300";
    return "bg-zinc-600/20 text-zinc-300";
  };

  const getTypeLabel = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-zinc-500 mt-1">System notifications and updates</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
            filter === "all"
              ? "bg-amber-500 text-black"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          )}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-colors relative",
            filter === "unread"
              ? "bg-amber-500 text-black"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          )}
        >
          Unread
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-400">No notifications</h3>
            <p className="text-sm text-zinc-500 mt-1">
              {filter === "unread"
                ? "All notifications have been read"
                : "No notifications yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "p-4 hover:bg-zinc-800/50 transition-colors flex items-start gap-4",
                  notification.actionUrl && "cursor-pointer",
                  !notification.isRead && "bg-zinc-800/30"
                )}
              >
                {/* Status Indicator */}
                <div className="shrink-0 pt-1">
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{notification.title}</h3>
                        <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded", getTypeColor(notification.type))}>
                          {getTypeLabel(notification.type)}
                        </span>
                      </div>
                      {notification.description && (
                        <p className="text-sm text-zinc-400 line-clamp-2 mb-2">
                          {notification.description}
                        </p>
                      )}
                      <p className="text-xs text-zinc-600">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!notification.isRead && (
                    <button
                      onClick={(e: MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Eye className="w-4 h-4 text-emerald-500" />
                    </button>
                  )}
                  {notification.actionUrl && (
                    <button
                      onClick={(e: MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        handleNotificationClick(notification);
                      }}
                      className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-amber-500"
                      title="View"
                    >
                      →
                    </button>
                  )}
                  <button
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
