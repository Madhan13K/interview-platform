import api from "@/lib/axios";
import { TEMPLATE_ENDPOINTS } from "@/lib/api-endpoints";
import type { TemplateResponse, CreateTemplateRequest, PaginatedResponse } from "@/types";

export const templateService = {
  create: async (data: CreateTemplateRequest): Promise<TemplateResponse> => {
    const res = await api.post(TEMPLATE_ENDPOINTS.create, data);
    return res.data;
  },

  getById: async (id: string): Promise<TemplateResponse> => {
    const res = await api.get(TEMPLATE_ENDPOINTS.getById(id));
    return res.data;
  },

  getAll: async (): Promise<TemplateResponse[]> => {
    const res = await api.get(TEMPLATE_ENDPOINTS.getAll);
    return res.data;
  },

  getPaginated: async (page = 0, size = 10): Promise<PaginatedResponse<TemplateResponse>> => {
    const res = await api.get(TEMPLATE_ENDPOINTS.getPaginated, { params: { page, size } });
    return res.data;
  },

  filterByType: async (type: string): Promise<TemplateResponse[]> => {
    const res = await api.get(TEMPLATE_ENDPOINTS.filterByType, { params: { type } });
    return res.data;
  },

  search: async (keyword: string): Promise<TemplateResponse[]> => {
    const res = await api.get(TEMPLATE_ENDPOINTS.search, { params: { keyword } });
    return res.data;
  },

  update: async (id: string, data: Partial<CreateTemplateRequest>): Promise<TemplateResponse> => {
    const res = await api.put(TEMPLATE_ENDPOINTS.update(id), data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(TEMPLATE_ENDPOINTS.delete(id));
  },

  addQuestion: async (templateId: string, data: { questionId: string; order: number; required: boolean }): Promise<void> => {
    await api.post(TEMPLATE_ENDPOINTS.addQuestion(templateId), data);
  },

  removeQuestion: async (templateId: string, questionId: string): Promise<void> => {
    await api.delete(TEMPLATE_ENDPOINTS.removeQuestion(templateId, questionId));
  },

  createInterview: async (data: { templateId: string; candidateId: string; scheduledAt: string }): Promise<void> => {
    await api.post(TEMPLATE_ENDPOINTS.createInterview, data);
  },
};
