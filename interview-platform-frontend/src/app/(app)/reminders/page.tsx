"use client";

import { useEffect, useState } from "react";
import { reminderService } from "@/services/reminder.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReminderResponse } from "@/types";

const REMINDER_TYPE_OPTIONS = [
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "IN_APP", label: "In-App" },
];

const typeBadgeStyles: Record<string, string> = {
  EMAIL: "bg-blue-100 text-blue-800 border-blue-200",
  SMS: "bg-purple-100 text-purple-800 border-purple-200",
  IN_APP: "bg-amber-100 text-amber-800 border-amber-200",
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Create form state
  const [formInterviewId, setFormInterviewId] = useState("");
  const [formType, setFormType] = useState<"EMAIL" | "SMS" | "IN_APP">("EMAIL");
  const [formScheduledAt, setFormScheduledAt] = useState("");

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const data = await reminderService.getMy();
      setReminders(data);
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInterviewId || !formScheduledAt) return;

    try {
      setCreating(true);
      await reminderService.create(formInterviewId, {
        type: formType,
        scheduledAt: new Date(formScheduledAt).toISOString(),
      });
      setDialogOpen(false);
      setFormInterviewId("");
      setFormType("EMAIL");
      setFormScheduledAt("");
      await fetchReminders();
    } catch (error) {
      console.error("Failed to create reminder:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (reminder: ReminderResponse) => {
    if (!confirm("Are you sure you want to cancel this reminder?")) return;
    try {
      setCancellingId(reminder.id);
      await reminderService.cancel(reminder.interviewId);
      await fetchReminders();
    } catch (error) {
      console.error("Failed to cancel reminder:", error);
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingReminders = reminders.filter((r) => !r.sent);
  const sentReminders = reminders.filter((r) => r.sent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reminders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage interview reminders via email, SMS, or in-app notifications.
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Reminder
        </Button>
      </div>

      {/* Reminders List */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-8 w-16 ml-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : reminders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No reminders yet</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            Create your first reminder to get notified about upcoming interviews.
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Create Reminder
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending Reminders */}
          {pendingReminders.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-amber-500" />
                  Pending ({pendingReminders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-slate-100">
                  {pendingReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-slate-700 font-mono">
                          {reminder.interviewId.slice(0, 8)}...
                        </span>
                        <Badge className={typeBadgeStyles[reminder.type]}>
                          {reminder.type === "IN_APP" ? "In-App" : reminder.type}
                        </Badge>
                        <span className="text-sm text-slate-500">
                          {formatDate(reminder.scheduledAt)}
                        </span>
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                          Pending
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleCancel(reminder)}
                        disabled={cancellingId === reminder.id}
                      >
                        {cancellingId === reminder.id ? "Cancelling..." : "Cancel"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sent Reminders */}
          {sentReminders.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-green-500" />
                  Sent ({sentReminders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-slate-100">
                  {sentReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-slate-700 font-mono">
                          {reminder.interviewId.slice(0, 8)}...
                        </span>
                        <Badge className={typeBadgeStyles[reminder.type]}>
                          {reminder.type === "IN_APP" ? "In-App" : reminder.type}
                        </Badge>
                        <span className="text-sm text-slate-500">
                          {formatDate(reminder.scheduledAt)}
                        </span>
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          Sent
                        </Badge>
                        {reminder.sentAt && (
                          <span className="text-xs text-slate-400">
                            Sent at: {formatDate(reminder.sentAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create Reminder Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Reminder</DialogTitle>
            <DialogDescription>
              Set up a reminder for an upcoming interview.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Interview ID <span className="text-red-500">*</span>
              </label>
              <Input
                required
                placeholder="Enter interview ID"
                value={formInterviewId}
                onChange={(e) => setFormInterviewId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Reminder Type <span className="text-red-500">*</span>
              </label>
              <Select
                required
                options={REMINDER_TYPE_OPTIONS}
                value={formType}
                onChange={(e) => setFormType(e.target.value as "EMAIL" | "SMS" | "IN_APP")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Scheduled At <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="datetime-local"
                value={formScheduledAt}
                onChange={(e) => setFormScheduledAt(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={creating || !formInterviewId || !formScheduledAt}
              >
                {creating ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Reminder"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
