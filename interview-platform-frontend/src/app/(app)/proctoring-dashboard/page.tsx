"use client";

import { useState, useEffect } from "react";
import { proctoringService } from "@/services/proctoring.service";

interface ProctoringSession {
  id: string;
  interviewId: string;
  candidateName: string;
  status: "active" | "ended";
  tabSwitches: number;
  faceViolations: number;
  integrityScore: number;
  startedAt: string;
}

export default function ProctoringDashboardPage() {
  const [sessions, setSessions] = useState<ProctoringSession[]>([]);
  const [flagged, setFlagged] = useState<ProctoringSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    proctoringService.getFlagged()
      .then((data) => {
        setFlagged(data || []);
      })
      .catch(() => setFlagged([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><p>Loading proctoring data...</p></div>;
  }

  const activeSessions = sessions.filter((s) => s.status === "active");

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Proctoring Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{activeSessions.length}</p>
          <p className="text-sm text-slate-500">Active Sessions</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{flagged.length}</p>
          <p className="text-sm text-slate-500">Flagged</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-3xl font-bold">{sessions.length}</p>
          <p className="text-sm text-slate-500">Total Sessions</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">
            {sessions.length > 0 ? Math.round(sessions.reduce((s, x) => s + x.integrityScore, 0) / sessions.length) : 100}%
          </p>
          <p className="text-sm text-slate-500">Avg Integrity</p>
        </div>
      </div>

      {/* Flagged Sessions */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-red-600">Flagged Sessions</h2>
        <div className="space-y-3">
          {flagged.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">{s.candidateName}</p>
                <p className="text-sm text-slate-500">
                  Tab switches: {s.tabSwitches} | Face violations: {s.faceViolations}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${s.integrityScore >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                  {s.integrityScore}%
                </span>
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                  Flagged
                </span>
              </div>
            </div>
          ))}
          {flagged.length === 0 && (
            <p className="text-slate-400 text-sm">No flagged sessions.</p>
          )}
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Active Sessions</h2>
        <div className="space-y-3">
          {activeSessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">{s.candidateName}</p>
                <p className="text-sm text-slate-500">Started: {new Date(s.startedAt).toLocaleTimeString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${s.integrityScore >= 80 ? "bg-green-500" : s.integrityScore >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${s.integrityScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{s.integrityScore}%</span>
              </div>
            </div>
          ))}
          {activeSessions.length === 0 && (
            <p className="text-slate-400 text-sm">No active sessions.</p>
          )}
        </div>
      </div>
    </div>
  );
}
