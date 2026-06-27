import api from "@/lib/axios";

export interface WorkflowNode {
  id: string;
  type: "TRIGGER" | "CONDITION" | "ACTION" | "DELAY" | "BRANCH" | "END";
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  connections: string[];
}

export interface WorkflowCanvas {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: { source: string; target: string }[];
  isPublished: boolean;
  version: number;
  lastModified: string;
}

export const workflowBuilderService = {
  list: () => api.get<WorkflowCanvas[]>("/api/v1/workflow-builder"),
  get: (id: string) => api.get<WorkflowCanvas>(`/api/v1/workflow-builder/${id}`),
  create: (data: { name: string; description: string }) => api.post<WorkflowCanvas>("/api/v1/workflow-builder", data),
  update: (id: string, data: { nodes: WorkflowNode[]; edges: { source: string; target: string }[] }) => api.put<WorkflowCanvas>(`/api/v1/workflow-builder/${id}`, data),
  publish: (id: string) => api.post<WorkflowCanvas>(`/api/v1/workflow-builder/${id}/publish`),
  validate: (id: string) => api.post<{ valid: boolean; errors: string[] }>(`/api/v1/workflow-builder/${id}/validate`),
  delete: (id: string) => api.delete(`/api/v1/workflow-builder/${id}`),
};
