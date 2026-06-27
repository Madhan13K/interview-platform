import api from "@/lib/axios";

export interface ComplianceAuditRun {
  id: string;
  type: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  score: number;
  startedAt: string;
  completedAt: string | null;
}

export interface ComplianceCheck {
  id: string;
  auditRunId: string;
  name: string;
  category: string;
  status: "PASSED" | "FAILED" | "WARNING" | "SKIPPED";
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const complianceService = {
  runAudit: (type: string) => api.post<ComplianceAuditRun>(`/api/v1/compliance/audit/${type}`),
  getLatest: (type: string) => api.get<ComplianceAuditRun>(`/api/v1/compliance/audit/${type}/latest`),
  getHistory: (type: string) => api.get<ComplianceAuditRun[]>(`/api/v1/compliance/audit/${type}/history`),
  getChecks: (auditRunId: string) => api.get<ComplianceCheck[]>(`/api/v1/compliance/checks/${auditRunId}`),
};
