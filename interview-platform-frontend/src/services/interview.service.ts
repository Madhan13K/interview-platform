import api from "@/lib/axios";
import { INTERVIEW_ENDPOINTS } from "@/lib/api-endpoints";
import type {
  InterviewResponse,
  CreateInterviewRequest,
  InterviewFeedbackRequest,
  InterviewFeedbackResponse,
  PaginatedResponse,
} from "@/types";

export const interviewService = {
  getAll: async (): Promise<InterviewResponse[]> => {
    const res = await api.get(INTERVIEW_ENDPOINTS.getAll);
    return res.data;
  },

  getPaginated: async (page = 0, size = 10, sort?: string): Promise<PaginatedResponse<InterviewResponse>> => {
    const res = await api.get(INTERVIEW_ENDPOINTS.getPaginated, { params: { page, size, sort } });
    return res.data;
  },

  getById: async (id: string): Promise<InterviewResponse> => {
    const res = await api.get(INTERVIEW_ENDPOINTS.getById(id));
    return res.data;
  },

  create: async (data: CreateInterviewRequest): Promise<InterviewResponse> => {
    const res = await api.post(INTERVIEW_ENDPOINTS.create, data);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateInterviewRequest>): Promise<InterviewResponse> => {
    const res = await api.put(INTERVIEW_ENDPOINTS.update(id), data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(INTERVIEW_ENDPOINTS.delete(id));
  },

  cancel: async (id: string): Promise<void> => {
    await api.patch(INTERVIEW_ENDPOINTS.cancel(id));
  },

  updateStatus: async (id: string, status: string): Promise<void> => {
    await api.patch(INTERVIEW_ENDPOINTS.updateStatus(id), { status });
  },

  getMyAsCandidate: async (): Promise<InterviewResponse[]> => {
    const res = await api.get(INTERVIEW_ENDPOINTS.myCandidate);
    return res.data;
  },

  getMyAsInterviewer: async (): Promise<InterviewResponse[]> => {
    const res = await api.get(INTERVIEW_ENDPOINTS.myInterviewer);
    return res.data;
  },

  addInterviewer: async (interviewId: string, interviewerId: string): Promise<void> => {
    await api.post(INTERVIEW_ENDPOINTS.addInterviewer(interviewId, interviewerId));
  },

  removeInterviewer: async (interviewId: string, interviewerId: string): Promise<void> => {
    await api.delete(INTERVIEW_ENDPOINTS.removeInterviewer(interviewId, interviewerId));
  },

  submitFeedback: async (interviewId: string, data: InterviewFeedbackRequest): Promise<void> => {
    await api.post(INTERVIEW_ENDPOINTS.submitFeedback(interviewId), data);
  },

  getFeedback: async (interviewId: string): Promise<InterviewFeedbackResponse[]> => {
    const res = await api.get(INTERVIEW_ENDPOINTS.getFeedback(interviewId));
    return res.data;
  },

  filterByStatus: async (status: string): Promise<InterviewResponse[]> => {
    const res = await api.get(INTERVIEW_ENDPOINTS.filterByStatus, { params: { status } });
    return res.data;
  },

  filterByDateRange: async (startDate: string, endDate: string): Promise<InterviewResponse[]> => {
    const res = await api.get(INTERVIEW_ENDPOINTS.filterByDateRange, { params: { startDate, endDate } });
    return res.data;
  },
};
