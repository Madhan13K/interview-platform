"use client";

import { useState, useEffect } from "react";
import { copilotService, CopilotDashboard } from "@/services/copilot.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CopilotPage() {
  const [session, setSession] = useState<CopilotDashboard | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Interview Copilot</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time AI assistance during live interviews
          </p>
        </div>
      </div>

      {!session ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-slate-700 mb-2">No Active Session</h3>
            <p className="text-sm text-slate-500 mb-4">
              Start a copilot session from an active interview to receive real-time suggestions,
              bias alerts, and competency coverage tracking.
            </p>
            <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto mt-8">
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-700 text-sm">Follow-up Questions</h4>
                <p className="text-xs text-slate-500 mt-1">AI-suggested probing questions based on candidate responses</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-700 text-sm">Bias Detection</h4>
                <p className="text-xs text-slate-500 mt-1">Real-time alerts for potential unconscious bias</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-700 text-sm">Time Management</h4>
                <p className="text-xs text-slate-500 mt-1">Ensure all competencies are covered within time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{session.interviewProgress}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Time Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{session.timeRemainingMin} min</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{session.recentSuggestions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Bias Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{session.biasAlerts.length}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
