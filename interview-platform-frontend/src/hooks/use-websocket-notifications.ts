"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";

interface WebSocketNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export function useWebSocketNotifications() {
  const [notifications, setNotifications] = useState<WebSocketNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { accessToken } = useAuthStore();

  const connect = useCallback(() => {
    if (!accessToken) return;
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'}/ws/notifications?token=${accessToken}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log('[WS] Connected to notification stream');
      };

      ws.onmessage = (event) => {
        try {
          const notification: WebSocketNotification = JSON.parse(event.data);
          setNotifications((prev) => [notification, ...prev].slice(0, 100));
          setUnreadCount((prev) => prev + 1);
          
          // Show browser notification if permitted
          if (Notification.permission === 'granted') {
            new Notification(notification.title, { body: notification.body });
          }
        } catch (e) { console.error('[WS] Parse error:', e); }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimerRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => { ws.close(); };
    } catch (e) { console.error('[WS] Connection error:', e); }
  }, [accessToken]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (wsRef.current) wsRef.current.close();
    setConnected(false);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  useEffect(() => { connect(); return disconnect; }, [connect, disconnect]);

  return { notifications, connected, unreadCount, markAllRead, disconnect };
}
