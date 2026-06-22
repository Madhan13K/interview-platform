"use client";

import { useState, useEffect, useCallback } from "react";
import {
  analyticsService,
  type CohortData,
  type LeaderboardEntry,
  type RealtimeMetrics,
  type RetentionData,
} from "@/services/analytics.service";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type PeriodOption = "this_week" | "this_month" | "this_quarter" | "this_year";

const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "this_year", label: "This Year" },
];

function getDateRange(period: PeriodOption): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().split("T")[0];
  let startDate: string;

  switch (period) {
    case "this_week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split("T")[0];
      break;
    }
    case "this_month": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      startDate = d.toISOString().split("T")[0];
      break;
    }
    case "this_quarter": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      startDate = d.toISOString().split("T")[0];
      break;
    }
    case "this_year": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      startDate = d.toISOString().split("T")[0];
      break;
    }
  }

  return { startDate, endDate };
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<PeriodOption>("this_month");
  const [realtime, setRealtime] = useState<RealtimeMetrics | null>(null);
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [retention, setRetention] = useState<RetentionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeLoading, setRealtimeLoading] = useState(true);

  const { showError } = useActionFeedback();

  const fetchRealtime = useCallback(async () => {
    try {
      const data = await analyticsService.getRealtime();
      setRealtime(data);
    } catch {
      showError("Failed to load real-time metrics");
    } finally {
      setRealtimeLoading(false);
    }
  }, [showError]);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(period);

    try {
      const [cohortData, retentionData] = await Promise.all([
        analyticsService.getCohorts(startDate, endDate),
        analyticsService.getRetention(period),
      ]);
      setCohorts(cohortData);
      setRetention(retentionData);
    } catch {
      showError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [period, showError]);

  useEffect(() => {
    fetchRealtime();
    fetchAnalyticsData();
  }, [fetchRealtime, fetchAnalyticsData]);

  // Auto-refresh realtime every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchRealtime, 10000);
    return () => clearInterval(interval);
  }, [fetchRealtime]);

  const maxRetentionRate = retention.length > 0
    ? Math.max(...retention.map((r) => r.retentionRate))
    : 100;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodOption)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Real-time Metrics */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Real-time Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {realtimeLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <RealtimeCard
                label="Active Interviews"
                value={realtime?.activeInterviews ?? 0}
                variant="info"
              />
              <RealtimeCard
                label="Online Users"
                value={realtime?.onlineUsers ?? 0}
                variant="success"
              />
              <RealtimeCard
                label="Scheduled Today"
                value={realtime?.scheduledToday ?? 0}
                variant="warning"
              />
              <RealtimeCard
                label="Completed Today"
                value={realtime?.completedToday ?? 0}
                variant="default"
              />
              <RealtimeCard
                label="Avg Duration"
                value={`${realtime?.avgDuration ?? 0}m`}
                variant="secondary"
              />
            </>
          )}
        </div>
      </section>

      {/* Cohort Analysis */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Cohort Analysis</h2>
        {loading ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : cohorts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-slate-500">
              No cohort data available for the selected period.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Period</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">Total Candidates</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">Hired</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">Rejected</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">Pending</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600 min-w-[200px]">
                        Conversion Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohorts.map((cohort) => (
                      <tr key={cohort.period} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-700">{cohort.period}</td>
                        <td className="px-4 py-3 text-center text-slate-700">{cohort.totalCandidates}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="success">{cohort.hired}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="destructive">{cohort.rejected}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="warning">{cohort.pending}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(cohort.conversionRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-600 w-12 text-right">
                              {cohort.conversionRate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Retention Chart */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Retention Chart</h2>
        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-end gap-2 h-48">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 h-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : retention.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-slate-500">
              No retention data available for the selected period.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-end gap-2 h-52">
                {retention.map((data) => {
                  const barHeight = maxRetentionRate > 0
                    ? (data.retentionRate / maxRetentionRate) * 100
                    : 0;
                  return (
                    <div
                      key={data.period}
                      className="flex-1 flex flex-col items-center gap-1 min-w-0"
                    >
                      <span className="text-xs text-slate-500 font-medium truncate w-full text-center">
                        {data.retentionRate.toFixed(0)}%
                      </span>
                      <div className="w-full flex justify-center" style={{ height: "180px" }}>
                        <div className="w-full max-w-[40px] flex flex-col justify-end h-full">
                          <div
                            className="w-full rounded-t bg-indigo-500 transition-all duration-300 hover:bg-indigo-600"
                            style={{ height: `${barHeight}%` }}
                            title={`${data.period}: ${data.candidatesRetained}/${data.candidatesEntered} (${data.retentionRate.toFixed(1)}%)`}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 truncate w-full text-center">
                        {data.period}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-between text-xs text-slate-400">
                <span>Candidates entered vs retained per period</span>
                <span>Total periods: {retention.length}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function RealtimeCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number | string;
  variant: "info" | "success" | "warning" | "default" | "secondary";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-500">{label}</span>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
        </div>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}
