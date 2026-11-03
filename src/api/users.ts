import { apiClient } from './client';
import { UserProfile } from '../types';

export const usersApi = {
  getMe: async (): Promise<UserProfile> => {
    const res = await apiClient.get('/users/me');
    return res.data;
  },

  updateMe: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const res = await apiClient.patch('/users/me', data);
    return res.data;
  },

  getByUsername: async (username: string): Promise<UserProfile> => {
    const res = await apiClient.get(`/users/${username}`);
    return res.data;
  },

  deleteMe: async () => {
    const res = await apiClient.delete('/users/me');
    return res.data;
  },
};

