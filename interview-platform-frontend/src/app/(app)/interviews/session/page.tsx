"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import { CODE_EDITOR_ENDPOINTS } from "@/lib/api-endpoints";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { VideoRoom } from "@/components/ui/video-room";

type SessionTab = "code" | "whiteboard" | "notes";
type CodeSubTab = "editor" | "tests";
type SessionStatus = "connecting" | "active" | "ended";

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  description: string;
}

interface TestCaseResult {
  id: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  description: string;
}

interface ExecutionResult {
  output: string;
  error?: string;
  exitCode: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isRemote?: boolean;
}

interface Participant {
  id: string;
  name: string;
  role: string;
  initials: string;
  isOnline: boolean;
}

// ─── Whiteboard Drawing Types ────────────────────────────────────────────────
interface Point {
  x: number;
  y: number;
}

interface DrawStroke {
  points: Point[];
  color: string;
  width: number;
  tool: "pen" | "eraser";
}

export default function InterviewSessionPage() {
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("id") || "";
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<SessionTab>("code");
  const [status, setStatus] = useState<SessionStatus>("connecting");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [notes, setNotes] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", name: user?.firstName || "You", role: "interviewer", initials: (user?.firstName?.[0] || "Y") + (user?.lastName?.[0] || ""), isOnline: true },
  ]);

  // ─── Code Execution & Test Cases State ─────────────────────────────────────
  const [codeSubTab, setCodeSubTab] = useState<CodeSubTab>("editor");
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [newTestInput, setNewTestInput] = useState("");
  const [newTestExpected, setNewTestExpected] = useState("");
  const [newTestDescription, setNewTestDescription] = useState("");

  // ─── Whiteboard State ───────────────────────────────────────────────────────
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawStroke | null>(null);
  const [drawColor, setDrawColor] = useState("#ffffff");
  const [drawWidth, setDrawWidth] = useState(2);
  const [drawTool, setDrawTool] = useState<"pen" | "eraser">("pen");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // ─── Video State ────────────────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const codeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // ─── WebSocket Connection ───────────────────────────────────────────────────
  const {
    status: wsStatus,
    sendChatMessage: wsSendChat,
    sendCodeChange: wsSendCode,
  } = useWebSocket({
    interviewId,
    autoConnect: !!interviewId,
    onChatMessage: (data) => {
      const newMsg: ChatMessage = {
        id: Date.now().toString() + Math.random(),
        sender: data.sender || "Remote",
        text: data.text,
        timestamp: new Date(data.timestamp),
        isRemote: true,
      };
      setMessages((prev) => [...prev, newMsg]);
    },
    onCodeChange: (data) => {
      if (data.userId !== user?.id) {
        setCode(data.code);
        if (data.language) setLanguage(data.language);
      }
    },
    onParticipantJoin: (data) => {
      setParticipants((prev) => {
        if (prev.find((p) => p.id === data.userId)) return prev;
        return [...prev, {
          id: data.userId,
          name: data.name,
          role: data.role,
          initials: data.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
          isOnline: true,
        }];
      });
    },
    onParticipantLeave: (data) => {
      setParticipants((prev) => prev.map((p) => p.id === data.userId ? { ...p, isOnline: false } : p));
    },
  });

  // ─── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ─── Start code session on mount ───────────────────────────────────────────
  useEffect(() => {
    if (!interviewId) return;
    const startSession = async () => {
      try {
        const res = await api.post(CODE_EDITOR_ENDPOINTS.start(interviewId), { language });
        if (res.data?.code) setCode(res.data.code);
        if (res.data?.language) setLanguage(res.data.language);
        setStatus("active");
      } catch {
        // Try getting existing session
        try {
          const res = await api.get(CODE_EDITOR_ENDPOINTS.getActive(interviewId));
          if (res.data?.code) setCode(res.data.code);
          if (res.data?.language) setLanguage(res.data.language);
        } catch {
          // Allow usage anyway
        }
        setStatus("active");
      }
    };
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  // ─── Auto-scroll chat ──────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Video initialization ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isCameraOn) {
      return;
    }

    let cancelled = false;
    const initVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360, facingMode: "user" },
          audio: !isMuted,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        setLocalStream(stream);
        setIsVideoReady(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Failed to access camera/microphone:", err);
        if (!cancelled) setIsVideoReady(false);
      }
    };

    initVideo();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOn]);

  // Update video element when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Toggle mute on existing stream
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // ─── Whiteboard Canvas Drawing ─────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "whiteboard") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to fill container
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Redraw all strokes
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === "eraser" ? "#0f172a" : stroke.color;
      ctx.lineWidth = stroke.tool === "eraser" ? stroke.width * 5 : stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }

    // Draw current stroke
    if (currentStroke && currentStroke.points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = currentStroke.tool === "eraser" ? "#0f172a" : currentStroke.color;
      ctx.lineWidth = currentStroke.tool === "eraser" ? currentStroke.width * 5 : currentStroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(currentStroke.points[0].x, currentStroke.points[0].y);
      for (let i = 1; i < currentStroke.points.length; i++) {
        ctx.lineTo(currentStroke.points[i].x, currentStroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [activeTab, strokes, currentStroke]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const point = getCanvasPoint(e);
    setCurrentStroke({
      points: [point],
      color: drawColor,
      width: drawWidth,
      tool: drawTool,
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStroke) return;
    const point = getCanvasPoint(e);
    setCurrentStroke((prev) =>
      prev ? { ...prev, points: [...prev.points, point] } : null
    );
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawingRef.current || !currentStroke) return;
    isDrawingRef.current = false;
    if (currentStroke.points.length > 1) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  };

  const handleClearWhiteboard = () => {
    setStrokes([]);
    setCurrentStroke(null);
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSaveCode = useCallback(async () => {
    if (!interviewId) return;
    try {
      setSaving(true);
      await api.put(CODE_EDITOR_ENDPOINTS.save(interviewId), { code, language });
    } catch (err) {
      console.error("Failed to save code:", err);
    } finally {
      setSaving(false);
    }
  }, [interviewId, code, language]);

  const handleEndSession = async () => {
    if (!interviewId) return;
    try {
      await api.post(CODE_EDITOR_ENDPOINTS.end(interviewId));
      setStatus("ended");
      if (timerRef.current) clearInterval(timerRef.current);
      // Stop video
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }
    } catch (err) {
      console.error("Failed to end session:", err);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: user?.firstName || "You",
      text: chatInput.trim(),
      timestamp: new Date(),
      isRemote: false,
    };
    setMessages((prev) => [...prev, newMessage]);
    // Send via WebSocket
    wsSendChat(chatInput.trim());
    setChatInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Broadcast code changes with debounce
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (codeDebounceRef.current) clearTimeout(codeDebounceRef.current);
    codeDebounceRef.current = setTimeout(() => {
      wsSendCode(newCode, language);
    }, 500);
  };

  // ─── Code Execution ────────────────────────────────────────────────────────
  const handleRunCode = async () => {
    setIsRunning(true);
    setExecutionResult(null);
    try {
      const res = await api.post("/api/v1/code/execute", { code, language });
      setExecutionResult({
        output: res.data?.output || "",
        error: res.data?.error,
        exitCode: res.data?.exitCode ?? 0,
      });
    } catch (err: any) {
      setExecutionResult({
        output: "",
        error: err?.response?.data?.message || err?.message || "Execution failed",
        exitCode: 1,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // ─── Test Cases ────────────────────────────────────────────────────────────
  const handleAddTestCase = () => {
    if (!newTestInput.trim() && !newTestExpected.trim()) return;
    const newCase: TestCase = {
      id: Date.now().toString(),
      input: newTestInput.trim(),
      expectedOutput: newTestExpected.trim(),
      description: newTestDescription.trim() || `Test ${testCases.length + 1}`,
    };
    setTestCases((prev) => [...prev, newCase]);
    setNewTestInput("");
    setNewTestExpected("");
    setNewTestDescription("");
  };

  const handleRemoveTestCase = (id: string) => {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
    setTestResults((prev) => prev.filter((tr) => tr.id !== id));
  };

  const handleRunTestCases = async () => {
    if (testCases.length === 0) return;
    setIsRunningTests(true);
    setTestResults([]);
    try {
      const res = await api.post("/api/v1/code/execute/test-cases", {
        code,
        language,
        testCases: testCases.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
        })),
      });
      const results: TestCaseResult[] = (res.data?.results || []).map(
        (r: any, i: number) => ({
          id: testCases[i]?.id || i.toString(),
          passed: r.passed,
          actualOutput: r.actualOutput || r.output || "",
          expectedOutput: testCases[i]?.expectedOutput || "",
          description: testCases[i]?.description || `Test ${i + 1}`,
        })
      );
      setTestResults(results);
    } catch (err: any) {
      // Mark all as failed on error
      setTestResults(
        testCases.map((tc) => ({
          id: tc.id,
          passed: false,
          actualOutput: err?.response?.data?.message || "Execution failed",
          expectedOutput: tc.expectedOutput,
          description: tc.description,
        }))
      );
    } finally {
      setIsRunningTests(false);
    }
  };

  // Generate line numbers for code editor
  const lineCount = Math.max(code.split("\n").length, 20);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* ─── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-white">Live Interview Session</h1>
          <Badge className="bg-slate-700 text-slate-300 border border-slate-600 text-xs">
            {interviewId ? `#${interviewId.slice(0, 8)}` : "No ID"}
          </Badge>
          {/* WebSocket status indicator */}
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${
              wsStatus === "connected" ? "bg-green-400" :
              wsStatus === "connecting" ? "bg-yellow-400 animate-pulse" :
              "bg-red-400"
            }`} />
            <span className="text-[10px] text-slate-500">{wsStatus === "connected" ? "Live" : wsStatus}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-mono text-slate-300">{formatTime(elapsedSeconds)}</span>
          </div>

          <Badge
            className={`text-xs border ${
              status === "active"
                ? "bg-green-900/50 text-green-400 border-green-700"
                : status === "connecting"
                ? "bg-yellow-900/50 text-yellow-400 border-yellow-700"
                : "bg-red-900/50 text-red-400 border-red-700"
            }`}
          >
            {status === "active" ? "Live" : status === "connecting" ? "Connecting..." : "Ended"}
          </Badge>

          <Button
            onClick={handleEndSession}
            disabled={status === "ended"}
            className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            End Session
          </Button>
        </div>
      </div>

      {/* ─── Main Area ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel (60%) */}
        <div className="w-[60%] flex flex-col border-r border-slate-700">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
            {(["code", "whiteboard", "notes"] as SessionTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                {tab === "code" ? "Code" : tab === "whiteboard" ? "Whiteboard" : "Notes"}
              </button>
            ))}

            {activeTab === "code" && (
              <div className="ml-auto flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="h-7 px-2 text-xs bg-slate-700 border border-slate-600 text-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                </select>
                <Button
                  onClick={handleRunCode}
                  disabled={isRunning || !code.trim()}
                  className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  {isRunning ? "Running..." : "Run Code"}
                </Button>
                <Button
                  onClick={handleSaveCode}
                  disabled={saving}
                  className="h-7 px-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            )}

            {activeTab === "whiteboard" && (
              <div className="ml-auto flex items-center gap-2">
                {/* Color picker */}
                {["#ffffff", "#ef4444", "#22c55e", "#3b82f6", "#eab308", "#a855f7"].map((color) => (
                  <button
                    key={color}
                    onClick={() => { setDrawColor(color); setDrawTool("pen"); }}
                    className={`h-5 w-5 rounded-full border-2 transition-transform ${
                      drawColor === color && drawTool === "pen" ? "border-white scale-125" : "border-slate-600"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <button
                  onClick={() => setDrawTool("eraser")}
                  className={`h-7 px-2 text-xs rounded transition-colors ${
                    drawTool === "eraser" ? "bg-white text-slate-900" : "bg-slate-700 text-slate-300"
                  }`}
                >
                  Eraser
                </button>
                <select
                  value={drawWidth}
                  onChange={(e) => setDrawWidth(Number(e.target.value))}
                  className="h-7 px-1 text-xs bg-slate-700 border border-slate-600 text-slate-300 rounded"
                >
                  <option value={1}>Thin</option>
                  <option value={2}>Medium</option>
                  <option value={4}>Thick</option>
                  <option value={8}>Bold</option>
                </select>
                <Button
                  onClick={handleClearWhiteboard}
                  className="h-7 px-2 text-xs bg-red-600/80 hover:bg-red-600 text-white"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "code" && (
              <div className="h-full flex flex-col">
                {/* Code Sub-tabs */}
                <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border-b border-slate-700 shrink-0">
                  <button
                    onClick={() => setCodeSubTab("editor")}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      codeSubTab === "editor"
                        ? "bg-slate-700 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Editor
                  </button>
                  <button
                    onClick={() => setCodeSubTab("tests")}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      codeSubTab === "tests"
                        ? "bg-slate-700 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Test Cases
                    {testCases.length > 0 && (
                      <span className="ml-1 text-[10px] bg-slate-600 text-slate-300 px-1 rounded">
                        {testCases.length}
                      </span>
                    )}
                  </button>
                </div>

                {codeSubTab === "editor" ? (
                  <>
                    {/* Code Editor */}
                    <div className="flex-1 flex overflow-hidden">
                      {/* Line Numbers */}
                      <div className="w-12 bg-slate-950 border-r border-slate-800 overflow-hidden py-3 shrink-0">
                        <div className="text-right pr-2">
                          {lineNumbers.map((num) => (
                            <div
                              key={num}
                              className="text-xs leading-5 text-slate-600 font-mono select-none"
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Code Editor */}
                      <textarea
                        value={code}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        spellCheck={false}
                        className="flex-1 bg-slate-950 text-green-300 font-mono text-sm leading-5 p-3 resize-none focus:outline-none placeholder:text-slate-600 overflow-auto"
                        placeholder={`// Start coding here...\n// Language: ${language}\n// Code is synced in real-time with other participants\n\nfunction solution() {\n  \n}`}
                      />
                    </div>

                    {/* Output Console */}
                    {executionResult && (
                      <div className="shrink-0 border-t border-slate-700 bg-slate-950 max-h-40 overflow-auto">
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800">
                          <span className="text-xs font-medium text-slate-400">Output</span>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[10px] border ${
                              executionResult.exitCode === 0
                                ? "bg-green-900/50 text-green-400 border-green-700"
                                : "bg-red-900/50 text-red-400 border-red-700"
                            }`}>
                              Exit: {executionResult.exitCode}
                            </Badge>
                            <button
                              onClick={() => setExecutionResult(null)}
                              className="text-slate-500 hover:text-slate-300 text-xs"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                        <pre className="px-3 py-2 text-xs font-mono whitespace-pre-wrap">
                          {executionResult.error ? (
                            <span className="text-red-400">{executionResult.error}</span>
                          ) : (
                            <span className="text-green-300">{executionResult.output || "(no output)"}</span>
                          )}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  /* Test Cases Sub-tab */
                  <div className="flex-1 overflow-auto p-3 space-y-3">
                    {/* Add Test Case Form */}
                    <div className="space-y-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                      <p className="text-xs font-medium text-slate-300">Add Test Case</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 mb-0.5 block">Input</label>
                          <textarea
                            value={newTestInput}
                            onChange={(e) => setNewTestInput(e.target.value)}
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="e.g. [1, 2, 3]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 mb-0.5 block">Expected Output</label>
                          <textarea
                            value={newTestExpected}
                            onChange={(e) => setNewTestExpected(e.target.value)}
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="e.g. 6"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          value={newTestDescription}
                          onChange={(e) => setNewTestDescription(e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Description (optional)"
                        />
                        <Button
                          onClick={handleAddTestCase}
                          disabled={!newTestInput.trim() && !newTestExpected.trim()}
                          className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Test Cases List */}
                    {testCases.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-slate-400">
                            {testCases.length} test case{testCases.length > 1 ? "s" : ""}
                          </p>
                          <Button
                            onClick={handleRunTestCases}
                            disabled={isRunningTests}
                            className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                          >
                            {isRunningTests ? "Running..." : "Run All Tests"}
                          </Button>
                        </div>

                        {/* Results Summary */}
                        {testResults.length > 0 && (
                          <div className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
                            <span className="text-xs text-green-400 font-medium">
                              Passed: {testResults.filter((r) => r.passed).length}
                            </span>
                            <span className="text-xs text-red-400 font-medium">
                              Failed: {testResults.filter((r) => !r.passed).length}
                            </span>
                          </div>
                        )}

                        {testCases.map((tc) => {
                          const result = testResults.find((r) => r.id === tc.id);
                          return (
                            <div
                              key={tc.id}
                              className={`p-2.5 rounded-lg border text-xs ${
                                result
                                  ? result.passed
                                    ? "bg-green-900/20 border-green-700/50"
                                    : "bg-red-900/20 border-red-700/50"
                                  : "bg-slate-800 border-slate-700"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  {result && (
                                    <span className={`text-[10px] font-bold ${result.passed ? "text-green-400" : "text-red-400"}`}>
                                      {result.passed ? "PASS" : "FAIL"}
                                    </span>
                                  )}
                                  <span className="text-slate-300 font-medium">{tc.description}</span>
                                </div>
                                <button
                                  onClick={() => handleRemoveTestCase(tc.id)}
                                  className="text-slate-500 hover:text-red-400 text-[10px]"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 font-mono">
                                <div>
                                  <span className="text-[10px] text-slate-500">Input:</span>
                                  <p className="text-slate-400 truncate">{tc.input || "(none)"}</p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500">Expected:</span>
                                  <p className="text-slate-400 truncate">{tc.expectedOutput}</p>
                                </div>
                              </div>
                              {result && !result.passed && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-700/50 font-mono">
                                  <span className="text-[10px] text-slate-500">Actual:</span>
                                  <p className="text-red-400 truncate">{result.actualOutput}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "whiteboard" && (
              <div className="h-full relative bg-slate-950">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className="w-full h-full cursor-crosshair"
                />
                {strokes.length === 0 && !currentStroke && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-slate-600 text-sm">Draw on the canvas to start whiteboarding</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "notes" && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-full w-full bg-slate-950 text-slate-200 text-sm p-4 resize-none focus:outline-none placeholder:text-slate-600"
                placeholder={"Type your interview notes here...\n\n- Key observations\n- Technical skills\n- Communication\n- Follow-up questions"}
              />
            )}
          </div>
        </div>

        {/* Right Panel (40%) */}
        <div className="w-[40%] flex flex-col bg-slate-850">
          {/* Video Area */}
          <div className="h-56 border-b border-slate-700 shrink-0">
            <VideoRoom
              roomUrl={undefined}
              onLeave={handleEndSession}
              userName={user?.firstName || "You"}
            />
          </div>

          {/* Participants */}
          <div className="px-3 py-2 border-b border-slate-700 bg-slate-800 shrink-0">
            <p className="text-xs text-slate-500 mb-1.5">Participants ({participants.filter((p) => p.isOnline).length})</p>
            <div className="flex items-center gap-2 flex-wrap">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5">
                  <div className={`relative h-6 w-6 rounded-full flex items-center justify-center ${p.isOnline ? "bg-indigo-600" : "bg-slate-600"}`}>
                    <span className="text-[10px] font-medium text-white">{p.initials}</span>
                    {p.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 border border-slate-800" />
                    )}
                  </div>
                  <span className={`text-xs ${p.isOnline ? "text-slate-300" : "text-slate-500"}`}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-700 bg-slate-800 shrink-0">
              <p className="text-xs font-medium text-slate-400">Chat</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {messages.length === 0 && (
                <p className="text-xs text-slate-600 text-center mt-4">
                  No messages yet. Start the conversation.
                </p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`space-y-0.5 ${msg.isRemote ? "" : "text-right"}`}>
                  <div className={`flex items-center gap-1.5 ${msg.isRemote ? "" : "justify-end"}`}>
                    <span className={`text-xs font-medium ${msg.isRemote ? "text-blue-400" : "text-indigo-400"}`}>
                      {msg.sender}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className={`inline-block max-w-[80%] ${msg.isRemote ? "" : "ml-auto"}`}>
                    <p className={`text-xs break-words rounded-lg px-2.5 py-1.5 ${
                      msg.isRemote
                        ? "bg-slate-700 text-slate-300"
                        : "bg-indigo-600 text-white"
                    }`}>
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="px-3 py-2 border-t border-slate-700 bg-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 h-8 text-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:ring-indigo-500"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 bg-slate-800 border-t border-slate-700 shrink-0">
        <Button
          onClick={() => setIsMuted(!isMuted)}
          className={`h-10 w-10 rounded-full p-0 ${
            isMuted
              ? "bg-red-600 hover:bg-red-700"
              : "bg-slate-700 hover:bg-slate-600"
          }`}
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
        </Button>

        <Button
          onClick={() => {
            if (isCameraOn && localStream) {
              localStream.getTracks().forEach((track) => track.stop());
              setLocalStream(null);
              setIsVideoReady(false);
            }
            setIsCameraOn(!isCameraOn);
          }}
          className={`h-10 w-10 rounded-full p-0 ${
            !isCameraOn
              ? "bg-red-600 hover:bg-red-700"
              : "bg-slate-700 hover:bg-slate-600"
          }`}
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
        </Button>

        <Button
          onClick={() => setIsScreenSharing(!isScreenSharing)}
          className={`h-10 w-10 rounded-full p-0 ${
            isScreenSharing
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-slate-700 hover:bg-slate-600"
          }`}
        >
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
          </svg>
        </Button>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        <Button
          onClick={handleEndSession}
          disabled={status === "ended"}
          className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-full disabled:opacity-50"
        >
          End Call
        </Button>
      </div>
    </div>
  );
}
