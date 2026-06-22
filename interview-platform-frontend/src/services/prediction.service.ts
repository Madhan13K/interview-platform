import api from "@/lib/axios";
import { PREDICTION_ENDPOINTS } from "@/lib/api-endpoints";

export interface CandidateSuccessPrediction {
  candidateId: string;
  probability: number;
  confidence: string;
  recommendation: string;
  stageScores: Record<string, number>;
}

export interface InterviewerBiasReport {
  interviewerId: string;
  severity: string;
  avgDeviation: number;
  biasScore: number;
  flags: string[];
}

export const predictionService = {
  predictCandidateSuccess: async (candidateId: string): Promise<CandidateSuccessPrediction> => {
    const res = await api.get(PREDICTION_ENDPOINTS.candidateSuccess(candidateId));
    return res.data;
  },

  detectInterviewerBias: async (interviewerId: string): Promise<InterviewerBiasReport> => {
    const res = await api.get(PREDICTION_ENDPOINTS.interviewerBias(interviewerId));
    return res.data;
  },

  predictTimeToHire: async (department?: string, level?: string): Promise<{ predictedDays: number; confidence: string; sampleSize: number }> => {
    const res = await api.get(PREDICTION_ENDPOINTS.timeToHire, { params: { department, level } });
    return res.data;
  },
};
