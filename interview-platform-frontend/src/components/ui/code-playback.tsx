"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface CodeSnapshot {
  code: string;
  language: string;
  timestamp: string;
}

interface CodePlaybackProps {
  snapshots: CodeSnapshot[];
}

// Keyword highlighting patterns for dark theme (replicating code-editor style)
const KEYWORD_PATTERNS: Record<string, { pattern: RegExp; color: string }[]> = {
  javascript: [
    { pattern: /\b(function|const|let|var|if|else|return|class|import|export|from|default|async|await|new|this|throw|try|catch|finally|for|while|do|switch|case|break|continue|typeof|instanceof|in|of|yield)\b/g, color: "#c678dd" },
    { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, color: "#d19a66" },
    { pattern: /\b(\d+\.?\d*)\b/g, color: "#d19a66" },
    { pattern: /(\/\/.*$)/gm, color: "#5c6370" },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, color: "#98c379" },
    { pattern: /\b(console|Math|JSON|Object|Array|String|Number|Boolean|Promise)\b/g, color: "#e5c07b" },
  ],
  typescript: [
    { pattern: /\b(function|const|let|var|if|else|return|class|import|export|from|default|async|await|new|this|throw|try|catch|finally|for|while|do|switch|case|break|continue|typeof|instanceof|in|of|yield|interface|type|enum)\b/g, color: "#c678dd" },
    { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, color: "#d19a66" },
    { pattern: /\b(\d+\.?\d*)\b/g, color: "#d19a66" },
    { pattern: /(\/\/.*$)/gm, color: "#5c6370" },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, color: "#98c379" },
    { pattern: /\b(console|Math|JSON|Object|Array|String|Number|Boolean|Promise)\b/g, color: "#e5c07b" },
  ],
  python: [
    { pattern: /\b(def|class|if|elif|else|return|import|from|as|try|except|finally|raise|for|while|with|yield|lambda|pass|break|continue|and|or|not|in|is)\b/g, color: "#c678dd" },
    { pattern: /\b(True|False|None)\b/g, color: "#d19a66" },
    { pattern: /\b(\d+\.?\d*)\b/g, color: "#d19a66" },
    { pattern: /(#.*$)/gm, color: "#5c6370" },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, color: "#98c379" },
    { pattern: /\b(print|len|range|int|str|float|list|dict|set|tuple|type|self)\b/g, color: "#e5c07b" },
  ],
  java: [
    { pattern: /\b(public|private|protected|static|final|abstract|class|interface|extends|implements|new|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|import|package|void|int|long|double|float|boolean|char|String|this|super)\b/g, color: "#c678dd" },
    { pattern: /\b(true|false|null)\b/g, color: "#d19a66" },
    { pattern: /\b(\d+\.?\d*[fFdDlL]?)\b/g, color: "#d19a66" },
    { pattern: /(\/\/.*$)/gm, color: "#5c6370" },
    { pattern: /("(?:[^"\\]|\\.)*")/g, color: "#98c379" },
    { pattern: /\b(System|Math|Arrays|Collections|List|Map|Set|ArrayList|HashMap)\b/g, color: "#e5c07b" },
  ],
};

function highlightCode(code: string, language: string): string {
  const patterns = KEYWORD_PATTERNS[language] || KEYWORD_PATTERNS["javascript"];

  let escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  interface Token {
    start: number;
    end: number;
    color: string;
    text: string;
  }

  const tokens: Token[] = [];

  for (const { pattern, color } of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(escaped)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const overlaps = tokens.some((t) => start < t.end && end > t.start);
      if (!overlaps) {
        tokens.push({ start, end, color, text: match[0] });
      }
    }
  }

  tokens.sort((a, b) => b.start - a.start);

  for (const token of tokens) {
    const before = escaped.slice(0, token.start);
    const after = escaped.slice(token.end);
    escaped = `${before}<span style="color:${token.color}">${token.text}</span>${after}`;
  }

  return escaped;
}

function computeDiff(prev: string, current: string): { added: number; removed: number } {
  const prevLines = prev.split("\n");
  const currentLines = current.split("\n");

  let added = 0;
  let removed = 0;

  // Simple line-based diff
  const prevSet = new Set(prevLines);
  const currentSet = new Set(currentLines);

  for (const line of currentLines) {
    if (!prevSet.has(line)) added++;
  }
  for (const line of prevLines) {
    if (!currentSet.has(line)) removed++;
  }

  return { added, removed };
}

export function CodePlayback({ snapshots }: CodePlaybackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalFrames = snapshots.length;
  const currentSnapshot = snapshots[currentIndex] || { code: "", language: "javascript", timestamp: "" };
  const previousSnapshot = currentIndex > 0 ? snapshots[currentIndex - 1] : null;

  const diff = previousSnapshot
    ? computeDiff(previousSnapshot.code, currentSnapshot.code)
    : { added: 0, removed: 0 };

  const handlePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= totalFrames - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, speed, totalFrames]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setCurrentIndex(value);
    setIsPlaying(false);
  };

  const highlightedCode = highlightCode(currentSnapshot.code, currentSnapshot.language);
  const lineCount = currentSnapshot.code.split("\n").length;

  if (totalFrames === 0) {
    return (
      <div className="h-full w-full rounded-xl bg-slate-900 flex items-center justify-center border border-slate-700">
        <p className="text-slate-500 text-sm">No snapshots to playback</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-xl bg-slate-900 flex flex-col overflow-hidden border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-300">Code Playback</span>
          <span className="text-xs text-slate-500 font-mono">
            {currentSnapshot.language}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Diff indicator */}
          {previousSnapshot && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-400">+{diff.added}</span>
              <span className="text-red-400">-{diff.removed}</span>
            </div>
          )}
          {/* Frame counter */}
          <span className="text-xs text-slate-400">
            Frame {currentIndex + 1} of {totalFrames}
          </span>
        </div>
      </div>

      {/* Code Display */}
      <div className="flex-1 overflow-auto flex bg-[#1e1e2e]">
        {/* Line numbers */}
        <div className="flex-shrink-0 select-none border-r border-gray-700/50 bg-[#181825] py-3 text-right">
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className="px-3 text-xs leading-6 text-gray-600"
              style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
            >
              {i + 1}
            </div>
          ))}
        </div>
        {/* Code content */}
        <div
          className="flex-1 p-3 text-sm leading-6 whitespace-pre-wrap break-words overflow-auto"
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            color: "#cdd6f4",
          }}
          dangerouslySetInnerHTML={{ __html: highlightedCode + "\n" }}
        />
      </div>

      {/* Controls */}
      <div className="px-4 py-3 bg-slate-800 border-t border-slate-700 shrink-0 space-y-2">
        {/* Timeline slider */}
        <div className="relative w-full">
          <input
            type="range"
            min={0}
            max={totalFrames - 1}
            value={currentIndex}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={handlePlay}
              className="h-8 w-8 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Speed selector */}
            <div className="flex items-center gap-1">
              {([1, 2, 4] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`h-6 px-2 rounded text-xs font-medium transition-colors ${
                    speed === s
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Timestamp */}
          <span className="text-xs text-slate-400 font-mono">
            {currentSnapshot.timestamp || "--:--:--"}
          </span>
        </div>
      </div>
    </div>
  );
}
