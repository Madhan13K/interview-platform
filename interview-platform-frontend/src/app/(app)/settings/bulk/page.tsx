"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { BULK_ENDPOINTS } from "@/lib/api-endpoints";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export default function BulkOperationsPage() {
  // Bulk Schedule state
  const [scheduleData, setScheduleData] = useState("");
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [schedulingProgress, setSchedulingProgress] = useState<number | null>(null);
  const [scheduleResult, setScheduleResult] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  // Bulk Invite state
  const [inviteEmails, setInviteEmails] = useState("");
  const [invitePosition, setInvitePosition] = useState("");
  const [inviteCount, setInviteCount] = useState<number | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  // Bulk Export state
  const [exportType, setExportType] = useState("INTERVIEWS");
  const [exportFormat, setExportFormat] = useState("CSV");
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // ─── Bulk Schedule ──────────────────────────────────────────────────────────
  const handleScheduleAll = async () => {
    try {
      setIsScheduling(true);
      setScheduleError(null);
      setScheduleResult(null);
      setSchedulingProgress(0);

      let payload: unknown;

      if (scheduleFile) {
        const formData = new FormData();
        formData.append("file", scheduleFile);
        const res = await api.post(BULK_ENDPOINTS.scheduleInterviews, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              setSchedulingProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
            }
          },
        });
        payload = res.data;
      } else if (scheduleData.trim()) {
        const lines = scheduleData.trim().split("\n");
        const interviews = lines.map((line) => {
          const [email, scheduledAt] = line.split(",").map((s) => s.trim());
          return { candidateEmail: email, scheduledAt };
        });
        const res = await api.post(BULK_ENDPOINTS.scheduleInterviews, { interviews });
        payload = res.data;
      } else {
        setScheduleError("Please upload a CSV file or paste interview data");
        setIsScheduling(false);
        return;
      }

      setSchedulingProgress(100);
      const result = payload as { scheduled?: number; total?: number };
      setScheduleResult(
        `Successfully scheduled ${result.scheduled ?? result.total ?? "all"} interviews`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to schedule interviews";
      setScheduleError(message);
    } finally {
      setIsScheduling(false);
    }
  };

  // ─── Bulk Invite ────────────────────────────────────────────────────────────
  const handleInvite = async () => {
    const emails = inviteEmails
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emails.length === 0) {
      setInviteError("Please enter at least one email address");
      return;
    }
    if (!invitePosition) {
      setInviteError("Please select a job position");
      return;
    }

    try {
      setIsInviting(true);
      setInviteError(null);
      setInviteCount(null);

      const res = await api.post(BULK_ENDPOINTS.inviteCandidates, {
        emails,
        jobPositionId: invitePosition,
      });
      const data = res.data as { invited?: number };
      setInviteCount(data.invited ?? emails.length);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send invitations";
      setInviteError(message);
    } finally {
      setIsInviting(false);
    }
  };

  // ─── Bulk Export ────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      setExportSuccess(null);

      const res = await api.post(
        BULK_ENDPOINTS.export,
        {
          type: exportType,
          format: exportFormat,
          dateFrom: exportDateFrom || undefined,
          dateTo: exportDateTo || undefined,
        },
        { responseType: "blob" }
      );

      // Trigger file download
      const blob = new Blob([res.data as BlobPart]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export-${exportType.toLowerCase()}.${exportFormat.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportSuccess(`Export completed successfully`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to export data";
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTemplateDownload = () => {
    const csvContent = "candidateEmail,scheduledAt\njohn@example.com,2025-01-15T10:00:00Z\njane@example.com,2025-01-16T14:00:00Z";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-schedule-template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bulk Operations</h1>
        <p className="mt-1 text-slate-600">
          Perform batch actions: schedule multiple interviews, invite candidates, or export data in
          bulk.
        </p>
      </div>

      {/* Bulk Schedule Interviews */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Schedule Interviews</CardTitle>
          <CardDescription>
            Upload a CSV file or paste candidate emails with scheduled times to schedule multiple
            interviews at once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template download */}
          <div>
            <button
              onClick={handleTemplateDownload}
              className="text-sm text-indigo-600 hover:text-indigo-800 underline"
            >
              Download CSV template
            </button>
          </div>

          {/* CSV File Upload */}
          <div>
            <Label htmlFor="schedule-file" className="text-sm font-medium text-slate-700">
              Upload CSV File
            </Label>
            <Input
              id="schedule-file"
              type="file"
              accept=".csv"
              onChange={(e) => setScheduleFile(e.target.files?.[0] ?? null)}
              className="mt-1"
            />
          </div>

          {/* Or paste data */}
          <div>
            <Label htmlFor="schedule-data" className="text-sm font-medium text-slate-700">
              Or Paste Data (email, scheduledAt per line)
            </Label>
            <Textarea
              id="schedule-data"
              placeholder="john@example.com, 2025-01-15T10:00:00Z&#10;jane@example.com, 2025-01-16T14:00:00Z"
              value={scheduleData}
              onChange={(e) => setScheduleData(e.target.value)}
              rows={5}
              className="mt-1 font-mono text-sm"
            />
          </div>

          {/* Progress */}
          {schedulingProgress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progress</span>
                <span>{schedulingProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${schedulingProgress}%` }}
                />
              </div>
            </div>
          )}

          {scheduleError && (
            <p className="text-sm text-red-600">{scheduleError}</p>
          )}
          {scheduleResult && (
            <p className="text-sm text-green-600">{scheduleResult}</p>
          )}

          <Button
            onClick={handleScheduleAll}
            disabled={isScheduling}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isScheduling ? "Scheduling..." : "Schedule All"}
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Invite Candidates */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Invite Candidates</CardTitle>
          <CardDescription>
            Send interview invitations to multiple candidates at once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="invite-emails" className="text-sm font-medium text-slate-700">
              Email Addresses (one per line)
            </Label>
            <Textarea
              id="invite-emails"
              placeholder="candidate1@example.com&#10;candidate2@example.com&#10;candidate3@example.com"
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              rows={5}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="invite-position" className="text-sm font-medium text-slate-700">
              Job Position
            </Label>
            <Select value={invitePosition} onValueChange={setInvitePosition}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frontend-engineer">Frontend Engineer</SelectItem>
                <SelectItem value="backend-engineer">Backend Engineer</SelectItem>
                <SelectItem value="fullstack-engineer">Fullstack Engineer</SelectItem>
                <SelectItem value="product-manager">Product Manager</SelectItem>
                <SelectItem value="designer">UX Designer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {inviteError && (
            <p className="text-sm text-red-600">{inviteError}</p>
          )}
          {inviteCount !== null && (
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 border-green-300">
                {inviteCount} invitation{inviteCount !== 1 ? "s" : ""} sent
              </Badge>
            </div>
          )}

          <Button
            onClick={handleInvite}
            disabled={isInviting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isInviting ? "Sending..." : "Send Invitations"}
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Export */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Export</CardTitle>
          <CardDescription>
            Export interview data, candidate records, or reports in your preferred format.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="export-type" className="text-sm font-medium text-slate-700">
                Export Type
              </Label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERVIEWS">Interviews</SelectItem>
                  <SelectItem value="CANDIDATES">Candidates</SelectItem>
                  <SelectItem value="REPORTS">Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="export-format" className="text-sm font-medium text-slate-700">
                Format
              </Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="export-date-from" className="text-sm font-medium text-slate-700">
                From Date
              </Label>
              <Input
                id="export-date-from"
                type="date"
                value={exportDateFrom}
                onChange={(e) => setExportDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="export-date-to" className="text-sm font-medium text-slate-700">
                To Date
              </Label>
              <Input
                id="export-date-to"
                type="date"
                value={exportDateTo}
                onChange={(e) => setExportDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {exportError && (
            <p className="text-sm text-red-600">{exportError}</p>
          )}
          {exportSuccess && (
            <p className="text-sm text-green-600">{exportSuccess}</p>
          )}

          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
