import api from "@/lib/axios";
import { AUDIT_ENDPOINTS } from "@/lib/api-endpoints";
import type { AuditLogResponse, PaginatedResponse } from "@/types";

export const auditService = {
  getAll: async (page = 0, size = 20): Promise<PaginatedResponse<AuditLogResponse>> => {
    const res = await api.get(AUDIT_ENDPOINTS.getAll, { params: { page, size } });
    return res.data;
  },

  getByEntity: async (entityType: string, entityId: string): Promise<AuditLogResponse[]> => {
    const res = await api.get(AUDIT_ENDPOINTS.getByEntity(entityType, entityId));
    return res.data;
  },

  getByUser: async (email: string): Promise<AuditLogResponse[]> => {
    const res = await api.get(AUDIT_ENDPOINTS.getByUser(email));
    return res.data;
  },
};
