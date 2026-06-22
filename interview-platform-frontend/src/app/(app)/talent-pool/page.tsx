"use client";

import { useState, useEffect, useCallback } from "react";
import { userService } from "@/services/user.service";
import { pipelineService } from "@/services/pipeline.service";
import { useActionFeedback } from "@/hooks/use-action-feedback";

type CandidateStatus = "All" | "Engaged" | "Nurturing" | "Ready to Hire";

interface TalentCandidate {
  id: string;
  name: string;
  email: string;
  company: string;
  skills: string[];
  location: string;
  source: string;
  status: Exclude<CandidateStatus, "All">;
  lastInteraction: string;
  engagementScore: number;
  pipelineStatus?: string;
}

export default function TalentPoolPage() {
  const [candidates, setCandidates] = useState<TalentCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CandidateStatus>("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const { withFeedback } = useActionFeedback();

  // Add form state
  const [newCandidate, setNewCandidate] = useState({
    firstName: "",
    lastName: "",
    email: "",
    skills: "",
    source: "",
  });

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const result = await userService.search({
        keyword: searchQuery || undefined,
        page,
        size: 20,
      });

      // Map user data to talent pool format
      const mappedCandidates: TalentCandidate[] = (result.content || []).map((user) => {
        const u = user as unknown as Record<string, unknown>;
        return {
          id: u.id as string,
          name: `${(u.firstName as string) || ""} ${(u.lastName as string) || ""}`.trim() || (u.email as string),
          email: u.email as string,
          company: (u.company as string) || "",
          skills: (u.skills as string[]) || [],
          location: (u.location as string) || "",
          source: (u.source as string) || "Direct",
          status: mapUserStatusToTalentStatus(u.status as string),
          lastInteraction: (u.updatedAt as string) || (u.createdAt as string) || "",
          engagementScore: calculateEngagement(u),
          pipelineStatus: u.pipelineStatus as string | undefined,
        };
      });

      setCandidates(mappedCandidates);
      setTotalElements(result.totalElements || 0);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, page]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const mapUserStatusToTalentStatus = (status?: string): Exclude<CandidateStatus, "All"> => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
      case "IN_PROGRESS":
        return "Engaged";
      case "INACTIVE":
      case "PENDING":
        return "Nurturing";
      case "HIRED":
      case "APPROVED":
        return "Ready to Hire";
      default:
        return "Nurturing";
    }
  };

  const calculateEngagement = (user: Record<string, unknown>): number => {
    let score = 20; // base score
    const interviewCount = user.interviewCount as number | undefined;
    const feedbackCount = user.feedbackCount as number | undefined;
    const lastLoginAt = user.lastLoginAt as string | undefined;
    if (interviewCount) score += Math.min(interviewCount * 15, 40);
    if (feedbackCount) score += Math.min(feedbackCount * 10, 20);
    if (lastLoginAt) {
      const daysSinceLogin = Math.floor((Date.now() - new Date(lastLoginAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLogin < 7) score += 20;
      else if (daysSinceLogin < 30) score += 10;
    }
    return Math.min(score, 100);
  };

  const addCandidate = async () => {
    if (!newCandidate.firstName || !newCandidate.email) return;
    await withFeedback(
      async () => {
        await userService.create({
          firstName: newCandidate.firstName,
          lastName: newCandidate.lastName,
          email: newCandidate.email,
          password: "TempPass123!", // Will be reset via email
        });
        setNewCandidate({ firstName: "", lastName: "", email: "", skills: "", source: "" });
        setShowAddForm(false);
        await fetchCandidates();
      },
      { successTitle: "Candidate added to talent pool" }
    );
  };

  const addToPipeline = async (candidateId: string, pipelineId: string) => {
    await withFeedback(
      async () => {
        await pipelineService.addCandidate({ pipelineId, candidateId });
        await fetchCandidates();
      },
      { successTitle: "Candidate added to pipeline" }
    );
  };

  const allSkills = Array.from(new Set(candidates.flatMap((c) => c.skills))).sort();

  const filteredCandidates = candidates.filter((c) => {
    if (activeTab !== "All" && c.status !== activeTab) return false;
    if (filterSkill && !c.skills.includes(filterSkill)) return false;
    return true;
  });

  const stats = {
    total: candidates.length,
    engaged: candidates.filter((c) => c.status === "Engaged").length,
    nurturing: candidates.filter((c) => c.status === "Nurturing").length,
    ready: candidates.filter((c) => c.status === "Ready to Hire").length,
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-slate-400";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Engaged":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      case "Nurturing":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
      case "Ready to Hire":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Talent Pool</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage and nurture your candidate pipeline ({totalElements} total candidates)
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchCandidates}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              + Add Candidate
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm text-blue-600 dark:text-blue-400">Engaged</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.engaged}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm text-amber-600 dark:text-amber-400">Nurturing</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.nurturing}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm text-green-600 dark:text-green-400">Ready to Hire</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.ready}</p>
          </div>
        </div>

        {/* Add Candidate Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Add to Talent Pool</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={newCandidate.firstName}
                      onChange={(e) => setNewCandidate({ ...newCandidate, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={newCandidate.lastName}
                      onChange={(e) => setNewCandidate({ ...newCandidate, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source</label>
                  <select
                    value={newCandidate.source}
                    onChange={(e) => setNewCandidate({ ...newCandidate, source: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">Select source</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Referral">Referral</option>
                    <option value="Job Board">Job Board</option>
                    <option value="Conference">Conference</option>
                    <option value="Direct Application">Direct Application</option>
                    <option value="Headhunter">Headhunter</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={addCandidate}
                  disabled={!newCandidate.firstName || !newCandidate.email}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add Candidate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchCandidates()}
              placeholder="Search by name or email..."
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <button
              onClick={() => { setPage(0); fetchCandidates(); }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Search
            </button>
          </div>
          {allSkills.length > 0 && (
            <select
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">All Skills</option>
              {allSkills.map((skill) => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-200 dark:bg-slate-700 rounded-lg p-1 mb-6 w-fit">
          {(["All", "Engaged", "Nurturing", "Ready to Hire"] as CandidateStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {tab === "All" ? `All (${stats.total})` : tab}
            </button>
          ))}
        </div>

        {/* Candidate Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4" />
                <div className="flex gap-2 mb-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <p className="text-slate-400 text-lg">No candidates found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCandidates.map((candidate) => (
                <div key={candidate.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{candidate.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{candidate.email}</p>
                      {candidate.company && (
                        <p className="text-xs text-slate-400 dark:text-slate-500">{candidate.company}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(candidate.status)}`}>
                      {candidate.status}
                    </span>
                  </div>

                  {/* Skills */}
                  {candidate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {candidate.skills.slice(0, 4).map((skill) => (
                        <span key={skill} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 4 && (
                        <span className="px-2 py-0.5 text-slate-400 text-xs">+{candidate.skills.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Engagement Score */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          candidate.engagementScore >= 80 ? "bg-green-500" :
                          candidate.engagementScore >= 50 ? "bg-yellow-500" : "bg-slate-300"
                        }`}
                        style={{ width: `${candidate.engagementScore}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${getEngagementColor(candidate.engagementScore)}`}>
                      {candidate.engagementScore}%
                    </span>
                  </div>

                  {/* Last Interaction */}
                  {candidate.lastInteraction && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                      Last updated: {new Date(candidate.lastInteraction).toLocaleDateString()}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => addToPipeline(candidate.id, "default")}
                      className="flex-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                    >
                      Add to Pipeline
                    </button>
                    <button
                      onClick={() => setExpandedCandidate(expandedCandidate === candidate.id ? null : candidate.id)}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-md text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      {expandedCandidate === candidate.id ? "Less" : "More"}
                    </button>
                  </div>

                  {/* Expanded Detail */}
                  {expandedCandidate === candidate.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      {candidate.location && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Location</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{candidate.location}</p>
                        </div>
                      )}
                      <div className="mb-2">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Source</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{candidate.source}</p>
                      </div>
                      {candidate.pipelineStatus && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Pipeline Status</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{candidate.pipelineStatus}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalElements > 20 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Page {page + 1} of {Math.ceil(totalElements / 20)}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * 20 >= totalElements}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
