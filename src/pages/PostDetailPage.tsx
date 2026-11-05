import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Bookmark,
  ExternalLink,
  Download,
  Share2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { postsApi } from '../api/posts';
import { likesApi } from '../api/likes';
import { followsApi } from '../api/follows';
import { Post } from '../types';
import { Avatar } from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';
import { SaveToCollectionModal } from '../components/modal/SaveToCollectionModal';

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    postsApi
      .getOne(id)
      .then((data) => {
        setPost(data);
        setIsLiked(data.isLiked ?? false);
        setLikesCount(data.likesCount ?? 0);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Post topilmadi yoki ko‘rish huquqi yo‘q.');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#8B5E3C] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 text-[#C85A5A] flex items-center justify-center text-2xl font-bold">
          !
        </div>
        <h2 className="text-xl font-extrabold text-[#2C221E]">{error || 'Post topilmadi'}</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 rounded-full bg-[#8B5E3C] text-white text-xs font-bold hover:bg-[#6E472B] transition-all"
        >
          Orqaga qaytish
        </button>
      </div>
    );
  }

  const isOwner = user?.id === post.author?.id;
  const currentMedia = post.media?.[activeMediaIndex];

  const handleLike = async () => {
    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }
    try {
      if (isLiked) {
        setIsLiked(false);
        setLikesCount((c) => Math.max(0, c - 1));
        await likesApi.unlike(post.id);
      } else {
        setIsLiked(true);
        setLikesCount((c) => c + 1);
        await likesApi.like(post.id);
      }
    } catch {
      setIsLiked(!isLiked);
      setLikesCount(post.likesCount);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }
    try {
      if (isFollowing) {
        await followsApi.unfollow(post.author.id);
        setIsFollowing(false);
      } else {
        await followsApi.follow(post.author.id);
        setIsFollowing(true);
      }
    } catch {
      // error
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Haqiqatan ham bu postni o‘chirmoqchimisiz?')) return;
    try {
      await postsApi.delete(post.id);
      navigate('/');
    } catch {
      alert('Postni o‘chirishda xatolik yuz berdi.');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownloadMain = () => {
    if (currentMedia?.url) {
      const a = document.createElement('a');
      a.href = currentMedia.url;
      a.download = `vibe-${post.id}-${activeMediaIndex + 1}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#8C7A6B] hover:text-[#2C221E] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Orqaga qaytish
      </button>

      {/* Main Post Card (Pinterest-style 28px rounded box) */}
      <div className="bg-white rounded-[28px] shadow-2xl border border-[#E6DEC3] overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Column: Media Player / Carousel (50%) */}
        <div className="md:col-span-7 bg-[#2C221E] flex items-center justify-center relative min-h-[460px] max-h-[720px] overflow-hidden">
          {currentMedia ? (
            currentMedia.type === 'VIDEO' ? (
              <video
                src={currentMedia.url}
                controls
                autoPlay
                className="w-full h-full object-contain max-h-[720px]"
              />
            ) : (
              <img
                src={currentMedia.url}
                alt={post.title || 'Interesting content'}
                className="w-full h-full object-contain max-h-[720px]"
              />
            )
          ) : (
            <div className="text-[#8C7A6B] text-sm font-medium">Media fayl mavjud emas</div>
          )}

          {/* Carousel Arrows */}
          {post.media.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActiveMediaIndex((prev) =>
                    prev > 0 ? prev - 1 : post.media.length - 1,
                  )
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#FAF7F2]/90 hover:bg-white text-[#2C221E] backdrop-blur-md shadow-md transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setActiveMediaIndex((prev) =>
                    prev < post.media.length - 1 ? prev + 1 : 0,
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#FAF7F2]/90 hover:bg-white text-[#2C221E] backdrop-blur-md shadow-md transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-4 flex gap-1.5 justify-center">
                {post.media.map((_, i) => (
                  <span
                    key={i}
                    className={`h-2 rounded-full transition-all ${
                      i === activeMediaIndex ? 'bg-[#8B5E3C] w-6' : 'bg-white/60 w-2'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Post Details & Actions (50%) */}
        <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white">
          <div className="space-y-6">
            {/* Header: Author & Actions Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D2]">
              {/* Author & Follow */}
              <div className="flex items-center gap-3">
                <Link
                  to={`/profile/${post.author?.username}`}
                  className="flex items-center gap-2.5 hover:opacity-85 transition-opacity"
                >
                  <Avatar
                    src={post.author?.avatarUrl}
                    name={post.author?.fullName || post.author?.username}
                    size="md"
                  />
                  <div>
                    <p className="font-extrabold text-sm text-[#2C221E] leading-tight">
                      {post.author?.fullName || post.author?.username}
                    </p>
                    <p className="text-xs text-[#8C7A6B]">@{post.author?.username}</p>
                  </div>
                </Link>

                {!isOwner && (
                  <button
                    onClick={handleFollow}
                    className={`ml-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      isFollowing
                        ? 'bg-[#EFE7DD] text-[#2C221E] border-transparent'
                        : 'border-[#8B5E3C] text-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-white'
                    }`}
                  >
                    {isFollowing ? 'Kuzatildi' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Top Action Icons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all ${
                    isLiked
                      ? 'bg-[#8B5E3C] text-white shadow-md shadow-[#8B5E3C]/20'
                      : 'bg-[#EFE7DD] hover:bg-[#E6DEC3] text-[#2C221E]'
                  }`}
                  title="Like"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
                  {likesCount > 0 && <span>{likesCount}</span>}
                </button>

                <button
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-full bg-[#EFE7DD] hover:bg-[#E6DEC3] text-[#2C221E] transition-colors"
                  title="Ulashish"
                >
                  {copySuccess ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => {
                    if (!isAuthenticated) openAuthModal('signin');
                    else setIsCollectionModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EFE7DD] hover:bg-[#E6DEC3] text-[#2C221E] font-bold text-xs transition-all"
                  title="To‘plamga saqlash"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Saqlash</span>
                </button>

                {isOwner && (
                  <button
                    onClick={handleDeletePost}
                    className="p-2.5 rounded-full hover:bg-rose-50 text-[#C85A5A] transition-colors"
                    title="O‘chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-3">
              <h1 className="text-2xl font-extrabold text-[#2C221E] tracking-tight leading-snug">
                {post.title || 'Sarlavhasiz post'}
              </h1>
              {post.description && (
                <p className="text-sm text-[#8C7A6B] whitespace-pre-line leading-relaxed">
                  {post.description}
                </p>
              )}
            </div>

            {/* Destination URL */}
            {post.destinationUrl && (
              <a
                href={post.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B5E3C] hover:text-[#6E472B] underline truncate max-w-full"
              >
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{post.destinationUrl}</span>
              </a>
            )}

            {/* Tags (Chips: #EFE7DD fon, #8C7A6B matn) */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {post.tags.map((t) => (
                  <Link
                    key={t.id}
                    to={`/explore?q=${encodeURIComponent(t.name)}`}
                    className="px-3.5 py-1.5 rounded-full bg-[#EFE7DD] hover:bg-[#E6DEC3] text-[#8C7A6B] text-xs font-semibold transition-colors"
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Panel (Download Section) */}
          <div className="pt-6 border-t border-[#EAE3D2] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#8C7A6B] font-medium">
              <span>Media formati: <b>{currentMedia?.type || 'IMAGE'}</b></span>
              <span>Yuqori sifat (HD)</span>
            </div>

            <button
              onClick={handleDownloadMain}
              className="w-full py-3.5 px-6 rounded-full bg-[#8B5E3C] hover:bg-[#6E472B] active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-[#8B5E3C]/25 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Yuklab olish ({currentMedia?.type === 'VIDEO' ? 'Video' : 'Rasm'})</span>
            </button>
          </div>
        </div>
      </div>

      <SaveToCollectionModal
        postId={post.id}
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
      />
    </div>
  );
};
