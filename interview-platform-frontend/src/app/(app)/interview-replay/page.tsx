"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { videoService } from "@/services/video.service";
import { transcriptionService, TranscriptionSegment } from "@/services/transcription.service";
import { recordingHighlightsService, RecordingHighlight } from "@/services/recording-highlights.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Bookmark {
  id: string;
  time: number;
  label: string;
  type: RecordingHighlight["type"];
}

export default function InterviewReplayPage() {
  const [interviewId] = useState("demo-interview-001");
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(3600); // 1 hour mock
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [highlights, setHighlights] = useState<RecordingHighlight[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newBookmarkLabel, setNewBookmarkLabel] = useState("");
  const [showBookmarkInput, setShowBookmarkInput] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReplayData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    // Sync active segment with current time
    const activeSegment = segments.find(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    );
    if (activeSegment && activeSegment.id !== activeSegmentId) {
      setActiveSegmentId(activeSegment.id);
      // Auto-scroll transcript
      const element = document.getElementById(`segment-${activeSegment.id}`);
      if (element && transcriptRef.current) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentTime, segments, activeSegmentId]);

  const loadReplayData = async () => {
    try {
      setLoading(true);
      // Load mock segments
      const mockSegments: TranscriptionSegment[] = [
        { id: "s1", speaker: "Interviewer", text: "Welcome! Can you tell me about your experience with distributed systems?", startTime: 5, endTime: 12, confidence: 0.95 },
        { id: "s2", speaker: "Candidate", text: "Absolutely. I've spent the last 3 years working on microservices architecture at scale.", startTime: 13, endTime: 20, confidence: 0.92 },
        { id: "s3", speaker: "Candidate", text: "We handled about 50,000 requests per second across 40 services.", startTime: 21, endTime: 27, confidence: 0.88 },
        { id: "s4", speaker: "Interviewer", text: "That's impressive. How did you handle service discovery?", startTime: 30, endTime: 35, confidence: 0.94 },
        { id: "s5", speaker: "Candidate", text: "We used Consul for service discovery combined with Envoy as our service mesh.", startTime: 36, endTime: 43, confidence: 0.91 },
        { id: "s6", speaker: "Interviewer", text: "What about handling failures and circuit breaking?", startTime: 48, endTime: 53, confidence: 0.93 },
        { id: "s7", speaker: "Candidate", text: "We implemented the circuit breaker pattern with exponential backoff and used Hystrix-style fallbacks.", startTime: 54, endTime: 63, confidence: 0.89 },
        { id: "s8", speaker: "Interviewer", text: "Can you walk me through a specific incident you handled?", startTime: 67, endTime: 72, confidence: 0.96 },
        { id: "s9", speaker: "Candidate", text: "Sure. We had a cascading failure that took down our payment service. I led the incident response...", startTime: 73, endTime: 85, confidence: 0.87 },
        { id: "s10", speaker: "Interviewer", text: "Great problem-solving approach. Now let's move to a coding exercise.", startTime: 90, endTime: 96, confidence: 0.94 },
      ];
      setSegments(mockSegments);

      const mockHighlights: RecordingHighlight[] = [
        { id: "h1", interviewId, startTime: 21, endTime: 27, label: "Strong scaling experience", type: "STRONG_ANSWER", confidence: 0.9, transcript: "", createdAt: "", createdBy: null },
        { id: "h2", interviewId, startTime: 54, endTime: 63, label: "Circuit breaker knowledge", type: "KEY_MOMENT", confidence: 0.85, transcript: "", createdAt: "", createdBy: null },
        { id: "h3", interviewId, startTime: 73, endTime: 85, label: "Incident response leadership", type: "STRONG_ANSWER", confidence: 0.92, transcript: "", createdAt: "", createdBy: null },
      ];
      setHighlights(mockHighlights);
    } catch (err) {
      console.error("Failed to load replay data:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = () => {
    if (playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPlaying(false);
    } else {
      setPlaying(true);
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            if (timerRef.current) clearInterval(timerRef.current);
            setPlaying(false);
            return duration;
          }
          return prev + playbackSpeed;
        });
      }, 1000);
    }
  };

  const seekTo = (time: number) => {
    setCurrentTime(Math.min(Math.max(0, time), duration));
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    seekTo(Math.floor(percentage * duration));
  };

  const addBookmark = () => {
    if (!newBookmarkLabel.trim()) return;
    const bookmark: Bookmark = {
      id: `bm_${Date.now()}`,
      time: currentTime,
      label: newBookmarkLabel.trim(),
      type: "BOOKMARK",
    };
    setBookmarks((prev) => [...prev, bookmark].sort((a, b) => a.time - b.time));
    setNewBookmarkLabel("");
    setShowBookmarkInput(false);
  };

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getHighlightColor = (type: RecordingHighlight["type"]) => {
    switch (type) {
      case "STRONG_ANSWER": return "bg-green-500";
      case "KEY_MOMENT": return "bg-blue-500";
      case "RED_FLAG": return "bg-red-500";
      case "FOLLOW_UP_NEEDED": return "bg-amber-500";
      case "BOOKMARK": return "bg-purple-500";
    }
  };

  const getHighlightBadgeColor = (type: RecordingHighlight["type"]) => {
    switch (type) {
      case "STRONG_ANSWER": return "bg-green-100 text-green-700";
      case "KEY_MOMENT": return "bg-blue-100 text-blue-700";
      case "RED_FLAG": return "bg-red-100 text-red-700";
      case "FOLLOW_UP_NEEDED": return "bg-amber-100 text-amber-700";
      case "BOOKMARK": return "bg-purple-100 text-purple-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading interview replay...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Interview Replay</h1>
          <p className="text-xs text-slate-500">Technical Interview - Senior Engineer</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{formatTime(currentTime)} / {formatTime(duration)}</Badge>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video / Player Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Placeholder */}
          <div className="flex-1 bg-slate-900 flex items-center justify-center relative">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-slate-700 mx-auto flex items-center justify-center mb-3">
                <svg className="w-10 h-10 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm">Interview Recording</p>
            </div>
            {/* Time overlay */}
            <div className="absolute bottom-4 left-4 text-white font-mono text-sm bg-black/60 px-2 py-1 rounded">
              {formatTime(currentTime)}
            </div>
          </div>

          {/* Timeline & Controls */}
          <div className="bg-white border-t border-slate-200 p-4 space-y-3">
            {/* Timeline */}
            <div className="relative cursor-pointer" onClick={handleTimelineClick}>
              {/* Track */}
              <div className="h-2 bg-slate-200 rounded-full relative overflow-visible">
                {/* Progress */}
                <div
                  className="absolute h-full bg-indigo-500 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                {/* Highlights markers */}
                {highlights.map((h) => (
                  <div
                    key={h.id}
                    className={`absolute top-0 h-full rounded-sm opacity-60 ${getHighlightColor(h.type)}`}
                    style={{
                      left: `${(h.startTime / duration) * 100}%`,
                      width: `${((h.endTime - h.startTime) / duration) * 100}%`,
                    }}
                    title={h.label}
                  />
                ))}
                {/* Bookmark markers */}
                {bookmarks.map((b) => (
                  <div
                    key={b.id}
                    className="absolute top-[-3px] w-2 h-2 rounded-full bg-purple-500 border border-white"
                    style={{ left: `${(b.time / duration) * 100}%` }}
                    title={b.label}
                  />
                ))}
              </div>
              {/* Playhead */}
              <div
                className="absolute top-[-2px] w-3 h-3 bg-indigo-600 rounded-full border-2 border-white shadow"
                style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => seekTo(currentTime - 10)} variant="outline" className="h-8 px-2 text-xs">
                  -10s
                </Button>
                <Button
                  size="sm"
                  onClick={togglePlayback}
                  className="h-9 w-9 p-0 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {playing ? "⏸" : "▶"}
                </Button>
                <Button size="sm" onClick={() => seekTo(currentTime + 10)} variant="outline" className="h-8 px-2 text-xs">
                  +10s
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {showBookmarkInput ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={newBookmarkLabel}
                      onChange={(e) => setNewBookmarkLabel(e.target.value)}
                      placeholder="Bookmark label..."
                      className="h-8 w-40 text-xs"
                      onKeyDown={(e) => e.key === "Enter" && addBookmark()}
                    />
                    <Button size="sm" onClick={addBookmark} className="h-8 text-xs">Add</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowBookmarkInput(false)} className="h-8 text-xs">Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setShowBookmarkInput(true)} className="h-8 text-xs">
                    + Bookmark
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Transcript & Bookmarks */}
        <div className="w-96 border-l border-slate-200 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <TabButton label="Transcript" active={true} />
          </div>

          {/* Transcript */}
          <div ref={transcriptRef} className="flex-1 overflow-y-auto p-4 space-y-2">
            {segments.map((segment) => (
              <button
                key={segment.id}
                id={`segment-${segment.id}`}
                onClick={() => seekTo(segment.startTime)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeSegmentId === segment.id
                    ? "bg-indigo-50 border border-indigo-200"
                    : "hover:bg-slate-50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${
                    segment.speaker === "Interviewer" ? "text-indigo-600" : "text-green-600"
                  }`}>
                    {segment.speaker}
                  </span>
                  <span className="text-xs text-slate-400">{formatTime(segment.startTime)}</span>
                </div>
                <p className="text-sm text-slate-700">{segment.text}</p>
              </button>
            ))}
          </div>

          {/* Highlights & Bookmarks */}
          <div className="h-48 border-t border-slate-200 overflow-y-auto p-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">
              Highlights & Bookmarks
            </h3>
            <div className="space-y-1.5">
              {highlights.map((h) => (
                <button
                  key={h.id}
                  onClick={() => seekTo(h.startTime)}
                  className="w-full flex items-center gap-2 p-2 rounded text-left hover:bg-slate-50"
                >
                  <Badge className={`text-xs ${getHighlightBadgeColor(h.type)}`}>
                    {h.type.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-xs text-slate-600 truncate flex-1">{h.label}</span>
                  <span className="text-xs text-slate-400">{formatTime(h.startTime)}</span>
                </button>
              ))}
              {bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-slate-50"
                >
                  <button onClick={() => seekTo(b.time)} className="flex items-center gap-2 flex-1">
                    <Badge className="text-xs bg-purple-100 text-purple-700">BOOKMARK</Badge>
                    <span className="text-xs text-slate-600 truncate">{b.label}</span>
                    <span className="text-xs text-slate-400">{formatTime(b.time)}</span>
                  </button>
                  <button onClick={() => removeBookmark(b.id)} className="text-slate-300 hover:text-red-500 text-xs">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, active }: { label: string; active: boolean }) {
  return (
    <button
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-indigo-500 text-indigo-600"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}
