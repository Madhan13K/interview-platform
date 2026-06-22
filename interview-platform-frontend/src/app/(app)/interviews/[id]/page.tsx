"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { interviewService } from "@/services/interview.service";
import { scorecardService } from "@/services/scorecard.service";
import { aiService } from "@/services/ai.service";
import api from "@/lib/axios";
import { MEETING_ENDPOINTS } from "@/lib/api-endpoints";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type {
  InterviewResponse,
  InterviewFeedbackResponse,
  InterviewFeedbackRequest,
  ScorecardResponse,
  AISuggestionResponse,
} from "@/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusVariant(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "info" as const;
    case "IN_PROGRESS":
      return "warning" as const;
    case "COMPLETED":
      return "success" as const;
    case "CANCELLED":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function typeVariant(type: string) {
  switch (type) {
    case "TECHNICAL":
      return "default" as const;
    case "BEHAVIORAL":
      return "purple" as const;
    case "SYSTEM_DESIGN":
      return "info" as const;
    case "CODING":
      return "success" as const;
    case "HR":
      return "warning" as const;
    case "CASE_STUDY":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

// ─── Star Rating Component ──────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = readonly ? star <= value : star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`transition-transform duration-100 ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
          >
            <svg
              className={`h-6 w-6 ${
                filled ? "text-amber-400 fill-amber-400" : "text-slate-300 fill-slate-300"
              }`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────

export default function InterviewDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // State
  const [interview, setInterview] = useState<InterviewResponse | null>(null);
  const [feedback, setFeedback] = useState<InterviewFeedbackResponse[]>([]);
  const [scorecards, setScorecards] = useState<ScorecardResponse[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestionResponse[]>([]);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [meetingGenerating, setMeetingGenerating] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState<InterviewFeedbackRequest>({
    rating: 0,
    strengths: "",
    weaknesses: "",
    recommendation: "HIRE",
    notes: "",
  });

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [interviewData, feedbackData, scorecardData, suggestionsData] = await Promise.all([
        interviewService.getById(id),
        interviewService.getFeedback(id),
        scorecardService.getByInterview(id),
        aiService.getSuggestionsByInterview(id),
      ]);
      setInterview(interviewData);
      setFeedback(feedbackData);
      setScorecards(scorecardData);
      setSuggestions(suggestionsData);

      if (interviewData.meetingLink) {
        setMeetingLink(interviewData.meetingLink);
      } else {
        try {
          const meetingRes = await api.get(MEETING_ENDPOINTS.get(id));
          if (meetingRes.data?.meetingUrl) {
            setMeetingLink(meetingRes.data.meetingUrl);
          }
        } catch {
          // No meeting link yet
        }
      }
    } catch (error) {
      console.error("Failed to fetch interview data:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  // Actions
  const handleStatusUpdate = async (status: string) => {
    setStatusUpdating(true);
    try {
      await interviewService.updateStatus(id, status);
      setInterview((prev) => (prev ? { ...prev, status: status as InterviewResponse["status"] } : prev));
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this interview?")) return;
    try {
      await interviewService.cancel(id);
      setInterview((prev) => (prev ? { ...prev, status: "CANCELLED" } : prev));
    } catch (error) {
      console.error("Failed to cancel interview:", error);
    }
  };

  const handleGenerateMeetingLink = async () => {
    setMeetingGenerating(true);
    try {
      const res = await api.post(MEETING_ENDPOINTS.generate(id));
      setMeetingLink(res.data?.meetingUrl || res.data?.meetingLink || null);
    } catch (error) {
      console.error("Failed to generate meeting link:", error);
    } finally {
      setMeetingGenerating(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackForm.rating === 0) return;
    setFeedbackSubmitting(true);
    try {
      await interviewService.submitFeedback(id, feedbackForm);
      const updatedFeedback = await interviewService.getFeedback(id);
      setFeedback(updatedFeedback);
      setFeedbackForm({ rating: 0, strengths: "", weaknesses: "", recommendation: "HIRE", notes: "" });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleSuggestionAction = async (suggestionId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      await aiService.updateSuggestionStatus(suggestionId, status);
      setSuggestions((prev) =>
        prev.map((s) => (s.id === suggestionId ? { ...s, status } : s))
      );
    } catch (error) {
      console.error("Failed to update suggestion:", error);
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 text-lg">Interview not found</p>
        <Link href="/interviews" className="mt-4 text-indigo-600 hover:underline">
          Back to Interviews
        </Link>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* ──── Header Section ──── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/interviews">
            <Button variant="ghost" size="sm">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{interview.title}</h1>
              <Badge variant={typeVariant(interview.type)}>{interview.type}</Badge>
              <Badge variant={statusVariant(interview.status)}>{interview.status}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
              <span>{formatDate(interview.scheduledAt)}</span>
              <span>{formatTime(interview.scheduledAt)}</span>
              <span>{interview.duration} min</span>
            </div>
          </div>
        </div>
      </div>

      {/* ──── Actions Bar ──── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Update Status:</span>
              <Select
                value={interview.status}
                onValueChange={handleStatusUpdate}
              >
                <SelectTrigger className="w-44" disabled={statusUpdating}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="destructive" size="sm" onClick={handleCancel}>
              Cancel Interview
            </Button>
            <Button variant="outline" size="sm">
              Edit Interview
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ──── Left Column ──── */}
        <div className="lg:col-span-2 space-y-6">
          {/* ──── Details Card ──── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interview Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {interview.description && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700">Description</h4>
                  <p className="mt-1 text-sm text-slate-600">{interview.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-700">Candidate</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    {interview.candidateName || interview.candidateId}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-700">Interviewers</h4>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {interview.interviewerNames?.length ? (
                      interview.interviewerNames.map((name, idx) => (
                        <Badge key={idx} variant="secondary">
                          {name}
                        </Badge>
                      ))
                    ) : interview.interviewerIds?.length ? (
                      interview.interviewerIds.map((iId) => (
                        <Badge key={iId} variant="secondary">
                          {iId.slice(0, 8)}...
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">No interviewers assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {interview.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-slate-700">Notes</h4>
                    <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{interview.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <h4 className="text-sm font-medium text-slate-700">Meeting Link</h4>
                {meetingLink ? (
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {meetingLink}
                  </a>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleGenerateMeetingLink}
                    disabled={meetingGenerating}
                  >
                    {meetingGenerating ? "Generating..." : "Generate Meeting Link"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ──── Feedback Section ──── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Feedback</CardTitle>
              <CardDescription>Interview feedback submitted by interviewers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedback.length > 0 ? (
                <div className="space-y-4">
                  {feedback.map((fb) => (
                    <div key={fb.id} className="rounded-lg border border-slate-200 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          {fb.interviewerName || fb.interviewerId.slice(0, 8)}
                        </span>
                        <Badge
                          variant={
                            fb.recommendation === "STRONG_HIRE"
                              ? "success"
                              : fb.recommendation === "HIRE"
                              ? "info"
                              : fb.recommendation === "NO_HIRE"
                              ? "warning"
                              : "destructive"
                          }
                        >
                          {fb.recommendation.replace("_", " ")}
                        </Badge>
                      </div>
                      <StarRating value={fb.rating} readonly />
                      {fb.strengths && (
                        <div>
                          <span className="text-xs font-medium text-slate-500">Strengths:</span>
                          <p className="text-sm text-slate-600">{fb.strengths}</p>
                        </div>
                      )}
                      {fb.weaknesses && (
                        <div>
                          <span className="text-xs font-medium text-slate-500">Weaknesses:</span>
                          <p className="text-sm text-slate-600">{fb.weaknesses}</p>
                        </div>
                      )}
                      {fb.notes && (
                        <div>
                          <span className="text-xs font-medium text-slate-500">Notes:</span>
                          <p className="text-sm text-slate-600">{fb.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No feedback submitted yet.</p>
              )}

              <Separator />

              {/* Submit Feedback Form */}
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-800">Submit Feedback</h4>

                <div>
                  <label className="text-sm font-medium text-slate-700">Rating</label>
                  <StarRating
                    value={feedbackForm.rating}
                    onChange={(val) => setFeedbackForm((prev) => ({ ...prev, rating: val }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Strengths</label>
                  <Textarea
                    placeholder="What did the candidate do well?"
                    value={feedbackForm.strengths}
                    onChange={(e) => setFeedbackForm((prev) => ({ ...prev, strengths: e.target.value }))}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Weaknesses</label>
                  <Textarea
                    placeholder="Areas for improvement"
                    value={feedbackForm.weaknesses}
                    onChange={(e) => setFeedbackForm((prev) => ({ ...prev, weaknesses: e.target.value }))}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Recommendation</label>
                  <Select
                    value={feedbackForm.recommendation}
                    onValueChange={(val) =>
                      setFeedbackForm((prev) => ({
                        ...prev,
                        recommendation: val as InterviewFeedbackRequest["recommendation"],
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select recommendation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STRONG_HIRE">Strong Hire</SelectItem>
                      <SelectItem value="HIRE">Hire</SelectItem>
                      <SelectItem value="NO_HIRE">No Hire</SelectItem>
                      <SelectItem value="STRONG_NO_HIRE">Strong No Hire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Notes</label>
                  <Textarea
                    placeholder="Additional notes..."
                    value={feedbackForm.notes}
                    onChange={(e) => setFeedbackForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <Button type="submit" disabled={feedbackSubmitting || feedbackForm.rating === 0}>
                  {feedbackSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ──── Right Column ──── */}
        <div className="space-y-6">
          {/* ──── Scorecards Section ──── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scorecards</CardTitle>
              <CardDescription>Evaluation scorecards for this interview</CardDescription>
            </CardHeader>
            <CardContent>
              {scorecards.length > 0 ? (
                <div className="space-y-4">
                  {scorecards.map((sc) => (
                    <div key={sc.id} className="rounded-lg border border-slate-200 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          Overall Score
                        </span>
                        <span className="text-lg font-bold text-indigo-600">
                          {sc.overallScore.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Rating</span>
                        <StarRating value={sc.overallRating} readonly />
                      </div>
                      {sc.recommendation && (
                        <Badge variant={
                          sc.recommendation === "STRONG_HIRE"
                            ? "success"
                            : sc.recommendation === "HIRE"
                            ? "info"
                            : sc.recommendation === "NO_HIRE"
                            ? "warning"
                            : "destructive"
                        }>
                          {sc.recommendation.replace(/_/g, " ")}
                        </Badge>
                      )}
                      {sc.scores && sc.scores.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <span className="text-xs font-medium text-slate-500">Criteria Scores:</span>
                          {sc.scores.map((score) => (
                            <div key={score.criteriaId} className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">{score.criteriaName}</span>
                              <span className="font-medium text-slate-800">
                                {score.score}/{score.maxScore}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {sc.notes && (
                        <p className="text-xs text-slate-500 mt-1">{sc.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No scorecards submitted yet.</p>
              )}
            </CardContent>
          </Card>

          {/* ──── AI Suggestions Section ──── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Suggestions</CardTitle>
              <CardDescription>AI-generated suggestions for this interview</CardDescription>
            </CardHeader>
            <CardContent>
              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="rounded-lg border border-slate-200 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{suggestion.type}</Badge>
                        <Badge
                          variant={
                            suggestion.status === "ACCEPTED"
                              ? "success"
                              : suggestion.status === "REJECTED"
                              ? "destructive"
                              : "warning"
                          }
                        >
                          {suggestion.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700">{suggestion.content}</p>
                      {suggestion.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleSuggestionAction(suggestion.id, "ACCEPTED")}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionAction(suggestion.id, "REJECTED")}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No AI suggestions available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
