"use client";

import { useState, useEffect, useCallback } from "react";
import { jobPositionService } from "@/services/job-position.service";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  JobPositionResponse,
  CreateJobPositionRequest,
  JobPositionStatus,
} from "@/types";

const STATUS_OPTIONS: JobPositionStatus[] = ["OPEN", "CLOSED", "ON_HOLD", "DRAFT"];
const TYPE_OPTIONS = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"] as const;

const statusColorMap: Record<JobPositionStatus, string> = {
  OPEN: "bg-green-100 text-green-800 border-green-200",
  CLOSED: "bg-red-100 text-red-800 border-red-200",
  ON_HOLD: "bg-amber-100 text-amber-800 border-amber-200",
  DRAFT: "bg-slate-100 text-slate-800 border-slate-200",
};

const typeLabels: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

const initialFormData: CreateJobPositionRequest = {
  title: "",
  description: "",
  department: "",
  location: "",
  type: "FULL_TIME",
  experienceLevel: "",
  openings: 1,
  requirements: [],
  skills: [],
  salaryRange: undefined,
};

export default function JobPositionsPage() {
  const { showSuccess, showError } = useActionFeedback();
  const [positions, setPositions] = useState<JobPositionResponse[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<JobPositionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<JobPositionResponse | null>(null);
  const [formData, setFormData] = useState<CreateJobPositionRequest>(initialFormData);
  const [requirementsText, setRequirementsText] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("USD");
  const [submitting, setSubmitting] = useState(false);

  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await jobPositionService.getAll();
      setPositions(data);
    } catch (error) {
      console.error("Failed to fetch job positions:", error);
      showError("Failed to load", "Could not fetch job positions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  useEffect(() => {
    let filtered = [...positions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.department.toLowerCase().includes(query) ||
          (p.location && p.location.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (typeFilter !== "ALL") {
      filtered = filtered.filter((p) => p.type === typeFilter);
    }

    setFilteredPositions(filtered);
  }, [positions, searchQuery, statusFilter, typeFilter]);

  const openCreateDialog = () => {
    setEditingPosition(null);
    setFormData(initialFormData);
    setRequirementsText("");
    setSkillsText("");
    setSalaryMin("");
    setSalaryMax("");
    setSalaryCurrency("USD");
    setDialogOpen(true);
  };

  const openEditDialog = (position: JobPositionResponse) => {
    setEditingPosition(position);
    setFormData({
      title: position.title,
      description: position.description || "",
      department: position.department,
      location: position.location || "",
      type: position.type,
      experienceLevel: position.experienceLevel,
      openings: position.openings,
      requirements: position.requirements || [],
      skills: position.skills || [],
      salaryRange: position.salaryRange,
    });
    setRequirementsText((position.requirements || []).join("\n"));
    setSkillsText((position.skills || []).join(", "));
    setSalaryMin(position.salaryRange?.min?.toString() || "");
    setSalaryMax(position.salaryRange?.max?.toString() || "");
    setSalaryCurrency(position.salaryRange?.currency || "USD");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const requirements = requirementsText
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);
      const skills = skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const salaryRange =
        salaryMin && salaryMax
          ? { min: Number(salaryMin), max: Number(salaryMax), currency: salaryCurrency }
          : undefined;

      const payload: CreateJobPositionRequest = {
        ...formData,
        requirements,
        skills,
        salaryRange,
      };

      if (editingPosition) {
        await jobPositionService.update(editingPosition.id, payload);
        showSuccess("Position updated");
      } else {
        await jobPositionService.create(payload);
        showSuccess("Position created");
      }

      setDialogOpen(false);
      await fetchPositions();
    } catch (error) {
      console.error("Failed to save job position:", error);
      showError("Save failed", "Could not save job position");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: JobPositionStatus) => {
    try {
      await jobPositionService.updateStatus(id, status);
      showSuccess("Status updated");
      await fetchPositions();
    } catch (error) {
      console.error("Failed to update status:", error);
      showError("Update failed", "Could not update position status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this position?")) return;
    try {
      await jobPositionService.delete(id);
      showSuccess("Position deleted");
      await fetchPositions();
    } catch (error) {
      console.error("Failed to delete position:", error);
      showError("Delete failed", "Could not delete position");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Job Positions</h1>
        <Button onClick={openCreateDialog} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          Create Position
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search positions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {TYPE_OPTIONS.map((type) => (
              <SelectItem key={type} value={type}>
                {typeLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty State */}
      {filteredPositions.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No job positions found</h3>
          <p className="text-slate-500 mb-6 max-w-sm">
            {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL"
              ? "Try adjusting your filters to see more results."
              : "Get started by creating your first job position."}
          </p>
          {!searchQuery && statusFilter === "ALL" && typeFilter === "ALL" && (
            <Button onClick={openCreateDialog} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Create Position
            </Button>
          )}
        </div>
      )}

      {/* Job Positions Grid */}
      {filteredPositions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPositions.map((position) => (
            <Card key={position.id} className="border border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-semibold text-slate-900 line-clamp-1">
                    {position.title}
                  </CardTitle>
                  <Badge className={`text-xs shrink-0 ${statusColorMap[position.status]}`}>
                    {position.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs text-indigo-700 border-indigo-200 bg-indigo-50">
                    {typeLabels[position.type]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm text-slate-600">
                  <p>
                    <span className="font-medium text-slate-700">Department:</span> {position.department}
                  </p>
                  {position.location && (
                    <p>
                      <span className="font-medium text-slate-700">Location:</span> {position.location}
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-slate-700">Openings:</span> {position.openings}
                  </p>
                  {position.salaryRange && (
                    <p>
                      <span className="font-medium text-slate-700">Salary:</span>{" "}
                      {position.salaryRange.currency} {position.salaryRange.min.toLocaleString()} -{" "}
                      {position.salaryRange.max.toLocaleString()}
                    </p>
                  )}
                </div>

                {position.skills && position.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {position.skills.slice(0, 4).map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-xs bg-slate-100 text-slate-600"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {position.skills.length > 4 && (
                      <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-500">
                        +{position.skills.length - 4}
                      </Badge>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-400">Created {formatDate(position.createdAt)}</p>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    onClick={() => openEditDialog(position)}
                  >
                    Edit
                  </Button>
                  <Select
                    value={position.status}
                    onValueChange={(value) =>
                      handleUpdateStatus(position.id, value as JobPositionStatus)
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-auto border-none shadow-none px-2 text-slate-600 hover:bg-slate-50">
                      <span>Status</span>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status} className="text-xs">
                          {status.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                    onClick={() => handleDelete(position.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {editingPosition ? "Edit Position" : "Create Position"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior Software Engineer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Engineering"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Job description..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as CreateJobPositionRequest["type"] })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {typeLabels[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experienceLevel">Experience Level *</Label>
                <Input
                  id="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                  placeholder="e.g. Senior, Mid-Level"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openings">Openings *</Label>
                <Input
                  id="openings"
                  type="number"
                  min={1}
                  value={formData.openings}
                  onChange={(e) => setFormData({ ...formData, openings: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements (one per line)</Label>
              <Textarea
                id="requirements"
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                placeholder={"5+ years of experience\nBS in Computer Science\nStrong communication skills"}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="React, TypeScript, Node.js, AWS"
              />
            </div>

            <div className="space-y-2">
              <Label>Salary Range (optional)</Label>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  type="number"
                  placeholder="Min"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                />
                <Input
                  placeholder="Currency"
                  value={salaryCurrency}
                  onChange={(e) => setSalaryCurrency(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : editingPosition
                  ? "Update Position"
                  : "Create Position"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
