"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { codeEditorService } from "@/services/code-editor.service";
import { copilotService, CopilotSuggestion, CopilotDashboard } from "@/services/copilot.service";
import { transcriptionService, TranscriptionSegment } from "@/services/transcription.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PanelMode = "copilot" | "whiteboard";

interface TimerState {
  elapsed: number;
  total: number;
  running: boolean;
}

export default function InterviewRoomPage() {
  const [interviewId] = useState("demo-interview-001");
  const [code, setCode] = useState<string>("// Start coding here...\n");
  const [language, setLanguage] = useState("javascript");
  const [rightPanel, setRightPanel] = useState<PanelMode>("copilot");
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptionSegment[]>([]);
  const [timer, setTimer] = useState<TimerState>({ elapsed: 0, total: 3600, running: false });
  const [splitPosition, setSplitPosition] = useState(33);
  const [isResizing, setIsResizing] = useState(false);
  const [copilotDashboard, setCopilotDashboard] = useState<CopilotDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeRoom();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initializeRoom = async () => {
    try {
      setLoading(true);
      const [session] = await Promise.all([
        codeEditorService.getActiveSession(interviewId),
      ]);
      if (session) {
        setLanguage(session.language || "javascript");
      }
    } catch (err) {
      console.error("Failed to initialize room:", err);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const copilotRes = await copilotService.start({
        interviewId,
        competencies: ["problem-solving", "coding", "communication"],
        totalMinutes: 60,
      });
      setSessionId(copilotRes.data.sessionId || "session-1");
      setTimer((prev) => ({ ...prev, running: true }));
      startTimer();
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev.elapsed >= prev.total) {
          if (timerRef.current) clearInterval(timerRef.current);
          return { ...prev, running: false };
        }
        return { ...prev, elapsed: prev.elapsed + 1 };
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer((prev) => ({ ...prev, running: false }));
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percentage = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPosition(Math.min(Math.max(20, percentage), 60));
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const getPriorityColor = (priority: CopilotSuggestion["priority"]) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-100 text-red-700 border-red-200";
      case "HIGH": return "bg-orange-100 text-orange-700 border-orange-200";
      case "MEDIUM": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "LOW": return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Setting up interview room...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-slate-700">Interview Room</span>
          <Badge variant="secondary">{language}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className={timer.running ? "text-green-600" : "text-slate-500"}>
              {formatTime(timer.elapsed)}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-400">{formatTime(timer.total)}</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1">
            {!timer.running ? (
              <Button size="sm" onClick={startSession} className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white">
                Start
              </Button>
            ) : (
              <Button size="sm" onClick={pauseTimer} className="h-7 px-3 text-xs" variant="outline">
                Pause
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-7 px-3 text-xs text-red-600 border-red-200">
              End
            </Button>
          </div>
        </div>
      </div>

      {/* Main Split Panels */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Left Panel - Code Editor */}
        <div className="flex flex-col border-r border-slate-200" style={{ width: `${splitPosition}%` }}>
          <div className="h-9 border-b border-slate-200 bg-slate-50 flex items-center px-3 gap-2">
            <span className="text-xs font-medium text-slate-600">Code Editor</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="ml-auto text-xs border border-slate-200 rounded px-2 py-0.5 bg-white"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="go">Go</option>
            </select>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-slate-900 text-green-400 resize-none focus:outline-none"
              spellCheck={false}
              placeholder="// Write your solution here..."
            />
          </div>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-1.5 cursor-col-resize flex items-center justify-center hover:bg-indigo-200 transition-colors ${
            isResizing ? "bg-indigo-300" : "bg-slate-200"
          }`}
        >
          <div className="w-0.5 h-8 rounded bg-slate-400" />
        </div>

        {/* Center Panel - Video Feed */}
        <div className="flex-1 flex flex-col border-r border-slate-200 min-w-[200px]">
          <div className="h-9 border-b border-slate-200 bg-slate-50 flex items-center px-3">
            <span className="text-xs font-medium text-slate-600">Video Feed</span>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-600">REC</span>
            </div>
          </div>
          <div className="flex-1 bg-slate-900 flex items-center justify-center relative">
            {/* Main video placeholder */}
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-slate-700 mx-auto flex items-center justify-center mb-3">
                  <svg className="w-12 h-12 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm">Candidate Video</p>
              </div>
            </div>
            {/* Self-view thumbnail */}
            <div className="absolute bottom-3 right-3 w-32 h-24 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
              <p className="text-slate-500 text-xs">You</p>
            </div>
          </div>
          {/* Video controls */}
          <div className="h-10 border-t border-slate-700 bg-slate-800 flex items-center justify-center gap-3 px-3">
            <button className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white text-xs">
              🎤
            </button>
            <button className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white text-xs">
              📷
            </button>
            <button className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white text-xs">
              🖥️
            </button>
            <button className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white text-xs">
              📞
            </button>
          </div>
        </div>

        {/* Right Panel - AI Copilot / Whiteboard */}
        <div className="w-80 flex flex-col">
          <div className="h-9 border-b border-slate-200 bg-slate-50 flex items-center px-3 gap-2">
            <button
              onClick={() => setRightPanel("copilot")}
              className={`text-xs font-medium px-2 py-1 rounded ${
                rightPanel === "copilot" ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              AI Copilot
            </button>
            <button
              onClick={() => setRightPanel("whiteboard")}
              className={`text-xs font-medium px-2 py-1 rounded ${
                rightPanel === "whiteboard" ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Whiteboard
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {rightPanel === "copilot" ? (
              <div className="space-y-3">
                {/* Copilot Dashboard Summary */}
                {copilotDashboard && (
                  <Card className="border-indigo-200 bg-indigo-50">
                    <CardContent className="p-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500">Progress</span>
                          <p className="font-semibold">{copilotDashboard.interviewProgress}%</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Next Topic</span>
                          <p className="font-semibold truncate">{copilotDashboard.nextRecommendedTopic}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Suggestions */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase">Suggestions</h3>
                  {suggestions.length > 0 ? (
                    suggestions.map((suggestion, idx) => (
                      <Card key={idx} className="border-slate-200">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <Badge className={`text-xs shrink-0 ${getPriorityColor(suggestion.priority)}`}>
                              {suggestion.priority}
                            </Badge>
                            <div>
                              <p className="text-xs font-medium text-slate-700">{suggestion.type.replace(/_/g, " ")}</p>
                              <p className="text-xs text-slate-600 mt-1">{suggestion.content}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-400">No suggestions yet</p>
                      <p className="text-xs text-slate-300 mt-1">AI will provide real-time hints during the interview</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button size="sm" variant="outline" className="text-xs h-8">Ask Follow-up</Button>
                    <Button size="sm" variant="outline" className="text-xs h-8">Give Hint</Button>
                    <Button size="sm" variant="outline" className="text-xs h-8">Rate Answer</Button>
                    <Button size="sm" variant="outline" className="text-xs h-8">Next Question</Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Whiteboard */
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <button className="w-6 h-6 rounded bg-slate-900 border-2 border-slate-300" />
                  <button className="w-6 h-6 rounded bg-red-500 border-2 border-transparent" />
                  <button className="w-6 h-6 rounded bg-blue-500 border-2 border-transparent" />
                  <button className="w-6 h-6 rounded bg-green-500 border-2 border-transparent" />
                  <div className="ml-auto">
                    <Button size="sm" variant="outline" className="h-6 text-xs">Clear</Button>
                  </div>
                </div>
                <div className="flex-1 bg-white border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center">
                  <p className="text-slate-300 text-sm">Whiteboard Canvas</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar - Transcription Stream */}
      <div className="h-24 border-t border-slate-200 bg-slate-50 flex flex-col">
        <div className="flex items-center px-4 h-7 border-b border-slate-200">
          <span className="text-xs font-medium text-slate-600">Live Transcription</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-600">Active</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {transcriptSegments.length > 0 ? (
            <div className="space-y-1">
              {transcriptSegments.map((segment) => (
                <p key={segment.id} className="text-xs text-slate-600">
                  <span className="font-medium text-slate-800">{segment.speaker}:</span>{" "}
                  {segment.text}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Transcription will appear here in real-time as the interview progresses...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
