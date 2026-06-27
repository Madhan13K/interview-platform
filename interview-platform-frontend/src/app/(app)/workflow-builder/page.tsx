"use client";

import { useState, useEffect, useCallback } from "react";
import {
  workflowBuilderService,
  WorkflowCanvas,
  WorkflowNode,
} from "@/services/workflow-builder.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type NodeType = WorkflowNode["type"];

const NODE_TYPES: { type: NodeType; label: string; color: string; icon: string }[] = [
  { type: "TRIGGER", label: "Trigger", color: "bg-green-100 border-green-300 text-green-800", icon: "⚡" },
  { type: "CONDITION", label: "Condition", color: "bg-yellow-100 border-yellow-300 text-yellow-800", icon: "🔀" },
  { type: "ACTION", label: "Action", color: "bg-blue-100 border-blue-300 text-blue-800", icon: "▶️" },
  { type: "DELAY", label: "Delay", color: "bg-purple-100 border-purple-300 text-purple-800", icon: "⏱️" },
  { type: "BRANCH", label: "Branch", color: "bg-orange-100 border-orange-300 text-orange-800", icon: "🌿" },
  { type: "END", label: "End", color: "bg-red-100 border-red-300 text-red-800", icon: "🛑" },
];

export default function WorkflowBuilderPage() {
  const [workflows, setWorkflows] = useState<WorkflowCanvas[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowCanvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const res = await workflowBuilderService.list();
      setWorkflows(res.data);
      if (res.data.length > 0 && !selectedWorkflow) {
        setSelectedWorkflow(res.data[0]);
      }
    } catch {
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await workflowBuilderService.create({
        name: newName.trim(),
        description: newDescription.trim(),
      });
      setWorkflows((prev) => [...prev, res.data]);
      setSelectedWorkflow(res.data);
      setShowCreateDialog(false);
      setNewName("");
      setNewDescription("");
    } catch (err) {
      console.error("Failed to create workflow:", err);
    }
  };

  const handleSave = async () => {
    if (!selectedWorkflow) return;
    try {
      setSaving(true);
      const res = await workflowBuilderService.update(selectedWorkflow.id, {
        nodes: selectedWorkflow.nodes,
        edges: selectedWorkflow.edges,
      });
      setSelectedWorkflow(res.data);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === res.data.id ? res.data : w))
      );
    } catch (err) {
      console.error("Failed to save workflow:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedWorkflow) return;
    try {
      const res = await workflowBuilderService.publish(selectedWorkflow.id);
      setSelectedWorkflow(res.data);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === res.data.id ? res.data : w))
      );
    } catch (err) {
      console.error("Failed to publish workflow:", err);
    }
  };

  const handleValidate = async () => {
    if (!selectedWorkflow) return;
    try {
      const res = await workflowBuilderService.validate(selectedWorkflow.id);
      setValidationErrors(res.data.errors);
    } catch (err) {
      console.error("Failed to validate workflow:", err);
    }
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedNodeType || !selectedWorkflow) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: draggedNodeType,
      label: `${draggedNodeType} Node`,
      position: { x, y },
      config: {},
      connections: [],
    };

    setSelectedWorkflow({
      ...selectedWorkflow,
      nodes: [...selectedWorkflow.nodes, newNode],
    });
    setDraggedNodeType(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!selectedWorkflow) return;
    setSelectedWorkflow({
      ...selectedWorkflow,
      nodes: selectedWorkflow.nodes.filter((n) => n.id !== nodeId),
      edges: selectedWorkflow.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading workflow builder...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Sidebar - Node Palette */}
      <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Node Types
          </h2>
          <p className="text-xs text-slate-500 mt-1">Drag nodes to canvas</p>
        </div>
        <div className="p-3 space-y-2 flex-1 overflow-y-auto">
          {NODE_TYPES.map((nodeType) => (
            <div
              key={nodeType.type}
              draggable
              onDragStart={() => setDraggedNodeType(nodeType.type)}
              onDragEnd={() => setDraggedNodeType(null)}
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all hover:shadow-sm ${nodeType.color}`}
            >
              <span className="text-lg">{nodeType.icon}</span>
              <span className="text-sm font-medium">{nodeType.label}</span>
            </div>
          ))}
        </div>

        {/* Workflow List */}
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase">Workflows</span>
            <Button
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setShowCreateDialog(true)}
            >
              + New
            </Button>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {workflows.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWorkflow(w)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                  selectedWorkflow?.id === w.id
                    ? "bg-indigo-100 text-indigo-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{w.name}</span>
                  {w.isPublished && (
                    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-900">
              {selectedWorkflow?.name || "Workflow Builder"}
            </h1>
            {selectedWorkflow && (
              <Badge variant={selectedWorkflow.isPublished ? "default" : "secondary"}>
                {selectedWorkflow.isPublished ? "Published" : "Draft"}
              </Badge>
            )}
            {selectedWorkflow && (
              <span className="text-xs text-slate-400">
                v{selectedWorkflow.version} | {selectedWorkflow.nodes.length} nodes
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidate}
              disabled={!selectedWorkflow}
            >
              Validate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!selectedWorkflow || saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={!selectedWorkflow || selectedWorkflow.isPublished}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Publish
            </Button>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-2">
              <span className="text-red-600 text-sm font-medium">Validation errors:</span>
              <div className="flex gap-2 flex-wrap">
                {validationErrors.map((err, i) => (
                  <span key={i} className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">
                    {err}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setValidationErrors([])}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        {selectedWorkflow ? (
          <div
            className="flex-1 relative overflow-auto"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleCanvasDrop}
            style={{
              backgroundImage:
                "radial-gradient(circle, #e2e8f0 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          >
            {/* Nodes on Canvas */}
            {selectedWorkflow.nodes.map((node) => {
              const nodeStyle = NODE_TYPES.find((nt) => nt.type === node.type);
              return (
                <div
                  key={node.id}
                  className={`absolute group rounded-lg border-2 shadow-sm px-4 py-3 min-w-[140px] cursor-move ${
                    nodeStyle?.color || "bg-slate-100 border-slate-300"
                  }`}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>{nodeStyle?.icon}</span>
                    <span className="text-sm font-medium">{node.label}</span>
                  </div>
                  <span className="text-xs opacity-60 mt-1 block">{node.type}</span>
                  <button
                    onClick={() => handleDeleteNode(node.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              );
            })}

            {/* Empty State */}
            {selectedWorkflow.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-slate-400 text-lg">Drag nodes here to build your workflow</p>
                  <p className="text-slate-300 text-sm mt-1">
                    Start with a Trigger node and connect to Actions
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-500 text-lg">No workflow selected</p>
              <p className="text-slate-400 text-sm mt-1">
                Select a workflow from the sidebar or create a new one
              </p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                Create Workflow
              </Button>
            </div>
          </div>
        )}

        {/* Node List Panel */}
        {selectedWorkflow && selectedWorkflow.nodes.length > 0 && (
          <div className="h-44 border-t border-slate-200 bg-white overflow-y-auto">
            <div className="p-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                Node List ({selectedWorkflow.nodes.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {selectedWorkflow.nodes.map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center gap-2 px-3 py-2 rounded border border-slate-200 bg-slate-50 text-sm"
                  >
                    <span>{NODE_TYPES.find((nt) => nt.type === node.type)?.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-700">{node.label}</p>
                      <p className="text-xs text-slate-400">{node.type}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteNode(node.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Dialog Overlay */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Interview Pipeline Automation"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe what this workflow does"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setNewName("");
                    setNewDescription("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!newName.trim()}>
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
