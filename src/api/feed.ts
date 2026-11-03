import { apiClient } from './client';
import { Post, PaginationMeta } from '../types';

export interface FeedResponse {
  data: Post[];
  meta: PaginationMeta;
}

export const feedApi = {
  getFeed: async (params?: { page?: number; limit?: number; type?: 'all' | 'following' }): Promise<FeedResponse> => {
    const res = await apiClient.get('/feed', { params });
    return res.data;
  },
};

