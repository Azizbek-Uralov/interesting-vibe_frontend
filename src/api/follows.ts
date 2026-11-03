import { apiClient } from './client';
import { Author, FollowStatus, PaginationMeta } from '../types';

export interface FollowListResponse {
  data: Author[];
  meta: PaginationMeta;
}

export interface FollowRequestsResponse {
  data: Array<{
    followId: string;
    createdAt: string;
    user: Author;
  }>;
  meta: PaginationMeta;
}

export const followsApi = {
  follow: async (userId: string): Promise<{ message: string; status: FollowStatus }> => {
    const res = await apiClient.post(`/users/${userId}/follow`);
    return res.data;
  },

  unfollow: async (userId: string) => {
    const res = await apiClient.delete(`/users/${userId}/follow`);
    return res.data;
  },

  getFollowers: async (userId: string, params?: { page?: number; limit?: number }): Promise<FollowListResponse> => {
    const res = await apiClient.get(`/users/${userId}/followers`, { params });
    return res.data;
  },

  getFollowing: async (userId: string, params?: { page?: number; limit?: number }): Promise<FollowListResponse> => {
    const res = await apiClient.get(`/users/${userId}/following`, { params });
    return res.data;
  },

  getPendingRequests: async (params?: { page?: number; limit?: number }): Promise<FollowRequestsResponse> => {
    const res = await apiClient.get('/users/me/follow-requests', { params });
    return res.data;
  },

  acceptRequest: async (followId: string) => {
    const res = await apiClient.patch(`/users/follow-requests/${followId}/accept`);
    return res.data;
  },

  rejectRequest: async (followId: string) => {
    const res = await apiClient.patch(`/users/follow-requests/${followId}/reject`);
    return res.data;
  },
};

