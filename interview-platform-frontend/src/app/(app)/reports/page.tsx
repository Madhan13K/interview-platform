"use client";

import { useEffect, useState } from "react";
import { reportService } from "@/services/report.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsReport, ConversionMetrics, TimeToHireMetrics } from "@/types";

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsReport | null>(null);
  const [conversion, setConversion] = useState<ConversionMetrics | null>(null);
  const [timeToHire, setTimeToHire] = useState<TimeToHireMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [interviewerId, setInterviewerId] = useState("");
  const [jobPositionId, setJobPositionId] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [analyticsData, conversionData, timeToHireData] = await Promise.all([
          reportService.getAnalytics(),
          reportService.getConversionMetrics(),
          reportService.getTimeToHireMetrics(),
        ]);
        setAnalytics(analyticsData);
        setConversion(conversionData);
        setTimeToHire(timeToHireData);
      } catch (error) {
        console.error("Failed to fetch report data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDownloadAnalyticsPdf = async () => {
    try {
      const blob = await reportService.downloadAnalyticsPdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "analytics-report.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download analytics PDF:", error);
    }
  };

  const handleDownloadInterviewerPdf = async () => {
    if (!interviewerId.trim()) return;
    try {
      const blob = await reportService.downloadInterviewerPdf(interviewerId.trim());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `interviewer-${interviewerId}-report.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download interviewer PDF:", error);
    }
  };

  const handleDownloadJobPositionPdf = async () => {
    if (!jobPositionId.trim()) return;
    try {
      const blob = await reportService.downloadJobPositionPdf(jobPositionId.trim());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `job-position-${jobPositionId}-report.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download job position PDF:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  const totalCandidates = conversion
    ? conversion.applied
    : 0;

  const avgTimeToHire = timeToHire ? timeToHire.averageDays : 0;

  // Compute max values for chart scaling
  const typeMax = analytics
    ? Math.max(...Object.values(analytics.interviewsByType), 1)
    : 1;
  const statusMax = analytics
    ? Math.max(...Object.values(analytics.interviewsByStatus), 1)
    : 1;
  const trendMax = analytics
    ? Math.max(...analytics.monthlyTrend.map((m) => m.count), 1)
    : 1;

  const typeColors = [
    "bg-indigo-500",
    "bg-purple-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-rose-500",
  ];

  const statusColors = [
    "bg-emerald-500",
    "bg-amber-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-blue-500",
  ];

  const funnelStages = conversion
    ? [
        { label: "Applied", value: conversion.applied },
        { label: "Screened", value: conversion.screened },
        { label: "Interviewed", value: conversion.interviewed },
        { label: "Offered", value: conversion.offered },
        { label: "Hired", value: conversion.hired },
      ]
    : [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <Button onClick={handleDownloadAnalyticsPdf}>Download PDF</Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics?.totalInterviews ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics?.completionRate ?? 0}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics?.averageRating?.toFixed(1) ?? "0.0"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hire Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics?.hireRate ?? 0}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCandidates}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Time to Hire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgTimeToHire} days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Interviews by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Interviews by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics &&
              Object.entries(analytics.interviewsByType).map(([type, count], idx) => (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{type.toLowerCase().replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${typeColors[idx % typeColors.length]}`}
                      style={{ width: `${(count / typeMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            {analytics && Object.keys(analytics.interviewsByType).length === 0 && (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Interviews by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Interviews by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics &&
              Object.entries(analytics.interviewsByStatus).map(([status, count], idx) => (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{status.toLowerCase().replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${statusColors[idx % statusColors.length]}`}
                      style={{ width: `${(count / statusMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            {analytics && Object.keys(analytics.interviewsByStatus).length === 0 && (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {analytics &&
            analytics.monthlyTrend.map((item) => (
              <div key={item.month} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm font-medium">{item.month}</span>
                <div className="h-6 flex-1 overflow-hidden rounded bg-muted">
                  <div
                    className="flex h-full items-center rounded bg-indigo-500 px-2 text-xs font-medium text-white transition-all"
                    style={{ width: `${(item.count / trendMax) * 100}%` }}
                  >
                    {item.count > 0 && item.count}
                  </div>
                </div>
              </div>
            ))}
          {analytics && analytics.monthlyTrend.length === 0 && (
            <p className="text-sm text-muted-foreground">No trend data available</p>
          )}
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {conversion && (
            <div className="space-y-1">
              {funnelStages.map((stage, idx) => {
                const maxVal = Math.max(...funnelStages.map((s) => s.value), 1);
                const widthPct = (stage.value / maxVal) * 100;
                const prevStage = idx > 0 ? funnelStages[idx - 1] : null;
                const conversionRate = prevStage && prevStage.value > 0
                  ? ((stage.value / prevStage.value) * 100).toFixed(1)
                  : null;

                return (
                  <div key={stage.label}>
                    {conversionRate !== null && (
                      <div className="flex justify-center py-1">
                        <Badge variant="secondary" className="text-xs">
                          {conversionRate}% conversion
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-sm font-medium">{stage.label}</span>
                      <div className="h-8 flex-1 overflow-hidden rounded bg-muted">
                        <div
                          className="flex h-full items-center rounded bg-purple-500 px-3 text-xs font-semibold text-white transition-all"
                          style={{ width: `${widthPct}%` }}
                        >
                          {stage.value}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!conversion && (
            <p className="text-sm text-muted-foreground">No conversion data available</p>
          )}
        </CardContent>
      </Card>

      {/* Time to Hire */}
      <Card>
        <CardHeader>
          <CardTitle>Time to Hire</CardTitle>
        </CardHeader>
        <CardContent>
          {timeToHire && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Average Days</p>
                  <p className="text-3xl font-bold text-indigo-600">{timeToHire.averageDays}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Median Days</p>
                  <p className="text-3xl font-bold text-purple-600">{timeToHire.medianDays}</p>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold">By Department</h4>
                <div className="space-y-2">
                  {Object.entries(timeToHire.byDepartment).map(([dept, days]) => {
                    const deptMax = Math.max(...Object.values(timeToHire.byDepartment), 1);
                    return (
                      <div key={dept} className="flex items-center gap-3">
                        <span className="w-32 shrink-0 truncate text-sm">{dept}</span>
                        <div className="h-5 flex-1 overflow-hidden rounded bg-muted">
                          <div
                            className="flex h-full items-center rounded bg-emerald-500 px-2 text-xs font-medium text-white transition-all"
                            style={{ width: `${(days / deptMax) * 100}%` }}
                          >
                            {days}d
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {!timeToHire && (
            <p className="text-sm text-muted-foreground">No time-to-hire data available</p>
          )}
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleDownloadAnalyticsPdf} variant="outline">
              Download Analytics PDF
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Interviewer ID</label>
              <Input
                placeholder="Enter interviewer ID"
                value={interviewerId}
                onChange={(e) => setInterviewerId(e.target.value)}
              />
            </div>
            <Button
              onClick={handleDownloadInterviewerPdf}
              variant="outline"
              disabled={!interviewerId.trim()}
            >
              Download Interviewer PDF
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Job Position ID</label>
              <Input
                placeholder="Enter job position ID"
                value={jobPositionId}
                onChange={(e) => setJobPositionId(e.target.value)}
              />
            </div>
            <Button
              onClick={handleDownloadJobPositionPdf}
              variant="outline"
              disabled={!jobPositionId.trim()}
            >
              Download Job Position PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
