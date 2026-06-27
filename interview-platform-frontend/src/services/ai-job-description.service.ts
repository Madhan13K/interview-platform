import api from "@/lib/api";

export const aiJobDescriptionService = {
  generate: (data: { jobTitle: string; department: string; requirements: string[]; tone?: string }) => api.post("/api/v1/ai-job-descriptions/generate", data),
  checkDei: (content: string) => api.post("/api/v1/ai-job-descriptions/dei-check", { content }),
  improve: (content: string) => api.post("/api/v1/ai-job-descriptions/improve", { content }),
  list: () => api.get("/api/v1/ai-job-descriptions"),
};
