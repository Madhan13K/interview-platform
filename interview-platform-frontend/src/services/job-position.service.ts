import api from "@/lib/axios";
import { JOB_POSITION_ENDPOINTS } from "@/lib/api-endpoints";
import type { JobPositionResponse, CreateJobPositionRequest, PaginatedResponse } from "@/types";

export const jobPositionService = {
  create: async (data: CreateJobPositionRequest): Promise<JobPositionResponse> => {
    const res = await api.post(JOB_POSITION_ENDPOINTS.create, data);
    return res.data;
  },

  getById: async (id: string): Promise<JobPositionResponse> => {
    const res = await api.get(JOB_POSITION_ENDPOINTS.getById(id));
    return res.data;
  },

  getAll: async (): Promise<JobPositionResponse[]> => {
    const res = await api.get(JOB_POSITION_ENDPOINTS.getAll);
    return res.data;
  },

  getPaginated: async (page = 0, size = 10): Promise<PaginatedResponse<JobPositionResponse>> => {
    const res = await api.get(JOB_POSITION_ENDPOINTS.getPaginated, { params: { page, size } });
    return res.data;
  },

  search: async (keyword: string): Promise<JobPositionResponse[]> => {
    const res = await api.get(JOB_POSITION_ENDPOINTS.search, { params: { keyword } });
    return res.data;
  },

  filterByStatus: async (status: string): Promise<JobPositionResponse[]> => {
    const res = await api.get(JOB_POSITION_ENDPOINTS.filterByStatus, { params: { status } });
    return res.data;
  },

  getMy: async (): Promise<JobPositionResponse[]> => {
    const res = await api.get(JOB_POSITION_ENDPOINTS.getMy);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateJobPositionRequest>): Promise<JobPositionResponse> => {
    const res = await api.put(JOB_POSITION_ENDPOINTS.update(id), data);
    return res.data;
  },

  updateStatus: async (id: string, status: string): Promise<void> => {
    await api.patch(JOB_POSITION_ENDPOINTS.updateStatus(id), { status });
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(JOB_POSITION_ENDPOINTS.delete(id));
  },

  linkInterview: async (positionId: string, interviewId: string): Promise<void> => {
    await api.post(JOB_POSITION_ENDPOINTS.linkInterview(positionId, interviewId));
  },

  unlinkInterview: async (interviewId: string): Promise<void> => {
    await api.delete(JOB_POSITION_ENDPOINTS.unlinkInterview(interviewId));
  },
};
