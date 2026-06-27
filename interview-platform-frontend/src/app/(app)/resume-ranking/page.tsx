"use client";

import { useState } from "react";
import { resumeRankingService, ResumeRanking } from "@/services/resume-ranking.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResumeRankingPage() {
  const [jobId, setJobId] = useState("");
  const [rankings, setRankings] = useState<ResumeRanking[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRank = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const res = await resumeRankingService.rankForJob(jobId);
      setRankings(res.data);
    } catch (error) {
      console.error("Ranking failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRankings = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const res = await resumeRankingService.getRankings(jobId);
      setRankings(res.data);
    } catch (error) {
      console.error("Failed to get rankings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resume Ranking</h1>
        <p className="text-sm text-slate-500 mt-1">
          AI-powered resume scoring and ranking against job requirements
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rank Resumes for a Job</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="job-id">Job ID</Label>
              <Input
                id="job-id"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Enter job ID..."
                className="mt-1"
              />
            </div>
            <Button onClick={handleRank} disabled={loading || !jobId}>
              {loading ? "Processing..." : "Rank Resumes"}
            </Button>
            <Button variant="outline" onClick={handleGetRankings} disabled={loading || !jobId}>
              View Existing
            </Button>
          </div>
        </CardContent>
      </Card>

      {rankings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankings.map((ranking) => (
                <div key={ranking.candidateId} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-indigo-600 w-8">#{ranking.rank}</span>
                    <div>
                      <p className="font-medium text-slate-900">{ranking.candidateName}</p>
                      <p className="text-xs text-slate-500">
                        Skills: {ranking.matchBreakdown.skillsMatch}% |
                        Experience: {ranking.matchBreakdown.experienceMatch}% |
                        Education: {ranking.matchBreakdown.educationMatch}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">{ranking.score}</p>
                    <p className="text-xs text-slate-500">Overall</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
