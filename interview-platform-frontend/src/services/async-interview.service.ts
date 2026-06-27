import api from "@/lib/axios";
import { ASYNC_INTERVIEW_ENDPOINTS } from "@/lib/api-endpoints";

export interface AsyncInterview {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline: string;
  maxResponseTime: number;
  maxRetakes: number;
  questionCount: number;
  invitationCount: number;
  createdAt: string;
}

export interface AsyncQuestion {
  id: string;
  questionText: string;
  questionOrder: number;
  thinkingTime: number;
  maxResponseTime: number;
}

export interface AsyncInvitation {
  id: string;
  candidateEmail: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
}

export const listAsyncInterviews = async (status?: string): Promise<AsyncInterview[]> => {
  const res = await api.get(ASYNC_INTERVIEW_ENDPOINTS.list, { params: { status } });
  return res.data;
};

export const createAsyncInterview = async (data: {
  title: string;
  description?: string;
  questions: { questionText: string; thinkingTime?: number; maxResponseTime?: number }[];
  deadline?: string;
  maxResponseTime?: number;
  maxRetakes?: number;
}): Promise<AsyncInterview> => {
  const res = await api.post(ASYNC_INTERVIEW_ENDPOINTS.create, data);
  return res.data;
};

export const publishAsyncInterview = async (id: string): Promise<void> => {
  await api.post(ASYNC_INTERVIEW_ENDPOINTS.publish(id));
};

export const inviteCandidate = async (id: string, email: string): Promise<void> => {
  await api.post(ASYNC_INTERVIEW_ENDPOINTS.invite(id), { candidateEmail: email });
};

export const getAsyncInterview = async (id: string): Promise<AsyncInterview & { questions: AsyncQuestion[]; invitations: AsyncInvitation[] }> => {
  const res = await api.get(ASYNC_INTERVIEW_ENDPOINTS.getById(id));
  return res.data;
};

export const getResponses = async (id: string) => {
  const res = await api.get(ASYNC_INTERVIEW_ENDPOINTS.getResponses(id));
  return res.data;
};

export const submitReview = async (invitationId: string, data: {
  overallRating: number;
  notes?: string;
  decision: string;
}): Promise<void> => {
  await api.post(ASYNC_INTERVIEW_ENDPOINTS.submitReview(invitationId), data);
};
