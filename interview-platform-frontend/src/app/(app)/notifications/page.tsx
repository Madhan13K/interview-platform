"use client";

import { useState, useEffect, useCallback } from "react";
import { notificationService } from "@/services/notification.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { NotificationResponse } from "@/types";

type FilterTab = "all" | "unread" | "interviews" | "candidates" | "system";

interface SnoozedNotification {
  id: string;
  snoozeUntil: Date;
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case "INTERVIEW_SCHEDULED": return "📅";
    case "FEEDBACK_RECEIVED": return "💬";
    case "INTERVIEW_COMPLETED": return "✅";
    case "INTERVIEW_CANCELLED": return "❌";
    case "CANDIDATE_APPLIED": return "📋";
    case "REMINDER": return "🔔";
    case "SYSTEM": return "⚙️";
    default: return "📣";
  }
}

function getNotificationCategory(type: string): string {
  if (type.includes("INTERVIEW")) return "interviews";
  if (type.includes("CANDIDATE")) return "candidates";
  return "system";
}

function groupByDate(notifications: NotificationResponse[]): Map<string, NotificationResponse[]> {
  const groups = new Map<string, NotificationResponse[]>();
  notifications.forEach((n) => {
    const date = new Date(n.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = "Yesterday";
    } else {
      key = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(n);
  });
  return groups;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());
  const [snoozedIds, setSnoozedIds] = useState<Set<string>>(new Set());
  const [showSnoozeMenu, setShowSnoozeMenu] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      const response = await notificationService.getAll(pageNum, 20);
      const items = response.content;

      if (append) {
        setNotifications((prev) => [...prev, ...items]);
      } else {
        setNotifications(items);
      }

      setHasMore(!response.last);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { unreadCount: count } = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(0);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const handleMarkAsRead = async (id: string) => {
    setMarkingIds((prev) => new Set(prev).add(id));
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleSnooze = (id: string, minutes: number) => {
    setSnoozedIds((prev) => new Set(prev).add(id));
    setShowSnoozeMenu(null);
    // In production, this would call an API to snooze the notification
    setTimeout(() => {
      setSnoozedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, minutes * 60 * 1000);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (snoozedIds.has(n.id)) return false;
    switch (filter) {
      case "unread": return !n.read;
      case "interviews": return getNotificationCategory(n.type) === "interviews";
      case "candidates": return getNotificationCategory(n.type) === "candidates";
      case "system": return getNotificationCategory(n.type) === "system";
      default: return true;
    }
  });

  const groupedNotifications = groupByDate(filteredNotifications);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-indigo-100 text-indigo-700">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {snoozedIds.size > 0 && (
            <Badge variant="secondary" className="text-xs">
              {snoozedIds.size} snoozed
            </Badge>
          )}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              {markingAll ? "Marking..." : "Mark All Read"}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {(["all", "unread", "interviews", "candidates", "system"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors ${
              filter === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredNotifications.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-4xl mb-3">🔔</div>
            <h3 className="text-lg font-medium text-slate-700">No notifications</h3>
            <p className="text-sm text-slate-500 mt-1">
              {filter === "unread"
                ? "You're all caught up! No unread notifications."
                : `No ${filter === "all" ? "" : filter + " "}notifications to display.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grouped Notification List */}
      {!loading && filteredNotifications.length > 0 && (
        <div className="space-y-6">
          {Array.from(groupedNotifications.entries()).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              {/* Date Group Header */}
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase">{dateLabel}</h3>
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">{items.length}</span>
              </div>

              {/* Notifications */}
              <div className="space-y-2">
                {items.map((notification) => {
                  const isMarking = markingIds.has(notification.id);

                  return (
                    <Card
                      key={notification.id}
                      className={`group transition-all duration-300 ease-in-out ${
                        !notification.read
                          ? "border-l-4 border-l-indigo-500 bg-indigo-50/30"
                          : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className="relative flex-shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">
                              {getNotificationIcon(notification.type)}
                            </div>
                            {!notification.read && (
                              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-indigo-500 border-2 border-white" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-sm leading-snug ${
                                  !notification.read
                                    ? "font-semibold text-slate-900"
                                    : "font-medium text-slate-700"
                                }`}
                              >
                                {notification.title}
                              </p>
                              <span className="flex-shrink-0 text-xs text-slate-400">
                                {getRelativeTime(notification.createdAt)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-sm text-slate-600 leading-relaxed">
                              {notification.message}
                            </p>

                            {/* Actions */}
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {notification.type.replace(/_/g, " ")}
                              </Badge>

                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  disabled={isMarking}
                                  className="ml-auto h-7 px-2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-600"
                                >
                                  {isMarking ? "..." : "Mark read"}
                                </Button>
                              )}

                              {/* Snooze */}
                              <div className="relative">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowSnoozeMenu(showSnoozeMenu === notification.id ? null : notification.id)}
                                  className="h-7 px-2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-amber-600"
                                >
                                  Snooze
                                </Button>
                                {showSnoozeMenu === notification.id && (
                                  <div className="absolute right-0 top-8 z-10 bg-white border border-slate-200 rounded-lg shadow-lg p-1 min-w-[120px]">
                                    {[
                                      { label: "15 min", value: 15 },
                                      { label: "1 hour", value: 60 },
                                      { label: "4 hours", value: 240 },
                                      { label: "Tomorrow", value: 1440 },
                                    ].map((option) => (
                                      <button
                                        key={option.value}
                                        onClick={() => handleSnooze(notification.id, option.value)}
                                        className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded"
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {!loading && hasMore && filteredNotifications.length > 0 && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-slate-600 hover:text-indigo-600 hover:border-indigo-200"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
