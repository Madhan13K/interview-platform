"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CalendarConnection {
  id: string;
  provider: "google" | "outlook";
  email: string;
  connected: boolean;
  lastSynced: string | null;
  autoSync: boolean;
  syncFrequency: string;
}

interface SyncEvent {
  id: string;
  timestamp: string;
  direction: "push" | "pull";
  eventsSynced: number;
  status: "success" | "failed" | "partial";
  provider: "google" | "outlook";
}

interface UpcomingInterview {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: string[];
  provider: "google" | "outlook";
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_CONNECTIONS: CalendarConnection[] = [
  {
    id: "gc-1",
    provider: "google",
    email: "hiring@company.com",
    connected: true,
    lastSynced: "2024-01-25T14:30:00Z",
    autoSync: true,
    syncFrequency: "15min",
  },
  {
    id: "ol-1",
    provider: "outlook",
    email: "recruiter@company.com",
    connected: false,
    lastSynced: null,
    autoSync: false,
    syncFrequency: "30min",
  },
];

const MOCK_SYNC_HISTORY: SyncEvent[] = [
  { id: "s1", timestamp: "2024-01-25T14:30:00Z", direction: "pull", eventsSynced: 12, status: "success", provider: "google" },
  { id: "s2", timestamp: "2024-01-25T14:15:00Z", direction: "push", eventsSynced: 3, status: "success", provider: "google" },
  { id: "s3", timestamp: "2024-01-25T14:00:00Z", direction: "pull", eventsSynced: 8, status: "partial", provider: "google" },
  { id: "s4", timestamp: "2024-01-25T13:45:00Z", direction: "push", eventsSynced: 0, status: "failed", provider: "google" },
  { id: "s5", timestamp: "2024-01-25T13:30:00Z", direction: "pull", eventsSynced: 5, status: "success", provider: "google" },
];

const MOCK_UPCOMING: UpcomingInterview[] = [
  { id: "i1", title: "Technical Interview - Alice Johnson", date: "2024-01-26", time: "10:00 AM", participants: ["Sarah Chen", "David Kim"], provider: "google" },
  { id: "i2", title: "Culture Fit - Bob Martinez", date: "2024-01-26", time: "2:00 PM", participants: ["Emily Ross", "Lisa Wang"], provider: "google" },
  { id: "i3", title: "System Design - Carol White", date: "2024-01-27", time: "11:00 AM", participants: ["Michael Park", "Sarah Chen"], provider: "google" },
  { id: "i4", title: "Final Round - David Lee", date: "2024-01-28", time: "9:30 AM", participants: ["Sarah Chen", "Michael Park", "Lisa Wang"], provider: "google" },
  { id: "i5", title: "Phone Screen - Eva Brown", date: "2024-01-29", time: "3:00 PM", participants: ["Emily Ross"], provider: "google" },
  { id: "i6", title: "Panel Interview - Frank Miller", date: "2024-01-30", time: "1:00 PM", participants: ["David Kim", "Lisa Wang", "Emily Ross"], provider: "google" },
  { id: "i7", title: "Hiring Manager - Grace Wilson", date: "2024-01-31", time: "4:00 PM", participants: ["Sarah Chen"], provider: "google" },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function CalendarSyncPage() {
  const [connections, setConnections] = useState<CalendarConnection[]>(MOCK_CONNECTIONS);
  const [syncHistory] = useState<SyncEvent[]>(MOCK_SYNC_HISTORY);
  const [upcomingInterviews] = useState<UpcomingInterview[]>(MOCK_UPCOMING);
  const [loading] = useState(false);
  const [oauthDialogOpen, setOauthDialogOpen] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<"google" | "outlook">("google");

  // Settings
  const [autoCreateEvents, setAutoCreateEvents] = useState(true);
  const [sendInvites, setSendInvites] = useState(true);
  const [blockAvailability, setBlockAvailability] = useState(true);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleConnect = (provider: "google" | "outlook") => {
    setOauthProvider(provider);
    setOauthDialogOpen(true);
  };

  const handleDisconnect = (connectionId: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId ? { ...c, connected: false, lastSynced: null, autoSync: false } : c
      )
    );
  };

