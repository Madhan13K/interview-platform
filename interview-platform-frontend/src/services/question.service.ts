import api from "@/lib/axios";
import { QUESTION_ENDPOINTS } from "@/lib/api-endpoints";
import type { QuestionResponse, QuestionCategory, CreateQuestionRequest, PaginatedResponse } from "@/types";

export const questionService = {
  createCategory: async (data: { name: string; description?: string }): Promise<QuestionCategory> => {
    const res = await api.post(QUESTION_ENDPOINTS.createCategory, data);
    return res.data;
  },

  getCategories: async (): Promise<QuestionCategory[]> => {
    const res = await api.get(QUESTION_ENDPOINTS.getCategories);
    return res.data;
  },

  create: async (data: CreateQuestionRequest): Promise<QuestionResponse> => {
    const res = await api.post(QUESTION_ENDPOINTS.create, data);
    return res.data;
  },

  getById: async (id: string): Promise<QuestionResponse> => {
    const res = await api.get(QUESTION_ENDPOINTS.getById(id));
    return res.data;
  },

  update: async (id: string, data: Partial<CreateQuestionRequest>): Promise<QuestionResponse> => {
    const res = await api.put(QUESTION_ENDPOINTS.update(id), data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(QUESTION_ENDPOINTS.delete(id));
  },

  search: async (params: {
    keyword?: string;
    type?: string;
    difficulty?: string;
    categoryId?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<QuestionResponse>> => {
    const res = await api.get(QUESTION_ENDPOINTS.search, { params });
    return res.data;
  },

  getByCategory: async (categoryId: string): Promise<QuestionResponse[]> => {
    const res = await api.get(QUESTION_ENDPOINTS.byCategory(categoryId));
    return res.data;
  },
};
