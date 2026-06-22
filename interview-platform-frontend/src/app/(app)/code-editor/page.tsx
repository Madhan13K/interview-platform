"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CodeEditor } from "@/components/ui/code-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import { CODE_EDITOR_ENDPOINTS } from "@/lib/api-endpoints";

interface CodeSession {
  id: string;
  interviewId: string;
  language: string;
  code: string;
  status: "ACTIVE" | "ENDED";
  startedAt: string;
}

interface HistoryItem {
  id: string;
  language: string;
  code: string;
  status: string;
  startedAt: string;
  endedAt?: string;
}

// Default code templates for each language
const DEFAULT_TEMPLATES: Record<string, string> = {
  JavaScript: `// JavaScript - Runs in browser sandbox
// Write your solution and click "Run" to execute

function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test
const result = twoSum([2, 7, 11, 15], 9);
console.log("Input: nums = [2, 7, 11, 15], target = 9");
console.log("Output:", result);
console.log("Expected: [0, 1]");
`,
  TypeScript: `// TypeScript - Runs in browser sandbox
// Write your solution and click "Run" to execute

function fibonacci(n: number): number {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const temp = b;
    b = a + b;
    a = temp;
  }
  return b;
}

// Test
for (let i = 0; i < 10; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}
`,
  Python: `# Python 3.10 - Runs via Piston API
# Write your solution and click "Run" to execute

def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test
result = two_sum([2, 7, 11, 15], 9)
print(f"Input: nums = [2, 7, 11, 15], target = 9")
print(f"Output: {result}")
print(f"Expected: [0, 1]")
`,
  Java: `// Java 15 - Runs via Piston API
// Write your solution and click "Run" to execute

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        java.util.Map<Integer, Integer> map = new java.util.HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }

    public static void main(String[] args) {
        int[] result = twoSum(new int[]{2, 7, 11, 15}, 9);
        System.out.println("Input: nums = [2, 7, 11, 15], target = 9");
        System.out.println("Output: [" + result[0] + ", " + result[1] + "]");
        System.out.println("Expected: [0, 1]");
    }
}
`,
  "C++": `// C++ (GCC 10.2) - Runs via Piston API
// Write your solution and click "Run" to execute

#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (map.count(complement)) {
            return {map[complement], i};
        }
        map[nums[i]] = i;
    }
    return {};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    vector<int> result = twoSum(nums, target);
    cout << "Input: nums = [2, 7, 11, 15], target = 9" << endl;
    cout << "Output: [" << result[0] << ", " << result[1] << "]" << endl;
    cout << "Expected: [0, 1]" << endl;
    return 0;
}
`,
  Go: `// Go 1.16 - Runs via Piston API
// Write your solution and click "Run" to execute

package main

import "fmt"

func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if j, ok := seen[complement]; ok {
            return []int{j, i}
        }
        seen[num] = i
    }
    return []int{}
}

func main() {
    nums := []int{2, 7, 11, 15}
    target := 9
    result := twoSum(nums, target)
    fmt.Println("Input: nums = [2, 7, 11, 15], target = 9")
    fmt.Printf("Output: %v\\n", result)
    fmt.Println("Expected: [0, 1]")
}
`,
  Rust: `// Rust 1.68 - Runs via Piston API
// Write your solution and click "Run" to execute

use std::collections::HashMap;

fn two_sum(nums: &[i32], target: i32) -> Vec<usize> {
    let mut map: HashMap<i32, usize> = HashMap::new();
    for (i, &num) in nums.iter().enumerate() {
        let complement = target - num;
        if let Some(&j) = map.get(&complement) {
            return vec![j, i];
        }
        map.insert(num, i);
    }
    vec![]
}

fn main() {
    let nums = vec![2, 7, 11, 15];
    let target = 9;
    let result = two_sum(&nums, target);
    println!("Input: nums = [2, 7, 11, 15], target = 9");
    println!("Output: {:?}", result);
    println!("Expected: [0, 1]");
}
`,
};

