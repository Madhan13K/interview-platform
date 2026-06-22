"use client";

import { useEffect, useState, useCallback } from "react";
import { activityService } from "@/services/activity.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityResponse } from "@/types";

const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "All Entities" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "CANDIDATE", label: "Candidate" },
  { value: "JOB_POSITION", label: "Job Position" },
  { value: "TEAM", label: "Team" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "USER", label: "User" },
  { value: "TEMPLATE", label: "Template" },
  { value: "PIPELINE", label: "Pipeline" },
];

const ACTION_TYPE_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "STATUS_CHANGE", label: "Status Change" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
];

type TabType = "all" | "my";

function getActionColor(action: string): string {
  const upper = action.toUpperCase();
  if (upper.includes("CREATE")) return "bg-green-100 text-green-700 border-green-200";
  if (upper.includes("UPDATE")) return "bg-blue-100 text-blue-700 border-blue-200";
  if (upper.includes("DELETE")) return "bg-red-100 text-red-700 border-red-200";
  if (upper.includes("STATUS_CHANGE")) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function getActionDotColor(action: string): string {
  const upper = action.toUpperCase();
  if (upper.includes("CREATE")) return "bg-green-500";
  if (upper.includes("UPDATE")) return "bg-blue-500";
  if (upper.includes("DELETE")) return "bg-red-500";
  if (upper.includes("STATUS_CHANGE")) return "bg-amber-500";
  return "bg-slate-400";
}

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchActivities = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      }

      if (activeTab === "my") {
        const data = await activityService.getMy();
        setActivities(data);
        setHasMore(false);
      } else if (entityTypeFilter || actionFilter || startDate || endDate) {
        const data = await activityService.filter({
          entityType: entityTypeFilter || undefined,
          action: actionFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setActivities(data);
        setHasMore(false);
      } else {
        const data = await activityService.getAll(reset ? 0 : page, 20);
        if (reset) {
          setActivities(data.content);
        } else {
          setActivities((prev) => [...prev, ...data.content]);
        }
        setHasMore(!data.last);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, entityTypeFilter, actionFilter, startDate, endDate, page]);

  useEffect(() => {
    fetchActivities(true);
  }, [activeTab, entityTypeFilter, actionFilter, startDate, endDate]);

  useEffect(() => {
    if (page > 0) {
      setLoadingMore(true);
      fetchActivities(false);
    }
  }, [page]);

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleClearFilters = () => {
    setEntityTypeFilter("");
    setActionFilter("");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters = entityTypeFilter || actionFilter || startDate || endDate;

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40 bg-slate-200" />
          <Skeleton className="h-10 w-48 bg-slate-200" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-40 bg-slate-200" />
          <Skeleton className="h-10 w-40 bg-slate-200" />
          <Skeleton className="h-10 w-36 bg-slate-200" />
          <Skeleton className="h-10 w-36 bg-slate-200" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48 bg-slate-200" />
                <Skeleton className="h-3 w-72 bg-slate-100" />
              </div>
              <Skeleton className="h-4 w-16 bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Activity Feed</h1>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "my"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            My Activity
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="p-4 border-slate-200">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Entity Type</Label>
            <Select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              options={ENTITY_TYPE_OPTIONS}
              className="w-44"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Action</Label>
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              options={ACTION_TYPE_OPTIONS}
              className="w-40"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-36"
            />
          </div>
          {hasActiveFilters && (
            <Button
              onClick={handleClearFilters}
              className="h-10 px-3 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300"
            >
              Clear Filters
            </Button>
          )}
          <span className="text-sm text-slate-500 ml-auto">
            {activities.length} activit{activities.length !== 1 ? "ies" : "y"}
          </span>
        </div>
      </Card>

      {/* Empty State */}
      {activities.length === 0 && (
        <Card className="p-12 text-center border-slate-200">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No activity found</p>
            <p className="text-sm text-slate-400">
              {hasActiveFilters
                ? "Try adjusting your filters to see more results."
                : "Activity will appear here as actions are performed."}
            </p>
          </div>
        </Card>
      )}

      {/* Timeline */}
      {activities.length > 0 && (
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

          <div className="space-y-1">
            {activities.map((activity, index) => (
              <div key={activity.id} className="relative flex items-start gap-4 py-3">
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                      activity.userName
                        ? "bg-indigo-100"
                        : "bg-slate-100"
                    }`}
                  >
                    <span className="text-xs font-semibold text-indigo-700">
                      {getInitials(activity.userName)}
                    </span>
                  </div>
                  {/* Connector dot overlay */}
                  <div
                    className={`absolute -left-[3px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full ${getActionDotColor(
                      activity.action
                    )} ring-2 ring-white`}
                    style={{ left: "-7px" }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-900">
                      {activity.userName || "Unknown User"}
                    </span>
                    <Badge
                      className={`text-xs border ${getActionColor(activity.action)}`}
                    >
                      {activity.action}
                    </Badge>
                    <Badge className="text-xs bg-slate-100 text-slate-600 border-slate-200">
                      {activity.entityType}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5 truncate">
                    {activity.description}
                  </p>
                </div>

                {/* Timestamp */}
                <span className="text-xs text-slate-400 whitespace-nowrap pt-1.5">
                  {getRelativeTime(activity.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Load More */}
      {hasMore && activities.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-6"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
