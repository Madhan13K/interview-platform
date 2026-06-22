"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  onLanguageChange?: (lang: string) => void;
  readOnly?: boolean;
  height?: string;
  onRun?: () => void;
}

const LANGUAGES = [
  "JavaScript",
  "Python",
  "Java",
  "C++",
  "Go",
  "Rust",
  "TypeScript",
];

// Runtime info for each language
const RUNTIME_INFO: Record<string, { engine: string; version: string }> = {
  JavaScript: { engine: "Browser Sandbox", version: "ES2022" },
  TypeScript: { engine: "Browser Sandbox", version: "ES2022" },
  Python: { engine: "Piston API", version: "3.10.0" },
  Java: { engine: "Piston API", version: "15.0.2" },
  "C++": { engine: "Piston (GCC)", version: "10.2.0" },
  Go: { engine: "Piston API", version: "1.16.2" },
  Rust: { engine: "Piston API", version: "1.68.2" },
};

const KEYWORD_PATTERNS: Record<string, { pattern: RegExp; color: string }[]> = {
  JavaScript: [
    {
      pattern:
        /\b(function|const|let|var|if|else|return|class|import|export|from|default|async|await|new|this|throw|try|catch|finally|for|while|do|switch|case|break|continue|typeof|instanceof|in|of|yield)\b/g,
      color: "#c678dd",
    },
    { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, color: "#d19a66" },
    { pattern: /\b(\d+\.?\d*)\b/g, color: "#d19a66" },
    { pattern: /(\/\/.*$)/gm, color: "#5c6370" },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, color: "#98c379" },
    { pattern: /\b(console|Math|JSON|Object|Array|String|Number|Boolean|Promise|Map|Set)\b/g, color: "#e5c07b" },
  ],
  TypeScript: [
    {
      pattern:
        /\b(function|const|let|var|if|else|return|class|import|export|from|default|async|await|new|this|throw|try|catch|finally|for|while|do|switch|case|break|continue|typeof|instanceof|in|of|yield|interface|type|enum|implements|extends|abstract|declare|namespace|module|readonly|keyof|infer|as|is)\b/g,
      color: "#c678dd",
    },
    { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, color: "#d19a66" },
    { pattern: /\b(\d+\.?\d*)\b/g, color: "#d19a66" },
    { pattern: /(\/\/.*$)/gm, color: "#5c6370" },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, color: "#98c379" },
    { pattern: /\b(console|Math|JSON|Object|Array|String|Number|Boolean|Promise|Map|Set)\b/g, color: "#e5c07b" },
  ],
  Python: [
    {
      pattern:
        /\b(def|class|if|elif|else|return|import|from|as|try|except|finally|raise|for|while|with|yield|lambda|pass|break|continue|and|or|not|in|is|global|nonlocal|assert|del|async|await)\b/g,
      color: "#c678dd",
    },
    { pattern: /\b(True|False|None)\b/g, color: "#d19a66" },
    { pattern: /\b(\d+\.?\d*)\b/g, color: "#d19a66" },
    { pattern: /(#.*$)/gm, color: "#5c6370" },
    { pattern: /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, color: "#98c379" },
    { pattern: /\b(print|len|range|int|str|float|list|dict|set|tuple|type|isinstance|super|self)\b/g, color: "#e5c07b" },
  ],
  Java: [
    {
      pattern:
        /\b(public|private|protected|static|final|abstract|class|interface|extends|implements|new|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|import|package|void|int|long|double|float|boolean|char|byte|short|String|this|super|instanceof|synchronized|volatile|transient|native|enum)\b/g,
      color: "#c678dd",
    },
    { pattern: /\b(true|false|null)\b/g, color: "#d19a66" },
    { pattern: /\b(\d+\.?\d*[fFdDlL]?)\b/g, color: "#d19a66" },
    { pattern: /(\/\/.*$)/gm, color: "#5c6370" },
    { pattern: /("(?:[^"\\]|\\.)*")/g, color: "#98c379" },
    { pattern: /\b(System|Math|Arrays|Collections|List|Map|Set|ArrayList|HashMap)\b/g, color: "#e5c07b" },
  ],
  "C++": [
    {
      pattern:
        /\b(int|long|double|float|char|bool|void|unsigned|signed|short|auto|const|static|extern|register|volatile|inline|virtual|class|struct|union|enum|namespace|using|template|typename|typedef|public|private|protected|friend|operator|new|delete|return|if|else|for|while|do|switch|case|break|continue|try|catch|throw|include|define|ifdef|ifndef|endif)\b/g,
      color: "#c678dd",
    },
    { pattern: /\b(true|false|nullptr|NULL)\b/g, color: "#d19a66" },
    { pattern: /\b(\d+\.?\d*[fFlL]?)\b/g, color: "#d19a66" },
    { pattern: /(\/\/.*$)/gm, color: "#5c6370" },
    { pattern: /("(?:[^"\\]|\\.)*")/g, color: "#98c379" },
    { pattern: /\b(std|cout|cin|endl|vector|string|map|set|pair|queue|stack|sort|printf|scanf)\b/g, color: "#e5c07b" },
  ],
  Go: [
    {
      pattern:
        /\b(func|package|import|var|const|type|struct|interface|map|chan|go|defer|return|if|else|for|range|switch|case|break|continue|select|default|fallthrough|goto)\b/g,
      color: "#c678dd",
    },
    { pattern: /\b(true|false|nil|iota)\b/g, color: "#d19a66" },
    { pattern: /\b(\d+\.?\d*)\b/g, color: "#d19a66" },
    { pattern: /(\/\/.*$)/gm, color: "#5c6370" },
    { pattern: /("(?:[^"\\]|\\.)*"|`[^`]*`)/g, color: "#98c379" },
    { pattern: /\b(fmt|log|os|io|net|http|json|strings|strconv|errors|context|sync|time)\b/g, color: "#e5c07b" },
  ],
  Rust: [
    {
      pattern:
        /\b(fn|let|mut|const|static|struct|enum|impl|trait|type|pub|mod|use|crate|self|super|return|if|else|for|while|loop|match|break|continue|move|async|await|unsafe|where|ref|in|as|dyn|box)\b/g,
      color: "#c678dd",
    },
    { pattern: /\b(true|false|None|Some|Ok|Err|Self)\b/g, color: "#d19a66" },
    { pattern: /\b(\d+\.?\d*[_]?\w*)\b/g, color: "#d19a66" },
    { pattern: /(\/\/.*$)/gm, color: "#5c6370" },
    { pattern: /("(?:[^"\\]|\\.)*")/g, color: "#98c379" },
    { pattern: /\b(println|print|vec|String|Vec|Box|Rc|Arc|Option|Result|HashMap|HashSet)\b/g, color: "#e5c07b" },
  ],
};

function highlightCode(code: string, language: string): string {
  const patterns = KEYWORD_PATTERNS[language] || KEYWORD_PATTERNS["JavaScript"];

  // Escape HTML
  let escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // We'll use a token-based approach to avoid overlapping replacements
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

      // Check for overlap with existing tokens
      const overlaps = tokens.some(
        (t) => start < t.end && end > t.start
      );

      if (!overlaps) {
        tokens.push({ start, end, color, text: match[0] });
      }
    }
  }

  // Sort tokens by position (descending) so we can replace from end to start
  tokens.sort((a, b) => b.start - a.start);

  for (const token of tokens) {
    const before = escaped.slice(0, token.start);
    const after = escaped.slice(token.end);
    escaped = `${before}<span style="color:${token.color}">${token.text}</span>${after}`;
  }

  return escaped;
}

