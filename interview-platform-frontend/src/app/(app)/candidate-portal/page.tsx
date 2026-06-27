"use client";

import { useState, useEffect } from "react";
import { candidatePortalService, CandidatePortalData, TimelineEvent } from "@/services/candidate-portal.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CandidatePortalPage() {
  const [portalData, setPortalData] = useState<CandidatePortalData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      candidatePortalService.getPortalData().then((res) => setPortalData(res.data)).catch(() => {}),
      candidatePortalService.getTimeline().then((res) => setTimeline(res.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Loading portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Candidate Portal</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track your applications, upcoming interviews, and preparation tips
        </p>
      </div>

      {portalData && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Active Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{portalData.activeApplications}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Upcoming Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{portalData.upcomingInterviews}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Completed Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{portalData.completedInterviews}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Application Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No timeline events yet.</p>
          ) : (
            <div className="space-y-4">
              {timeline.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 border-l-2 border-slate-200 pl-4">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{event.title}</p>
                    <p className="text-xs text-slate-500">{event.description}</p>
                    <p className="text-xs text-slate-400 mt-1">{event.date}</p>
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
