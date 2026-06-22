import api from "@/lib/axios";
import { PIPELINE_ENDPOINTS } from "@/lib/api-endpoints";
import type { PipelineResponse, CreatePipelineRequest, CandidatePipelineResponse } from "@/types";

export const pipelineService = {
  create: async (data: CreatePipelineRequest): Promise<PipelineResponse> => {
    const res = await api.post(PIPELINE_ENDPOINTS.create, data);
    return res.data;
  },

  getById: async (id: string): Promise<PipelineResponse> => {
    const res = await api.get(PIPELINE_ENDPOINTS.getById(id));
    return res.data;
  },

  getAll: async (): Promise<PipelineResponse[]> => {
    const res = await api.get(PIPELINE_ENDPOINTS.getAll);
    return res.data;
  },

  getByDepartment: async (department: string): Promise<PipelineResponse[]> => {
    const res = await api.get(PIPELINE_ENDPOINTS.getByDepartment(department));
    return res.data;
  },

  update: async (id: string, data: Partial<CreatePipelineRequest>): Promise<PipelineResponse> => {
    const res = await api.put(PIPELINE_ENDPOINTS.update(id), data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(PIPELINE_ENDPOINTS.delete(id));
  },

  addCandidate: async (data: { pipelineId: string; candidateId: string }): Promise<CandidatePipelineResponse> => {
    const res = await api.post(PIPELINE_ENDPOINTS.addCandidate, data);
    return res.data;
  },

  getCandidatesInPipeline: async (pipelineId: string): Promise<CandidatePipelineResponse[]> => {
    const res = await api.get(PIPELINE_ENDPOINTS.getCandidatesInPipeline(pipelineId));
    return res.data;
  },

  advanceCandidate: async (candidatePipelineId: string): Promise<void> => {
    await api.post(PIPELINE_ENDPOINTS.advance(candidatePipelineId));
  },

  rejectCandidate: async (candidatePipelineId: string, reason?: string): Promise<void> => {
    await api.post(PIPELINE_ENDPOINTS.reject(candidatePipelineId), { reason });
  },

  updateCandidateStatus: async (candidatePipelineId: string, status: string): Promise<void> => {
    await api.patch(PIPELINE_ENDPOINTS.updateCandidateStatus(candidatePipelineId), { status });
  },
};
