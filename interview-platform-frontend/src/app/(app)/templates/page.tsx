"use client";

import { useEffect, useState, useCallback } from "react";
import { templateService } from "@/services/template.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { TemplateResponse, CreateTemplateRequest } from "@/types";
import type { InterviewType } from "@/types";

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "CODING", label: "Coding" },
  { value: "HR", label: "HR" },
  { value: "CASE_STUDY", label: "Case Study" },
];

const TYPE_OPTIONS_FORM = [
  { value: "TECHNICAL", label: "Technical" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "CODING", label: "Coding" },
  { value: "HR", label: "HR" },
  { value: "CASE_STUDY", label: "Case Study" },
];

const typeBadgeStyles: Record<InterviewType, string> = {
  TECHNICAL: "bg-purple-100 text-purple-800 border-purple-200",
  BEHAVIORAL: "bg-sky-100 text-sky-800 border-sky-200",
  SYSTEM_DESIGN: "bg-indigo-100 text-indigo-800 border-indigo-200",
  CODING: "bg-emerald-100 text-emerald-800 border-emerald-200",
  HR: "bg-pink-100 text-pink-800 border-pink-200",
  CASE_STUDY: "bg-orange-100 text-orange-800 border-orange-200",
};

const typeLabels: Record<InterviewType, string> = {
  TECHNICAL: "Technical",
  BEHAVIORAL: "Behavioral",
  SYSTEM_DESIGN: "System Design",
  CODING: "Coding",
  HR: "HR",
  CASE_STUDY: "Case Study",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Dialog states
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateResponse | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTemplateRequest>({
    name: "",
    description: "",
    type: "TECHNICAL",
    duration: 60,
  });
  const [createLoading, setCreateLoading] = useState(false);

  const [useTemplateOpen, setUseTemplateOpen] = useState(false);
  const [useTemplateId, setUseTemplateId] = useState<string | null>(null);
  const [useTemplateForm, setUseTemplateForm] = useState({
    candidateId: "",
    scheduledAt: "",
  });
  const [useTemplateLoading, setUseTemplateLoading] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      let data: TemplateResponse[];
      if (searchQuery.trim()) {
        data = await templateService.search(searchQuery.trim());
      } else if (typeFilter) {
        data = await templateService.filterByType(typeFilter);
      } else {
        data = await templateService.getAll();
      }
      setTemplates(data);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleViewDetails = (template: TemplateResponse) => {
    setSelectedTemplate(template);
    setDetailOpen(true);
  };

  const handleUseTemplate = (templateId: string) => {
    setUseTemplateId(templateId);
    setUseTemplateForm({ candidateId: "", scheduledAt: "" });
    setUseTemplateOpen(true);
  };

  const handleCreateTemplate = async () => {
    if (!createForm.name.trim()) return;
    setCreateLoading(true);
    try {
      await templateService.create(createForm);
      setCreateOpen(false);
      setCreateForm({ name: "", description: "", type: "TECHNICAL", duration: 60 });
      fetchTemplates();
    } catch (error) {
      console.error("Failed to create template:", error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSubmitUseTemplate = async () => {
    if (!useTemplateId || !useTemplateForm.candidateId || !useTemplateForm.scheduledAt) return;
    setUseTemplateLoading(true);
    try {
      await templateService.createInterview({
        templateId: useTemplateId,
        candidateId: useTemplateForm.candidateId,
        scheduledAt: new Date(useTemplateForm.scheduledAt).toISOString(),
      });
      setUseTemplateOpen(false);
      setUseTemplateId(null);
    } catch (error) {
      console.error("Failed to create interview from template:", error);
    } finally {
      setUseTemplateLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    setDeleteLoading(id);
    try {
      await templateService.delete(id);
      fetchTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
    } finally {
      setDeleteLoading(null);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Interview Templates</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage reusable interview templates
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          Create Template
        </Button>
      </div>

      {/* Filter/Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search templates by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              placeholder="Filter by type"
            />
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && templates.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg
                className="h-6 w-6 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">No templates found</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery || typeFilter
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first interview template."}
            </p>
            {!searchQuery && !typeFilter && (
              <Button
                onClick={() => setCreateOpen(true)}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700"
              >
                Create Template
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Templates Grid */}
      {!loading && templates.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id} className="p-6 transition-shadow hover:shadow-md">
              <div className="space-y-3">
                {/* Name & Type Badge */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
                  <Badge className={typeBadgeStyles[template.type]}>
                    {typeLabels[template.type]}
                  </Badge>
                </div>

                {/* Duration & Question Count */}
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <svg
                      className="h-4 w-4 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {formatDuration(template.duration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      className="h-4 w-4 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                      />
                    </svg>
                    {template.questions.length} question{template.questions.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Description */}
                {template.description && (
                  <p className="text-sm text-slate-500">
                    {truncate(template.description, 120)}
                  </p>
                )}

                {/* Creator & Date */}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Created by {template.createdBy}</span>
                  <span>&middot;</span>
                  <span>{formatDate(template.createdAt)}</span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(template)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    Use Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(template)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleDelete(template.id)}
                    disabled={deleteLoading === template.id}
                  >
                    {deleteLoading === template.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Template Detail Dialog ──────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Template details and included questions
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={typeBadgeStyles[selectedTemplate.type]}>
                  {typeLabels[selectedTemplate.type]}
                </Badge>
                <span className="text-sm text-slate-600">
                  {formatDuration(selectedTemplate.duration)}
                </span>
                <span className="text-sm text-slate-600">
                  {selectedTemplate.questions.length} question
                  {selectedTemplate.questions.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Description */}
              {selectedTemplate.description && (
                <p className="text-sm text-slate-600">{selectedTemplate.description}</p>
              )}

              {/* Questions List */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">Questions</h4>
                {selectedTemplate.questions.length === 0 ? (
                  <p className="text-sm text-slate-400">No questions added yet.</p>
                ) : (
                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {selectedTemplate.questions
                      .sort((a, b) => a.order - b.order)
                      .map((q) => (
                        <div
                          key={q.id}
                          className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                            {q.order}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700">{q.questionText}</p>
                          </div>
                          {q.required && (
                            <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Footer Info */}
              <div className="text-xs text-slate-400">
                Created by {selectedTemplate.createdBy} on{" "}
                {formatDate(selectedTemplate.createdAt)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Create Template Dialog ──────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>
              Create a new reusable interview template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                placeholder="e.g. Senior Engineer Technical Interview"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                placeholder="Describe the purpose and focus areas of this template..."
                rows={3}
                value={createForm.description || ""}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-type">Type</Label>
              <Select
                options={TYPE_OPTIONS_FORM}
                value={createForm.type}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, type: e.target.value as InterviewType }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-duration">Duration (minutes)</Label>
              <Input
                id="template-duration"
                type="number"
                min={15}
                max={480}
                value={createForm.duration}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, duration: parseInt(e.target.value) || 60 }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={createLoading || !createForm.name.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {createLoading ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Use Template Dialog ─────────────────────────────────────────── */}
      <Dialog open={useTemplateOpen} onOpenChange={setUseTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Interview from Template</DialogTitle>
            <DialogDescription>
              Schedule an interview using this template&apos;s configuration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="candidate-id">Candidate ID</Label>
              <Input
                id="candidate-id"
                placeholder="Enter candidate ID"
                value={useTemplateForm.candidateId}
                onChange={(e) =>
                  setUseTemplateForm((f) => ({ ...f, candidateId: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled-at">Scheduled Date & Time</Label>
              <Input
                id="scheduled-at"
                type="datetime-local"
                value={useTemplateForm.scheduledAt}
                onChange={(e) =>
                  setUseTemplateForm((f) => ({ ...f, scheduledAt: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUseTemplateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitUseTemplate}
              disabled={
                useTemplateLoading ||
                !useTemplateForm.candidateId.trim() ||
                !useTemplateForm.scheduledAt
              }
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {useTemplateLoading ? "Scheduling..." : "Schedule Interview"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
