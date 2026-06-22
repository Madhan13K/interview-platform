import api from "@/lib/axios";
import { DOCUMENT_ENDPOINTS } from "@/lib/api-endpoints";
import type { DocumentResponse, PaginatedResponse } from "@/types";

export const documentService = {
  upload: async (file: File, documentType: string, entityType?: string, entityId?: string): Promise<DocumentResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    if (entityType) formData.append("entityType", entityType);
    if (entityId) formData.append("entityId", entityId);
    const res = await api.post(DOCUMENT_ENDPOINTS.upload, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  getById: async (id: string): Promise<DocumentResponse> => {
    const res = await api.get(DOCUMENT_ENDPOINTS.getById(id));
    return res.data;
  },

  getByEntity: async (entityType: string, entityId: string): Promise<DocumentResponse[]> => {
    const res = await api.get(DOCUMENT_ENDPOINTS.getByEntity(entityType, entityId));
    return res.data;
  },

  getMy: async (): Promise<DocumentResponse[]> => {
    const res = await api.get(DOCUMENT_ENDPOINTS.getMy);
    return res.data;
  },

  getMyPaginated: async (page = 0, size = 10): Promise<PaginatedResponse<DocumentResponse>> => {
    const res = await api.get(DOCUMENT_ENDPOINTS.getMyPaginated, { params: { page, size } });
    return res.data;
  },

  getByType: async (type: string): Promise<DocumentResponse[]> => {
    const res = await api.get(DOCUMENT_ENDPOINTS.getByType(type));
    return res.data;
  },

  getDownloadUrl: async (id: string): Promise<string> => {
    const res = await api.get(DOCUMENT_ENDPOINTS.getDownloadUrl(id));
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(DOCUMENT_ENDPOINTS.delete(id));
  },

  updateMetadata: async (id: string, data: { fileName?: string; documentType?: string }): Promise<DocumentResponse> => {
    const res = await api.patch(DOCUMENT_ENDPOINTS.update(id), data);
    return res.data;
  },
};
