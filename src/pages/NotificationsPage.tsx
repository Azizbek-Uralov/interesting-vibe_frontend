import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Heart,
  UserPlus,
  Check,
  Clock,
  Trash2,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import { notificationsApi } from '../api/notifications';
import { NotificationItem } from '../types';
import { Avatar } from '../components/common/Avatar';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await notificationsApi.getAll({ limit: 50 });
      setNotifications(res.data);
      setUnreadCount(res.meta.unreadCount || 0);
    } catch {
      // error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'POST_LIKE':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'NEW_FOLLOWER':
      case 'FOLLOW_REQUEST':
        return <UserPlus className="w-4 h-4 text-brand-500" />;
      case 'FOLLOW_ACCEPTED':
        return <Check className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D2]">
        <div>
          <h1 className="text-2xl font-black text-[#2C221E] tracking-tight">
            Bildirishnomalar
          </h1>
          {unreadCount > 0 && (
            <p className="text-xs text-[#8B5E3C] font-bold mt-0.5">
              {unreadCount} ta o‘qilmagan xabar
            </p>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EFE7DD] hover:bg-[#E6DEC3] text-[#2C221E] text-xs font-bold transition-colors shadow-sm"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#8B5E3C]" /> Barchasini o‘qilgan qilish
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B5E3C]" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#EFE7DD] flex items-center justify-center text-[#8C7A6B]">
            <Bell className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-[#2C221E]">Hozircha bildirishnomalar yo‘q</p>
          <p className="text-xs text-[#8C7A6B] mt-1">
            Yangi like va kuzatuvlar haqida bu yerda xabar beramiz
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => {
            const isUnread = !item.readAt;
            return (
              <div
                key={item.id}
                onClick={() => isUnread && handleMarkAsRead(item.id)}
                className={`p-4 rounded-[18px] border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                  isUnread
                    ? 'bg-[#FAF7F2] border-[#8B5E3C]/40 shadow-sm'
                    : 'bg-white border-[#EAE3D2] hover:border-[#E6DEC3]'
                }`}
              >
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className="relative">
                    <Avatar
                      src={item.actor?.avatarUrl}
                      name={item.actor?.fullName || item.actor?.username}
                      size="md"
                    />
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white shadow-sm border border-[#EAE3D2]">
                      {renderIcon(item.type)}
                    </div>
                  </div>

                  <div className="truncate">
                    <p className="text-sm text-[#2C221E] leading-snug">
                      <Link
                        to={`/profile/${item.actor?.username}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold hover:underline text-[#2C221E]"
                      >
                        {item.actor?.fullName || item.actor?.username || 'Foydalanuvchi'}
                      </Link>{' '}
                      <span className="text-[#8C7A6B] font-normal">{item.message}</span>
                    </p>
                    <p className="text-[11px] text-[#8C7A6B]/80 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString('uz-UZ', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.post?.thumbnailUrl && (
                    <Link
                      to={`/post/${item.post.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-10 h-10 rounded-xl overflow-hidden bg-[#F4EFE6] border border-[#E6DEC3] flex-shrink-0"
                    >
                      <img
                        src={item.post.thumbnailUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </Link>
                  )}

                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-2 rounded-full hover:bg-[#C85A5A]/10 text-[#8C7A6B] hover:text-[#C85A5A] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
