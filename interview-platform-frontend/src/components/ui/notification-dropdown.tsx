"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { notificationService } from "@/services/notification.service";
import type { NotificationResponse } from "@/types";
import { cn } from "@/lib/utils";

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getNotificationColor(type: string): string {
  switch (type.toUpperCase()) {
    case "INTERVIEW_SCHEDULED":
    case "SCHEDULED":
      return "bg-indigo-500";
    case "INTERVIEW_CANCELLED":
    case "CANCELLED":
    case "ERROR":
      return "bg-red-500";
    case "INTERVIEW_COMPLETED":
    case "COMPLETED":
    case "SUCCESS":
      return "bg-emerald-500";
    case "REMINDER":
    case "WARNING":
      return "bg-amber-500";
    case "FEEDBACK":
      return "bg-purple-500";
    default:
      return "bg-slate-400";
  }
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const [unread, countData] = await Promise.all([
        notificationService.getUnread(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(unread.slice(0, 5));

      if (countData.unreadCount > prevCountRef.current && prevCountRef.current > 0) {
        setHasNewNotification(true);
        setTimeout(() => setHasNewNotification(false), 3000);
      }
      prevCountRef.current = countData.unreadCount;
      setUnreadCount(countData.unreadCount);
    } catch {
      // Silently handle errors
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silently handle errors
    }
  };

  const handleNotificationClick = async (notification: NotificationResponse) => {
    if (!notification.read) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Silently handle errors
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200",
          isOpen && "bg-slate-800 text-slate-200"
        )}
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
            {/* Ping animation for new notifications */}
            {hasNewNotification && (
              <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75" />
            )}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <div
        className={cn(
          "absolute right-0 top-full mt-2 w-80 origin-top-right rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-slate-950/50 transition-all duration-200",
          isOpen
            ? "scale-100 opacity-100 translate-y-0"
            : "pointer-events-none scale-95 opacity-0 -translate-y-2"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-100">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-[320px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No notifications yet
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800/60",
                      !notification.read && "bg-slate-800/30"
                    )}
                  >
                    {/* Type indicator dot */}
                    <div className="mt-1.5 flex-shrink-0">
                      <div
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          getNotificationColor(notification.type)
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm",
                          notification.read ? "text-slate-300" : "font-medium text-slate-100"
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        {getRelativeTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="mt-1.5 flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700/50 px-4 py-2.5">
          <Link
            href="/notifications"
            className="block text-center text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            onClick={() => setIsOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      </div>
    </div>
  );
}
