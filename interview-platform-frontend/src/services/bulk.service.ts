import api from "@/lib/axios";
import { BULK_ENDPOINTS } from "@/lib/api-endpoints";

export interface BulkScheduleRequest {
  interviews: Array<{
    title: string;
    type: string;
    candidateId: string;
    interviewerIds: string[];
    scheduledAt: string;
    duration: number;
  }>;
}

export interface BulkInviteRequest {
  emails: string[];
  jobPositionId?: string;
  message?: string;
}

export interface BulkExportRequest {
  entityType: string;
  format: "CSV" | "JSON" | "PDF";
  filters?: Record<string, unknown>;
}

export interface BulkOperationResponse {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalItems: number;
  processedItems: number;
  failedItems: number;
  errors?: string[];
}

export const bulkService = {
  scheduleInterviews: async (data: BulkScheduleRequest): Promise<BulkOperationResponse> => {
    const res = await api.post(BULK_ENDPOINTS.scheduleInterviews, data);
    return res.data;
  },

  inviteCandidates: async (data: BulkInviteRequest): Promise<BulkOperationResponse> => {
    const res = await api.post(BULK_ENDPOINTS.inviteCandidates, data);
    return res.data;
  },

  export: async (data: BulkExportRequest): Promise<BulkOperationResponse> => {
    const res = await api.post(BULK_ENDPOINTS.export, data);
    return res.data;
  },
};
