"use client";

import { MouseEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X, CheckCircle, Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  type: string;
  title: string;
  description?: string;
  isRead: boolean;
  actionUrl?: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  createdAt: string;
  readAt?: string;
}

interface NotificationBellProps {
  className?: string;
}

/** Minimum milliseconds between notification list fetches for the bell dropdown. */
const BELL_FETCH_THROTTLE_MS = 30_000; // 30 seconds

export default function NotificationBell({ className }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  /** Timestamp (ms) of the last successful fetch. */
  const lastFetchedAt = useRef<number>(0);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications?limit=10&offset=0");
      if (response.ok) {
        const data = await response.json();
        const mapped = (data.notifications || []).map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          description: n.description,
          isRead: n.is_read,
          actionUrl: n.action_url,
          relatedEntityType: n.related_entity_type,
          relatedEntityId: n.related_entity_id,
          createdAt: n.created_at,
          readAt: n.read_at,
        }));
        setNotifications(mapped);
        setUnreadCount(data.unreadCount || 0);
        lastFetchedAt.current = Date.now();
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Refresh when opening the dropdown, but only if data is stale.
  // This prevents rapid open/close cycles from triggering repeated API calls.
  useEffect(() => {
    if (isOpen && Date.now() - lastFetchedAt.current > BELL_FETCH_THROTTLE_MS) {
      fetchNotifications();
    }
  }, [isOpen]);

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
      console.error("Failed to mark notification as read:", error);
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
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
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
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    setIsOpen(false);
    navigateToActionUrl(buildNotificationTargetUrl(notification));
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
    });
  };

  return (
    <div className={cn("relative", className)}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-zinc-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
            {Math.min(unreadCount, 9)}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl z-50 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div>
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-zinc-500">{unreadCount} unread</p>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "p-4 border-b border-zinc-800/50 last:border-0 transition-colors hover:bg-zinc-800/50 cursor-pointer",
                    !notification.isRead && "bg-zinc-800/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Notification Badge */}
                    <div className={cn(
                      "shrink-0 w-2 h-2 rounded-full mt-2",
                      !notification.isRead ? "bg-amber-500" : "bg-zinc-600"
                    )} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white line-clamp-2">
                        {notification.title}
                      </p>
                      {notification.description && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                          {notification.description}
                        </p>
                      )}
                      <p className="text-xs text-zinc-600 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={(e: MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="p-1 hover:bg-zinc-700 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </button>
                      )}
                      <button
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                        className="p-1 hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-zinc-800 flex items-center gap-2 bg-zinc-800/50">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex-1 px-3 py-2 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/dashboard?tab=notifications');
                }}
                className="flex-1 px-3 py-2 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-black rounded-lg transition-colors"
              >
                View all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
