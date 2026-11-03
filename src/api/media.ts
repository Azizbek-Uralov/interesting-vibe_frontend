import { apiClient } from './client';
import { MediaType } from '../types';

export interface UploadResult {
  storageKey: string;
  url: string;
  type: MediaType;
  mimeType: string;
  fileSize: number;
  originalName: string;
}

export const mediaApi = {
  upload: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getMetadata: async (id: string) => {
    const res = await apiClient.get(`/media/${id}`);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await apiClient.delete(`/media/${id}`);
    return res.data;
  },
};

