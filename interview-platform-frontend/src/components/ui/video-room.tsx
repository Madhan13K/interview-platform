"use client";

import { useState, useEffect, useRef } from "react";

interface VideoRoomProps {
  roomUrl?: string;
  onLeave?: () => void;
  userName?: string;
}

type ConnectionStatus = "connecting" | "connected" | "disconnected";

export function VideoRoom({ roomUrl, onLeave, userName = "Guest" }: VideoRoomProps) {
  const [currentRoomUrl, setCurrentRoomUrl] = useState<string | undefined>(roomUrl);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check if Daily.co is configured (room URL must be a valid daily.co URL)
  const isDailyConfigured = currentRoomUrl && currentRoomUrl.includes("daily.co");

  useEffect(() => {
    if (roomUrl) {
      setCurrentRoomUrl(roomUrl);
    }
  }, [roomUrl]);

  useEffect(() => {
    if (!currentRoomUrl) {
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");

    // Simulate connection established after iframe loads
    const timer = setTimeout(() => {
      setConnectionStatus("connected");
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentRoomUrl]);

  const handleCreateRoom = () => {
    // Generate a placeholder room URL for demo purposes
    const roomId = `room-${Date.now().toString(36)}`;
    setCurrentRoomUrl(`https://your-domain.daily.co/${roomId}`);
  };

  const handleLeave = () => {
    setConnectionStatus("disconnected");
    setCurrentRoomUrl(undefined);
    onLeave?.();
  };

  const handleIframeLoad = () => {
    if (currentRoomUrl) {
      setConnectionStatus("connected");
      setParticipantCount(1);
    }
  };

  // Fallback: Video Unavailable
  if (!currentRoomUrl && !isDailyConfigured) {
    return (
      <div className="h-full w-full rounded-xl bg-slate-900 flex flex-col items-center justify-center gap-4 border border-slate-700">
        <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>
        <div className="text-center space-y-2">
          <p className="text-slate-300 text-sm font-medium">Video Unavailable</p>
          <p className="text-slate-500 text-xs max-w-[240px]">
            Configure DAILY_API_KEY in your environment to enable video calls.
          </p>
        </div>
        <button
          onClick={handleCreateRoom}
          className="mt-2 px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          Create Room
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-xl bg-slate-900 flex flex-col overflow-hidden border border-slate-700">
      {/* Connection Status & Participant Count */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              connectionStatus === "connected"
                ? "bg-green-400"
                : connectionStatus === "connecting"
                ? "bg-yellow-400 animate-pulse"
                : "bg-red-400"
            }`}
          />
          <span className="text-xs text-slate-400 capitalize">{connectionStatus}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
          <span className="text-xs text-slate-300 font-medium">{participantCount}</span>
        </div>
      </div>

      {/* Video iframe area */}
      <div className="flex-1 relative bg-black">
        {currentRoomUrl ? (
          <iframe
            ref={iframeRef}
            src={`${currentRoomUrl}?userName=${encodeURIComponent(userName)}`}
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-slate-500 text-sm">No room connected</p>
          </div>
        )}

        {connectionStatus === "connecting" && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-300 text-xs">Connecting to room...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 border-t border-slate-700 shrink-0">
        {/* Mute Mic */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-600"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        {/* Toggle Camera */}
        <button
          onClick={() => setIsCameraOn(!isCameraOn)}
          className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
            !isCameraOn ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-600"
          }`}
          title={isCameraOn ? "Turn off camera" : "Turn on camera"}
        >
          {isCameraOn ? (
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </button>

        {/* Share Screen */}
        <button
          onClick={() => setIsScreenSharing(!isScreenSharing)}
          className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
            isScreenSharing ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-700 hover:bg-slate-600"
          }`}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
          </svg>
        </button>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        {/* Leave Call */}
        <button
          onClick={handleLeave}
          className="h-9 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
          title="Leave call"
        >
          Leave
        </button>
      </div>
    </div>
  );
}
