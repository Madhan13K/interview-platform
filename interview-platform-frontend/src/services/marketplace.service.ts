import api from "@/lib/axios";
import { MARKETPLACE_ENDPOINTS } from "@/lib/api-endpoints";

export interface AssessmentProvider {
  id: string;
  name: string;
  description: string;
  categories: string[];
  active: boolean;
}

export interface Assessment {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  difficulty: string;
}

export interface AssessmentOrder {
  orderId: string;
  providerId: string;
  assessmentId: string;
  candidateEmail: string;
  status: string;
  inviteUrl: string;
}

export const marketplaceService = {
  getProviders: async (category?: string): Promise<AssessmentProvider[]> => {
    const res = await api.get(MARKETPLACE_ENDPOINTS.getProviders, { params: category ? { category } : {} });
    return res.data;
  },

  getAssessments: async (providerId: string): Promise<Assessment[]> => {
    const res = await api.get(MARKETPLACE_ENDPOINTS.getAssessments(providerId));
    return res.data;
  },

  orderAssessment: async (data: { providerId: string; assessmentId: string; candidateEmail: string; candidateName: string }): Promise<AssessmentOrder> => {
    const res = await api.post(MARKETPLACE_ENDPOINTS.orderAssessment, data);
    return res.data;
  },

  getResult: async (orderId: string, providerId: string): Promise<{ orderId: string; status: string; score: number; verdict: string; details: Record<string, unknown> }> => {
    const res = await api.get(MARKETPLACE_ENDPOINTS.getResult(orderId), { params: { providerId } });
    return res.data;
  },
};
