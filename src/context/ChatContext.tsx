import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { chatApi, ConversationItem, ChatMessage } from '../api/chat';

interface ChatContextType {
  socket: Socket | null;
  conversations: ConversationItem[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  onlineUserIds: Set<string>;
  totalUnreadCount: number;
  isLoading: boolean;
  fetchConversations: () => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  startConversationWithUser: (participantId: string) => Promise<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  // Jami o'qilmagan xabarlar soni
  const totalUnreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // Suhbatlar ro'yxatini yuklash
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Auth o'zgarganda suhbatlarni yuklash va Socketni ulash
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      setConversations([]);
      setOnlineUserIds(new Set());
      return;
    }

    fetchConversations();

    // Socket.IO ulanishi
    // Vite proxy orqali port 5173 -> backend 5005
    const newSocket = io({
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Online status hodisalari
    newSocket.on('online_users_list', (userIds: string[]) => {
      setOnlineUserIds(new Set(userIds));
    });

    newSocket.on('user_online', ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => new Set([...prev, userId]));
    });

    newSocket.on('user_offline', ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // Yangi xabar kelganda suhbatlar ro'yxatini yangilash
    newSocket.on(
      'new_message_notification',
      ({ conversationId, message }: { conversationId: string; message: ChatMessage }) => {
        setConversations((prev) => {
          const index = prev.findIndex((c) => c.id === conversationId);
          if (index === -1) {
            // Yangi suhbat ochilgan bo'lsa qayta yuklaymiz
            fetchConversations();
            return prev;
          }

          const updated = [...prev];
          const conv = updated[index];
          const isCurrentlyActive = activeConversationId === conversationId;

          updated[index] = {
            ...conv,
            lastMessage: {
              id: message.id,
              senderId: message.senderId,
              content: message.content,
              isRead: message.isRead,
              createdAt: message.createdAt,
            },
            lastMessageAt: message.createdAt,
            unreadCount: isCurrentlyActive ? conv.unreadCount : conv.unreadCount + 1,
          };

          // Eng oxirgi xabarli suhbatni yuqoriga surish
          return [updated[index], ...updated.filter((_, i) => i !== index)];
        });
      },
    );

    // Xabarlar o'qilganda suhbatdagi oxirgi xabarni isRead qilish
    newSocket.on('message_read', ({ conversationId }: { conversationId: string }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId && c.lastMessage) {
            return {
              ...c,
              lastMessage: { ...c.lastMessage, isRead: true },
            };
          }
          return c;
        }),
      );
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [isAuthenticated, user?.id, fetchConversations, activeConversationId]);

  // Xabar yuborish
  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!content.trim()) return;

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', { conversationId, content });
      } else {
        // Fallback REST API
        const newMsg = await chatApi.sendMessage(conversationId, content);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  lastMessage: {
                    id: newMsg.id,
                    senderId: newMsg.senderId,
                    content: newMsg.content,
                    isRead: newMsg.isRead,
                    createdAt: newMsg.createdAt,
                  },
                  lastMessageAt: newMsg.createdAt,
                }
              : c,
          ),
        );
      }
    },
    [],
  );

  // O'qilgan deb belgilash
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('mark_read', { conversationId });
      } else {
        await chatApi.markAsRead(conversationId);
      }

      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
      );
    } catch {
      // ignore
    }
  }, []);

  // Foydalanuvchi bilan yangi suhbat boshlash
  const startConversationWithUser = useCallback(async (participantId: string): Promise<string> => {
    const conv = await chatApi.createOrGetConversation(participantId);
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conv.id);
      return exists ? prev : [conv, ...prev];
    });
    setActiveConversationId(conv.id);
    return conv.id;
  }, []);

  return (
    <ChatContext.Provider
      value={{
        socket,
        conversations,
        activeConversationId,
        setActiveConversationId,
        onlineUserIds,
        totalUnreadCount,
        isLoading,
        fetchConversations,
        sendMessage,
        markConversationAsRead,
        startConversationWithUser,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

