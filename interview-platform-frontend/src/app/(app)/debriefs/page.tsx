"use client";

import { useState, useEffect, useCallback } from "react";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import api from "@/lib/axios";
import { INTERVIEW_ENDPOINTS, SCORECARD_ENDPOINTS } from "@/lib/api-endpoints";

type DebriefStatus = "Scheduled" | "In Progress" | "Completed";
type Decision = "Strong Hire" | "Hire" | "No Hire" | "Strong No Hire";

interface ParticipantScorecard {
  id?: string;
  name: string;
  role: string;
  rating: number;
  recommendation: string;
  notes: string;
  vote?: "Hire" | "No Hire";
  confidence?: "High" | "Medium" | "Low";
}

interface Debrief {
  id: string;
  candidateName: string;
  position: string;
  date: string;
  time: string;
  status: DebriefStatus;
  participants: ParticipantScorecard[];
  agenda: string;
  discussionNotes: string;
  finalDecision?: Decision;
  decisionTimestamp?: string;
  decisionRationale?: string;
  interviewId: string;
}

export default function DebriefsPage() {
  const [debriefs, setDebriefs] = useState<Debrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDebrief, setSelectedDebrief] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DebriefStatus | "All">("All");
  const { withFeedback } = useActionFeedback();

  const fetchDebriefs = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch completed/recent interviews that need debriefing
      const response = await api.get(INTERVIEW_ENDPOINTS.getPaginated, {
        params: { page: 0, size: 20, sort: "startTime,desc" },
      });

      const interviews = response.data.content || response.data || [];

      // For each interview, fetch feedback/scorecards to build debrief data
      const debriefData: Debrief[] = await Promise.all(
        interviews.map(async (interview: {
          id: string;
          title?: string;
          candidateName?: string;
          candidateId?: string;
          startTime?: string;
          scheduledAt?: string;
          status?: string;
          interviewerNames?: string[];
          type?: string;
        }) => {
          let participants: ParticipantScorecard[] = [];

          try {
            // Try to fetch scorecards for this interview
            const scorecardRes = await api.get(SCORECARD_ENDPOINTS.getByInterview(interview.id));
            const scorecards = scorecardRes.data || [];
            participants = scorecards.map((sc: {
              id: string;
              interviewerName?: string;
              interviewerId?: string;
              overallScore?: number;
              recommendation?: string;
              overallComments?: string;
              strengths?: string;
            }) => ({
              id: sc.id,
              name: sc.interviewerName || sc.interviewerId || "Interviewer",
              role: "Interviewer",
              rating: sc.overallScore || 0,
              recommendation: sc.recommendation || "",
              notes: sc.overallComments || sc.strengths || "",
            }));
          } catch {
            // If no scorecards, try feedback
            try {
              const feedbackRes = await api.get(INTERVIEW_ENDPOINTS.getFeedback(interview.id));
              const feedbacks = feedbackRes.data || [];
              participants = feedbacks.map((fb: {
                id: string;
                interviewerName?: string;
                interviewerId?: string;
                rating?: number;
                recommendation?: string;
                notes?: string;
                strengths?: string;
              }) => ({
                id: fb.id,
                name: fb.interviewerName || fb.interviewerId || "Interviewer",
                role: "Interviewer",
                rating: fb.rating || 0,
                recommendation: fb.recommendation || "",
                notes: fb.notes || fb.strengths || "",
              }));
            } catch {
              // No feedback available yet
              participants = (interview.interviewerNames || []).map((name: string) => ({
                name,
                role: "Interviewer",
                rating: 0,
                recommendation: "",
                notes: "",
              }));
            }
          }

          const interviewDate = interview.startTime || interview.scheduledAt || "";
          const dateObj = interviewDate ? new Date(interviewDate) : new Date();

          let debriefStatus: DebriefStatus = "Scheduled";
          if (interview.status === "COMPLETED") {
            debriefStatus = participants.some((p) => p.rating > 0) ? "Completed" : "In Progress";
          } else if (interview.status === "IN_PROGRESS") {
            debriefStatus = "In Progress";
          }

          return {
            id: interview.id,
            candidateName: interview.candidateName || "Unknown Candidate",
            position: interview.title || interview.type || "Interview",
            date: dateObj.toISOString().split("T")[0],
            time: dateObj.toTimeString().slice(0, 5),
            status: debriefStatus,
            participants,
            agenda: `Debrief for ${interview.title || "interview"}`,
            discussionNotes: "",
            interviewId: interview.id,
          };
        })
      );

      setDebriefs(debriefData);
    } catch (err) {
      console.error("Failed to fetch debrief data:", err);
      setDebriefs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDebriefs();
  }, [fetchDebriefs]);

  const filteredDebriefs = debriefs.filter((d) =>
    statusFilter === "All" ? true : d.status === statusFilter
  );

  const activeDebrief = debriefs.find((d) => d.id === selectedDebrief);

  const submitFeedback = async (interviewId: string, rating: number, recommendation: string, notes: string) => {
    await withFeedback(
      async () => {
        await api.post(INTERVIEW_ENDPOINTS.submitFeedback(interviewId), {
          rating,
          recommendation,
          notes,
          strengths: notes,
        });
        await fetchDebriefs();
      },
      { successTitle: "Feedback submitted successfully" }
    );
  };

  const recordDecision = async (debriefId: string, decision: Decision) => {
    const rationale = prompt("Enter rationale for this decision:");
    if (rationale === null) return;

    await withFeedback(
      async () => {
        // Update interview status based on decision
        const newStatus = decision.includes("Hire") ? "COMPLETED" : "COMPLETED";
        await api.patch(INTERVIEW_ENDPOINTS.updateStatus(debriefId), { status: newStatus });

        // Update local state
        setDebriefs(
          debriefs.map((d) =>
            d.id === debriefId
              ? {
                  ...d,
                  finalDecision: decision,
                  decisionTimestamp: new Date().toISOString(),
                  decisionRationale: rationale,
                  status: "Completed" as DebriefStatus,
                }
              : d
          )
        );
      },
      { successTitle: `Decision recorded: ${decision}` }
    );
  };

  const getStatusBadge = (status: DebriefStatus) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
      case "In Progress":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400";
      case "Completed":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400";
    }
  };

  const getConsensusBadge = (participants: ParticipantScorecard[]) => {
    const rated = participants.filter((p) => p.rating > 0);
    if (rated.length === 0) return null;
    const avgRating = rated.reduce((acc, p) => acc + p.rating, 0) / rated.length;
    if (avgRating >= 4) return { label: "Strong Positive", className: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
    if (avgRating >= 3) return { label: "Positive", className: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" };
    if (avgRating >= 2) return { label: "Mixed", className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
    return { label: "Negative", className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  };

  const getDecisionColor = (decision: Decision) => {
    switch (decision) {
      case "Strong Hire": return "bg-green-600 hover:bg-green-700";
      case "Hire": return "bg-green-500 hover:bg-green-600";
      case "No Hire": return "bg-red-500 hover:bg-red-600";
      case "Strong No Hire": return "bg-red-700 hover:bg-red-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Interview Debriefs</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Collaborative hiring decisions based on interview feedback
            </p>
          </div>
          <button
            onClick={fetchDebriefs}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Refresh
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-1 bg-slate-200 dark:bg-slate-700 rounded-lg p-1 mb-6 w-fit">
          {(["All", "Scheduled", "In Progress", "Completed"] as (DebriefStatus | "All")[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {filteredDebriefs.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <p className="text-slate-400 text-lg">No interviews found for debriefing</p>
            <p className="text-sm text-slate-400 mt-1">Interviews will appear here once scheduled or completed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Debrief List */}
            <div className="lg:col-span-1 space-y-3">
              {filteredDebriefs.map((debrief) => {
                const consensus = getConsensusBadge(debrief.participants);
                return (
                  <button
                    key={debrief.id}
                    onClick={() => setSelectedDebrief(debrief.id)}
                    className={`w-full text-left bg-white dark:bg-slate-800 rounded-xl border p-4 transition-colors ${
                      selectedDebrief === debrief.id
                        ? "border-indigo-300 dark:border-indigo-600 ring-2 ring-indigo-100 dark:ring-indigo-900/30"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{debrief.candidateName}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusBadge(debrief.status)}`}>
                        {debrief.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{debrief.position}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 dark:text-slate-500">
                        {debrief.date} at {debrief.time}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">
                        {debrief.participants.length} participants
                      </span>
                    </div>
                    {consensus && (
                      <div className="mt-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${consensus.className}`}>
                          {consensus.label}
                        </span>
                      </div>
                    )}
                    {debrief.finalDecision && (
                      <div className="mt-2">
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Decision: {debrief.finalDecision}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Debrief Detail */}
            <div className="lg:col-span-2">
              {!activeDebrief ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                  <p className="text-slate-400 text-lg">Select an interview to view debrief details</p>
                  <p className="text-slate-400 text-sm mt-1">Click on an interview from the list to see scorecards and feedback.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Detail Header */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeDebrief.candidateName}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{activeDebrief.position}</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                          {activeDebrief.date} at {activeDebrief.time} - {activeDebrief.status}
                        </p>
                      </div>
                      {activeDebrief.finalDecision && (
                        <div className="text-right">
                          <p className="text-xs text-slate-400 mb-1">Final Decision</p>
                          <span className="px-3 py-1 bg-slate-900 dark:bg-slate-600 text-white rounded-md text-sm font-bold">
                            {activeDebrief.finalDecision}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Participant Scorecards */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                      Participant Feedback ({activeDebrief.participants.length})
                    </h3>
                    {activeDebrief.participants.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        No feedback submitted yet. Interviewers need to submit their evaluations.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {activeDebrief.participants.map((participant, idx) => (
                          <div key={idx} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">{participant.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{participant.role}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                {participant.rating > 0 && (
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span
                                        key={star}
                                        className={`text-sm ${star <= participant.rating ? "text-amber-400" : "text-slate-200 dark:text-slate-600"}`}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {participant.recommendation && (
                                  <span
                                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                                      participant.recommendation.includes("NO")
                                        ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        : participant.recommendation === "MAYBE"
                                        ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                        : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    }`}
                                  >
                                    {participant.recommendation}
                                  </span>
                                )}
                              </div>
                            </div>
                            {participant.notes && (
                              <p className="text-sm text-slate-600 dark:text-slate-300">{participant.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Final Decision */}
                  {!activeDebrief.finalDecision && activeDebrief.status !== "Scheduled" && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Record Final Decision</h3>
                      <div className="flex gap-3">
                        {(["Strong Hire", "Hire", "No Hire", "Strong No Hire"] as Decision[]).map((decision) => (
                          <button
                            key={decision}
                            onClick={() => recordDecision(activeDebrief.id, decision)}
                            className={`px-4 py-2 text-white rounded-lg text-sm font-medium ${getDecisionColor(decision)}`}
                          >
                            {decision}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
