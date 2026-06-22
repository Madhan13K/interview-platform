import api from "@/lib/axios";
import { EXPORT_IMPORT_ENDPOINTS } from "@/lib/api-endpoints";
import type { ExportJobResponse, ExportFormat } from "@/types";

export interface StartExportRequest {
  entityType: string;
  format: ExportFormat;
  filters?: Record<string, unknown>;
}

export interface StartImportRequest {
  entityType: string;
  file: File;
}

export const exportImportService = {
  startExport: async (data: StartExportRequest): Promise<ExportJobResponse> => {
    const res = await api.post(EXPORT_IMPORT_ENDPOINTS.startExport, data);
    return res.data;
  },

  startImport: async (data: StartImportRequest): Promise<ExportJobResponse> => {
    const formData = new FormData();
    formData.append("entityType", data.entityType);
    formData.append("file", data.file);
    const res = await api.post(EXPORT_IMPORT_ENDPOINTS.startImport, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  getJobs: async (): Promise<ExportJobResponse[]> => {
    const res = await api.get(EXPORT_IMPORT_ENDPOINTS.getJobs);
    return res.data;
  },

  getJob: async (id: string): Promise<ExportJobResponse> => {
    const res = await api.get(EXPORT_IMPORT_ENDPOINTS.getJob(id));
    return res.data;
  },

  cancelJob: async (id: string): Promise<void> => {
    await api.delete(EXPORT_IMPORT_ENDPOINTS.cancelJob(id));
  },
};
