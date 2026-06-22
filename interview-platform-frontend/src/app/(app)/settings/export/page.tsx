"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { EXPORT_IMPORT_ENDPOINTS } from "@/lib/api-endpoints";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ExportJobResponse, PaginatedResponse } from "@/types";

const ENTITY_TYPES = ["INTERVIEWS", "CANDIDATES", "QUESTIONS", "TEMPLATES", "REPORTS", "USERS"];
const FORMATS = ["CSV", "JSON", "PDF"];

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "PROCESSING":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-300";
    case "FAILED":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-slate-100 text-slate-800 border-slate-300";
  }
}

export default function ExportImportPage() {
  // New job state
  const [jobMode, setJobMode] = useState<"EXPORT" | "IMPORT">("EXPORT");
  const [entityType, setEntityType] = useState("INTERVIEWS");
  const [format, setFormat] = useState("CSV");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Job history state
  const [jobs, setJobs] = useState<ExportJobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<PaginatedResponse<ExportJobResponse>>(
        EXPORT_IMPORT_ENDPOINTS.getJobs,
        { params: { page, size: 10 } }
      );
      setJobs(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load jobs";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ─── Start Export ───────────────────────────────────────────────────────────
  const handleStartExport = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      await api.post(EXPORT_IMPORT_ENDPOINTS.startExport, {
        entityType,
        format,
      });

      setSubmitSuccess("Export job started successfully");
      await fetchJobs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start export";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Start Import ───────────────────────────────────────────────────────────
  const handleStartImport = async () => {
    if (!importFile) {
      setSubmitError("Please select a file to import");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("entityType", entityType);

      await api.post(EXPORT_IMPORT_ENDPOINTS.startImport, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSubmitSuccess("Import job started successfully");
      setImportFile(null);
      await fetchJobs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start import";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Cancel Job ─────────────────────────────────────────────────────────────
  const handleCancel = async (jobId: string) => {
    try {
      setCancellingId(jobId);
      await api.delete(EXPORT_IMPORT_ENDPOINTS.cancelJob(jobId));
      await fetchJobs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to cancel job";
      setError(message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Data Export & Import</h1>
        <p className="mt-1 text-slate-600">
          Start export or import jobs and track their progress. Download completed exports or upload
          data files for import.
        </p>
      </div>

      {/* Start New Job */}
      <Card>
        <CardHeader>
          <CardTitle>Start New Job</CardTitle>
          <CardDescription>
            Create a new export or import job.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={jobMode === "EXPORT" ? "default" : "outline"}
              onClick={() => setJobMode("EXPORT")}
              className={jobMode === "EXPORT" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
            >
              Export
            </Button>
            <Button
              variant={jobMode === "IMPORT" ? "default" : "outline"}
              onClick={() => setJobMode("IMPORT")}
              className={jobMode === "IMPORT" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
            >
              Import
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Entity type */}
            <div>
              <Label className="text-sm font-medium text-slate-700">Entity Type</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format (export only) */}
            {jobMode === "EXPORT" && (
              <div>
                <Label className="text-sm font-medium text-slate-700">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* File upload for import */}
          {jobMode === "IMPORT" && (
            <div>
              <Label className="text-sm font-medium text-slate-700">Upload File</Label>
              <Input
                type="file"
                accept=".csv,.json"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                className="mt-1"
              />
            </div>
          )}

          {submitError && (
            <p className="text-sm text-red-600">{submitError}</p>
          )}
          {submitSuccess && (
            <p className="text-sm text-green-600">{submitSuccess}</p>
          )}

          <Button
            onClick={jobMode === "EXPORT" ? handleStartExport : handleStartImport}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting
              ? "Starting..."
              : jobMode === "EXPORT"
              ? "Start Export"
              : "Start Import"}
          </Button>
        </CardContent>
      </Card>

      {/* Job History */}
      <Card>
        <CardHeader>
          <CardTitle>Job History</CardTitle>
          <CardDescription>
            Track the progress of your export and import jobs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <span className="ml-2 text-sm text-slate-500">Loading jobs...</span>
            </div>
          ) : jobs.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">No jobs found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Type</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Format</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Entity Type</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">File Name</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Records</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Created</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <Badge
                            className={
                              job.type === "EXPORT"
                                ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                                : "bg-purple-100 text-purple-800 border-purple-300"
                            }
                          >
                            {job.type}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Badge className={getStatusBadge(job.status)}>{job.status}</Badge>
                        </td>
                        <td className="px-3 py-2 text-slate-700">{job.format}</td>
                        <td className="px-3 py-2 text-slate-700">{job.entityType}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {job.fileName ?? <span className="text-slate-400">-</span>}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {job.status === "PROCESSING" && job.totalRecords ? (
                            <div className="space-y-1">
                              <span className="text-xs">
                                {job.processedRecords ?? 0}/{job.totalRecords}
                              </span>
                              <div className="h-1.5 w-16 rounded-full bg-slate-200">
                                <div
                                  className="h-1.5 rounded-full bg-blue-500 transition-all"
                                  style={{
                                    width: `${
                                      job.totalRecords
                                        ? ((job.processedRecords ?? 0) / job.totalRecords) * 100
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span>{job.totalRecords ?? "-"}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-xs">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {job.status === "COMPLETED" && job.downloadUrl && (
                              <a
                                href={job.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                              >
                                Download
                              </a>
                            )}
                            {job.status === "PENDING" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancel(job.id)}
                                disabled={cancellingId === job.id}
                                className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                              >
                                {cancellingId === job.id ? "..." : "Cancel"}
                              </Button>
                            )}
                            {job.status === "FAILED" && job.errorMessage && (
                              <span
                                className="text-xs text-red-500 truncate max-w-[120px]"
                                title={job.errorMessage}
                              >
                                {job.errorMessage}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
