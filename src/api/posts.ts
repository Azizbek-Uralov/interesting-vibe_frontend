import { apiClient } from './client';
import { Post, MediaType } from '../types';

export interface CreatePostDto {
  title?: string;
  description?: string;
  categoryId?: string;
  destinationUrl?: string;
  tags?: string[];
}

export interface UpdatePostDto {
  title?: string;
  description?: string;
  categoryId?: string | null;
  destinationUrl?: string | null;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
}

export interface AddMediaDto {
  type: MediaType;
  storageKey: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  fileSize?: number;
}

export const postsApi = {
  getPublished: async (params?: { limit?: number; cursor?: string }): Promise<Post[]> => {
    const res = await apiClient.get('/posts', { params });
    return res.data;
  },

  getMyPosts: async (): Promise<Post[]> => {
    const res = await apiClient.get('/posts/me');
    return res.data;
  },

  getOne: async (id: string): Promise<Post> => {
    const res = await apiClient.get(`/posts/${id}`);
    return res.data;
  },

  create: async (data: CreatePostDto): Promise<Post> => {
    const res = await apiClient.post('/posts', data);
    return res.data;
  },

  update: async (id: string, data: UpdatePostDto): Promise<Post> => {
    const res = await apiClient.patch(`/posts/${id}`, data);
    return res.data;
  },

  archive: async (id: string): Promise<Post> => {
    const res = await apiClient.post(`/posts/${id}/archive`);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await apiClient.delete(`/posts/${id}`);
    return res.data;
  },

  addMedia: async (postId: string, data: AddMediaDto) => {
    const res = await apiClient.post(`/posts/${postId}/media`, data);
    return res.data;
  },

  reorderMedia: async (postId: string, mediaIds: string[]) => {
    const res = await apiClient.patch(`/posts/${postId}/media/order`, { mediaIds });
    return res.data;
  },

  removeMedia: async (postId: string, mediaId: string) => {
    const res = await apiClient.delete(`/posts/${postId}/media/${mediaId}`);
    return res.data;
  },
};

