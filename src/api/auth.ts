import { apiClient } from './client';

export interface SignupRequestDto {
  phone: string;
  password?: string;
  username?: string;
  fullName?: string;
}

export interface VerifySignupDto {
  phoneNumber: string;
  code: string;
}

export interface SigninDto {
  username: string;
  password: string;
}

export const authApi = {
  signup: async (data: SignupRequestDto) => {
    const res = await apiClient.post('/auth/signup', data);
    return res.data;
  },

  verifySignup: async (data: VerifySignupDto) => {
    const res = await apiClient.post('/auth/verify', data);
    return res.data;
  },

  signin: async (data: SigninDto) => {
    const res = await apiClient.post('/auth/signin', data);
    return res.data;
  },

  logout: async () => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  },

  logoutAll: async () => {
    const res = await apiClient.delete('/auth/logout-all');
    return res.data;
  },

  getSessions: async () => {
    const res = await apiClient.get('/auth/sessions');
    return res.data;
  },

  getTelegramStatus: async (token: string) => {
    const res = await apiClient.get('/auth/telegram/status', {
      params: { token },
    });
    return res.data as { status: 'PENDING' | 'SENT' | 'EXPIRED'; phone?: string };
  },

  revokeSession: async (id: string) => {
    const res = await apiClient.delete(`/auth/sessions/${id}`);
    return res.data;
  },
};

