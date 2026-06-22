"use client";

import { useState, useEffect, useCallback } from "react";
import {
  analyticsService,
  type LeaderboardEntry,
} from "@/services/analytics.service";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type PeriodOption = "this_week" | "this_month" | "this_quarter" | "all_time";

const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "all_time", label: "All Time" },
];

function getMedalStyles(rank: number) {
  switch (rank) {
    case 1:
      return {
        border: "border-yellow-400",
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        badge: "bg-yellow-400 text-yellow-900",
        label: "1st",
        shadow: "shadow-yellow-100",
      };
    case 2:
      return {
        border: "border-slate-400",
        bg: "bg-slate-50",
        text: "text-slate-700",
        badge: "bg-slate-400 text-white",
        label: "2nd",
        shadow: "shadow-slate-100",
      };
    case 3:
      return {
        border: "border-orange-400",
        bg: "bg-orange-50",
        text: "text-orange-700",
        badge: "bg-orange-400 text-orange-900",
        label: "3rd",
        shadow: "shadow-orange-100",
      };
    default:
      return {
        border: "border-slate-200",
        bg: "bg-white",
        text: "text-slate-700",
        badge: "bg-slate-200 text-slate-700",
        label: `#${rank}`,
        shadow: "",
      };
  }
}

function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const stars: React.ReactNode[] = [];

  for (let i = 0; i < 5; i++) {
    if (i < fullStars || (i === fullStars && hasHalf)) {
      stars.push(
        <span key={i} className="text-yellow-400">
          ★
        </span>
      );
    } else {
      stars.push(
        <span key={i} className="text-slate-300">
          ★
        </span>
      );
    }
  }

  return <span className="inline-flex">{stars}</span>;
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<PeriodOption>("this_month");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const { showError } = useActionFeedback();

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getLeaderboard(period);
      setEntries(data);
    } catch {
      showError("Failed to load leaderboard data");
    } finally {
      setLoading(false);
    }
  }, [period, showError]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Interviewer Leaderboard</h1>
        <div className="flex gap-2 flex-wrap">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={period === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-8">
          {/* Podium skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 flex flex-col items-center gap-3">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-40" />
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Table skeleton */}
          <Card>
            <CardContent className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg text-slate-500">No leaderboard data available</p>
            <p className="text-sm text-slate-400 mt-1">
              Complete interviews to appear on the leaderboard
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top 3 Podium */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Display order: 2nd, 1st, 3rd for podium effect on desktop */}
              {[top3[1], top3[0], top3[2]]
                .filter(Boolean)
                .map((entry) => {
                  if (!entry) return null;
                  const styles = getMedalStyles(entry.rank);
                  return (
                    <Card
                      key={entry.interviewerId}
                      className={`border-2 ${styles.border} ${styles.shadow} ${
                        entry.rank === 1 ? "md:scale-105 md:-mt-4" : ""
                      }`}
                    >
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        {/* Medal Badge */}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-3 ${styles.badge}`}
                        >
                          {styles.label}
                        </div>

                        {/* Avatar placeholder */}
                        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl mb-3">
                          {entry.interviewerName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>

                        {/* Name */}
                        <h3 className="text-lg font-semibold text-slate-900">
                          {entry.interviewerName}
                        </h3>

                        {/* Stats */}
                        <div className="mt-3 space-y-1">
                          <p className="text-3xl font-bold text-indigo-600">
                            {entry.totalInterviews}
                          </p>
                          <p className="text-xs text-slate-500">interviews conducted</p>
                        </div>

                        {/* Rating & Hire Rate */}
                        <div className="mt-4 flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            {renderStars(entry.avgRating)}
                            <span className="text-xs text-slate-500 ml-1">
                              {entry.avgRating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Badge variant="success">{entry.hireRate}% hire rate</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </section>

          {/* Remaining Entries Table */}
          {rest.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Full Rankings</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Rank</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
                          <th className="px-4 py-3 text-center font-medium text-slate-600">
                            Total Interviews
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-slate-600">
                            Avg Rating
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-slate-600">
                            Hire Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rest.map((entry) => (
                          <tr
                            key={entry.interviewerId}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-600">#{entry.rank}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                                  {entry.interviewerName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)}
                                </div>
                                <span className="font-medium text-slate-900">
                                  {entry.interviewerName}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-slate-700">
                              {entry.totalInterviews}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {renderStars(entry.avgRating)}
                                <span className="text-xs text-slate-500 ml-1">
                                  {entry.avgRating.toFixed(1)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="success">{entry.hireRate}%</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}
