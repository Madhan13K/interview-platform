import api from "@/lib/axios";
import { TAG_ENDPOINTS } from "@/lib/api-endpoints";
import type { TagResponse, CreateTagRequest } from "@/types";

export const tagService = {
  create: async (data: CreateTagRequest): Promise<TagResponse> => {
    const res = await api.post(TAG_ENDPOINTS.create, data);
    return res.data;
  },

  getAll: async (): Promise<TagResponse[]> => {
    const res = await api.get(TAG_ENDPOINTS.getAll);
    return res.data;
  },

  getByCategory: async (category: string): Promise<TagResponse[]> => {
    const res = await api.get(TAG_ENDPOINTS.getByCategory(category));
    return res.data;
  },

  search: async (query: string): Promise<TagResponse[]> => {
    const res = await api.get(TAG_ENDPOINTS.search, { params: { q: query } });
    return res.data;
  },

  delete: async (tagId: string): Promise<void> => {
    await api.delete(TAG_ENDPOINTS.delete(tagId));
  },

  tagEntity: async (tagId: string, entityType: string, entityId: string): Promise<void> => {
    await api.post(TAG_ENDPOINTS.tagEntity(tagId, entityType, entityId));
  },

  untagEntity: async (tagId: string, entityType: string, entityId: string): Promise<void> => {
    await api.delete(TAG_ENDPOINTS.untagEntity(tagId, entityType, entityId));
  },

  getEntityTags: async (entityType: string, entityId: string): Promise<TagResponse[]> => {
    const res = await api.get(TAG_ENDPOINTS.getEntityTags(entityType, entityId));
    return res.data;
  },

  getEntitiesByTag: async (tagId: string, entityType: string): Promise<string[]> => {
    const res = await api.get(TAG_ENDPOINTS.getEntitiesByTag(tagId, entityType));
    return res.data;
  },
};
