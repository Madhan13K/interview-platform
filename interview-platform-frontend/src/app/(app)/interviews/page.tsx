"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { interviewService } from "@/services/interview.service";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  InterviewResponse,
  CreateInterviewRequest,
  InterviewType,
  InterviewStatus,
} from "@/types";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "CODING", label: "Coding" },
  { value: "HR", label: "HR" },
];

const TYPE_OPTIONS_FORM = [
  { value: "TECHNICAL", label: "Technical" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "CODING", label: "Coding" },
  { value: "HR", label: "HR" },
  { value: "CASE_STUDY", label: "Case Study" },
];

const statusBadgeStyles: Record<InterviewStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200",
  IN_PROGRESS: "bg-amber-100 text-amber-800 border-amber-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  NO_SHOW: "bg-slate-100 text-slate-800 border-slate-200",
};

const typeBadgeStyles: Record<InterviewType, string> = {
  TECHNICAL: "bg-purple-100 text-purple-800 border-purple-200",
  BEHAVIORAL: "bg-sky-100 text-sky-800 border-sky-200",
  SYSTEM_DESIGN: "bg-indigo-100 text-indigo-800 border-indigo-200",
  CODING: "bg-emerald-100 text-emerald-800 border-emerald-200",
  HR: "bg-pink-100 text-pink-800 border-pink-200",
  CASE_STUDY: "bg-orange-100 text-orange-800 border-orange-200",
};

const statusLabels: Record<InterviewStatus, string> = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

const typeLabels: Record<InterviewType, string> = {
  TECHNICAL: "Technical",
  BEHAVIORAL: "Behavioral",
  SYSTEM_DESIGN: "System Design",
  CODING: "Coding",
  HR: "HR",
  CASE_STUDY: "Case Study",
};

export default function InterviewsPage() {
  const { showSuccess, showError } = useActionFeedback();
  const [interviews, setInterviews] = useState<InterviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [formData, setFormData] = useState<CreateInterviewRequest>({
    title: "",
    type: "TECHNICAL",
    candidateId: "",
    scheduledAt: "",
    duration: 60,
    description: "",
    notes: "",
  });

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      // Use paginated endpoint for server-side pagination
      const response = await interviewService.getPaginated(page, pageSize, "scheduledAt,desc");
      setInterviews(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch {
      // Fallback to getAll if paginated endpoint not available
      try {
        const data = await interviewService.getAll();
        setInterviews(data);
        setTotalPages(Math.ceil(data.length / pageSize));
        setTotalElements(data.length);
      } catch (error) {
        console.error("Failed to fetch interviews:", error);
        showError("Failed to load", "Could not fetch interviews");
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  // Client-side filtering on the current page results
  const filteredInterviews = interviews.filter((interview) => {
    const matchesSearch =
      !search ||
      interview.title.toLowerCase().includes(search.toLowerCase()) ||
      interview.candidateName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || interview.status === statusFilter;
    const matchesType = !typeFilter || interview.type === typeFilter;

    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(interview.scheduledAt) >= new Date(dateFrom);
    }
    if (dateTo) {
      matchesDate = matchesDate && new Date(interview.scheduledAt) <= new Date(dateTo + "T23:59:59");
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0); // Reset to first page
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await interviewService.create(formData);
      showSuccess("Interview scheduled");
      setDialogOpen(false);
      setFormData({
        title: "",
        type: "TECHNICAL",
        candidateId: "",
        scheduledAt: "",
        duration: 60,
        description: "",
        notes: "",
      });
      await fetchInterviews();
    } catch (error) {
      console.error("Failed to create interview:", error);
      showError("Create failed", "Could not schedule interview");
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this interview?")) return;
    try {
      await interviewService.cancel(id);
      showSuccess("Interview cancelled");
      await fetchInterviews();
    } catch (error) {
      console.error("Failed to cancel interview:", error);
      showError("Cancel failed", "Could not cancel interview");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this interview? This action cannot be undone.")) return;
    try {
      await interviewService.delete(id);
      showSuccess("Interview deleted");
      await fetchInterviews();
    } catch (error) {
      console.error("Failed to delete interview:", error);
      showError("Delete failed", "Could not delete interview");
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Interviews</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and track all interviews across your organization.
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Schedule Interview
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Input
              placeholder="Search interviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From date"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To date"
          />
        </div>
      </Card>

      {/* Interviews Table */}
      {loading ? (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-8 w-24 ml-auto" />
              </div>
            ))}
          </div>
        </Card>
      ) : filteredInterviews.length === 0 ? (
        /* Empty State */
        <Card className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No interviews found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            {search || statusFilter || typeFilter || dateFrom || dateTo
              ? "No interviews match your current filters. Try adjusting your search criteria."
              : "Get started by scheduling your first interview."}
          </p>
          {!search && !statusFilter && !typeFilter && !dateFrom && !dateTo && (
            <Button
              onClick={() => setDialogOpen(true)}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Schedule Interview
            </Button>
          )}
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">Title</TableHead>
                  <TableHead className="font-semibold text-slate-700">Type</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700">Candidate</TableHead>
                  <TableHead className="font-semibold text-slate-700">Date</TableHead>
                  <TableHead className="font-semibold text-slate-700">Duration</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInterviews.map((interview) => (
                  <TableRow key={interview.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <Link
                        href={`/interviews/${interview.id}`}
                        className="font-medium text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {interview.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeBadgeStyles[interview.type]}>
                        {typeLabels[interview.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadgeStyles[interview.status]}>
                        {statusLabels[interview.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {interview.candidateName || interview.candidateId}
                    </TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">
                      {formatDate(interview.scheduledAt)}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatDuration(interview.duration)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/interviews/${interview.id}`}>
                          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Button>
                        </Link>
                        {interview.status === "SCHEDULED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 hover:text-amber-600"
                            onClick={() => handleCancel(interview.id)}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-red-600"
                          onClick={() => handleDelete(interview.id)}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredInterviews.map((interview) => (
              <div key={interview.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <Link
                    href={`/interviews/${interview.id}`}
                    className="font-medium text-slate-900 hover:text-indigo-600 transition-colors"
                  >
                    {interview.title}
                  </Link>
                  <Badge className={statusBadgeStyles[interview.status]}>
                    {statusLabels[interview.status]}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                  <Badge className={typeBadgeStyles[interview.type]}>
                    {typeLabels[interview.type]}
                  </Badge>
                  <span>{interview.candidateName || interview.candidateId}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{formatDate(interview.scheduledAt)}</span>
                  <span>{formatDuration(interview.duration)}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Link href={`/interviews/${interview.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  {interview.status === "SCHEDULED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-600 border-amber-200 hover:bg-amber-50"
                      onClick={() => handleCancel(interview.id)}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(interview.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Results count */}
      {!loading && filteredInterviews.length > 0 && (
        <p className="text-sm text-slate-500">
          Showing {filteredInterviews.length} of {totalElements} interviews
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Create Interview Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Fill in the details to schedule a new interview.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                required
                placeholder="e.g., Frontend Developer - Round 1"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Type <span className="text-red-500">*</span>
                </label>
                <Select
                  required
                  options={TYPE_OPTIONS_FORM}
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as InterviewType })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Duration (min) <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  type="number"
                  min={15}
                  max={480}
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Candidate ID <span className="text-red-500">*</span>
              </label>
              <Input
                required
                placeholder="Enter candidate ID"
                value={formData.candidateId}
                onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Scheduled At <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Brief description of the interview..."
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Internal notes (not visible to candidate)..."
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                disabled={creating}
              >
                {creating ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Scheduling...
                  </>
                ) : (
                  "Schedule Interview"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
