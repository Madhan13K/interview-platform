import api from "@/lib/axios";

export interface InterviewKit {
  id: string;
  name: string;
  description: string;
  jobId: string;
  jobTitle: string;
  sections: InterviewKitSection[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewKitSection {
  id: string;
  title: string;
  durationMinutes: number;
  questions: string[];
  competencies: string[];
  instructions: string;
}

export const interviewKitsService = {
  list: (params?: { jobId?: string; page?: number; size?: number }) => api.get<InterviewKit[]>("/api/v1/interview-kits", { params }),
  get: (id: string) => api.get<InterviewKit>(`/api/v1/interview-kits/${id}`),
  create: (data: Partial<InterviewKit>) => api.post<InterviewKit>("/api/v1/interview-kits", data),
  update: (id: string, data: Partial<InterviewKit>) => api.put<InterviewKit>(`/api/v1/interview-kits/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/interview-kits/${id}`),
  download: (id: string, format: "pdf" | "docx") => api.get(`/api/v1/interview-kits/${id}/download?format=${format}`, { responseType: "blob" }),
};
