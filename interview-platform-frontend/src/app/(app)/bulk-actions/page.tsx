"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { bulkUpdate, bulkDelete, listOperations, BulkOperationStatus } from "@/services/bulk.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TableRow {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "HIRED" | "REJECTED";
  department: string;
  appliedDate: string;
}

const MOCK_DATA: TableRow[] = [
  { id: "c1", name: "Alice Johnson", email: "alice@example.com", status: "ACTIVE", department: "Engineering", appliedDate: "2026-06-01" },
  { id: "c2", name: "Bob Smith", email: "bob@example.com", status: "ACTIVE", department: "Design", appliedDate: "2026-06-03" },
  { id: "c3", name: "Carol Williams", email: "carol@example.com", status: "HIRED", department: "Engineering", appliedDate: "2026-05-20" },
  { id: "c4", name: "David Brown", email: "david@example.com", status: "ACTIVE", department: "Product", appliedDate: "2026-06-10" },
  { id: "c5", name: "Eva Martinez", email: "eva@example.com", status: "REJECTED", department: "Marketing", appliedDate: "2026-05-28" },
  { id: "c6", name: "Frank Garcia", email: "frank@example.com", status: "ACTIVE", department: "Engineering", appliedDate: "2026-06-12" },
  { id: "c7", name: "Grace Lee", email: "grace@example.com", status: "ACTIVE", department: "Design", appliedDate: "2026-06-15" },
  { id: "c8", name: "Henry Wilson", email: "henry@example.com", status: "INACTIVE", department: "Sales", appliedDate: "2026-05-15" },
  { id: "c9", name: "Iris Taylor", email: "iris@example.com", status: "ACTIVE", department: "Engineering", appliedDate: "2026-06-18" },
  { id: "c10", name: "Jack Anderson", email: "jack@example.com", status: "ACTIVE", department: "Product", appliedDate: "2026-06-20" },
  { id: "c11", name: "Karen Thomas", email: "karen@example.com", status: "HIRED", department: "Design", appliedDate: "2026-05-10" },
  { id: "c12", name: "Leo Jackson", email: "leo@example.com", status: "ACTIVE", department: "Engineering", appliedDate: "2026-06-22" },
  { id: "c13", name: "Mia White", email: "mia@example.com", status: "ACTIVE", department: "Marketing", appliedDate: "2026-06-24" },
  { id: "c14", name: "Nathan Harris", email: "nathan@example.com", status: "REJECTED", department: "Sales", appliedDate: "2026-06-01" },
  { id: "c15", name: "Olivia Clark", email: "olivia@example.com", status: "ACTIVE", department: "Engineering", appliedDate: "2026-06-25" },
];

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "HIRED", "REJECTED"] as const;

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  HIRED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function BulkActionsPage() {
  const [data, setData] = useState<TableRow[]>(MOCK_DATA);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [operations, setOperations] = useState<BulkOperationStatus[]>([]);
  const [showOperations, setShowOperations] = useState(false);

  useEffect(() => {
    loadOperations();
  }, []);

  const loadOperations = async () => {
    try {
      const ops = await listOperations();
      setOperations(ops);
    } catch {
      setOperations([]);
    }
  };

  const handleRowClick = (id: string, index: number, event: React.MouseEvent) => {
    if (event.shiftKey && lastSelectedIndex !== null) {
      // Shift-click: select range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSelection = new Set(selectedIds);
      for (let i = start; i <= end; i++) {
        newSelection.add(data[i].id);
      }
      setSelectedIds(newSelection);
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd-click: toggle single
      const newSelection = new Set(selectedIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      setSelectedIds(newSelection);
    } else {
      // Regular click: select only this
      setSelectedIds(new Set([id]));
    }
    setLastSelectedIndex(index);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((d) => d.id)));
    }
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    try {
      setProcessing(true);
      const items = Array.from(selectedIds).map((id) => ({ id, status: bulkStatus }));
      await bulkUpdate("candidate", items);

      // Update local state
      setData((prev) =>
        prev.map((row) =>
          selectedIds.has(row.id)
            ? { ...row, status: bulkStatus as TableRow["status"] }
            : row
        )
      );
      setSelectedIds(new Set());
      setBulkStatus("");
      await loadOperations();
    } catch (err) {
      console.error("Bulk update failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} item(s)?`)) return;
    try {
      setProcessing(true);
      await bulkDelete("candidate", Array.from(selectedIds));
      setData((prev) => prev.filter((row) => !selectedIds.has(row.id)));
      setSelectedIds(new Set());
      await loadOperations();
    } catch (err) {
      console.error("Bulk delete failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const isAllSelected = selectedIds.size === data.length && data.length > 0;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < data.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bulk Actions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Multi-select with Shift+Click, apply actions to multiple items at once
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOperations(!showOperations)}
        >
          {showOperations ? "Hide" : "Show"} History ({operations.length})
        </Button>
      </div>

      {/* Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 p-3 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-100 text-indigo-700 text-sm">
              {selectedIds.size} selected
            </Badge>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-indigo-600 hover:text-indigo-800 underline"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {/* Bulk Status Change */}
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-slate-200 text-sm bg-white"
            >
              <option value="">Change status to...</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={handleBulkStatusChange}
              disabled={!bulkStatus || processing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {processing ? "Processing..." : "Apply"}
            </Button>
            <div className="w-px h-6 bg-slate-300 mx-1" />
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDelete}
              disabled={processing}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono">Click</kbd>
          Select one
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono">Shift+Click</kbd>
          Select range
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono">Cmd+Click</kbd>
          Toggle selection
        </span>
        <span className="flex items-center gap-1">
          Checkbox header: Select all
        </span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => { if (el) el.indeterminate = isSomeSelected; }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Applied</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => {
                  const isSelected = selectedIds.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      onClick={(e) => handleRowClick(row.id, index, e)}
                      className={`border-b border-slate-100 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-indigo-50 hover:bg-indigo-100"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-slate-300 pointer-events-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">{row.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-600">{row.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${STATUS_COLORS[row.status]}`}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-600">{row.department}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-500">{row.appliedDate}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">No items to display</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operation History */}
      {showOperations && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operation History</CardTitle>
          </CardHeader>
          <CardContent>
            {operations.length > 0 ? (
              <div className="space-y-2">
                {operations.map((op) => (
                  <div key={op.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <Badge className={
                        op.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                        op.status === "PROCESSING" ? "bg-blue-100 text-blue-700" :
                        op.status === "FAILED" ? "bg-red-100 text-red-700" :
                        "bg-slate-100 text-slate-600"
                      }>
                        {op.status}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {op.operationType} {op.entityType}
                        </p>
                        <p className="text-xs text-slate-500">
                          {op.processedItems}/{op.totalItems} processed |{" "}
                          {op.successCount} success, {op.failureCount} failed
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 max-w-32 mx-4">
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${op.totalItems > 0 ? (op.processedItems / op.totalItems) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(op.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">No operations recorded yet</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
