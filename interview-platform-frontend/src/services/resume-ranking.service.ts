import api from "@/lib/axios";

export interface ResumeRanking {
  candidateId: string;
  candidateName: string;
  jobId: string;
  rank: number;
  score: number;
  matchBreakdown: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    overallFit: number;
  };
  rankedAt: string;
}

export const resumeRankingService = {
  rankForJob: (jobId: string) => api.post<ResumeRanking[]>(`/api/v1/resume-ranking/job/${jobId}/rank`),
  getRankings: (jobId: string) => api.get<ResumeRanking[]>(`/api/v1/resume-ranking/job/${jobId}`),
  getCandidateRank: (candidateId: string, jobId: string) => api.get<ResumeRanking>(`/api/v1/resume-ranking/candidate/${candidateId}/job/${jobId}`),
};
