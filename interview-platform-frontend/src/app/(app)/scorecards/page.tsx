"use client";

import { useEffect, useState } from "react";
import { scorecardService } from "@/services/scorecard.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { EvaluationCriteria, ScorecardResponse } from "@/types";

const RECOMMENDATION_OPTIONS = [
  { value: "", label: "Select Recommendation" },
  { value: "STRONG_HIRE", label: "Strong Hire" },
  { value: "HIRE", label: "Hire" },
  { value: "NO_HIRE", label: "No Hire" },
  { value: "STRONG_NO_HIRE", label: "Strong No Hire" },
];

const recommendationBadgeStyles: Record<string, string> = {
  STRONG_HIRE: "bg-green-100 text-green-800 border-green-200",
  HIRE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  NO_HIRE: "bg-red-100 text-red-800 border-red-200",
  STRONG_NO_HIRE: "bg-red-200 text-red-900 border-red-300",
};

const recommendationLabels: Record<string, string> = {
  STRONG_HIRE: "Strong Hire",
  HIRE: "Hire",
  NO_HIRE: "No Hire",
  STRONG_NO_HIRE: "Strong No Hire",
};

export default function ScorecardsPage() {
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [interviewId, setInterviewId] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [recommendation, setRecommendation] = useState("");
  const [notes, setNotes] = useState("");

  // Lookup scorecards state
  const [lookupInterviewId, setLookupInterviewId] = useState("");
  const [scorecards, setScorecards] = useState<ScorecardResponse[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    fetchCriteria();
  }, []);

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const data = await scorecardService.getAllCriteria();
      setCriteria(data);
    } catch (error) {
      console.error("Failed to fetch criteria:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (criteriaId: string, score: number) => {
    setScores((prev) => ({ ...prev, [criteriaId]: score }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewId || !candidateId || !recommendation) return;

    try {
      setSubmitting(true);
      const scoreEntries = Object.entries(scores).map(([criteriaId, score]) => ({
        criteriaId,
        score,
      }));

      await scorecardService.submit({
        interviewId,
        candidateId,
        scores: scoreEntries,
        recommendation,
        notes: notes || undefined,
      });

      setSubmitted(true);
      // Reset form
      setInterviewId("");
      setCandidateId("");
      setScores({});
      setRecommendation("");
      setNotes("");
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error("Failed to submit scorecard:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookup = async () => {
    if (!lookupInterviewId) return;
    try {
      setLookupLoading(true);
      const data = await scorecardService.getByInterview(lookupInterviewId);
      setScorecards(data);
    } catch (error) {
      console.error("Failed to fetch scorecards:", error);
      setScorecards([]);
    } finally {
      setLookupLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Scorecards</h1>
        <p className="mt-1 text-sm text-slate-500">
          Evaluate candidates with structured scoring criteria.
        </p>
      </div>

      {/* Submit Scorecard Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Submit Scorecard</CardTitle>
        </CardHeader>
        <CardContent>
          {submitted && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Scorecard submitted successfully.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Interview & Candidate IDs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Interview ID <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Enter interview ID"
                  value={interviewId}
                  onChange={(e) => setInterviewId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Candidate ID <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Enter candidate ID"
                  value={candidateId}
                  onChange={(e) => setCandidateId(e.target.value)}
                />
              </div>
            </div>

            {/* Criteria Scoring */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Evaluation Criteria
              </label>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-8 w-48" />
                    </div>
                  ))}
                </div>
              ) : criteria.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">
                  No evaluation criteria found. Contact an admin to create criteria.
                </p>
              ) : (
                <div className="space-y-3">
                  {criteria.map((criterion) => (
                    <div
                      key={criterion.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">
                          {criterion.name}
                        </p>
                        {criterion.description && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {criterion.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
                            {criterion.category}
                          </Badge>
                          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                            {criterion.interviewType}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            Weight: {criterion.weight}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: criterion.maxScore }, (_, i) => i + 1).map(
                          (score) => (
                            <button
                              key={score}
                              type="button"
                              onClick={() => handleScoreChange(criterion.id, score)}
                              className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-all ${
                                scores[criterion.id] === score
                                  ? "bg-indigo-600 text-white shadow-sm"
                                  : scores[criterion.id] && scores[criterion.id] >= score
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {score}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendation */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Overall Recommendation <span className="text-red-500">*</span>
              </label>
              <Select
                required
                options={RECOMMENDATION_OPTIONS}
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Additional notes on the candidate's performance..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={submitting || !interviewId || !candidateId || !recommendation}
            >
              {submitting ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                "Submit Scorecard"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lookup Scorecards by Interview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">View Scorecards by Interview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-slate-700">Interview ID</label>
              <Input
                placeholder="Enter interview ID to look up"
                value={lookupInterviewId}
                onChange={(e) => setLookupInterviewId(e.target.value)}
              />
            </div>
            <Button
              onClick={handleLookup}
              disabled={!lookupInterviewId || lookupLoading}
              variant="outline"
            >
              {lookupLoading ? "Loading..." : "Search"}
            </Button>
          </div>

          {/* Scorecard Results */}
          {lookupLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : scorecards.length > 0 ? (
            <div className="mt-4 space-y-4">
              {scorecards.map((sc) => (
                <div
                  key={sc.id}
                  className="rounded-lg border border-slate-200 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-700">
                        Interviewer: {sc.interviewerId.slice(0, 8)}...
                      </span>
                      <Badge className={recommendationBadgeStyles[sc.recommendation] || "bg-slate-100 text-slate-700"}>
                        {recommendationLabels[sc.recommendation] || sc.recommendation}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatDate(sc.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600">
                      Overall Score: <span className="font-semibold">{sc.overallScore}</span>
                    </span>
                    <span className="text-sm text-slate-600">
                      Rating: <span className="font-semibold">{sc.overallRating}/5</span>
                    </span>
                  </div>

                  {sc.scores && sc.scores.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {sc.scores.map((score) => (
                        <div
                          key={score.criteriaId}
                          className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1"
                        >
                          <span className="text-xs text-slate-600">{score.criteriaName}:</span>
                          <span className="text-xs font-semibold text-slate-800">
                            {score.score}/{score.maxScore}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {sc.notes && (
                    <p className="text-sm text-slate-600 italic">&quot;{sc.notes}&quot;</p>
                  )}
                </div>
              ))}
            </div>
          ) : lookupInterviewId && !lookupLoading ? (
            <p className="mt-4 text-sm text-slate-500">
              No scorecards found for this interview. Click Search to look up.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