export default function CodeEditorPage() {
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("interviewId") || "";

  const [code, setCode] = useState(DEFAULT_TEMPLATES["JavaScript"]);
  const [language, setLanguage] = useState("JavaScript");
  const [session, setSession] = useState<CodeSession | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Handle language change - update code to matching template
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    // Only auto-switch code if it matches the current template (user hasn't modified it)
    const currentTemplate = DEFAULT_TEMPLATES[language];
    if (code === currentTemplate || code.trim() === "") {
      setCode(DEFAULT_TEMPLATES[newLang] || "");
    }
    setOutput(""); // Clear output when language changes
  };

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Start session
  const handleStartSession = async () => {
    if (!interviewId) {
      // Standalone mode - just start timer
      setIsRunning(true);
      setSession({ id: "local", interviewId: "local", language, code, status: "ACTIVE", startedAt: new Date().toISOString() });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(CODE_EDITOR_ENDPOINTS.start(interviewId), { language });
      setSession(res.data);
      if (res.data.code) setCode(res.data.code);
      if (res.data.language) setLanguage(res.data.language);
      setIsRunning(true);
    } catch (err: unknown) {
      // Try to get existing active session
      try {
        const res = await api.get(CODE_EDITOR_ENDPOINTS.getActive(interviewId));
        setSession(res.data);
        if (res.data.code) setCode(res.data.code);
        if (res.data.language) setLanguage(res.data.language);
        setIsRunning(true);
      } catch {
        console.error("Failed to start/get session", err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save code
  const handleSave = async () => {
    if (!interviewId || !session) return;
    setSaving(true);
    try {
      await api.put(CODE_EDITOR_ENDPOINTS.save(interviewId), { code, language });
    } catch (err) {
      console.error("Failed to save", err);
    } finally {
      setSaving(false);
      setTimeout(() => setSaving(false), 500);
    }
  };

  // End session
  const handleEndSession = async () => {
    if (!interviewId || !session) {
      setIsRunning(false);
      setSession(null);
      return;
    }
    try {
      await api.post(CODE_EDITOR_ENDPOINTS.end(interviewId));
      setSession(null);
      setIsRunning(false);
    } catch (err) {
      console.error("Failed to end session", err);
    }
  };

  // Load history
  const loadHistory = async () => {
    if (!interviewId) return;
    try {
      const res = await api.get(CODE_EDITOR_ENDPOINTS.getHistory(interviewId));
      setHistory(res.data || []);
      setShowHistory(true);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  // Run code with actual execution
  /* eslint-disable react-hooks/purity */
  const handleRun = async () => {
    setOutput("Running...\n");

    const lang = language.toLowerCase();

    // JavaScript/TypeScript - execute in browser sandbox
    if (lang === "javascript" || lang === "typescript") {
      try {
        // Create a sandboxed execution environment
        const startTime = Date.now();

        // Capture console.log output
        const sandboxCode = `
          (function() {
            const __logs = [];
            const console = {
              log: (...args) => __logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
              error: (...args) => __logs.push('[ERROR] ' + args.map(a => String(a)).join(' ')),
              warn: (...args) => __logs.push('[WARN] ' + args.map(a => String(a)).join(' ')),
              info: (...args) => __logs.push('[INFO] ' + args.map(a => String(a)).join(' ')),
            };
            try {
              ${code}
            } catch(e) {
              __logs.push('[Runtime Error] ' + e.message);
            }
            return __logs;
          })()
        `;

        // Execute using Function constructor (safer than eval)
        const fn = new Function(`return ${sandboxCode}`);
        const result = fn();
        const endTime = Date.now();
        const execTime = (endTime - startTime).toFixed(2);

        if (Array.isArray(result) && result.length > 0) {
          setOutput(
            `> ${language} Runtime\n` +
            `> Executed in ${execTime}ms\n` +
            `${"─".repeat(40)}\n` +
            result.join("\n") +
            `\n${"─".repeat(40)}\n` +
            `> Process exited with code 0`
          );
        } else {
          setOutput(
            `> ${language} Runtime\n` +
            `> Executed in ${execTime}ms\n` +
            `${"─".repeat(40)}\n` +
            `(No output)\n` +
            `${"─".repeat(40)}\n` +
            `> Process exited with code 0`
          );
        }
      } catch (err: unknown) {
        setOutput(
          `> ${language} Runtime\n` +
          `${"─".repeat(40)}\n` +
          `[Error] ${err instanceof Error ? err.message : String(err)}\n` +
          `${"─".repeat(40)}\n` +
          `> Process exited with code 1`
        );
      }
      return;
    }

    // Python, Java, C++, Go, Rust - use Piston API (free, no API key needed)
    const pistonLanguageMap: Record<string, { language: string; version: string }> = {
      python: { language: "python", version: "3.10.0" },
      java: { language: "java", version: "15.0.2" },
      "c++": { language: "c++", version: "10.2.0" },
      go: { language: "go", version: "1.16.2" },
      rust: { language: "rust", version: "1.68.2" },
    };

    const pistonLang = pistonLanguageMap[lang];

    if (pistonLang) {
      try {
        const startTime = Date.now();
        const response = await fetch("https://emkc.org/api/v2/piston/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: pistonLang.language,
            version: pistonLang.version,
            files: [{ name: `main.${getFileExtension(lang)}`, content: code }],
            stdin: "",
            args: [],
            compile_timeout: 10000,
            run_timeout: 5000,
          }),
        });

        const data = await response.json();
        const endTime = Date.now();
        const execTime = (endTime - startTime).toFixed(0);

        if (data.run) {
          const stdout = data.run.stdout || "";
          const stderr = data.run.stderr || "";
          const exitCode = data.run.code ?? 0;
          const compileOutput = data.compile?.stderr || data.compile?.stdout || "";

          let outputText = `> ${language} Runtime (Piston API)\n`;
          outputText += `> Version: ${pistonLang.version}\n`;
          outputText += `> Network time: ${execTime}ms\n`;
          outputText += `${"─".repeat(40)}\n`;

          if (compileOutput) {
            outputText += `[Compile]\n${compileOutput}\n`;
          }
          if (stdout) {
            outputText += stdout;
            if (!stdout.endsWith("\n")) outputText += "\n";
          }
          if (stderr) {
            outputText += `[stderr]\n${stderr}`;
            if (!stderr.endsWith("\n")) outputText += "\n";
          }
          if (!stdout && !stderr && !compileOutput) {
            outputText += "(No output)\n";
          }

          outputText += `${"─".repeat(40)}\n`;
          outputText += `> Process exited with code ${exitCode}`;

          setOutput(outputText);
        } else if (data.message) {
          setOutput(`> Error: ${data.message}`);
        } else {
          setOutput(`> Unexpected response from runtime`);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setOutput(
          `> ${language} Runtime\n` +
          `${"─".repeat(40)}\n` +
          `[Network Error] Could not reach code execution service.\n` +
          `${errMsg}\n\n` +
          `Tip: The Piston API (emkc.org) may be temporarily unavailable.\n` +
          `JavaScript/TypeScript runs locally in the browser.`
        );
      }
      return;
    }

    // Fallback for unsupported languages
    setOutput(
      `> ${language} is not supported for direct execution.\n` +
      `> Supported runtimes:\n` +
      `>   - JavaScript/TypeScript (browser sandbox)\n` +
      `>   - Python 3.10 (Piston API)\n` +
      `>   - Java 15 (Piston API)\n` +
      `>   - C++ (GCC 10.2, Piston API)\n` +
      `>   - Go 1.16 (Piston API)\n` +
      `>   - Rust 1.68 (Piston API)\n`
    );
  };
  /* eslint-enable react-hooks/purity */

  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      python: "py",
      java: "java",
      "c++": "cpp",
      go: "go",
      rust: "rs",
      javascript: "js",
      typescript: "ts",
    };
    return extensions[lang] || "txt";
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Code Editor</h1>
          <p className="text-sm text-slate-500">
            {interviewId ? `Interview Session: ${interviewId.slice(0, 8)}...` : "Standalone Practice Mode"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <div className={`h-2 w-2 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
            <span className="font-mono text-sm text-slate-700">{formatTime(timer)}</span>
          </div>

          {/* Status */}
          {session && (
            <Badge variant={session.status === "ACTIVE" ? "success" : "secondary"}>
              {session.status}
            </Badge>
          )}

          {/* Actions */}
          {!session ? (
            <Button onClick={handleStartSession} disabled={loading}>
              {loading ? "Starting..." : "Start Session"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <span className="flex items-center gap-1">
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Saving
                  </span>
                ) : "Save"}
              </Button>
              {interviewId && (
                <Button variant="outline" size="sm" onClick={loadHistory}>
                  History
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={handleEndSession}>
                End Session
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Code Editor */}
        <div className="flex-1 min-w-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            onLanguageChange={handleLanguageChange}
            onRun={handleRun}
            height="100%"
            readOnly={!session && !!interviewId}
          />
        </div>

        {/* Right Panel - Output / History */}
        <div className="w-80 flex flex-col gap-3">
          {/* Output Console */}
          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Output
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 px-4 pb-4">
              <div className="h-full rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-400 overflow-auto whitespace-pre-wrap break-words">
                {output || <span className="text-slate-500">{"// Run your code to see output here...\n// Select a language and click Run"}</span>}
              </div>
            </CardContent>
          </Card>

          {/* Session History */}
          {showHistory && history.length > 0 && (
            <Card className="max-h-48 overflow-auto">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Session History</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {history.map((item, i) => (
                  <button
                    key={item.id || i}
                    onClick={() => { setCode(item.code); setLanguage(item.language); }}
                    className="w-full text-left rounded-lg border border-slate-100 p-2 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">{item.language}</span>
                      <Badge variant={item.status === "ACTIVE" ? "success" : "secondary"} className="text-[10px]">
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(item.startedAt).toLocaleString()}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Templates */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1.5">
              {[
                { label: "Two Sum", lang: "JavaScript", code: DEFAULT_TEMPLATES["JavaScript"] },
                { label: "Binary Search", lang: "JavaScript", code: "function binarySearch(arr, target) {\n  let left = 0, right = arr.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}\n\nconst arr = [1, 3, 5, 7, 9, 11, 13];\nconsole.log('Search 7:', binarySearch(arr, 7));\nconsole.log('Search 4:', binarySearch(arr, 4));" },
                { label: "FizzBuzz", lang: "Python", code: "# FizzBuzz in Python\ndef fizzbuzz(n):\n    result = []\n    for i in range(1, n + 1):\n        if i % 15 == 0:\n            result.append('FizzBuzz')\n        elif i % 3 == 0:\n            result.append('Fizz')\n        elif i % 5 == 0:\n            result.append('Buzz')\n        else:\n            result.append(str(i))\n    return result\n\nprint(', '.join(fizzbuzz(20)))" },
                { label: "Python Fibonacci", lang: "Python", code: DEFAULT_TEMPLATES["Python"] },
                { label: "Java Hello", lang: "Java", code: DEFAULT_TEMPLATES["Java"] },
                { label: "C++ Example", lang: "C++", code: DEFAULT_TEMPLATES["C++"] },
                { label: "Go Example", lang: "Go", code: DEFAULT_TEMPLATES["Go"] },
                { label: "Rust Example", lang: "Rust", code: DEFAULT_TEMPLATES["Rust"] },
              ].map((tmpl) => (
                <button
                  key={tmpl.label}
                  onClick={() => { setCode(tmpl.code); handleLanguageChange(tmpl.lang); setCode(tmpl.code); }}
                  className="w-full text-left rounded-md border border-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all"
                >
                  <span className="flex items-center justify-between">
                    <span>{tmpl.label}</span>
                    <span className="text-[10px] text-slate-400">{tmpl.lang}</span>
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
