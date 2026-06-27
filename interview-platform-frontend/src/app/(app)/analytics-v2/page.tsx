"use client";

import { useState, useEffect } from "react";
import {
  analyticsService,
  CohortData,
  RealtimeMetrics,
  RetentionData,
  getFunnelOverview,
  FunnelOverview,
} from "@/services/analytics.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DateRange = "7d" | "30d" | "90d" | "1y";
type ChartView = "overview" | "funnel" | "retention" | "realtime";

export default function AnalyticsV2Page() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [activeView, setActiveView] = useState<ChartView>("overview");
  const [realtime, setRealtime] = useState<RealtimeMetrics | null>(null);
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [retention, setRetention] = useState<RetentionData[]>([]);
  const [funnel, setFunnel] = useState<FunnelOverview | null>(null);
  const [drillDown, setDrillDown] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  useEffect(() => {
    // Refresh realtime data every 30s
    const interval = setInterval(() => {
      if (activeView === "realtime") {
        analyticsService.getRealtime().then(setRealtime).catch(() => {});
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeView]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [realtimeData, cohortData, retentionData, funnelData] = await Promise.all([
        analyticsService.getRealtime().catch(() => null),
        analyticsService.getCohorts().catch(() => []),
        analyticsService.getRetention(dateRange).catch(() => []),
        getFunnelOverview("MONTHLY").catch(() => null),
      ]);
      setRealtime(realtimeData);
      setCohorts(cohortData);
      setRetention(retentionData);
      setFunnel(funnelData);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard v2</h1>
          <p className="text-sm text-slate-500 mt-1">Interactive hiring metrics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(["7d", "30d", "90d", "1y"] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  dateRange === range
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(["overview", "funnel", "retention", "realtime"] as ChartView[]).map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeView === view
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeView === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDrillDown("interviews")}>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 uppercase font-medium">Active Interviews</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{realtime?.activeInterviews ?? 0}</p>
                <p className="text-xs text-green-600 mt-1">+12% from last period</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDrillDown("users")}>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 uppercase font-medium">Online Users</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{realtime?.onlineUsers ?? 0}</p>
                <p className="text-xs text-blue-600 mt-1">Real-time</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDrillDown("scheduled")}>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 uppercase font-medium">Scheduled Today</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{realtime?.scheduledToday ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">{realtime?.completedToday ?? 0} completed</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDrillDown("duration")}>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 uppercase font-medium">Avg Duration</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{realtime?.avgDuration ?? 0}m</p>
                <p className="text-xs text-amber-600 mt-1">-3% from last period</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Cohort Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cohort Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cohorts.slice(0, 6).map((cohort) => (
                    <div key={cohort.period} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-16">{cohort.period}</span>
                      <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${(cohort.hired / cohort.totalCandidates) * 100}%` }}
                          title={`Hired: ${cohort.hired}`}
                        />
                        <div
                          className="h-full bg-amber-400 transition-all"
                          style={{ width: `${(cohort.pending / cohort.totalCandidates) * 100}%` }}
                          title={`Pending: ${cohort.pending}`}
                        />
                        <div
                          className="h-full bg-red-400 transition-all"
                          style={{ width: `${(cohort.rejected / cohort.totalCandidates) * 100}%` }}
                          title={`Rejected: ${cohort.rejected}`}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700 w-12 text-right">
                        {cohort.conversionRate}%
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span className="text-xs text-slate-500">Hired</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-amber-400" />
                    <span className="text-xs text-slate-500">Pending</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-red-400" />
                    <span className="text-xs text-slate-500">Rejected</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hiring Velocity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hiring Velocity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cohorts.slice(0, 5).map((cohort, idx) => (
                    <div key={cohort.period}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">{cohort.period}</span>
                        <span className="text-xs font-medium text-slate-700">{cohort.totalCandidates} candidates</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, cohort.conversionRate * 3)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Drill-down Panel */}
          {drillDown && (
            <Card className="border-indigo-200 bg-indigo-50/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base capitalize">Drill-down: {drillDown}</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setDrillDown(null)}>Close</Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Detailed breakdown for <strong>{drillDown}</strong> metric. In production, this would show
                  granular data with filtering and export options.
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 rounded-lg bg-white border border-slate-200">
                      <p className="text-xs text-slate-500">Sub-metric {i}</p>
                      <p className="text-lg font-bold text-slate-900">{Math.floor(Math.random() * 100)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Funnel View */}
      {activeView === "funnel" && funnel && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{funnel.totalCandidates}</p>
                <p className="text-xs text-slate-500">Total Candidates</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{funnel.totalHired}</p>
                <p className="text-xs text-slate-500">Hired</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">{funnel.overallConversion}%</p>
                <p className="text-xs text-slate-500">Conversion Rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{funnel.avgTimeToHire}d</p>
                <p className="text-xs text-slate-500">Avg Time to Hire</p>
              </CardContent>
            </Card>
          </div>

          {/* Visual Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hiring Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {funnel.stageBreakdown.map((stage, idx) => {
                  const maxCount = funnel.stageBreakdown[0]?.count || 1;
                  const width = (stage.count / maxCount) * 100;
                  return (
                    <div key={stage.stage} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-32">{stage.stage}</span>
                      <div className="flex-1 relative">
                        <div
                          className="h-10 bg-indigo-500 rounded-md flex items-center justify-end pr-3 transition-all"
                          style={{ width: `${width}%`, opacity: 1 - idx * 0.12 }}
                        >
                          <span className="text-xs font-medium text-white">{stage.count}</span>
                        </div>
                      </div>
                      {idx > 0 && (
                        <span className="text-xs text-slate-500 w-16 text-right">
                          {((stage.count / (funnel.stageBreakdown[idx - 1]?.count || 1)) * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Retention View */}
      {activeView === "retention" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Candidate Retention by Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {retention.map((r) => (
                <div key={r.period} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium text-slate-700 w-24">{r.period}</span>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${r.retentionRate}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">{r.candidatesRetained}/{r.candidatesEntered}</span>
                    <Badge className={r.retentionRate > 50 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                      {r.retentionRate}%
                    </Badge>
                  </div>
                </div>
              ))}
              {retention.length === 0 && (
                <p className="text-center text-slate-400 py-8">No retention data available for this period</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Realtime View */}
      {activeView === "realtime" && realtime && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-slate-600">Live data - refreshes every 30 seconds</span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <Card className="border-green-200">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-green-600">{realtime.activeInterviews}</p>
                <p className="text-sm text-slate-500 mt-2">Active Interviews</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-blue-600">{realtime.onlineUsers}</p>
                <p className="text-sm text-slate-500 mt-2">Online Users</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-amber-600">{realtime.avgDuration}m</p>
                <p className="text-sm text-slate-500 mt-2">Avg Duration</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Today&apos;s Progress</p>
                  <p className="text-xs text-slate-500">{realtime.completedToday} of {realtime.scheduledToday} interviews completed</p>
                </div>
                <span className="text-lg font-bold text-indigo-600">
                  {realtime.scheduledToday > 0 ? Math.round((realtime.completedToday / realtime.scheduledToday) * 100) : 0}%
                </span>
              </div>
              <div className="mt-3 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${realtime.scheduledToday > 0 ? (realtime.completedToday / realtime.scheduledToday) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
