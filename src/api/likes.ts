import { apiClient } from './client';
import { Author, PaginationMeta } from '../types';

export const likesApi = {
  like: async (postId: string): Promise<{ liked: boolean; likeCount: number }> => {
    const res = await apiClient.post(`/posts/${postId}/like`);
    return res.data;
  },

  unlike: async (postId: string): Promise<{ liked: boolean; likeCount: number }> => {
    const res = await apiClient.delete(`/posts/${postId}/like`);
    return res.data;
  },

  getLikes: async (postId: string, params?: { page?: number; limit?: number }): Promise<{ data: Author[]; meta: PaginationMeta }> => {
    const res = await apiClient.get(`/posts/${postId}/likes`, { params });
    return res.data;
  },
};

