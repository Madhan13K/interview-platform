import api from "@/lib/axios";

export interface Comment {
  id: string;
  entityType: string;
  entityId: string;
  authorId: string;
  authorName: string;
  content: string;
  mentions: string[];
  parentId: string | null;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

export const commentsService = {
  getComments: (entityType: string, entityId: string) => api.get<Comment[]>(`/api/v1/comments?entityType=${entityType}&entityId=${entityId}`),
  addComment: (data: { entityType: string; entityId: string; content: string; mentions?: string[] }) => api.post<Comment>("/api/v1/comments", data),
  reply: (parentId: string, data: { content: string; mentions?: string[] }) => api.post<Comment>(`/api/v1/comments/${parentId}/reply`, data),
  edit: (id: string, content: string) => api.put<Comment>(`/api/v1/comments/${id}`, { content }),
  delete: (id: string) => api.delete(`/api/v1/comments/${id}`),
};
