import { apiClient } from './client';
import { Collection } from '../types';

export interface CreateCollectionDto {
  name: string;
  description?: string;
  coverUrl?: string;
}

export const collectionsApi = {
  getAll: async (): Promise<Collection[]> => {
    const res = await apiClient.get('/collections');
    return res.data;
  },

  getOne: async (id: string): Promise<Collection> => {
    const res = await apiClient.get(`/collections/${id}`);
    return res.data;
  },

  create: async (data: CreateCollectionDto): Promise<Collection> => {
    const res = await apiClient.post('/collections', data);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateCollectionDto>): Promise<Collection> => {
    const res = await apiClient.patch(`/collections/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await apiClient.delete(`/collections/${id}`);
    return res.data;
  },

  addPost: async (collectionId: string, postId: string) => {
    const res = await apiClient.post(`/collections/${collectionId}/posts/${postId}`);
    return res.data;
  },

  removePost: async (collectionId: string, postId: string) => {
    const res = await apiClient.delete(`/collections/${collectionId}/posts/${postId}`);
    return res.data;
  },
};

