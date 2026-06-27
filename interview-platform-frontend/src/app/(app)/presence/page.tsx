"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActiveUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  status: "active" | "idle" | "away";
  currentPage: string;
  lastActiveAt: string;
  color: string;
}

interface ViewingSession {
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  entityName: string;
  startedAt: string;
  color: string;
}

const MOCK_USERS: ActiveUser[] = [
  { id: "u1", name: "Sarah Chen", email: "sarah@company.com", avatar: null, status: "active", currentPage: "/pipelines", lastActiveAt: new Date().toISOString(), color: "#4f46e5" },
  { id: "u2", name: "Alex Morgan", email: "alex@company.com", avatar: null, status: "active", currentPage: "/candidates", lastActiveAt: new Date(Date.now() - 30000).toISOString(), color: "#059669" },
  { id: "u3", name: "James Wilson", email: "james@company.com", avatar: null, status: "idle", currentPage: "/interviews", lastActiveAt: new Date(Date.now() - 300000).toISOString(), color: "#d97706" },
  { id: "u4", name: "Emily Park", email: "emily@company.com", avatar: null, status: "active", currentPage: "/report-builder", lastActiveAt: new Date(Date.now() - 60000).toISOString(), color: "#dc2626" },
  { id: "u5", name: "Michael Brown", email: "michael@company.com", avatar: null, status: "away", currentPage: "/dashboard", lastActiveAt: new Date(Date.now() - 900000).toISOString(), color: "#7c3aed" },
];

const MOCK_SESSIONS: ViewingSession[] = [
  { userId: "u1", userName: "Sarah Chen", entityType: "Candidate", entityId: "c1", entityName: "John Doe - Senior Engineer", startedAt: new Date(Date.now() - 120000).toISOString(), color: "#4f46e5" },
  { userId: "u2", userName: "Alex Morgan", entityType: "Candidate", entityId: "c1", entityName: "John Doe - Senior Engineer", startedAt: new Date(Date.now() - 60000).toISOString(), color: "#059669" },
  { userId: "u4", userName: "Emily Park", entityType: "Report", entityId: "r1", entityName: "Q4 Hiring Metrics", startedAt: new Date(Date.now() - 300000).toISOString(), color: "#dc2626" },
  { userId: "u3", userName: "James Wilson", entityType: "Interview", entityId: "i1", entityName: "Technical Round - Jane Smith", startedAt: new Date(Date.now() - 180000).toISOString(), color: "#d97706" },
];

export default function PresencePage() {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [sessions, setSessions] = useState<ViewingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "idle" | "away">("all");

  useEffect(() => {
    // Simulate loading presence data
    const timer = setTimeout(() => {
      setUsers(MOCK_USERS);
      setSessions(MOCK_SESSIONS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers((prev) =>
        prev.map((user) => ({
          ...user,
          lastActiveAt: user.status === "active" ? new Date().toISOString() : user.lastActiveAt,
        }))
      );
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredUsers = filter === "all" ? users : users.filter((u) => u.status === filter);

  const getStatusColor = (status: ActiveUser["status"]) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "idle": return "bg-yellow-500";
      case "away": return "bg-slate-400";
    }
  };

  const getStatusLabel = (status: ActiveUser["status"]) => {
    switch (status) {
      case "active": return "Active now";
      case "idle": return "Idle";
      case "away": return "Away";
    }
  };

  const formatRelativeTime = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 30) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 1) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  // Group sessions by entity
  const groupedSessions = sessions.reduce((acc, session) => {
    const key = `${session.entityType}:${session.entityId}`;
    if (!acc[key]) {
      acc[key] = { entityType: session.entityType, entityName: session.entityName, viewers: [] };
    }
    acc[key].viewers.push(session);
    return acc;
  }, {} as Record<string, { entityType: string; entityName: string; viewers: ViewingSession[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading presence data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Collaboration Indicators</h1>
          <p className="text-sm text-slate-500 mt-1">
            See who is online and what they are currently viewing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-slate-600">
              {users.filter((u) => u.status === "active").length} active
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-800">{users.filter((u) => u.status === "active").length}</p>
              <p className="text-xs text-green-600">Active Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-800">{users.filter((u) => u.status === "idle").length}</p>
              <p className="text-xs text-yellow-600">Idle Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{users.filter((u) => u.status === "away").length}</p>
              <p className="text-xs text-slate-600">Away</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Team Members</CardTitle>
              <div className="flex gap-1">
                {(["all", "active", "idle", "away"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                      filter === f ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      Viewing: {user.currentPage}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{getStatusLabel(user.status)}</p>
                    <p className="text-xs text-slate-300">{formatRelativeTime(user.lastActiveAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Who's Viewing What */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Currently Viewing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(groupedSessions).map(([key, group]) => (
                <div key={key} className="p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">{group.entityType}</Badge>
                    <span className="text-sm font-medium text-slate-700 truncate">{group.entityName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {group.viewers.map((viewer) => (
                      <div
                        key={viewer.userId}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium -ml-1 first:ml-0 border-2 border-white"
                        style={{ backgroundColor: viewer.color }}
                        title={viewer.userName}
                      >
                        {viewer.userName.split(" ").map((n) => n[0]).join("")}
                      </div>
                    ))}
                    <span className="text-xs text-slate-500 ml-2">
                      {group.viewers.length} viewer{group.viewers.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
