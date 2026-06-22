"use client";

import { useEffect, useState, useCallback } from "react";
import { userService } from "@/services/user.service";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { UserResponse } from "@/types/auth";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PENDING", label: "Pending" },
];

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const users = await userService.getAll();
      // Filter users with CANDIDATE role
      const candidateUsers = users.filter(
        (user) =>
          user.roles &&
          user.roles.some(
            (role) => role.toUpperCase() === "CANDIDATE" || role.toUpperCase() === "ROLE_CANDIDATE"
          )
      );
      setCandidates(candidateUsers);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const filteredCandidates = candidates.filter((candidate) => {
    const fullName = `${candidate.firstName} ${candidate.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || candidate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700 border-green-200";
      case "INACTIVE":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "SUSPENDED":
        return "bg-red-100 text-red-700 border-red-200";
      case "PENDING":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 bg-slate-200" />
            <Skeleton className="h-4 w-72 bg-slate-200 mt-2" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64 bg-slate-200" />
          <Skeleton className="h-10 w-48 bg-slate-200" />
        </div>
        <div className="border rounded-lg">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full bg-slate-100 mb-1" />
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Candidates</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage and view all candidates on the platform.
          </p>
        </div>
        <Button
          onClick={fetchCandidates}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS}
          className="w-48"
        />
        {(searchQuery || statusFilter) && (
          <Button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("");
            }}
            className="h-10 px-3 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300"
          >
            Clear Filters
          </Button>
        )}
        <span className="text-sm text-slate-500 ml-auto">
          {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Empty State */}
      {filteredCandidates.length === 0 && (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No candidates found</p>
            <p className="text-sm text-slate-400">
              {candidates.length === 0
                ? "No candidates have registered yet."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        </Card>
      )}

      {/* Candidates Table */}
      {filteredCandidates.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold text-slate-700">Name</TableHead>
                <TableHead className="font-semibold text-slate-700">Email</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                <TableHead className="font-semibold text-slate-700">Roles</TableHead>
                <TableHead className="font-semibold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.map((candidate) => (
                <>
                  <TableRow
                    key={candidate.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() =>
                      setExpandedId(expandedId === candidate.id ? null : candidate.id)
                    }
                  >
                    <TableCell className="font-medium text-slate-900">
                      {candidate.firstName} {candidate.lastName}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {candidate.email}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs border ${getStatusBadgeStyles(candidate.status)}`}>
                        {candidate.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {candidate.roles.map((role) => (
                          <Badge
                            key={role}
                            className="text-xs bg-indigo-100 text-indigo-700 border-indigo-200"
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(expandedId === candidate.id ? null : candidate.id);
                        }}
                        className="h-8 px-3 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                      >
                        {expandedId === candidate.id ? "Collapse" : "Details"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedId === candidate.id && (
                    <TableRow key={`${candidate.id}-detail`}>
                      <TableCell colSpan={5} className="bg-slate-50 p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">
                              Full Name
                            </p>
                            <p className="text-sm text-slate-900 mt-1">
                              {candidate.firstName} {candidate.lastName}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">
                              Email
                            </p>
                            <p className="text-sm text-slate-900 mt-1">
                              {candidate.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">
                              Phone
                            </p>
                            <p className="text-sm text-slate-900 mt-1">
                              {candidate.phoneNumber || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">
                              Status
                            </p>
                            <p className="text-sm text-slate-900 mt-1">
                              {candidate.status}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">
                              Roles
                            </p>
                            <p className="text-sm text-slate-900 mt-1">
                              {candidate.roles.join(", ")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">
                              User ID
                            </p>
                            <p className="text-sm text-slate-900 mt-1 font-mono text-xs">
                              {candidate.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
