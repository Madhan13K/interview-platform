import api from "@/lib/axios";
import { SCORECARD_ENDPOINTS } from "@/lib/api-endpoints";
import type {
  EvaluationCriteria,
  CreateCriteriaRequest,
  ScorecardResponse,
  SubmitScorecardRequest,
} from "@/types";

export const scorecardService = {
  createCriteria: async (data: CreateCriteriaRequest): Promise<EvaluationCriteria> => {
    const res = await api.post(SCORECARD_ENDPOINTS.createCriteria, data);
    return res.data;
  },

  getAllCriteria: async (): Promise<EvaluationCriteria[]> => {
    const res = await api.get(SCORECARD_ENDPOINTS.getAllCriteria);
    return res.data;
  },

  getCriteriaByType: async (type: string): Promise<EvaluationCriteria[]> => {
    const res = await api.get(SCORECARD_ENDPOINTS.getCriteriaByType(type));
    return res.data;
  },

  getCriteriaById: async (id: string): Promise<EvaluationCriteria> => {
    const res = await api.get(SCORECARD_ENDPOINTS.getCriteriaById(id));
    return res.data;
  },

  updateCriteria: async (id: string, data: Partial<CreateCriteriaRequest>): Promise<EvaluationCriteria> => {
    const res = await api.put(SCORECARD_ENDPOINTS.updateCriteria(id), data);
    return res.data;
  },

  deleteCriteria: async (id: string): Promise<void> => {
    await api.delete(SCORECARD_ENDPOINTS.deleteCriteria(id));
  },

  submit: async (data: SubmitScorecardRequest): Promise<ScorecardResponse> => {
    const res = await api.post(SCORECARD_ENDPOINTS.submit, data);
    return res.data;
  },

  getById: async (id: string): Promise<ScorecardResponse> => {
    const res = await api.get(SCORECARD_ENDPOINTS.getById(id));
    return res.data;
  },

  getByInterview: async (interviewId: string): Promise<ScorecardResponse[]> => {
    const res = await api.get(SCORECARD_ENDPOINTS.getByInterview(interviewId));
    return res.data;
  },

  getByCandidate: async (candidateId: string): Promise<ScorecardResponse[]> => {
    const res = await api.get(SCORECARD_ENDPOINTS.getByCandidate(candidateId));
    return res.data;
  },

  getSummary: async (interviewId: string) => {
    const res = await api.get(SCORECARD_ENDPOINTS.getSummary(interviewId));
    return res.data;
  },
};
