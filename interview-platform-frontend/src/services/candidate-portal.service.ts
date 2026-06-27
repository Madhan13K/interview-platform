import api from "@/lib/axios";

export interface CandidatePortalData {
  candidateId: string;
  name: string;
  email: string;
  activeApplications: number;
  upcomingInterviews: number;
  completedInterviews: number;
  nextInterviewDate: string | null;
}

export interface PrepTip {
  id: string;
  category: string;
  title: string;
  content: string;
  priority: number;
}

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  status: string;
}

export const candidatePortalService = {
  getPortalData: () => api.get<CandidatePortalData>("/api/v1/candidate-portal/me"),
  getPrepTips: (jobId: string) => api.get<PrepTip[]>(`/api/v1/candidate-portal/prep-tips/${jobId}`),
  getTimeline: () => api.get<TimelineEvent[]>("/api/v1/candidate-portal/timeline"),
};