export function CodeEditor({
  value,
  onChange,
  language = "JavaScript",
  onLanguageChange,
  readOnly = false,
  height = "400px",
  onRun,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [currentLanguage, setCurrentLanguage] = useState(language);

  const lineCount = value.split("\n").length;
  const charCount = value.length;

  // Sync scroll between textarea and highlight overlay
  const syncScroll = useCallback(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    const lineNumbers = lineNumbersRef.current;

    if (textarea && highlight) {
      highlight.scrollTop = textarea.scrollTop;
      highlight.scrollLeft = textarea.scrollLeft;
    }
    if (textarea && lineNumbers) {
      lineNumbers.scrollTop = textarea.scrollTop;
    }
  }, []);

  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (readOnly) return;

      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd } = textarea;

      // Tab key inserts 2 spaces
      if (e.key === "Tab") {
        e.preventDefault();
        const before = value.slice(0, selectionStart);
        const after = value.slice(selectionEnd);
        const newValue = `${before}  ${after}`;
        onChange(newValue);

        // Restore cursor position
        requestAnimationFrame(() => {
          textarea.selectionStart = selectionStart + 2;
          textarea.selectionEnd = selectionStart + 2;
        });
      }

      // Enter key with auto-indent
      if (e.key === "Enter") {
        e.preventDefault();
        const before = value.slice(0, selectionStart);
        const after = value.slice(selectionEnd);

        // Get current line's indentation
        const currentLine = before.split("\n").pop() || "";
        const indentMatch = currentLine.match(/^(\s*)/);
        const currentIndent = indentMatch ? indentMatch[1] : "";

        // Check if line ends with { or : (increase indent)
        const trimmedLine = currentLine.trimEnd();
        const shouldIndent =
          trimmedLine.endsWith("{") ||
          trimmedLine.endsWith(":") ||
          trimmedLine.endsWith("(");
        const newIndent = shouldIndent
          ? `${currentIndent}  `
          : currentIndent;

        const newValue = `${before}\n${newIndent}${after}`;
        onChange(newValue);

        requestAnimationFrame(() => {
          const newPos = selectionStart + 1 + newIndent.length;
          textarea.selectionStart = newPos;
          textarea.selectionEnd = newPos;
        });
      }
    },
    [value, onChange, readOnly]
  );

  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang);
    onLanguageChange?.(lang);
  };

  const highlightedCode = highlightCode(value, currentLanguage);

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-gray-700 shadow-xl"
      style={{ height }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-[#181825] px-4 py-2">
        <div className="flex items-center gap-3">
          {/* Language selector */}
          <select
            value={currentLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="rounded-md border border-gray-600 bg-[#1e1e2e] px-2 py-1 text-xs font-medium text-gray-300 outline-none transition-colors hover:border-gray-500 focus:border-indigo-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          {/* Runtime badge */}
          {RUNTIME_INFO[currentLanguage] && (
            <div className="flex items-center gap-1.5 rounded-md border border-gray-600/50 bg-[#1e1e2e] px-2 py-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-medium text-gray-400">
                {RUNTIME_INFO[currentLanguage].engine}
              </span>
              <span className="text-[10px] text-gray-500">
                v{RUNTIME_INFO[currentLanguage].version}
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{lineCount} lines</span>
            <span className="text-gray-700">|</span>
            <span>{charCount} chars</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRun && (
            <button
              type="button"
              onClick={onRun}
              className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-500 active:bg-emerald-700"
            >
              <svg
                className="h-3 w-3"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              Run
            </button>
          )}
        </div>
      </div>

      {/* Editor body */}
      <div className="relative flex flex-1 overflow-hidden bg-[#1e1e2e]">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 select-none overflow-hidden border-r border-gray-700/50 bg-[#181825] py-4 text-right"
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className="px-3 text-xs leading-6 text-gray-600"
              style={{
                fontFamily:
                  "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code area container */}
        <div className="relative flex-1 overflow-hidden">
          {/* Syntax highlighted overlay */}
          <div
            ref={highlightRef}
            className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words p-4 text-sm leading-6"
            style={{
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              color: "#cdd6f4",
            }}
            dangerouslySetInnerHTML={{ __html: highlightedCode + "\n" }}
            aria-hidden="true"
          />

          {/* Textarea (transparent text, handles input) */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            readOnly={readOnly}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className={cn(
              "absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre-wrap break-words bg-transparent p-4 text-sm leading-6 text-transparent caret-gray-300 outline-none",
              readOnly && "cursor-default"
            )}
            style={{
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              caretColor: "#cdd6f4",
            }}
          />
        </div>
      </div>
    </div>
  );
}
