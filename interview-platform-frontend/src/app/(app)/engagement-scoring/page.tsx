"use client";

import { useState, useEffect } from "react";
import { engagementScoringService, EngagementScore } from "@/services/engagement-scoring.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EngagementScoringPage() {
  const [topEngaged, setTopEngaged] = useState<EngagementScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    engagementScoringService
      .getTopEngaged(20)
      .then((res) => setTopEngaged(res.data))
      .catch(() => setTopEngaged([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Loading engagement scores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Engagement Scoring</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track candidate engagement levels based on responsiveness, attendance, and activity
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Engaged Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          {topEngaged.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No engagement data available yet. Scores are calculated based on candidate interactions.
            </p>
          ) : (
            <div className="space-y-3">
              {topEngaged.map((score, idx) => (
                <div key={score.candidateId} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-400 w-6">#{idx + 1}</span>
                    <div>
                      <p className="font-medium text-slate-900">{score.candidateId}</p>
                      <p className="text-xs text-slate-500">
                        Email: {score.breakdown.emailResponsiveness}% |
                        Attendance: {score.breakdown.interviewAttendance}% |
                        Portal: {score.breakdown.portalActivity}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={score.trend === "UP" ? "default" : score.trend === "DOWN" ? "destructive" : "secondary"}>
                      {score.trend}
                    </Badge>
                    <span className="text-lg font-bold text-slate-900">{score.score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
