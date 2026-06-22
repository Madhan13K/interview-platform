"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { dashboardService } from "@/services/dashboard.service";
import { activityService } from "@/services/activity.service";
import { interviewService } from "@/services/interview.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminDashboardStats, ActivityResponse, InterviewResponse } from "@/types";

// ─── Animated Counter Hook ──────────────────────────────────────────────────
function useAnimatedCounter(end: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const prevEnd = useRef(0);

  useEffect(() => {
    if (end === prevEnd.current) return;
    prevEnd.current = end;

    let start = 0;
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration]);

  return count;
}

// ─── Stat Card Component ─────────────────────────────────────────────────────
function StatCard({ title, value, suffix, icon, color, delay }: {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
  delay: number;
}) {
  const animatedValue = useAnimatedCounter(value, 800);

  return (
    <div
      className="card-interactive group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background gradient blob */}
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:opacity-20 group-hover:scale-150 ${color}`} />

      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color} bg-opacity-10`}>
            {icon}
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold text-slate-900 number-roll">
          {animatedValue}{suffix}
        </p>
      </div>

      {/* Hover progress indicator */}
      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
    </div>
  );
}

// ─── Quick Action Card ───────────────────────────────────────────────────────
function QuickActionCard({ title, description, href, icon, gradient }: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <Link href={href}>
      <div className="card-interactive group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 h-full">
        <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${gradient}`} />
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 transition-all duration-300 group-hover:bg-white/80 group-hover:shadow-lg group-hover:scale-110">
            {icon}
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900 group-hover:text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500 group-hover:text-slate-600">{description}</p>
        </div>
        {/* Arrow indicator */}
        <div className="absolute right-4 top-4 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2">
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// ─── Activity Item ───────────────────────────────────────────────────────────
function ActivityItem({ action, detail, time, status, index }: {
  action: string;
  detail: string;
  time: string;
  status: string;
  index: number;
}) {
  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-500",
    completed: "bg-emerald-500",
    cancelled: "bg-red-500",
    pending: "bg-amber-500",
  };

  return (
    <div
      className="group flex items-start gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-slate-50 spring-press"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Timeline dot */}
      <div className="relative mt-1.5">
        <div className={`h-2.5 w-2.5 rounded-full ${statusColors[status] || "bg-slate-400"} ring-4 ring-white`} />
        {/* Connector line */}
        <div className="absolute left-1/2 top-3 h-8 w-px -translate-x-1/2 bg-slate-100" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{action}</p>
        <p className="text-xs text-slate-500 truncate">{detail}</p>
      </div>

      <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">{time}</span>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

// Helper: Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Helper: Map activity action to status for styling
function getActivityStatus(action: string): string {
  const actionLower = action.toLowerCase();
  if (actionLower.includes("schedul") || actionLower.includes("creat")) return "scheduled";
  if (actionLower.includes("complet") || actionLower.includes("submit") || actionLower.includes("feedback")) return "completed";
  if (actionLower.includes("cancel") || actionLower.includes("delet") || actionLower.includes("withdraw")) return "cancelled";
  return "pending";
}

const defaultStats: AdminDashboardStats = {
  totalInterviews: 0,
  scheduledInterviews: 0,
  completedInterviews: 0,
  cancelledInterviews: 0,
  totalCandidates: 0,
  totalInterviewers: 0,
  averageRating: 0,
  hireRate: 0,
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminDashboardStats>(defaultStats);
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all dashboard data in parallel
        const [statsData, activityData, interviewsData] = await Promise.allSettled([
          dashboardService.getMyStats(),
          activityService.getMy(),
          interviewService.filterByStatus("SCHEDULED"),
        ]);

        if (statsData.status === "fulfilled" && statsData.value) {
          const data = statsData.value;
          setStats({
            totalInterviews: (data as any).totalInterviews ?? 0,
            scheduledInterviews: (data as any).scheduledInterviews ?? (data as any).upcomingInterviews ?? 0,
            completedInterviews: (data as any).completedInterviews ?? 0,
            cancelledInterviews: (data as any).cancelledInterviews ?? 0,
            totalCandidates: (data as any).totalCandidates ?? 0,
            totalInterviewers: (data as any).totalInterviewers ?? 0,
            averageRating: (data as any).averageRating ?? 0,
            hireRate: (data as any).hireRate ?? 0,
          });
        }

        if (activityData.status === "fulfilled" && activityData.value) {
          setActivities(activityData.value.slice(0, 5)); // Show latest 5
        }

        if (interviewsData.status === "fulfilled" && interviewsData.value) {
          // Filter to today's interviews and sort by time
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const todayInterviews = interviewsData.value
            .filter((interview) => {
              const interviewDate = new Date(interview.scheduledAt);
              return interviewDate >= today && interviewDate < tomorrow;
            })
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
            .slice(0, 3); // Show up to 3

          setUpcomingInterviews(todayInterviews);
        }
      } catch {
        setStats(defaultStats);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-80 rounded-2xl" />
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting()}, <span className="text-indigo-600">{user?.firstName || "there"}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s what&apos;s happening with your interview platform today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
        <StatCard
          title="Interviews"
          value={stats.totalInterviews}
          icon={<svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
          color="bg-indigo-500"
          delay={0}
        />
        <StatCard
          title="Scheduled"
          value={stats.scheduledInterviews}
          icon={<svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          color="bg-blue-500"
          delay={50}
        />
        <StatCard
          title="Completed"
          value={stats.completedInterviews}
          icon={<svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-emerald-500"
          delay={100}
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelledInterviews}
          icon={<svg className="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-rose-500"
          delay={150}
        />
        <StatCard
          title="Candidates"
          value={stats.totalCandidates}
          icon={<svg className="h-4 w-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          color="bg-violet-500"
          delay={200}
        />
        <StatCard
          title="Hire Rate"
          value={Math.round(stats.hireRate)}
          suffix="%"
          icon={<svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          color="bg-amber-500"
          delay={250}
        />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
            <QuickActionCard
              title="Schedule"
              description="Book a new interview"
              href="/interviews"
              gradient="bg-gradient-to-br from-indigo-50 to-blue-50"
              icon={<svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>}
            />
            <QuickActionCard
              title="Questions"
              description="Manage question bank"
              href="/questions"
              gradient="bg-gradient-to-br from-emerald-50 to-teal-50"
              icon={<svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <QuickActionCard
              title="Reports"
              description="Analytics & insights"
              href="/reports"
              gradient="bg-gradient-to-br from-purple-50 to-pink-50"
              icon={<svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
            <QuickActionCard
              title="AI Assist"
              description="Smart suggestions"
              href="/ai"
              gradient="bg-gradient-to-br from-amber-50 to-orange-50"
              icon={<svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
            />
          </div>

          {/* Recent Activity */}
          <h2 className="text-lg font-semibold text-slate-900 mt-8 mb-4">Recent Activity</h2>
          <Card className="overflow-hidden">
            <CardContent className="p-2">
              <div className="stagger-children">
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <ActivityItem
                      key={activity.id}
                      action={activity.action}
                      detail={activity.description}
                      time={formatRelativeTime(activity.createdAt)}
                      status={getActivityStatus(activity.action)}
                      index={index}
                    />
                  ))
                ) : (
                  <div className="py-6 text-center text-sm text-slate-400">
                    No recent activity to display.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Performance Ring */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Platform Health</h3>
              <div className="flex items-center justify-center py-4">
                <div className="relative">
                  {/* Circular progress */}
                  <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none" stroke="#4f46e5" strokeWidth="10"
                      strokeDasharray={`${Math.PI * 100}`}
                      strokeDashoffset={`${Math.PI * 100 * (1 - (stats.hireRate || 72) / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900 number-roll">
                      {Math.round(stats.hireRate || 72)}%
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Success</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="rounded-lg bg-slate-50 p-3 text-center glow-hover">
                  <p className="text-lg font-bold text-slate-900">{stats.totalInterviewers || 12}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Interviewers</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center glow-hover">
                  <p className="text-lg font-bold text-slate-900">{stats.averageRating?.toFixed(1) || "4.2"}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Avg Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Upcoming Today</h3>
                <Link href="/scheduling" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingInterviews.length > 0 ? (
                  upcomingInterviews.map((interview) => (
                    <Link
                      key={interview.id}
                      href={`/interviews/${interview.id}`}
                    >
                      <div
                        className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50/30 spring-press"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                          {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).split(" ")[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{interview.title || interview.type || "Interview"}</p>
                          <p className="text-xs text-slate-500">{interview.candidateName || "Candidate"}</p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-emerald-400 status-dot" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No interviews scheduled for today.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Navigate */}
          <div className="grid grid-cols-2 gap-2">
            <Link href="/jobs">
              <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1 glow-hover">
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px]">Jobs</span>
              </Button>
            </Link>
            <Link href="/pipelines">
              <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1 glow-hover">
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-[10px]">Pipeline</span>
              </Button>
            </Link>
            <Link href="/teams">
              <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1 glow-hover">
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[10px]">Teams</span>
              </Button>
            </Link>
            <Link href="/documents">
              <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1 glow-hover">
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px]">Docs</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
