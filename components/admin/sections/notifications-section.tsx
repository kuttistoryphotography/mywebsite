"use client";

import React, { MouseEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Send,
  MessageSquare,
  Users,
  Calendar,
  CreditCard,
  CheckCircle,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  type: string;
  title: string;
  description: string;
  related_entity_type?: string;
  related_entity_id?: number;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export default function NotificationsSection() {
  const router = useRouter();
  const [notificationList, setNotificationList] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchNotifications = async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await fetch(
      "/api/notifications?limit=100",
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }

    const data = await response.json();

    console.log("ADMIN NOTIFICATIONS:", data.notifications);

    setNotificationList(data.notifications || []);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to load notifications"
    );
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchNotifications();

  const interval = setInterval(() => {
    fetchNotifications();
  }, 5000);

  return () => clearInterval(interval);
}, []);

const unreadCount = notificationList.filter(
  (n) => !n.is_read
).length;

  const filteredNotifications = notificationList.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read;
    return n.type === filter;
  });

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-read", notificationId: id }),
      });
      if (response.ok) {
        setNotificationList((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
        );
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-all-read" }),
      });
      if (response.ok) {
        setNotificationList((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      if (response.ok) {
        setNotificationList((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const navigateToActionUrl = (actionUrl?: string) => {
    if (!actionUrl) return;

    if (actionUrl.startsWith("http://") || actionUrl.startsWith("https://")) {
      window.location.href = actionUrl;
      return;
    }

    router.push(actionUrl);
  };

  const buildNotificationTargetUrl = (notification: Notification): string | null => {
    const fallbackByType: Record<string, string> = {
      booking: "/admin?tab=bookings",
      quote: "/admin?tab=quotes",
      payment: "/admin?tab=payments",
      invoice: "/admin?tab=invoices",
      file: "/admin?tab=files",
    };

    const baseUrl =
      notification.action_url ||
      (notification.related_entity_type
        ? fallbackByType[notification.related_entity_type] || "/admin?tab=notifications"
        : "/admin?tab=notifications");

    try {
      const url = new URL(baseUrl, window.location.origin);
      url.searchParams.set("notificationId", String(notification.id));

      if (notification.related_entity_type) {
        url.searchParams.set("entityType", notification.related_entity_type);
      }
      if (notification.related_entity_id != null) {
        url.searchParams.set("entityId", String(notification.related_entity_id));
      }

      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return baseUrl;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    const targetUrl = buildNotificationTargetUrl(notification);
    if (!targetUrl) return;

    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    navigateToActionUrl(targetUrl);
  };


  const getTypeIcon = (type: string) => {
    const typeMap: { [key: string]: React.ReactNode } = {
      booking_created: <Calendar className="w-5 h-5" />,
      booking_updated: <Calendar className="w-5 h-5" />,
      booking_cancelled: <Calendar className="w-5 h-5" />,
      booking_confirmed: <Calendar className="w-5 h-5" />,
      payment_received: <CreditCard className="w-5 h-5" />,
      payment_pending: <CreditCard className="w-5 h-5" />,
      invoice_created: <CreditCard className="w-5 h-5" />,
      invoice_updated: <CreditCard className="w-5 h-5" />,
      invoice_sent: <Send className="w-5 h-5" />,
      invoice_paid: <CheckCircle className="w-5 h-5" />,
      quote_requested: <MessageSquare className="w-5 h-5" />,
      quote_accepted: <CheckCircle className="w-5 h-5" />,
      quote_rejected: <X className="w-5 h-5" />,
      file_uploaded: <Bell className="w-5 h-5" />,
      gallery_shared: <Bell className="w-5 h-5" />,
      reminder: <Bell className="w-5 h-5" />,
    };
    return typeMap[type] || <Bell className="w-5 h-5" />;
  };

  const getTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      booking_created: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      booking_updated: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      booking_cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
      booking_confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      payment_received: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      payment_pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      invoice_created: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      invoice_updated: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      invoice_sent: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      invoice_paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      quote_requested: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      quote_accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      quote_rejected: "bg-red-500/10 text-red-400 border-red-500/20",
      file_uploaded: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      gallery_shared: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      reminder: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
    return colorMap[type] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-red-500">
            ADMIN NOTIFICATION TEST
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            System notifications from bookings, payments, and invoices
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            Mark All Read
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Bell className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unreadCount}</p>
              <p className="text-xs text-zinc-500">Unread</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {notificationList.filter((n) => n.type.includes("booking")).length}
              </p>
              <p className="text-xs text-zinc-500">Booking</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <MessageSquare className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {notificationList.filter((n) => n.type.includes("quote")).length}
              </p>
              <p className="text-xs text-zinc-500">Quotes</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <MessageSquare className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notificationList.length}</p>
              <p className="text-xs text-zinc-500">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "unread"].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize",
              filter === filterOption
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                : "bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"
            )}
          >
            {filterOption}
            {filterOption === "unread" && unreadCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-black rounded-full text-xs">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
          <Loader2 className="w-8 h-8 text-amber-500 mx-auto mb-4 animate-spin" />
          <p className="text-zinc-500">Loading notifications...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12 bg-red-500/10 rounded-2xl border border-red-500/20">
          <X className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Notifications List */}
      {!loading && !error && (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "bg-zinc-900/50 rounded-2xl border p-5 transition-colors cursor-pointer hover:border-zinc-700",
                !notification.is_read
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-zinc-800"
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "p-2.5 rounded-xl border",
                    getTypeColor(notification.type)
                  )}
                >
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className={cn(
                            "font-medium",
                            !notification.is_read && "text-white"
                          )}
                        >
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-amber-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">
                        {notification.description}
                      </p>
                      {notification.related_entity_type && (
                        <div className="flex items-center gap-2 mt-2">
                          <Users className="w-3 h-3 text-zinc-600" />
                          <span className="text-xs text-zinc-500">
                            {notification.related_entity_type}{" "}
                            {notification.related_entity_id && `#${notification.related_entity_id}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!notification.is_read && (
                    <button
                      onClick={(e: MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredNotifications.length === 0 && !loading && (
            <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
              <Bell className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No notifications found</p>
            </div>
          )}
        </div>
      )}    </div>
  );
}