"use client";

import { MouseEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Trash2, CheckCircle, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
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

export default function NotificationsSection() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const query = filter === "unread" ? "&unreadOnly=true" : "";
      const response = await fetch(`/api/notifications?limit=50&offset=0${query}`);
      if (response.ok) {
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
  }, [filter]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-read", notificationId }),
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notificationId)
        );
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-all-read" }),
      });
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const buildNotificationTargetUrl = (notification: Notification): string | null => {
    const fallbackByType: Record<string, string> = {
      booking: "/dashboard?tab=bookings",
      quote: "/dashboard?tab=quotes",
      payment: "/dashboard?tab=payments",
      invoice: "/dashboard?tab=payments",
      file: "/dashboard?tab=files",
    };

    const baseUrl =
      notification.actionUrl ||
      (notification.relatedEntityType
        ? fallbackByType[notification.relatedEntityType] || "/dashboard?tab=notifications"
        : "/dashboard?tab=notifications");

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

  const handleNotificationClick = async (notification: Notification) => {
    const targetUrl = buildNotificationTargetUrl(notification);
    if (!targetUrl) return;

    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    navigateToActionUrl(targetUrl);
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes("payment")) return "💳";
    if (type.includes("invoice")) return "📄";
    if (type.includes("booking")) return "📅";
    if (type.includes("quote")) return "✉️";
    if (type.includes("file")) return "📁";
    return "🔔";
  };

  const getNotificationColor = (type: string) => {
    if (type.includes("payment") || type.includes("paid")) return "bg-emerald-500/10 border-emerald-500/20";
    if (type.includes("invoice")) return "bg-amber-500/10 border-amber-500/20";
    if (type.includes("booking")) return "bg-blue-500/10 border-blue-500/20";
    if (type.includes("quote")) return "bg-purple-500/10 border-purple-500/20";
    if (type.includes("file")) return "bg-cyan-500/10 border-cyan-500/20";
    return "bg-zinc-700/30 border-zinc-600/30";
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

    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const filteredNotifications = typeFilter === "all"
    ? notifications
    : notifications.filter((n) => n.type.includes(typeFilter));

  const notificationTypes = Array.from(
    new Set(notifications.map((n) => n.type.split("_")[0]))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-zinc-500 mt-1">
            View all your notifications and updates
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-sm font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl font-bold">
{
  notifications.filter(
    (n) =>
      n.type.includes("booking") ||
      n.type.includes("quote")
  ).length
}
</p>
        </div>
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Unread</p>
          <p className="text-2xl font-bold text-amber-400">{unreadCount}</p>
        </div>
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Read</p>
          <p className="text-2xl font-bold text-emerald-400">{notifications.length - unreadCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-zinc-500" />
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            filter === "all"
              ? "bg-amber-500 text-black"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            filter === "unread"
              ? "bg-amber-500 text-black"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          )}
        >
          Unread ({unreadCount})
        </button>

        {/* Type Filter */}
        {notificationTypes.length > 0 && (
          <>
            <div className="w-px h-6 bg-zinc-700" />
            <button
              onClick={() => setTypeFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
                typeFilter === "all"
                  ? "bg-amber-500 text-black"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              )}
            >
              All Types
            </button>
            {notificationTypes.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
                  typeFilter === type
                    ? "bg-amber-500 text-black"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                )}
              >
                {type}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-12 text-center">
            <Bell className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-400">No notifications</h3>
            <p className="text-sm text-zinc-500 mt-1">
              {filter === "unread"
                ? "All notifications have been read"
                : "You don't have any notifications yet"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "bg-zinc-900/50 rounded-2xl border p-4 transition-all hover:border-zinc-700",
                notification.actionUrl && "cursor-pointer",
                notification.isRead
                  ? "border-zinc-800"
                  : "border-amber-500/30 bg-amber-500/5"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-2xl mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-white">
                        {notification.title}
                      </p>
                      {notification.description && (
                        <p className="text-sm text-zinc-400 mt-1">
                          {notification.description}
                        </p>
                      )}
                      <p className="text-xs text-zinc-500 mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={(e: MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </button>
                  )}
                  <button
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification.id);
                    }}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
