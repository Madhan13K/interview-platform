"use client";

import { useState, useEffect } from "react";
import { npsService } from "@/services/nps.service";

interface NpsTrend {
  period: string;
  score: number;
  responses: number;
}

interface NpsResponse {
  id: string;
  candidateName: string;
  score: number;
  feedback: string;
  createdAt: string;
}

interface Correlation {
  metric: string;
  correlation: number;
}

export default function NpsSurveysPage() {
  const [trends, setTrends] = useState<NpsTrend[]>([]);
  const [responses, setResponses] = useState<NpsResponse[]>([]);
  const [correlation, setCorrelation] = useState<Correlation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orgId = "current";
    Promise.all([
      npsService.getTrends(orgId).catch(() => []),
      npsService.getCorrelation(orgId).catch(() => []),
    ]).then(([t, c]) => {
      setTrends(t || []);
      setCorrelation(c || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><p>Loading NPS data...</p></div>;
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">NPS Surveys</h1>

      {/* Score Trend Chart */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Score Trend</h2>
        <div className="flex items-end gap-2 h-48">
          {trends.map((t) => (
            <div key={t.period} className="flex flex-col items-center flex-1">
              <span className="text-xs font-medium mb-1">{t.score}</span>
              <div
                className={`w-full rounded-t ${t.score >= 50 ? "bg-green-500" : t.score >= 0 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ height: `${Math.max(10, ((t.score + 100) / 200) * 100)}%` }}
              />
              <span className="text-xs mt-1 text-slate-500">{t.period}</span>
            </div>
          ))}
          {trends.length === 0 && (
            <p className="text-slate-400 text-sm">No trend data available yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response List */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Responses</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {responses.map((r) => (
              <div key={r.id} className="border-b pb-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{r.candidateName}</span>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded ${r.score >= 9 ? "bg-green-100 text-green-700" : r.score >= 7 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {r.score}/10
                  </span>
                </div>
                {r.feedback && <p className="text-sm text-slate-600 mt-1">{r.feedback}</p>}
              </div>
            ))}
            {responses.length === 0 && (
              <p className="text-slate-400 text-sm">No responses yet.</p>
            )}
          </div>
        </div>

        {/* Correlation Card */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">NPS Correlation</h2>
          <div className="space-y-3">
            {correlation.map((c) => (
              <div key={c.metric} className="flex items-center justify-between">
                <span className="text-sm">{c.metric}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${c.correlation > 0 ? "bg-blue-500" : "bg-red-500"}`}
                      style={{ width: `${Math.abs(c.correlation) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono w-12 text-right">
                    {c.correlation.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
            {correlation.length === 0 && (
              <p className="text-slate-400 text-sm">No correlation data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