  const handleToggleAutoSync = (connectionId: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId ? { ...c, autoSync: !c.autoSync } : c
      )
    );
  };

  const handleSyncFrequencyChange = (connectionId: string, frequency: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId ? { ...c, syncFrequency: frequency } : c
      )
    );
  };

  const handleMockConnect = () => {
    setConnections((prev) =>
      prev.map((c) =>
        c.provider === oauthProvider
          ? { ...c, connected: true, lastSynced: new Date().toISOString(), autoSync: true }
          : c
      )
    );
    setOauthDialogOpen(false);
  };

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const syncStatusColors: Record<string, string> = {
    success: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    partial: "bg-amber-100 text-amber-700",
  };

  const googleConnection = connections.find((c) => c.provider === "google")!;
  const outlookConnection = connections.find((c) => c.provider === "outlook")!;

  // ─── Loading State ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar Sync</h1>
          <p className="text-sm text-slate-500 mt-1">Connect and sync your calendars for scheduling</p>
        </div>
        <div className="flex gap-2">
          {googleConnection.connected && (
            <Badge className="bg-green-100 text-green-700 border-green-200">Google Connected</Badge>
          )}
          {outlookConnection.connected && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">Outlook Connected</Badge>
          )}
          {!googleConnection.connected && !outlookConnection.connected && (
            <Badge className="bg-slate-100 text-slate-500 border-slate-200">No Calendars Connected</Badge>
          )}
        </div>
      </div>

      {/* Calendar Connection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Calendar */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <CardTitle className="text-lg font-semibold text-slate-900">Google Calendar</CardTitle>
              </div>
              {googleConnection.connected ? (
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Connected</Badge>
              ) : (
                <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-xs">Disconnected</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {googleConnection.connected ? (
              <>
                <p className="text-sm text-slate-600">{googleConnection.email}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Last synced: {googleConnection.lastSynced ? formatDateTime(googleConnection.lastSynced) : "Never"}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label className="text-sm text-slate-700">Auto-sync</Label>
                  <button
                    onClick={() => handleToggleAutoSync(googleConnection.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      googleConnection.autoSync ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        googleConnection.autoSync ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm text-slate-700">Sync frequency</Label>
                  <Select
                    value={googleConnection.syncFrequency}
                    onValueChange={(v) => handleSyncFrequencyChange(googleConnection.id, v)}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5min">Every 5 min</SelectItem>
                      <SelectItem value="15min">Every 15 min</SelectItem>
                      <SelectItem value="30min">Every 30 min</SelectItem>
                      <SelectItem value="1hr">Every 1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleDisconnect(googleConnection.id)}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 mb-4">Connect your Google Calendar to sync interview events</p>
                <Button
                  onClick={() => handleConnect("google")}
                  className="bg-[#4285F4] hover:bg-[#3367d6] text-white"
                >
                  Connect Google Calendar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outlook Calendar */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 01-.587.234h-8.55V6.577h8.55c.23 0 .424.08.587.234A.77.77 0 0124 7.387zM13.812 6.577v12.098H7.049l-.113-.012a.63.63 0 01-.376-.176.572.572 0 01-.185-.387V6.152c0-.153.062-.284.185-.387a.63.63 0 01.376-.176l.113-.012h6.763zM6.375 3v18.252c0 .165-.053.302-.16.41a.538.538 0 01-.403.163H.563a.538.538 0 01-.403-.163A.557.557 0 010 21.252V3c0-.165.053-.302.16-.41A.538.538 0 01.563 2.427h5.25c.158 0 .292.054.402.163.107.108.16.245.16.41z" />
                  </svg>
                </div>
                <CardTitle className="text-lg font-semibold text-slate-900">Outlook Calendar</CardTitle>
              </div>
              {outlookConnection.connected ? (
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Connected</Badge>
              ) : (
                <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-xs">Disconnected</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {outlookConnection.connected ? (
              <>
                <p className="text-sm text-slate-600">{outlookConnection.email}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Last synced: {outlookConnection.lastSynced ? formatDateTime(outlookConnection.lastSynced) : "Never"}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label className="text-sm text-slate-700">Auto-sync</Label>
                  <button
                    onClick={() => handleToggleAutoSync(outlookConnection.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      outlookConnection.autoSync ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        outlookConnection.autoSync ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm text-slate-700">Sync frequency</Label>
                  <Select
                    value={outlookConnection.syncFrequency}
                    onValueChange={(v) => handleSyncFrequencyChange(outlookConnection.id, v)}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5min">Every 5 min</SelectItem>
                      <SelectItem value="15min">Every 15 min</SelectItem>
                      <SelectItem value="30min">Every 30 min</SelectItem>
                      <SelectItem value="1hr">Every 1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleDisconnect(outlookConnection.id)}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 mb-4">Connect your Outlook Calendar to sync interview events</p>
                <Button
                  onClick={() => handleConnect("outlook")}
                  className="bg-[#0078D4] hover:bg-[#106ebe] text-white"
                >
                  Connect Outlook Calendar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sync History */}
      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Recent Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {syncHistory.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No sync history yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Timestamp</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Direction</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Events Synced</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Provider</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {syncHistory.map((event) => (
                    <tr key={event.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 px-3 text-slate-700">{formatDateTime(event.timestamp)}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-xs">
                          {event.direction === "push" ? "Push" : "Pull"}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-slate-700">{event.eventsSynced}</td>
                      <td className="py-2 px-3 text-slate-700 capitalize">{event.provider}</td>
                      <td className="py-2 px-3">
                        <Badge className={`text-xs ${syncStatusColors[event.status]}`}>
                          {event.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Interviews */}
      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            Upcoming Interviews (Next 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingInterviews.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No upcoming interviews.</p>
          ) : (
            <div className="space-y-3">
              {upcomingInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center justify-between p-3 border border-slate-100 rounded-md hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{interview.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">
                        {formatDate(interview.date)} at {interview.time}
                      </span>
                      <span className="text-xs text-slate-400">
                        {interview.participants.join(", ")}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {interview.provider}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Auto-create calendar events for new interviews</p>
              <p className="text-xs text-slate-500">Automatically creates a calendar event when a new interview is scheduled</p>
            </div>
            <button
              onClick={() => setAutoCreateEvents(!autoCreateEvents)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                autoCreateEvents ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  autoCreateEvents ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Send calendar invites to participants</p>
              <p className="text-xs text-slate-500">Participants receive a calendar invite when added to an interview</p>
            </div>
            <button
              onClick={() => setSendInvites(!sendInvites)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                sendInvites ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  sendInvites ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Block availability from calendar</p>
              <p className="text-xs text-slate-500">Use calendar busy times to determine interviewer availability</p>
            </div>
            <button
              onClick={() => setBlockAvailability(!blockAvailability)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                blockAvailability ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  blockAvailability ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* OAuth Dialog */}
      <Dialog open={oauthDialogOpen} onOpenChange={setOauthDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Connect {oauthProvider === "google" ? "Google" : "Outlook"} Calendar
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800 font-medium">OAuth Configuration Required</p>
              <p className="text-xs text-amber-700 mt-1">
                To complete the connection, you need to configure the OAuth redirect URI in your{" "}
                {oauthProvider === "google" ? "Google Cloud Console" : "Azure Portal"}:
              </p>
              <code className="block mt-2 text-xs bg-amber-100 p-2 rounded text-amber-900 break-all">
                {`${typeof window !== "undefined" ? window.location.origin : "https://your-app.com"}/api/auth/callback/${oauthProvider}`}
              </code>
            </div>

            <div className="text-sm text-slate-600 space-y-2">
              <p>This will:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-500">
                <li>Read your calendar events to check availability</li>
                <li>Create events for scheduled interviews</li>
                <li>Send calendar invites to participants</li>
              </ul>
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOauthDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleMockConnect}
                className={
                  oauthProvider === "google"
                    ? "bg-[#4285F4] hover:bg-[#3367d6] text-white"
                    : "bg-[#0078D4] hover:bg-[#106ebe] text-white"
                }
              >
                Authorize & Connect
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
