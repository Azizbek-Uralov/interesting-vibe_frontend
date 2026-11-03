import { apiClient } from './client';
import { NotificationItem, PaginationMeta } from '../types';

export interface NotificationsResponse {
  data: NotificationItem[];
  meta: PaginationMeta;
}

export const notificationsApi = {
  getAll: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<NotificationsResponse> => {
    const res = await apiClient.get('/notifications', { params });
    return res.data;
  },

  markAsRead: async (id: string) => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await apiClient.patch('/notifications/read-all');
    return res.data;
  },

  delete: async (id: string) => {
    const res = await apiClient.delete(`/notifications/${id}`);
    return res.data;
  },
};

