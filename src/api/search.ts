import { apiClient } from './client';
import { Author, Post } from '../types';

export interface SearchResult {
  query: string;
  type: string;
  posts?: {
    data: Post[];
    total: number;
  };
  users?: {
    data: Author[];
    total: number;
  };
  tags?: {
    data: Array<{ id: string; postsCount: number; translations: Array<{ name: string; slug: string }> }>;
    total: number;
  };
}

export const searchApi = {
  search: async (params: { q: string; type?: 'all' | 'posts' | 'users' | 'tags'; page?: number; limit?: number }): Promise<SearchResult> => {
    const res = await apiClient.get('/search', { params });
    return res.data;
  },
};

