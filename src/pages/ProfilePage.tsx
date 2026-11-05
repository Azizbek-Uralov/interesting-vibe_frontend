import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Lock,
  Edit3,
  Bookmark,
  Grid,
  Check,
  UserPlus,
  BadgeCheck,
  LogOut,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { usersApi } from '../api/users';
import { followsApi } from '../api/follows';
import { collectionsApi } from '../api/collections';
import { UserProfile, Collection } from '../types';
import { Avatar } from '../components/common/Avatar';
import { MasonryGrid } from '../components/feed/MasonryGrid';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, openAuthModal, logoutUser, refreshUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'collections'>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const isMe = currentUser?.username === username;

  const loadProfile = useCallback(async () => {
    if (!username) return;
    setIsLoading(true);
    try {
      const data = await usersApi.getByUsername(username);
      setProfile(data);
      setIsFollowing(data.isFollowing ?? false);
      setEditFullName(data.fullName || '');
      setEditBio(data.bio || '');
      setEditAvatarUrl(data.avatarUrl || '');
      setEditIsPrivate(data.isPrivate ?? false);

      if (isMe) {
        const cols = await collectionsApi.getAll();
        setCollections(cols);
      }
    } catch {
      // not found
    } finally {
      setIsLoading(false);
    }
  }, [username, isMe]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }
    if (!profile) return;

    try {
      if (isFollowing) {
        await followsApi.unfollow(profile.id);
        setIsFollowing(false);
        setProfile((prev) => prev ? { ...prev, followersCount: Math.max(0, prev.followersCount - 1) } : null);
      } else {
        const res = await followsApi.follow(profile.id);
        setIsFollowing(res.status === 'ACCEPTED');
        setProfile((prev) => prev ? { ...prev, followersCount: prev.followersCount + 1 } : null);
      }
    } catch {
      // error
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await usersApi.updateMe({
        fullName: editFullName.trim() || undefined,
        bio: editBio.trim() || undefined,
        avatarUrl: editAvatarUrl.trim() || undefined,
        isPrivate: editIsPrivate,
      });
      await refreshUser();
      await loadProfile();
      setIsEditing(false);
    } catch {
      alert('Profilni yangilashda xatolik yuz berdi.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Rostdan ham akkauntingizni o‘chirish jarayonini boshlamoqchimisiz?')) return;
    try {
      await usersApi.deleteMe();
      alert('Akkauntni o‘chirish so‘rovi qabul qilindi. 30 kun ichida qayta kirib bekor qilishingiz mumkin.');
      logoutUser();
    } catch {
      alert('Xatolik yuz berdi.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#8B5E3C] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-[#2C221E]">Foydalanuvchi topilmadi</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 rounded-full bg-[#8B5E3C] hover:bg-[#6E472B] text-white text-xs font-bold transition-all shadow-md shadow-[#8B5E3C]/20"
        >
          Bosh sahifaga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative group">
          <Avatar
            src={profile.avatarUrl}
            name={profile.fullName || profile.username}
            size="xl"
            className="w-28 h-28 text-3xl shadow-lg ring-4 ring-[#EAE3D2] border-2 border-[#E6DEC3]"
          />
          {profile.isPrivate && (
            <div
              className="absolute bottom-1 right-1 p-1.5 rounded-full bg-[#2C221E] text-[#FAF7F2] shadow"
              title="Yopiq profil"
            >
              <Lock className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-black text-[#2C221E] tracking-tight">
              {profile.fullName || profile.username}
            </h1>
            {profile.isVerified && (
              <BadgeCheck className="w-5 h-5 text-[#8B5E3C] fill-[#8B5E3C] text-white" />
            )}
          </div>
          <p className="text-xs font-bold text-[#8C7A6B]">@{profile.username}</p>
        </div>

        {profile.bio && (
          <p className="text-sm text-[#8C7A6B] max-w-md leading-relaxed whitespace-pre-line">
            {profile.bio}
          </p>
        )}

        {/* Counts Bar */}
        <div className="flex items-center gap-8 py-2">
          <div className="text-center">
            <p className="font-black text-xl text-[#2C221E]">{profile.postsCount || 0}</p>
            <p className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider">
              Postlar
            </p>
          </div>
          <div className="text-center">
            <p className="font-black text-xl text-[#2C221E]">{profile.followersCount || 0}</p>
            <p className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider">
              Kuzatuvchilar
            </p>
          </div>
          <div className="text-center">
            <p className="font-black text-xl text-[#2C221E]">{profile.followingCount || 0}</p>
            <p className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider">
              Kuzatmoqda
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {isMe ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#EFE7DD] hover:bg-[#E6DEC3] text-[#2C221E] text-xs font-bold transition-all shadow-sm"
              >
                <Edit3 className="w-4 h-4 text-[#8B5E3C]" /> Profilni tahrirlash
              </button>
              <button
                onClick={logoutUser}
                className="p-2.5 rounded-full bg-[#EFE7DD] hover:bg-[#C85A5A]/15 text-[#2C221E] hover:text-[#C85A5A] transition-colors shadow-sm"
                title="Chiqish"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleFollowToggle}
                className={`flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-bold shadow-md transition-all ${
                  isFollowing
                    ? 'bg-[#EFE7DD] text-[#2C221E] shadow-none hover:bg-[#E6DEC3]'
                    : 'bg-[#8B5E3C] hover:bg-[#6E472B] text-white shadow-[#8B5E3C]/25'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-4 h-4" /> Kuzatildi
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Kuzatish
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    openAuthModal('signin');
                  } else {
                    navigate(`/messages?userId=${profile.id}`);
                  }
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#EFE7DD] hover:bg-[#E6DEC3] text-[#2C221E] text-xs font-bold transition-all shadow-sm"
                title="Xabar yozish"
              >
                <MessageSquare className="w-4 h-4 text-[#8B5E3C]" />
                Xabar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-6 border-b border-[#EAE3D2] pb-0">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 pb-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'posts'
              ? 'border-[#8B5E3C] text-[#2C221E]'
              : 'border-transparent text-[#8C7A6B] hover:text-[#2C221E]'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Yaratilgan postlar</span>
        </button>

        {isMe && (
          <button
            onClick={() => setActiveTab('collections')}
            className={`flex items-center gap-2 pb-3 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'collections'
                ? 'border-[#8B5E3C] text-[#2C221E]'
                : 'border-transparent text-[#8C7A6B] hover:text-[#2C221E]'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saqlangan to‘plamlar ({collections.length})</span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      {profile.canViewContent === false ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#EFE7DD] flex items-center justify-center text-[#8C7A6B]">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#2C221E] text-sm">Bu akkaunt yopiq (shaxsiy)</h3>
          <p className="text-xs text-[#8C7A6B] max-w-xs mx-auto">
            Foydalanuvchining postlarini ko‘rish uchun unga kuzatish so‘rovini yuboring.
          </p>
        </div>
      ) : activeTab === 'posts' ? (
        <MasonryGrid
          posts={(profile.posts as any) || []}
          emptyMessage="Bu foydalanuvchi hali hech qanday post joylashtirmagan."
        />
      ) : (
        /* Collections Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {collections.map((col) => (
            <div
              key={col.id}
              onClick={() => navigate('/collections')}
              className="group bg-white rounded-[18px] border border-[#E6DEC3] hover:border-[#8B5E3C] overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all"
            >
              <div className="h-36 bg-[#F4EFE6] flex items-center justify-center overflow-hidden">
                {col.coverUrl ? (
                  <img
                    src={col.coverUrl}
                    alt={col.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Bookmark className="w-8 h-8 text-[#8C7A6B]/50" />
                )}
              </div>
              <div className="p-3">
                <p className="font-bold text-sm text-[#2C221E] truncate">{col.name}</p>
                <p className="text-[11px] text-[#8C7A6B]">{col.itemsCount || 0} ta post</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#E6DEC3] shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-4">
            <h3 className="text-lg font-extrabold text-[#2C221E]">Profilni tahrirlash</h3>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#2C221E] mb-1">To‘liq ism</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-white border border-[#E6DEC3] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C221E] mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="O‘zingiz haqingizda..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-white border border-[#E6DEC3] text-[#2C221E] placeholder-[#8C7A6B]/60 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C221E] mb-1">Avatar URL</label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-white border border-[#E6DEC3] text-[#2C221E] placeholder-[#8C7A6B]/60 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#EFE7DD]/40 border border-[#E6DEC3]">
                <div>
                  <p className="text-xs font-bold text-[#2C221E]">Shaxsiy (Yopiq) profil</p>
                  <p className="text-[10px] text-[#8C7A6B]">
                    Faqat siz tasdiqlagan kuzatuvchilar postingizni ko‘radi
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsPrivate}
                  onChange={(e) => setEditIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded text-[#8B5E3C] focus:ring-[#8B5E3C] cursor-pointer accent-[#8B5E3C]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="text-xs text-[#C85A5A] hover:text-[#A74444] font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Akkauntni o‘chirish
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-[#8C7A6B] hover:bg-[#EFE7DD]"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2 rounded-full bg-[#8B5E3C] hover:bg-[#6E472B] text-white text-xs font-bold shadow-md shadow-[#8B5E3C]/20 disabled:opacity-50"
                  >
                    {isSavingProfile ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
