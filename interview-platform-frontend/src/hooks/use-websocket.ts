"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WEBSOCKET_CONFIG } from "@/lib/api-endpoints";
import { useAuthStore } from "@/store/auth.store";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface WebSocketMessage {
  type: string;
  payload: unknown;
  sender?: string;
  timestamp?: string;
}

interface UseWebSocketOptions {
  interviewId: string;
  onMessage?: (message: WebSocketMessage) => void;
  onCodeChange?: (data: { code: string; language: string; userId: string }) => void;
  onChatMessage?: (data: { sender: string; text: string; timestamp: string }) => void;
  onParticipantJoin?: (data: { userId: string; name: string; role: string }) => void;
  onParticipantLeave?: (data: { userId: string }) => void;
  onStatusChange?: (data: { status: string }) => void;
  autoConnect?: boolean;
}

/**
 * WebSocket hook for real-time interview session communication.
 * Handles chat, code sync, participant tracking, and signaling.
 */
export function useWebSocket({
  interviewId,
  onMessage,
  onCodeChange,
  onChatMessage,
  onParticipantJoin,
  onParticipantLeave,
  onStatusChange,
  autoConnect = true,
}: UseWebSocketOptions) {
  const { accessToken: token } = useAuthStore();
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const interviewIdRef = useRef(interviewId);
  const tokenRef = useRef(token);

  // Store callbacks in refs to avoid dependency issues
  const onMessageRef = useRef(onMessage);
  const onCodeChangeRef = useRef(onCodeChange);
  const onChatMessageRef = useRef(onChatMessage);
  const onParticipantJoinRef = useRef(onParticipantJoin);
  const onParticipantLeaveRef = useRef(onParticipantLeave);
  const onStatusChangeRef = useRef(onStatusChange);
  const connectRef = useRef<() => void>(() => {});

  useEffect(() => { interviewIdRef.current = interviewId; }, [interviewId]);
  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onCodeChangeRef.current = onCodeChange; }, [onCodeChange]);
  useEffect(() => { onChatMessageRef.current = onChatMessage; }, [onChatMessage]);
  useEffect(() => { onParticipantJoinRef.current = onParticipantJoin; }, [onParticipantJoin]);
  useEffect(() => { onParticipantLeaveRef.current = onParticipantLeave; }, [onParticipantLeave]);
  useEffect(() => { onStatusChangeRef.current = onStatusChange; }, [onStatusChange]);

  // Define connect function using ref to allow self-reference in reconnect
  useEffect(() => {
    connectRef.current = () => {
      const currentToken = tokenRef.current;
      const currentInterviewId = interviewIdRef.current;

      if (!currentInterviewId || !currentToken) return;
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      setStatus("connecting");

      const wsUrl = WEBSOCKET_CONFIG.endpoint.replace("http", "ws") + `?token=${currentToken}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        reconnectAttemptsRef.current = 0;

        // Subscribe to interview topics
        const subscribeMsg = JSON.stringify({
          type: "SUBSCRIBE",
          topics: [
            WEBSOCKET_CONFIG.topics.interview(currentInterviewId),
            WEBSOCKET_CONFIG.topics.code(currentInterviewId),
            WEBSOCKET_CONFIG.topics.signal(currentInterviewId),
          ],
        });
        ws.send(subscribeMsg);

        // Send join event
        const joinMsg = JSON.stringify({
          type: "JOIN",
          destination: WEBSOCKET_CONFIG.destinations.join(currentInterviewId),
          payload: { interviewId: currentInterviewId },
        });
        ws.send(joinMsg);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessageRef.current?.(message);

          switch (message.type) {
            case "CODE_CHANGE":
            case "FULL_SYNC":
            case "LANGUAGE_CHANGE":
              onCodeChangeRef.current?.(message.payload as { code: string; language: string; userId: string });
              break;
            case "CHAT_MESSAGE":
              onChatMessageRef.current?.(message.payload as { sender: string; text: string; timestamp: string });
              break;
            case "PARTICIPANT_JOIN":
              onParticipantJoinRef.current?.(message.payload as { userId: string; name: string; role: string });
              break;
            case "PARTICIPANT_LEAVE":
              onParticipantLeaveRef.current?.(message.payload as { userId: string });
              break;
            case "STATUS_CHANGE":
              onStatusChangeRef.current?.(message.payload as { status: string });
              break;
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
            connectRef.current();
          }, delay);
        }
      };

      ws.onerror = () => {
        setStatus("error");
      };
    };
  });

  const connect = useCallback(() => {
    connectRef.current();
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptsRef.current = maxReconnectAttempts;

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        const leaveMsg = JSON.stringify({
          type: "LEAVE",
          destination: WEBSOCKET_CONFIG.destinations.leave(interviewIdRef.current),
          payload: { interviewId: interviewIdRef.current },
        });
        wsRef.current.send(leaveMsg);
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  const sendChatMessage = useCallback((text: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    const msg = JSON.stringify({
      type: "CHAT_MESSAGE",
      destination: WEBSOCKET_CONFIG.destinations.chat(interviewIdRef.current),
      payload: { text, timestamp: new Date().toISOString() },
    });
    wsRef.current.send(msg);
  }, []);

  const sendCodeChange = useCallback((code: string, language: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    const msg = JSON.stringify({
      type: "CODE_CHANGE",
      destination: WEBSOCKET_CONFIG.destinations.code(interviewIdRef.current),
      payload: { code, language, changeType: "FULL_SYNC" },
    });
    wsRef.current.send(msg);
  }, []);

  const sendSignal = useCallback((signalData: unknown) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    const msg = JSON.stringify({
      type: "SIGNAL",
      destination: WEBSOCKET_CONFIG.destinations.signal(interviewIdRef.current),
      payload: signalData,
    });
    wsRef.current.send(msg);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && interviewId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, interviewId, connect, disconnect]);

  return {
    status,
    connect,
    disconnect,
    sendChatMessage,
    sendCodeChange,
    sendSignal,
  };
}
