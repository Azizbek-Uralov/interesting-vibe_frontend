import { apiClient } from './client';
import { Category, PaginationMeta, Roles, UserProfile, UserStatus } from '../types';

export interface AdminStats {
  users: { total: number; active: number };
  posts: { total: number; published: number };
  sessions: { active: number };
}

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const res = await apiClient.get('/admin/stats');
    return res.data;
  },

  getUsers: async (params?: { page?: number; limit?: number; role?: Roles; status?: UserStatus; search?: string }): Promise<{ data: UserProfile[]; meta: PaginationMeta }> => {
    const res = await apiClient.get('/admin/users', { params });
    return res.data;
  },

  getUserById: async (id: string): Promise<UserProfile> => {
    const res = await apiClient.get(`/admin/users/${id}`);
    return res.data;
  },

  updateUserStatus: async (id: string, status: UserStatus) => {
    const res = await apiClient.patch(`/admin/users/${id}/status`, { status });
    return res.data;
  },

  updateUserRole: async (id: string, role: Roles) => {
    const res = await apiClient.patch(`/admin/users/${id}/role`, { role });
    return res.data;
  },

  createCategory: async (data: { coverUrl?: string; isActive?: boolean; translations: Array<{ language: string; name: string; slug: string; description?: string }> }): Promise<Category> => {
    const res = await apiClient.post('/admin/categories', data);
    return res.data;
  },

  updateCategory: async (id: string, data: any): Promise<Category> => {
    const res = await apiClient.patch(`/admin/categories/${id}`, data);
    return res.data;
  },

  deleteCategory: async (id: string) => {
    const res = await apiClient.delete(`/admin/categories/${id}`);
    return res.data;
  },
};

