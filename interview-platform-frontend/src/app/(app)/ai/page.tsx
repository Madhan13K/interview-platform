"use client";

import { useState, useEffect, useCallback } from "react";
import { aiService } from "@/services/ai.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AISuggestionRequest,
  AISuggestionResponse,
  AIResumeParseResponse,
  InterviewType,
} from "@/types";

const INTERVIEW_TYPES: InterviewType[] = [
  "TECHNICAL",
  "BEHAVIORAL",
  "SYSTEM_DESIGN",
  "CODING",
  "HR",
  "CASE_STUDY",
];

const EXPERIENCE_LEVELS = ["Junior", "Mid", "Senior", "Lead"];

const statusColor: Record<string, string> = {
  PENDING: "bg-violet-100 text-violet-800 border-violet-300",
  ACCEPTED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
};

// --- Shimmer loading component ---
function AILoadingShimmer({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4 bg-violet-100"
          style={{ width: `${80 - i * 12}%` }}
        />
      ))}
    </div>
  );
}

export default function AIAssistantPage() {
  // ─── Question Suggestions State ────────────────────────────────────────────
  const [questionForm, setQuestionForm] = useState<AISuggestionRequest>({
    interviewType: "TECHNICAL",
    skills: [],
    experienceLevel: "Mid",
    count: 5,
  });
  const [skillsInput, setSkillsInput] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<
    AISuggestionResponse[]
  >([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // ─── Resume Parser State ───────────────────────────────────────────────────
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeMode, setResumeMode] = useState<"text" | "file">("file");
  const [parsedResume, setParsedResume] = useState<AIResumeParseResponse | null>(
    null
  );
  const [parsingResume, setParsingResume] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // ─── Interview Summary State ───────────────────────────────────────────────
  const [summaryInterviewId, setSummaryInterviewId] = useState("");
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // ─── Suggestion History State ──────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState<AISuggestionResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const pageSize = 10;

  // ─── Load Suggestion History ───────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await aiService.getSuggestions(historyPage, pageSize);
      setSuggestions(res.content);
      setHistoryTotalPages(res.totalPages);
    } catch (err) {
      console.error("Failed to load suggestion history", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleGenerateQuestions = async () => {
    setGeneratingQuestions(true);
    setSuggestedQuestions([]);
    try {
      const skills = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await aiService.suggestQuestions({
        ...questionForm,
        skills,
      });
      setSuggestedQuestions(res);
    } catch (err) {
      console.error("Failed to generate questions", err);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleParseResume = async () => {
    if (resumeMode === "text" && !resumeText.trim()) return;
    if (resumeMode === "file" && !resumeFile) return;
    setParsingResume(true);
    setParsedResume(null);
    try {
      let res: AIResumeParseResponse;
      if (resumeMode === "file" && resumeFile) {
        res = await aiService.parseResumeFile(resumeFile);
      } else {
        res = await aiService.parseResume(resumeText);
      }
      setParsedResume(res);
    } catch (err) {
      console.error("Failed to parse resume", err);
    } finally {
      setParsingResume(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!summaryInterviewId.trim()) return;
    setGeneratingSummary(true);
    setSummaryText(null);
    try {
      const res = await aiService.generateInterviewSummary(summaryInterviewId);
      setSummaryText(res.summary || res.content || JSON.stringify(res));
    } catch (err) {
      console.error("Failed to generate summary", err);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleSuggestionAction = async (
    id: string,
    status: "ACCEPTED" | "REJECTED"
  ) => {
    try {
      await aiService.updateSuggestionStatus(id, status);
      setSuggestedQuestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
      // Also update history if present
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
    } catch (err) {
      console.error("Failed to update suggestion status", err);
    }
  };

  // ─── Filtered suggestions for history ──────────────────────────────────────
  const filteredSuggestions =
    statusFilter === "ALL"
      ? suggestions
      : suggestions.filter((s) => s.status === statusFilter);

  return (
    <div className="space-y-8">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
          <svg
            className="h-6 w-6 text-violet-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
          <p className="text-sm text-gray-500">
            AI-powered tools for smarter interviews
          </p>
        </div>
      </div>

      {/* ─── Feature Cards Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ─── Question Suggestions ─────────────────────────────────────────── */}
        <Card className="border-violet-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-violet-700">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Question Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Interview Type
                </Label>
                <Select
                  value={questionForm.interviewType}
                  onValueChange={(val) =>
                    setQuestionForm((f) => ({
                      ...f,
                      interviewType: val as InterviewType,
                    }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Skills (comma-separated)
                </Label>
                <Input
                  className="mt-1"
                  placeholder="React, TypeScript, Node.js"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Experience Level
                </Label>
                <Select
                  value={questionForm.experienceLevel || "Mid"}
                  onValueChange={(val) =>
                    setQuestionForm((f) => ({ ...f, experienceLevel: val }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Count
                </Label>
                <Input
                  type="number"
                  className="mt-1"
                  min={1}
                  max={20}
                  value={questionForm.count || 5}
                  onChange={(e) =>
                    setQuestionForm((f) => ({
                      ...f,
                      count: parseInt(e.target.value) || 5,
                    }))
                  }
                />
              </div>
            </div>

            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleGenerateQuestions}
              disabled={generatingQuestions}
            >
              {generatingQuestions ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate Questions"
              )}
            </Button>

            {/* Results */}
            {generatingQuestions && <AILoadingShimmer lines={5} />}
            {suggestedQuestions.length > 0 && !generatingQuestions && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {suggestedQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-md border border-violet-100 bg-violet-50/50 p-3"
                  >
                    <p className="text-sm text-gray-800">{q.content}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge
                        className={`text-xs ${statusColor[q.status]}`}
                        variant="outline"
                      >
                        {q.status}
                      </Badge>
                      {q.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-green-700 hover:bg-green-100"
                            onClick={() =>
                              handleSuggestionAction(q.id, "ACCEPTED")
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-red-700 hover:bg-red-100"
                            onClick={() =>
                              handleSuggestionAction(q.id, "REJECTED")
                            }
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Resume Parser ────────────────────────────────────────────────── */}
        <Card className="border-violet-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-violet-700">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Resume Parser
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex rounded-lg border border-violet-200 p-1 bg-violet-50/50">
              <button
                type="button"
                onClick={() => setResumeMode("file")}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  resumeMode === "file"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload PDF
                </span>
              </button>
              <button
                type="button"
                onClick={() => setResumeMode("text")}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  resumeMode === "text"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Paste Text
                </span>
              </button>
            </div>

            {/* File Upload Mode */}
            {resumeMode === "file" && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file && (file.type === "application/pdf" || file.name.endsWith(".pdf") || file.type.includes("word") || file.name.endsWith(".docx"))) {
                    setResumeFile(file);
                  }
                }}
                className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                  dragOver
                    ? "border-violet-400 bg-violet-50 scale-[1.01]"
                    : resumeFile
                    ? "border-violet-300 bg-violet-50/50"
                    : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/30"
                }`}
                onClick={() => document.getElementById("resume-file-input")?.click()}
              >
                <input
                  id="resume-file-input"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setResumeFile(file);
                  }}
                />

                {resumeFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                      <svg className="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{resumeFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {(resumeFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}
                      className="text-xs text-red-500 hover:text-red-700 underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                      <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Drop your resume here or <span className="text-violet-600">browse</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Supports PDF, DOC, DOCX (max 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Text Mode */}
            {resumeMode === "text" && (
              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Paste resume text below
                </Label>
                <Textarea
                  className="mt-1 min-h-[140px] resize-y"
                  placeholder="Paste the full resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </div>
            )}

            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleParseResume}
              disabled={parsingResume || (resumeMode === "text" ? !resumeText.trim() : !resumeFile)}
            >
              {parsingResume ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Parsing Resume...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Parse Resume with AI
                </span>
              )}
            </Button>

            {/* Results */}
            {parsingResume && <AILoadingShimmer lines={6} />}
            {parsedResume && !parsingResume && (
              <div className="space-y-3 max-h-72 overflow-y-auto text-sm">
                {parsedResume.name && (
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>{" "}
                    <span className="text-gray-900">{parsedResume.name}</span>
                  </div>
                )}
                {parsedResume.email && (
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>{" "}
                    <span className="text-gray-900">{parsedResume.email}</span>
                  </div>
                )}
                {parsedResume.phone && (
                  <div>
                    <span className="font-medium text-gray-600">Phone:</span>{" "}
                    <span className="text-gray-900">{parsedResume.phone}</span>
                  </div>
                )}
                {parsedResume.skills.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-600">Skills:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {parsedResume.skills.map((skill, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="bg-violet-50 text-violet-700 border-violet-200 text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {parsedResume.experience.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-600">
                      Experience:
                    </span>
                    <ul className="mt-1 space-y-1">
                      {parsedResume.experience.map((exp, i) => (
                        <li
                          key={i}
                          className="rounded bg-gray-50 px-2 py-1 text-xs"
                        >
                          <span className="font-medium">{exp.role}</span> at{" "}
                          {exp.company}{" "}
                          <span className="text-gray-500">
                            ({exp.duration})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {parsedResume.education.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-600">
                      Education:
                    </span>
                    <ul className="mt-1 space-y-1">
                      {parsedResume.education.map((edu, i) => (
                        <li
                          key={i}
                          className="rounded bg-gray-50 px-2 py-1 text-xs"
                        >
                          <span className="font-medium">{edu.degree}</span> -{" "}
                          {edu.institution}{" "}
                          <span className="text-gray-500">({edu.year})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Interview Summary ────────────────────────────────────────────── */}
        <Card className="border-violet-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-violet-700">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              Interview Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-gray-600">
                Interview ID
              </Label>
              <Input
                className="mt-1"
                placeholder="Enter interview ID"
                value={summaryInterviewId}
                onChange={(e) => setSummaryInterviewId(e.target.value)}
              />
            </div>

            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleGenerateSummary}
              disabled={generatingSummary || !summaryInterviewId.trim()}
            >
              {generatingSummary ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate Summary"
              )}
            </Button>

            {/* Results */}
            {generatingSummary && <AILoadingShimmer lines={6} />}
            {summaryText && !generatingSummary && (
              <div className="rounded-md border border-violet-100 bg-violet-50/50 p-4">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {summaryText}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Suggestion History ─────────────────────────────────────────────── */}
      <Card className="border-violet-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-violet-700">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Suggestion History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-500">Filter:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <Skeleton className="h-6 w-20 bg-violet-100" />
                  <Skeleton className="h-4 w-16 bg-violet-50" />
                  <Skeleton className="h-4 flex-1 bg-gray-100" />
                  <Skeleton className="h-4 w-24 bg-gray-100" />
                </div>
              ))}
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              No suggestions found.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredSuggestions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start gap-3 rounded-md border border-gray-100 bg-gray-50/50 p-3"
                >
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-xs ${statusColor[s.status]}`}
                  >
                    {s.status}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs bg-gray-100 text-gray-600 border-gray-200"
                  >
                    {s.type}
                  </Badge>
                  <p className="flex-1 text-sm text-gray-700 line-clamp-2">
                    {s.content}
                  </p>
                  <span className="shrink-0 text-xs text-gray-400">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {historyTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={historyPage === 0}
                onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-gray-500">
                Page {historyPage + 1} of {historyTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={historyPage >= historyTotalPages - 1}
                onClick={() => setHistoryPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
