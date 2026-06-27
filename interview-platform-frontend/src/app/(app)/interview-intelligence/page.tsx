"use client";

import { useState, useEffect } from "react";
import { interviewIntelligenceService } from "@/services/interview-intelligence.service";

interface Insight {
  title: string;
  value: string | number;
  change: number;
  description: string;
}

interface FailurePoint {
  stage: string;
  dropRate: number;
  count: number;
  reason: string;
}

interface BestQuestion {
  question: string;
  predictiveScore: number;
  timesAsked: number;
  category: string;
}

export default function InterviewIntelligencePage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [failurePoints, setFailurePoints] = useState<FailurePoint[]>([]);
  const [bestQuestions, setBestQuestions] = useState<BestQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      interviewIntelligenceService.getInsights("current").catch(() => []),
      interviewIntelligenceService.getFailurePoints().catch(() => []),
      interviewIntelligenceService.getBestQuestions().catch(() => []),
    ]).then(([i, f, q]) => {
      setInsights(i || []);
      setFailurePoints(f || []);
      setBestQuestions(q || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><p>Loading intelligence data...</p></div>;
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Interview Intelligence</h1>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {insights.map((insight) => (
          <div key={insight.title} className="bg-white rounded-lg border p-4">
            <p className="text-sm text-slate-500">{insight.title}</p>
            <p className="text-2xl font-bold mt-1">{insight.value}</p>
            <p className={`text-sm mt-1 ${insight.change > 0 ? "text-green-600" : insight.change < 0 ? "text-red-600" : "text-slate-400"}`}>
              {insight.change > 0 ? "+" : ""}{insight.change}% vs last period
            </p>
            <p className="text-xs text-slate-400 mt-1">{insight.description}</p>
          </div>
        ))}
        {insights.length === 0 && (
          <div className="col-span-4 text-center py-8 text-slate-400">No insights available yet.</div>
        )}
      </div>

      {/* Failure Points */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Failure Points</h2>
        <div className="space-y-4">
          {failurePoints.map((fp) => (
            <div key={fp.stage} className="flex items-center gap-4">
              <div className="w-32">
                <p className="text-sm font-medium">{fp.stage}</p>
                <p className="text-xs text-slate-400">{fp.count} candidates</p>
              </div>
              <div className="flex-1">
                <div className="bg-slate-100 rounded-full h-4 relative">
                  <div
                    className="bg-red-400 h-4 rounded-full"
                    style={{ width: `${fp.dropRate}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-red-600 w-12">{fp.dropRate}%</span>
              <span className="text-xs text-slate-500 w-40">{fp.reason}</span>
            </div>
          ))}
          {failurePoints.length === 0 && (
            <p className="text-slate-400 text-sm">No failure point data available.</p>
          )}
        </div>
      </div>

      {/* Best Questions */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Best Predictive Questions</h2>
        <div className="space-y-3">
          {bestQuestions.map((q, i) => (
            <div key={i} className="flex items-center justify-between border-b pb-3">
              <div className="flex-1">
                <p className="font-medium">{q.question}</p>
                <div className="flex gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{q.category}</span>
                  <span className="text-xs text-slate-400">Asked {q.timesAsked} times</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">{(q.predictiveScore * 100).toFixed(0)}%</p>
                <p className="text-xs text-slate-400">Predictive</p>
              </div>
            </div>
          ))}
          {bestQuestions.length === 0 && (
            <p className="text-slate-400 text-sm">No question data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
