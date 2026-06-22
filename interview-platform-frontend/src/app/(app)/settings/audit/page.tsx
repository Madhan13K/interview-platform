"use client";

import { useEffect, useState, useCallback } from "react";
import { auditService } from "@/services/audit.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuditLogResponse, PaginatedResponse } from "@/types";

const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "All Entity Types" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "CANDIDATE", label: "Candidate" },
  { value: "USER", label: "User" },
  { value: "TEAM", label: "Team" },
  { value: "JOB_POSITION", label: "Job Position" },
  { value: "TEMPLATE", label: "Template" },
  { value: "PIPELINE", label: "Pipeline" },
  { value: "WEBHOOK", label: "Webhook" },
  { value: "API_KEY", label: "API Key" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "ROLE", label: "Role" },
  { value: "DOCUMENT", label: "Document" },
];

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [filterEmail, setFilterEmail] = useState("");
  const [filterEntityType, setFilterEntityType] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchLogs = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      let data: PaginatedResponse<AuditLogResponse> | AuditLogResponse[];

      if (filterEmail.trim()) {
        // Filter by user email
        const results = await auditService.getByUser(filterEmail.trim());
        setLogs(results);
        setTotalPages(1);
        setTotalElements(results.length);
      } else {
        // Get all with pagination
        const result = await auditService.getAll(pageNum);
        data = result;
        setLogs(result.content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [filterEmail]);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  // ─── Filter Logic ───────────────────────────────────────────────────────────

  const filteredLogs = logs.filter((log) => {
    const matchesEntityType = !filterEntityType || log.entityType === filterEntityType;
    const matchesDateFrom = !filterDateFrom || new Date(log.timestamp) >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || new Date(log.timestamp) <= new Date(filterDateTo + "T23:59:59");
    return matchesEntityType && matchesDateFrom && matchesDateTo;
  });

  // ─── Search by Email ────────────────────────────────────────────────────────

  const handleSearchByEmail = () => {
    setPage(0);
    fetchLogs(0);
  };

  // ─── Toggle Expanded ────────────────────────────────────────────────────────

  const toggleExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // ─── Clear Filters ──────────────────────────────────────────────────────────

  const handleClearFilters = () => {
    setFilterEmail("");
    setFilterEntityType("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(0);
  };

  const hasActiveFilters = filterEmail || filterEntityType || filterDateFrom || filterDateTo;

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loading && logs.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-36 bg-slate-200" />
        <div className="flex items-center gap-4 flex-wrap">
          <Skeleton className="h-10 w-64 bg-slate-200" />
          <Skeleton className="h-10 w-48 bg-slate-200" />
          <Skeleton className="h-10 w-40 bg-slate-200" />
          <Skeleton className="h-10 w-40 bg-slate-200" />
        </div>
        <Skeleton className="h-96 w-full bg-slate-100 rounded-lg" />
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <span className="text-sm text-slate-500">
          {totalElements} total entries
        </span>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200">
        <div className="p-4 space-y-3">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">User Email</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={filterEmail}
                  onChange={(e) => setFilterEmail(e.target.value)}
                  placeholder="Filter by email..."
                  className="w-56"
                  onKeyDown={(e) => e.key === "Enter" && handleSearchByEmail()}
                />
                <Button
                  onClick={handleSearchByEmail}
                  className="h-10 px-3 text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Search
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Entity Type</Label>
              <Select
                value={filterEntityType}
                onChange={(e) => setFilterEntityType(e.target.value)}
                options={ENTITY_TYPE_OPTIONS}
                className="w-48"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">From Date</Label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-40"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">To Date</Label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-40"
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
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      {filteredLogs.length === 0 ? (
        <Card className="p-12 text-center border-slate-200">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No audit logs found</p>
            <p className="text-sm text-slate-400">
              {hasActiveFilters
                ? "Try adjusting your filters."
                : "No activity has been recorded yet."}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 uppercase">Timestamp</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 uppercase">User</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 uppercase">Action</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 uppercase">Entity Type</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 uppercase">Entity ID</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 uppercase">IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <>
                    <TableRow
                      key={log.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => toggleExpanded(log.id)}
                    >
                      <TableCell className="w-10 text-center">
                        <span
                          className={`inline-block transition-transform text-slate-400 ${
                            expandedRows.has(log.id) ? "rotate-90" : ""
                          }`}
                        >
                          &#9656;
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">{log.userEmail}</TableCell>
                      <TableCell>
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{log.entityType}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500 max-w-[120px] truncate">
                        {log.entityId}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{log.ipAddress || "—"}</TableCell>
                    </TableRow>

                    {/* Expanded Row: Old/New Values */}
                    {expandedRows.has(log.id) && (log.oldValue || log.newValue) && (
                      <TableRow key={`${log.id}-expanded`}>
                        <TableCell colSpan={7} className="bg-slate-50 p-0">
                          <div className="px-6 py-3 space-y-2">
                            {log.oldValue && (
                              <div>
                                <span className="text-xs font-medium text-slate-500">Old Value:</span>
                                <pre className="mt-1 text-xs text-slate-700 bg-white border border-slate-200 rounded p-2 overflow-x-auto max-h-40">
                                  {(() => {
                                    try {
                                      return JSON.stringify(JSON.parse(log.oldValue), null, 2);
                                    } catch {
                                      return log.oldValue;
                                    }
                                  })()}
                                </pre>
                              </div>
                            )}
                            {log.newValue && (
                              <div>
                                <span className="text-xs font-medium text-slate-500">New Value:</span>
                                <pre className="mt-1 text-xs text-slate-700 bg-white border border-slate-200 rounded p-2 overflow-x-auto max-h-40">
                                  {(() => {
                                    try {
                                      return JSON.stringify(JSON.parse(log.newValue), null, 2);
                                    } catch {
                                      return log.newValue;
                                    }
                                  })()}
                                </pre>
                              </div>
                            )}
                            {log.userAgent && (
                              <p className="text-xs text-slate-400">
                                User Agent: {log.userAgent}
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {expandedRows.has(log.id) && !log.oldValue && !log.newValue && (
                      <TableRow key={`${log.id}-expanded`}>
                        <TableCell colSpan={7} className="bg-slate-50">
                          <p className="text-xs text-slate-400 text-center py-2">
                            No change details recorded for this action.
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-500">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                  className="h-8 px-3 text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 disabled:opacity-50"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || loading}
                  className="h-8 px-3 text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
