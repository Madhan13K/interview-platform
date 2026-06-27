import api from "@/lib/axios";

export interface ReportWidget {
  id: string;
  type: "BAR_CHART" | "LINE_CHART" | "PIE_CHART" | "TABLE" | "METRIC_CARD" | "FUNNEL" | "HEATMAP";
  title: string;
  dataSource: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  widgets: ReportWidget[];
  layout: "grid" | "list";
  filters: Record<string, unknown>[];
  createdBy: string;
  lastGenerated: string;
}

export interface GeneratedReport {
  id: string;
  name: string;
  format: string;
  status: string;
  rowCount: number;
  fileSizeBytes: number;
  createdAt: string;
  completedAt: string;
}

export const reportBuilderService = {
  list: (params?: { page?: number; size?: number }) => api.get<ReportTemplate[]>("/api/v1/report-builder", { params }),
  get: (id: string) => api.get<ReportTemplate>(`/api/v1/report-builder/${id}`),
  create: (data: Partial<ReportTemplate>) => api.post<ReportTemplate>("/api/v1/report-builder", data),
  update: (id: string, data: Partial<ReportTemplate>) => api.put<ReportTemplate>(`/api/v1/report-builder/${id}`, data),
  generate: (id: string) => api.post<GeneratedReport>(`/api/v1/report-builder/${id}/generate`),
  delete: (id: string) => api.delete(`/api/v1/report-builder/${id}`),
};
