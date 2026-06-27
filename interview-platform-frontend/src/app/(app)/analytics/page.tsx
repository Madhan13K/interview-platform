"use client";

import { useState, useEffect } from "react";
import { getFunnelOverview, getModelMetrics } from "@/services/analytics.service";
import type { FunnelOverview } from "@/services/analytics.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  const [funnel, setFunnel] = useState<FunnelOverview | null>(null);
  const [modelInfo, setModelInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getFunnelOverview().catch(() => null),
      getModelMetrics().catch(() => null),
    ]).then(([f, m]) => {
      setFunnel(f);
      setModelInfo(m);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><p>Loading analytics...</p></div>;
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Hiring Analytics</h1>

      {funnel && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" role="region" aria-label="Key metrics">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{funnel.totalCandidates}</p>
                <p className="text-sm text-slate-500">Total Candidates</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-600">{funnel.totalHired}</p>
                <p className="text-sm text-slate-500">Hired</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-blue-600">{funnel.overallConversion}%</p>
                <p className="text-sm text-slate-500">Conversion Rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{funnel.avgTimeToHire}d</p>
                <p className="text-sm text-slate-500">Avg Time to Hire</p>
              </CardContent>
            </Card>
          </div>

          {funnel.stageBreakdown && funnel.stageBreakdown.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Pipeline Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {funnel.stageBreakdown.map((stage, i) => (
                    <div key={stage.stage} className="flex items-center gap-4">
                      <span className="w-32 text-sm text-slate-600">{stage.stage}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${(stage.count / funnel.totalCandidates) * 100}%` }}
                          role="progressbar"
                          aria-valuenow={stage.count}
                          aria-valuemax={funnel.totalCandidates}
                          aria-label={`${stage.stage}: ${stage.count} candidates`}
                        />
                      </div>
                      <span className="w-12 text-sm font-medium text-right">{stage.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {modelInfo && (
        <Card>
          <CardHeader>
            <CardTitle>ML Model Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-slate-500">Algorithm:</span> <span className="font-medium">{String(modelInfo.algorithm || "N/A")}</span></div>
              <div><span className="text-slate-500">Accuracy:</span> <span className="font-medium">{String(((modelInfo.accuracy as number) * 100).toFixed(1))}%</span></div>
              <div><span className="text-slate-500">Precision:</span> <span className="font-medium">{String(((modelInfo.precision as number) * 100).toFixed(1))}%</span></div>
              <div><span className="text-slate-500">Training Data:</span> <span className="font-medium">{String(modelInfo.trainingDataSize)} records</span></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
