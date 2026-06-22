"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WEBSOCKET_CONFIG } from "@/lib/api-endpoints";
import { useAuthStore } from "@/store/auth.store";
import type { NotificationResponse } from "@/types";

interface UseNotificationSocketOptions {
  /** Whether to auto-connect on mount. Defaults to true. */
  autoConnect?: boolean;
}

interface UseNotificationSocketReturn {
  /** The most recently received notification via WebSocket */
  latestNotification: NotificationResponse | null;
  /** Running delta of unread notifications received since hook mount */
  unreadDelta: number;
  /** Connection status */
  status: "connecting" | "connected" | "disconnected" | "error";
  /** Manually reconnect */
  reconnect: () => void;
}

/**
 * Hook that connects to the WebSocket endpoint and listens for
 * real-time notification messages (type: "NOTIFICATION").
 *
 * Returns the latest notification and an incrementing unread delta
 * that can be added to the existing unread count from the REST API.
 *
 * Usage in NotificationDropdown:
 * ```tsx
 * const { latestNotification, unreadDelta } = useNotificationSocket();
 *
 * // Add unreadDelta to the REST-fetched unreadCount
 * const totalUnread = restUnreadCount + unreadDelta;
 *
 * // Prepend latestNotification to the notifications list
 * useEffect(() => {
 *   if (latestNotification) {
 *     setNotifications(prev => [latestNotification, ...prev].slice(0, 5));
 *   }
 * }, [latestNotification]);
 * ```
 */
export function useNotificationSocket(
  options: UseNotificationSocketOptions = {}
): UseNotificationSocketReturn {
  const { autoConnect = true } = options;
  const { accessToken } = useAuthStore();

  const [status, setStatus] = useState<UseNotificationSocketReturn["status"]>("disconnected");
  const [latestNotification, setLatestNotification] = useState<NotificationResponse | null>(null);
  const [unreadDelta, setUnreadDelta] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const tokenRef = useRef(accessToken);
  const maxReconnectAttempts = 10;

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const connect = useCallback(() => {
    const token = tokenRef.current;
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");

    const wsUrl = WEBSOCKET_CONFIG.endpoint.replace("http", "ws") + `?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      reconnectAttemptsRef.current = 0;

      // Subscribe to user notifications topic
      const subscribeMsg = JSON.stringify({
        type: "SUBSCRIBE",
        topics: ["/user/topic/notifications"],
      });
      ws.send(subscribeMsg);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "NOTIFICATION" && message.payload) {
          const notification = message.payload as NotificationResponse;
          setLatestNotification(notification);
          if (!notification.read) {
            setUnreadDelta((prev) => prev + 1);
          }
        }
      } catch {
        // Non-JSON message, ignore
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      // Auto-reconnect with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectTimerRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, delay);
      }
    };

    ws.onerror = () => {
      setStatus("error");
    };
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptsRef.current = maxReconnectAttempts;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    if (autoConnect && accessToken) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, accessToken, connect, disconnect]);

  return {
    latestNotification,
    unreadDelta,
    status,
    reconnect,
  };
}
