import api from "@/lib/axios";

export interface BulkOperationStatus {
  id: string;
  operationType: string;
  entityType: string;
  totalItems: number;
  processedItems: number;
  successCount: number;
  failureCount: number;
  status: string;
  errorSummary?: { index: number; error: string }[];
  createdAt: string;
}

export const bulkCreate = async (entityType: string, items: Record<string, unknown>[]): Promise<BulkOperationStatus> => {
  const res = await api.post("/api/v1/bulk/create", { entityType, items });
  return res.data;
};

export const bulkUpdate = async (entityType: string, items: Record<string, unknown>[]): Promise<BulkOperationStatus> => {
  const res = await api.post("/api/v1/bulk/update", { entityType, items });
  return res.data;
};

export const bulkDelete = async (entityType: string, ids: string[]): Promise<BulkOperationStatus> => {
  const res = await api.post("/api/v1/bulk/delete", { entityType, ids });
  return res.data;
};

export const getOperationStatus = async (operationId: string): Promise<BulkOperationStatus> => {
  const res = await api.get(`/api/v1/bulk/operations/${operationId}`);
  return res.data;
};

export const listOperations = async (): Promise<BulkOperationStatus[]> => {
  const res = await api.get("/api/v1/bulk/operations");
  return res.data;
};
