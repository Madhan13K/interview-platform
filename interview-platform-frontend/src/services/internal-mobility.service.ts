import api from "@/lib/axios";

export interface InternalPosting {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: string[];
  status: "OPEN" | "CLOSED" | "FILLED";
  postedBy: string;
  createdAt: string;
  closingDate: string;
}

export interface InternalApplication {
  id: string;
  postingId: string;
  applicantId: string;
  applicantName: string;
  status: "APPLIED" | "UNDER_REVIEW" | "SHORTLISTED" | "SELECTED" | "REJECTED";
  appliedAt: string;
  currentDepartment: string;
  currentRole: string;
}

export const internalMobilityService = {
  listPostings: (params?: { status?: string; department?: string }) => api.get<InternalPosting[]>("/api/v1/internal-mobility", { params }),
  getPosting: (id: string) => api.get<InternalPosting>(`/api/v1/internal-mobility/${id}`),
  createPosting: (data: Partial<InternalPosting>) => api.post<InternalPosting>("/api/v1/internal-mobility", data),
  updatePosting: (id: string, data: Partial<InternalPosting>) => api.put<InternalPosting>(`/api/v1/internal-mobility/${id}`, data),
  deletePosting: (id: string) => api.delete(`/api/v1/internal-mobility/${id}`),
  apply: (postingId: string, data: { coverLetter?: string }) => api.post<InternalApplication>(`/api/v1/internal-mobility/${postingId}/apply`, data),
  getApplications: (postingId: string) => api.get<InternalApplication[]>(`/api/v1/internal-mobility/${postingId}/applications`),
  getMyApplications: () => api.get<InternalApplication[]>("/api/v1/internal-mobility/my-applications"),
};
