import api from "@/lib/axios";

export interface HeadcountRequest {
  id: string;
  department: string;
  title: string;
  justification: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "FILLED";
  requestedBy: string;
  approvedBy: string | null;
  targetStartDate: string;
  createdAt: string;
}

export interface HeadcountForecast {
  department: string;
  currentHeadcount: number;
  approvedOpenings: number;
  pendingRequests: number;
  projectedHeadcount: number;
  budgetUtilization: number;
}

export const headcountService = {
  list: () => api.get<HeadcountRequest[]>("/api/v1/headcount"),
  create: (data: Record<string, unknown>) => api.post<HeadcountRequest>("/api/v1/headcount", data),
  update: (id: string, data: Record<string, unknown>) => api.put<HeadcountRequest>(`/api/v1/headcount/${id}`, data),
  approve: (id: string) => api.post<HeadcountRequest>(`/api/v1/headcount/${id}/approve`),
  getForecast: (department: string) => api.get<HeadcountForecast>(`/api/v1/headcount/forecast?department=${department}`),
};
