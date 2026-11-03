import { apiClient } from './client';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    username: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    isVerified?: boolean;
  };
}

export interface ConversationItem {
  id: string;
  partner: {
    id: string;
    username: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    isVerified?: boolean;
  };
  lastMessage?: {
    id: string;
    senderId: string;
    content: string;
    isRead: boolean;
    createdAt: string;
  } | null;
  unreadCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessagesResponse {
  data: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export const chatApi = {
  getConversations: async (): Promise<ConversationItem[]> => {
    const res = await apiClient.get<ConversationItem[]>('/chats');
    return res.data;
  },

  createOrGetConversation: async (participantId: string): Promise<ConversationItem> => {
    const res = await apiClient.post<ConversationItem>('/chats', { participantId });
    return res.data;
  },

  getMessages: async (conversationId: string, page = 1, limit = 30): Promise<MessagesResponse> => {
    const res = await apiClient.get<MessagesResponse>(`/chats/${conversationId}/messages`, {
      params: { page, limit },
    });
    return res.data;
  },

  sendMessage: async (conversationId: string, content: string): Promise<ChatMessage> => {
    const res = await apiClient.post<ChatMessage>(`/chats/${conversationId}/messages`, { content });
    return res.data;
  },

  markAsRead: async (conversationId: string): Promise<{ success: boolean }> => {
    const res = await apiClient.patch<{ success: boolean }>(`/chats/${conversationId}/read`);
    return res.data;
  },
};
