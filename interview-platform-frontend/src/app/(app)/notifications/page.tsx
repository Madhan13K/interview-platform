"use client";

import { useState, useEffect, useCallback } from "react";
import { notificationService } from "@/services/notification.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { NotificationResponse } from "@/types";
import Link from "next/link";

type FilterTab = "all" | "unread";

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case "INTERVIEW_SCHEDULED":
      return "📅";
    case "FEEDBACK_RECEIVED":
      return "💬";
    case "INTERVIEW_COMPLETED":
      return "✅";
    case "INTERVIEW_CANCELLED":
      return "❌";
    case "CANDIDATE_APPLIED":
      return "📋";
    case "REMINDER":
      return "🔔";
    case "SYSTEM":
      return "⚙️";
    default:
      return "📣";
  }
}

function getEntityLink(entityType?: string, entityId?: string): string | null {
  if (!entityType || !entityId) return null;
  switch (entityType) {
    case "INTERVIEW":
      return `/interviews/${entityId}`;
    case "JOB":
      return `/jobs/${entityId}`;
    case "CANDIDATE":
      return `/candidates/${entityId}`;
    case "FEEDBACK":
      return `/interviews/${entityId}`;
    default:
      return null;
  }
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

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="info" className="bg-indigo-100 text-indigo-700">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
          >
            {markingAll ? "Marking..." : "Mark All as Read"}
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            filter === "unread"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Unread
        </button>
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
                : "You don't have any notifications yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notification List */}
      {!loading && filteredNotifications.length > 0 && (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => {
            const entityLink = getEntityLink(
              notification.entityType,
              notification.entityId
            );
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
                    {/* Unread Indicator & Icon */}
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
                      <div className="mt-2 flex items-center gap-2">
                        {entityLink && (
                          <Link
                            href={entityLink}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            View details →
                          </Link>
                        )}
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={isMarking}
                            className="ml-auto h-7 px-2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-600"
                          >
                            {isMarking ? "..." : "Mark as read"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
