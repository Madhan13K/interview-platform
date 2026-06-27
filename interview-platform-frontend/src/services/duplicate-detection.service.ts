import api from "@/lib/axios";

export interface DuplicateCandidate {
  id: string;
  candidateAId: string;
  candidateAName: string;
  candidateBId: string;
  candidateBName: string;
  matchScore: number;
  matchFields: string[];
  status: "PENDING" | "CONFIRMED_DUPLICATE" | "NOT_DUPLICATE" | "MERGED";
  detectedAt: string;
  resolvedAt: string | null;
}

export interface MergeResult {
  survivingCandidateId: string;
  mergedCandidateId: string;
  mergedFields: string[];
  success: boolean;
}

export const duplicateDetectionService = {
  scan: () => api.post<{ scanId: string; duplicatesFound: number }>("/api/v1/duplicate-detection/scan"),
  getPending: (params?: { page?: number; size?: number }) => api.get<DuplicateCandidate[]>("/api/v1/duplicate-detection/pending", { params }),
  resolve: (id: string, status: "CONFIRMED_DUPLICATE" | "NOT_DUPLICATE") => api.post<DuplicateCandidate>(`/api/v1/duplicate-detection/${id}/resolve`, { status }),
  merge: (id: string, survivingCandidateId: string) => api.post<MergeResult>(`/api/v1/duplicate-detection/${id}/merge`, { survivingCandidateId }),
  getHistory: (params?: { page?: number; size?: number }) => api.get<DuplicateCandidate[]>("/api/v1/duplicate-detection/history", { params }),
};
