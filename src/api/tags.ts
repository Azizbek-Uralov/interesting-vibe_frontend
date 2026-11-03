import { apiClient } from './client';

export interface TagItem {
  id: string;
  postsCount: number;
  translations: Array<{
    id?: string;
    language: string;
    name: string;
    slug: string;
  }>;
}

export const tagsApi = {
  getAll: async (params?: { language?: string; search?: string; limit?: number }): Promise<TagItem[]> => {
    const res = await apiClient.get('/tags', { params });
    return res.data;
  },
};

