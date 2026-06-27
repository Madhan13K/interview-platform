"use client";

import { useEffect, useState, useCallback } from "react";
import { pipelineService } from "@/services/pipeline.service";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type {
  PipelineResponse,
  CandidatePipelineResponse,
  CreatePipelineRequest,
} from "@/types";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800 border-blue-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  HIRED: "bg-green-100 text-green-800 border-green-200",
  WITHDRAWN: "bg-slate-100 text-slate-800 border-slate-200",
};

const STAGE_TYPE_OPTIONS = [
  { value: "SCREENING", label: "Screening" },
  { value: "PHONE_INTERVIEW", label: "Phone Interview" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "ONSITE", label: "Onsite" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "OFFER", label: "Offer" },
  { value: "CUSTOM", label: "Custom" },
];

function getTimeInStage(updatedAt: string): string {
  const now = new Date();
  const updated = new Date(updatedAt);
  const diffMs = now.getTime() - updated.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day";
  return `${diffDays} days`;
}

export default function PipelinesPage() {
  const { showSuccess, showError } = useActionFeedback();
  const [pipelines, setPipelines] = useState<PipelineResponse[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [candidates, setCandidates] = useState<CandidatePipelineResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create pipeline form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formStages, setFormStages] = useState<
    { name: string; order: number; type: string }[]
  >([{ name: "", order: 1, type: "SCREENING" }]);

  const fetchPipelines = useCallback(async () => {
    try {
      setLoading(true);
      const data = await pipelineService.getAll();
      setPipelines(data);
      if (data.length > 0 && !selectedPipelineId) {
        setSelectedPipelineId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch pipelines:", error);
      showError("Failed to load", "Could not fetch pipelines");
    } finally {
      setLoading(false);
    }
  }, [selectedPipelineId]);

  const fetchCandidates = useCallback(async (pipelineId: string) => {
    if (!pipelineId) return;
    try {
      setCandidatesLoading(true);
      const data = await pipelineService.getCandidatesInPipeline(pipelineId);
      setCandidates(data);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
      showError("Failed to load", "Could not fetch candidates");
    } finally {
      setCandidatesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  useEffect(() => {
    if (selectedPipelineId) {
      fetchCandidates(selectedPipelineId);
    }
  }, [selectedPipelineId, fetchCandidates]);

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);

  const handleAdvance = async (candidatePipelineId: string) => {
    try {
      await pipelineService.advanceCandidate(candidatePipelineId);
      showSuccess("Candidate advanced");
      fetchCandidates(selectedPipelineId);
    } catch (error) {
      console.error("Failed to advance candidate:", error);
      showError("Advance failed", "Could not advance candidate");
    }
  };

  const handleReject = async (candidatePipelineId: string) => {
    try {
      await pipelineService.rejectCandidate(candidatePipelineId);
      showSuccess("Candidate rejected");
      fetchCandidates(selectedPipelineId);
    } catch (error) {
      console.error("Failed to reject candidate:", error);
      showError("Reject failed", "Could not reject candidate");
    }
  };

  const handleUpdateStatus = async (
    candidatePipelineId: string,
    status: string
  ) => {
    try {
      await pipelineService.updateCandidateStatus(candidatePipelineId, status);
      showSuccess("Status updated");
      fetchCandidates(selectedPipelineId);
    } catch (error) {
      console.error("Failed to update status:", error);
      showError("Update failed", "Could not update candidate status");
    }
  };

  const handleAddStage = () => {
    setFormStages((prev) => [
      ...prev,
      { name: "", order: prev.length + 1, type: "CUSTOM" },
    ]);
  };

  const handleRemoveStage = (index: number) => {
    setFormStages((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((stage, i) => ({ ...stage, order: i + 1 }))
    );
  };

  const handleStageChange = (
    index: number,
    field: "name" | "type",
    value: string
  ) => {
    setFormStages((prev) =>
      prev.map((stage, i) => (i === index ? { ...stage, [field]: value } : stage))
    );
  };

  const handleCreatePipeline = async () => {
    if (!formName.trim() || !formDepartment.trim()) return;
    const validStages = formStages.filter((s) => s.name.trim());
    if (validStages.length === 0) return;

    try {
      setCreating(true);
      const request: CreatePipelineRequest = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        department: formDepartment.trim(),
        stages: validStages.map((s, i) => ({
          name: s.name.trim(),
          order: i + 1,
          type: s.type,
        })),
      };
      const newPipeline = await pipelineService.create(request);
      setPipelines((prev) => [...prev, newPipeline]);
      setSelectedPipelineId(newPipeline.id);
      showSuccess("Pipeline created");
      resetForm();
      setCreateDialogOpen(false);
    } catch (error) {
      console.error("Failed to create pipeline:", error);
      showError("Create failed", "Could not create pipeline");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormDepartment("");
    setFormStages([{ name: "", order: 1, type: "SCREENING" }]);
  };

  const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  const getCandidatesForStage = (stageId: string) =>
    candidates.filter((c) => c.currentStageId === stageId);

  const handleDragStart = (candidateId: string) => {
    setDraggedCandidateId(candidateId);
  };

  const handleDragEnd = () => {
    setDraggedCandidateId(null);
    setDragOverStageId(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStageId(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStageId(null);
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedCandidateId) return;
    setDragOverStageId(null);
    setDraggedCandidateId(null);
    // In production, this would call an API to move the candidate to the new stage
    try {
      await pipelineService.advanceCandidate(draggedCandidateId);
      showSuccess("Candidate moved");
      fetchCandidates(selectedPipelineId);
    } catch (error) {
      console.error("Failed to move candidate:", error);
      showError("Move failed", "Could not move candidate to stage");
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-10 w-36 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-72 h-96 bg-slate-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Hiring Pipelines</h1>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Create Pipeline
        </Button>
      </div>

      {/* Pipeline Selector */}
      {pipelines.length > 0 ? (
        <div className="flex items-center gap-3">
          <Label className="text-slate-700 font-medium">Pipeline:</Label>
          <Select
            value={selectedPipelineId}
            onChange={(e) => setSelectedPipelineId(e.target.value)}
            options={pipelines.map((p) => ({ value: p.id, label: p.name }))}
            className="w-72"
          />
          {selectedPipeline && (
            <span className="text-sm text-slate-500">
              {selectedPipeline.department}
              {selectedPipeline.description &&
                ` — ${selectedPipeline.description}`}
            </span>
          )}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-slate-500">
            No pipelines yet. Create your first hiring pipeline to get started.
          </p>
        </Card>
      )}

      {/* Kanban Board */}
      {selectedPipeline && (
        <div className="relative">
          {candidatesLoading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2 text-slate-500">
                <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading candidates...</span>
              </div>
            </div>
          )}

          <div className="flex gap-4 overflow-x-auto pb-4">
            {selectedPipeline.stages
              .sort((a, b) => a.order - b.order)
              .map((stage, stageIndex) => {
                const stageCandidates = getCandidatesForStage(stage.id);
                const isLastStage =
                  stageIndex === selectedPipeline.stages.length - 1;

                return (
                  <div key={stage.id} className="flex items-start">
                    {/* Stage Column */}
                    <div className="flex-shrink-0 w-72">
                      <Card className="border-slate-200 bg-slate-50">
                        {/* Stage Header */}
                        <div className="p-3 border-b border-slate-200 bg-indigo-50 rounded-t-lg">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800 text-sm">
                              {stage.name}
                            </h3>
                            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">
                              {stageCandidates.length}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 capitalize">
                            {stage.type.toLowerCase().replace("_", " ")}
                          </p>
                        </div>

                        {/* Candidate Cards - DnD Drop Zone */}
                        <div
                          className={`p-2 space-y-2 max-h-[500px] overflow-y-auto transition-colors rounded-b-lg ${
                            dragOverStageId === stage.id
                              ? "bg-indigo-100 border-2 border-dashed border-indigo-400"
                              : ""
                          }`}
                          onDragOver={(e) => handleDragOver(e, stage.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={() => handleDrop(stage.id)}
                        >
                          {dragOverStageId === stage.id && (
                            <div className="text-center py-2">
                              <p className="text-xs text-indigo-600 font-medium">Drop here to move</p>
                            </div>
                          )}
                          {stageCandidates.length === 0 && !dragOverStageId ? (
                            <p className="text-xs text-slate-400 text-center py-4">
                              No candidates
                            </p>
                          ) : (
                            stageCandidates.map((candidate) => (
                              <Card
                                key={candidate.id}
                                draggable
                                onDragStart={() => handleDragStart(candidate.id)}
                                onDragEnd={handleDragEnd}
                                className={`p-3 bg-white border-slate-200 hover:border-indigo-300 transition-colors shadow-sm cursor-grab active:cursor-grabbing ${
                                  draggedCandidateId === candidate.id ? "opacity-50 ring-2 ring-indigo-400" : ""
                                }`}
                              >
                                {/* Candidate Name */}
                                <p className="font-medium text-slate-900 text-sm">
                                  {candidate.candidateName}
                                </p>

                                {/* Status and Time */}
                                <div className="flex items-center justify-between mt-2">
                                  <Badge
                                    className={`text-xs border ${
                                      STATUS_COLORS[candidate.status] ||
                                      STATUS_COLORS.ACTIVE
                                    }`}
                                  >
                                    {candidate.status}
                                  </Badge>
                                  <span className="text-xs text-slate-400">
                                    {getTimeInStage(candidate.updatedAt)}
                                  </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 mt-3">
                                  {!isLastStage &&
                                    candidate.status === "ACTIVE" && (
                                      <Button
                                        onClick={() =>
                                          handleAdvance(candidate.id)
                                        }
                                        className="h-7 px-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                                      >
                                        Advance
                                      </Button>
                                    )}
                                  {candidate.status === "ACTIVE" && (
                                    <Button
                                      onClick={() =>
                                        handleReject(candidate.id)
                                      }
                                      className="h-7 px-2 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                                    >
                                      Reject
                                    </Button>
                                  )}
                                  {candidate.status === "ACTIVE" && (
                                    <Button
                                      onClick={() =>
                                        handleUpdateStatus(
                                          candidate.id,
                                          "HIRED"
                                        )
                                      }
                                      className="h-7 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                                    >
                                      Hire
                                    </Button>
                                  )}
                                </div>
                              </Card>
                            ))
                          )}
                        </div>
                      </Card>
                    </div>

                    {/* Arrow connector between stages */}
                    {!isLastStage && (
                      <div className="flex items-center px-2 pt-16 flex-shrink-0">
                        <div className="w-6 h-0.5 bg-slate-300" />
                        <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-slate-300" />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Create Pipeline Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Pipeline</DialogTitle>
            <DialogDescription>
              Define a new hiring pipeline with stages for your recruitment
              process.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="pipeline-name">Pipeline Name</Label>
              <Input
                id="pipeline-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Engineering Hiring Pipeline"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="pipeline-description">Description</Label>
              <Input
                id="pipeline-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <Label htmlFor="pipeline-department">Department</Label>
              <Input
                id="pipeline-department"
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                placeholder="e.g., Engineering"
              />
            </div>

            {/* Stages */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Stages</Label>
                <Button
                  type="button"
                  onClick={handleAddStage}
                  className="h-7 px-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                >
                  + Add Stage
                </Button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto">
                {formStages.map((stage, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-md border border-slate-200"
                  >
                    <span className="text-xs text-slate-400 font-mono w-5 text-center">
                      {index + 1}
                    </span>
                    <Input
                      value={stage.name}
                      onChange={(e) =>
                        handleStageChange(index, "name", e.target.value)
                      }
                      placeholder="Stage name"
                      className="flex-1 h-8 text-sm"
                    />
                    <Select
                      value={stage.type}
                      onChange={(e) =>
                        handleStageChange(index, "type", e.target.value)
                      }
                      options={STAGE_TYPE_OPTIONS}
                      className="w-40 h-8 text-sm"
                    />
                    {formStages.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => handleRemoveStage(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent"
                      >
                        &times;
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                resetForm();
                setCreateDialogOpen(false);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePipeline}
              disabled={
                creating ||
                !formName.trim() ||
                !formDepartment.trim() ||
                formStages.filter((s) => s.name.trim()).length === 0
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Pipeline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
