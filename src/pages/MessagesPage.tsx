import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Send,
  ArrowLeft,
  Check,
  CheckCheck,
  Search,
  MessageSquare,
  Circle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { chatApi, ChatMessage } from '../api/chat';
import { Avatar } from '../components/common/Avatar';

export const MessagesPage: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const {
    socket,
    conversations,
    activeConversationId,
    setActiveConversationId,
    onlineUserIds,
    sendMessage,
    markConversationAsRead,
    startConversationWithUser,
    isLoading: isConversationsLoading,
  } = useChat();

  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // URL dan userId parametri kelsa, avtomatik suhbat ochish
  const targetUserId = searchParams.get('userId');
  useEffect(() => {
    if (targetUserId && isAuthenticated && user && targetUserId !== user.id) {
      startConversationWithUser(targetUserId).then((convId) => {
        setActiveConversationId(convId);
      });
    }
  }, [targetUserId, isAuthenticated, user, startConversationWithUser, setActiveConversationId]);

  // Tanlangan suhbat obyekti
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Xabarlar tarixini yuklash
  const loadMessages = useCallback(
    async (convId: string) => {
      try {
        setIsMessagesLoading(true);
        const res = await chatApi.getMessages(convId, 1, 50);
        setMessages(res.data);
        markConversationAsRead(convId);
      } catch {
        // ignore
      } finally {
        setIsMessagesLoading(false);
      }
    },
    [markConversationAsRead],
  );

  // Suhbat o'zgarganda xabarlarni yuklash va roomga kirish
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    loadMessages(activeConversationId);

    if (socket && socket.connected) {
      socket.emit('join_conversation', { conversationId: activeConversationId });
    }

    return () => {
      if (socket && socket.connected) {
        socket.emit('leave_conversation', { conversationId: activeConversationId });
      }
    };
  }, [activeConversationId, socket, loadMessages]);

  // Real-time socket eventlarini tinglash
  useEffect(() => {
    if (!socket) return;

    // Yangi xabar kelganda
    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.conversationId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          // Optimistik xabarni almashtirish (agar bir xil bo'lsa)
          const tempIdx = prev.findIndex(
            (m) => m.id.startsWith('temp-') && m.content === msg.content,
          );
          if (tempIdx !== -1) {
            const next = [...prev];
            next[tempIdx] = msg;
            return next;
          }
          return [...prev, msg];
        });

        // Agar xabar boshqa tomondan kelgan bo'lsa, uni o'qilgan deb belgilaymiz
        if (msg.senderId !== user?.id) {
          markConversationAsRead(activeConversationId);
        }
      }
    };

    const handleNewMessageNotification = ({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: ChatMessage;
    }) => {
      if (conversationId === activeConversationId) {
        handleNewMessage(message);
      }
    };

    // Xabar o'qilganda
    const handleMessageRead = ({
      conversationId,
      readerId,
    }: {
      conversationId: string;
      readerId: string;
    }) => {
      if (conversationId === activeConversationId && readerId !== user?.id) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === user?.id ? { ...m, isRead: true } : m)),
        );
      }
    };

    // Typing hodisalari
    const handleUserTyping = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (conversationId === activeConversationId && userId !== user?.id) {
        setPartnerTyping(true);
      }
    };

    const handleUserStopTyping = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (conversationId === activeConversationId && userId !== user?.id) {
        setPartnerTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('new_message_notification', handleNewMessageNotification);
    socket.on('message_read', handleMessageRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('new_message_notification', handleNewMessageNotification);
      socket.off('message_read', handleMessageRead);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, activeConversationId, user?.id, markConversationAsRead]);

  // Fallback: Real-time background sync (agar socket vaqtincha uzilsa ham 3 soniyada yangilab turish)
  useEffect(() => {
    if (!activeConversationId) return;

    const syncInterval = setInterval(async () => {
      try {
        const res = await chatApi.getMessages(activeConversationId, 1, 50);
        setMessages((prev) => {
          if (!res.data || res.data.length === 0) return prev;
          const prevIds = new Set(prev.map((m) => m.id));
          const hasNew = res.data.some((m) => !prevIds.has(m.id));
          if (hasNew) {
            // Yangi xabarlar kelgan bo'lsa yangilaymiz
            return res.data;
          }
          return prev;
        });
      } catch {
        // ignore
      }
    }, 3000);

    return () => clearInterval(syncInterval);
  }, [activeConversationId]);

  // Avtomatik pastga scroll qilish
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  // Xabar yuborish
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversationId || !user) return;

    const text = inputText.trim();
    setInputText('');

    if (socket && socket.connected) {
      socket.emit('stop_typing', { conversationId: activeConversationId });
    }

    // 1. Darhol optimistik xabarni ekranga chiqaramiz (0 ms da ko'rinadi)
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId: activeConversationId,
      senderId: user.id,
      content: text,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // 2. Serverga yuboramiz
    const serverMessage = await sendMessage(activeConversationId, text);
    if (serverMessage) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? serverMessage : m)),
      );
    }
  };

  // Typing eventlarini boshqarish
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (socket && socket.connected && activeConversationId) {
      socket.emit('typing', { conversationId: activeConversationId });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { conversationId: activeConversationId });
      }, 1500);
    }
  };

  // Key press (Enter bilan yuborish)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Qidiruv bo'yicha suhbatlarni filtrlash
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.partner.username.toLowerCase().includes(q) ||
      (c.partner.fullName && c.partner.fullName.toLowerCase().includes(q)) ||
      (c.lastMessage && c.lastMessage.content.toLowerCase().includes(q))
    );
  });

  // Sana formatlash
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (!isAuthenticated) {
    return (
      <div className="py-24 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#EFE7DD] text-[#8B5E3C] flex items-center justify-center">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#2C221E]">Xabarlar bo‘limi</h2>
        <p className="text-[#8C7A6B]">
          Shaxsiy xabarlarni ko‘rish va suhbatlashish uchun tizimga kiring.
        </p>
        <button
          onClick={() => openAuthModal('signin')}
          className="px-6 py-2.5 bg-[#8B5E3C] text-white rounded-full font-bold hover:bg-[#6E472B] transition-all shadow-md shadow-[#8B5E3C]/20"
        >
          Kirish
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-5.5rem)] pb-2">
      <div className="bg-white rounded-[24px] shadow-sm border border-[#E6DEC3] h-full flex overflow-hidden">
        {/* ================= CHAP PANEL: SUHBATLAR RO'YXATI ================= */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-[#E6DEC3] flex flex-col h-full ${
            activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header & Qidiruv */}
          <div className="p-4 border-b border-[#EAE3D2] space-y-3">
            <h1 className="text-xl font-black text-[#2C221E] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#8B5E3C]" />
              Xabarlar
            </h1>
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suhbatlardan qidirish..."
                className="w-full pl-9 pr-3 py-2 bg-[#EFE7DD] text-[#2C221E] placeholder-[#8C7A6B] rounded-full text-sm border border-[#E6DEC3] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Suhbatlar ro'yxati */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#EAE3D2]/60">
            {isConversationsLoading ? (
              <div className="p-8 text-center text-[#8C7A6B] text-sm">Yuklanmoqda...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-[#8C7A6B] text-sm space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-[#8C7A6B]/50" />
                <p className="font-bold text-[#2C221E]">Hozircha hech qanday suhbat yo‘q.</p>
                <p className="text-xs text-[#8C7A6B]">
                  Foydalanuvchi profiliga kirib, "Xabar yozish" orqali suhbat boshlang.
                </p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isOnline = onlineUserIds.has(c.partner.id);
                const isSelected = c.id === activeConversationId;

                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConversationId(c.id)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#EFE7DD] border-r-4 border-[#8B5E3C]'
                        : 'hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {/* Avatar va Online nuqta */}
                    <div className="relative flex-shrink-0">
                      <Avatar
                        src={c.partner.avatarUrl}
                        name={c.partner.fullName || c.partner.username}
                        size="md"
                      />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Ma'lumotlar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-bold text-[#2C221E] truncate">
                          {c.partner.fullName || `@${c.partner.username}`}
                        </span>
                        {c.lastMessage && (
                          <span className="text-xs text-[#8C7A6B] flex-shrink-0">
                            {formatTime(c.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#8C7A6B]">
                        <span className="truncate pr-2">
                          {c.lastMessage ? (
                            <>
                              {c.lastMessage.senderId === user?.id && (
                                <span className="text-[#8B5E3C] font-semibold mr-1">Siz:</span>
                              )}
                              {c.lastMessage.content}
                            </>
                          ) : (
                            <span className="italic text-[#8C7A6B]">Yangi suhbat</span>
                          )}
                        </span>

                        {c.unreadCount > 0 && (
                          <span className="bg-[#8B5E3C] text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 min-w-4 text-center">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= O'NG PANEL: CHAT OYNASI ================= */}
        <div
          className={`flex-1 flex flex-col h-full bg-[#FAF7F2]/40 ${
            !activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 bg-white border-b border-[#E6DEC3] flex items-center justify-between shadow-xs z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setActiveConversationId(null)}
                    className="md:hidden p-1.5 -ml-1 text-[#2C221E] hover:bg-[#EFE7DD] rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative">
                    <Avatar
                      src={activeConversation.partner.avatarUrl}
                      name={
                        activeConversation.partner.fullName || activeConversation.partner.username
                      }
                      size="md"
                    />
                    {onlineUserIds.has(activeConversation.partner.id) && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#2C221E] truncate">
                        {activeConversation.partner.fullName ||
                          `@${activeConversation.partner.username}`}
                      </span>
                      {activeConversation.partner.isVerified && (
                        <span className="text-[#8B5E3C] font-bold text-xs" title="Tasdiqlangan">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#8C7A6B] flex items-center gap-1">
                      {onlineUserIds.has(activeConversation.partner.id) ? (
                        <>
                          <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
                          Online
                        </>
                      ) : (
                        'Offline'
                      )}
                    </span>
                  </div>
                </div>

                {/* Profilga o'tish linki */}
                <Link
                  to={`/profile/${activeConversation.partner.username}`}
                  className="text-xs text-[#8C7A6B] hover:text-[#8B5E3C] flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-[#EFE7DD] transition-colors"
                >
                  <span className="font-bold">Profil</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Xabarlar tarixi */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isMessagesLoading ? (
                  <div className="flex justify-center items-center h-full text-[#8C7A6B] text-sm">
                    Xabarlar yuklanmoqda...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[#8C7A6B] text-sm space-y-1">
                    <p className="font-bold text-[#2C221E]">Suhbat hali boshlanmagan</p>
                    <p className="text-xs">Birinchi xabarni yozing va suhbatni boshlang!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.senderId === user?.id;

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] md:max-w-md px-4 py-2.5 rounded-[18px] shadow-sm text-sm break-words ${
                            isMine
                              ? 'bg-[#8B5E3C] text-white rounded-br-xs'
                              : 'bg-white text-[#2C221E] border border-[#E6DEC3] rounded-bl-xs'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>

                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                              isMine ? 'text-white/80' : 'text-[#8C7A6B]'
                            }`}
                          >
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            {isMine && (
                              <span>
                                {m.isRead ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-white" />
                                ) : (
                                  <Check className="w-3 h-3 text-white/70" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing indikatori */}
                {partnerTyping && (
                  <div className="flex items-center gap-1.5 text-xs text-[#8C7A6B] bg-white px-3.5 py-1.5 rounded-full w-fit shadow-xs border border-[#E6DEC3] animate-pulse">
                    <span className="w-1.5 h-1.5 bg-[#8B5E3C] rounded-full" />
                    <span className="w-1.5 h-1.5 bg-[#8B5E3C] rounded-full" />
                    <span className="w-1.5 h-1.5 bg-[#8B5E3C] rounded-full" />
                    <span className="ml-1 text-[11px] font-semibold text-[#2C221E]">yozmoqda...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Footer */}
              <div className="p-3 bg-white border-t border-[#E6DEC3]">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Xabar yozing... (Enter orqali yuborish)"
                    className="flex-1 px-4 py-2.5 bg-[#EFE7DD] text-[#2C221E] placeholder-[#8C7A6B] rounded-full text-sm border border-[#E6DEC3] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C] focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 bg-[#8B5E3C] text-white rounded-full hover:bg-[#6E472B] disabled:opacity-40 disabled:hover:bg-[#8B5E3C] transition-all flex-shrink-0 shadow-md shadow-[#8B5E3C]/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8C7A6B] space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#EFE7DD] flex items-center justify-center text-[#8C7A6B]">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2C221E]">Suhbatni tanlang</h3>
                <p className="text-xs text-[#8C7A6B] max-w-xs mt-1">
                  Mavjud suhbatlardan birini tanlang yoki do‘stlaringiz bilan yangi muloqot boshlang.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
