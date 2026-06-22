"use client";

import { useEffect, useState, useCallback } from "react";
import { candidateFeedbackService } from "@/services/candidate-feedback.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { CandidateFeedbackResponse, SubmitCandidateFeedbackRequest } from "@/types";

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`h-6 w-6 transition-colors ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          }`}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => onChange?.(star)}
        >
          <svg
            viewBox="0 0 24 24"
            fill={star <= (hovered || value) ? "#f59e0b" : "none"}
            stroke={star <= (hovered || value) ? "#f59e0b" : "#d1d5db"}
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function CandidateFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<CandidateFeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formInterviewId, setFormInterviewId] = useState("");
  const [formOverallRating, setFormOverallRating] = useState(0);
  const [formInterviewerRating, setFormInterviewerRating] = useState(0);
  const [formProcessRating, setFormProcessRating] = useState(0);
  const [formComments, setFormComments] = useState("");
  const [formWouldRecommend, setFormWouldRecommend] = useState(true);

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const data = await candidateFeedbackService.getMy();
      setFeedbacks(data);
    } catch (error) {
      console.error("Failed to fetch feedback:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const resetForm = () => {
    setFormInterviewId("");
    setFormOverallRating(0);
    setFormInterviewerRating(0);
    setFormProcessRating(0);
    setFormComments("");
    setFormWouldRecommend(true);
  };

  const handleSubmit = async () => {
    if (
      !formInterviewId.trim() ||
      formOverallRating === 0 ||
      formInterviewerRating === 0 ||
      formProcessRating === 0
    ) {
      return;
    }

    try {
      setSubmitting(true);
      const request: SubmitCandidateFeedbackRequest = {
        interviewId: formInterviewId.trim(),
        overallRating: formOverallRating,
        interviewerRating: formInterviewerRating,
        processRating: formProcessRating,
        comments: formComments.trim() || undefined,
        wouldRecommend: formWouldRecommend,
      };
      const newFeedback = await candidateFeedbackService.submit(request);
      setFeedbacks((prev) => [newFeedback, ...prev]);
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-56 bg-slate-200" />
            <Skeleton className="h-4 w-80 bg-slate-200 mt-2" />
          </div>
          <Skeleton className="h-10 w-40 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Candidate Feedback</h1>
          <p className="text-sm text-slate-500 mt-1">
            Rate your interview experience and help us improve.
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Submit Feedback
        </Button>
      </div>

      {/* Empty State */}
      {feedbacks.length === 0 && (
        <Card className="p-12 text-center border-slate-200">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No feedback submitted yet</p>
            <p className="text-sm text-slate-400">
              Share your interview experience to help improve the process.
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Submit Feedback
            </Button>
          </div>
        </Card>
      )}

      {/* Feedback List */}
      {feedbacks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feedbacks.map((feedback) => (
            <Card
              key={feedback.id}
              className="border-slate-200 hover:border-indigo-200 transition-colors"
            >
              <div className="p-5 space-y-4">
                {/* Interview ID */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-mono truncate max-w-[180px]">
                    Interview: {feedback.interviewId}
                  </p>
                  <Badge
                    className={`text-xs border ${
                      feedback.wouldRecommend
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-red-100 text-red-700 border-red-200"
                    }`}
                  >
                    {feedback.wouldRecommend ? "Would Recommend" : "Would Not Recommend"}
                  </Badge>
                </div>

                {/* Ratings */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Overall</span>
                    <StarRating value={feedback.overallRating} readonly />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Interviewer</span>
                    <StarRating value={feedback.interviewerRating} readonly />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Process</span>
                    <StarRating value={feedback.processRating} readonly />
                  </div>
                </div>

                {/* Comments */}
                {feedback.comments && (
                  <p className="text-sm text-slate-600 border-t border-slate-100 pt-3 line-clamp-3">
                    {feedback.comments}
                  </p>
                )}

                {/* Date */}
                <p className="text-xs text-slate-400">
                  Submitted {new Date(feedback.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Submit Feedback Dialog ────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Interview Feedback</DialogTitle>
            <DialogDescription>
              Rate your interview experience. All ratings are required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* Interview ID */}
            <div className="space-y-1.5">
              <Label htmlFor="feedback-interview-id">Interview ID</Label>
              <Input
                id="feedback-interview-id"
                value={formInterviewId}
                onChange={(e) => setFormInterviewId(e.target.value)}
                placeholder="Enter the interview ID"
              />
            </div>

            {/* Overall Rating */}
            <div className="space-y-1.5">
              <Label>Overall Rating</Label>
              <StarRating value={formOverallRating} onChange={setFormOverallRating} />
            </div>

            {/* Interviewer Rating */}
            <div className="space-y-1.5">
              <Label>Interviewer Rating</Label>
              <StarRating value={formInterviewerRating} onChange={setFormInterviewerRating} />
            </div>

            {/* Process Rating */}
            <div className="space-y-1.5">
              <Label>Process Rating</Label>
              <StarRating value={formProcessRating} onChange={setFormProcessRating} />
            </div>

            {/* Comments */}
            <div className="space-y-1.5">
              <Label htmlFor="feedback-comments">Comments (optional)</Label>
              <Textarea
                id="feedback-comments"
                value={formComments}
                onChange={(e) => setFormComments(e.target.value)}
                placeholder="Share your thoughts about the interview experience..."
                rows={4}
              />
            </div>

            {/* Would Recommend */}
            <div className="space-y-1.5">
              <Label>Would you recommend this company?</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormWouldRecommend(true)}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                    formWouldRecommend
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setFormWouldRecommend(false)}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                    !formWouldRecommend
                      ? "bg-red-100 text-red-700 border-red-300"
                      : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(false);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                submitting ||
                !formInterviewId.trim() ||
                formOverallRating === 0 ||
                formInterviewerRating === 0 ||
                formProcessRating === 0
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
