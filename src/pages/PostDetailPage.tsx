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
  UserPlus,
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
        <div className="w-8 h-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-2xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-gray-900">{error || 'Post topilmadi'}</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 rounded-full bg-gray-900 text-white text-xs font-bold"
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Orqaga
      </button>

      {/* Main Post Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Column: Media Player / Carousel */}
        <div className="md:col-span-7 bg-black flex items-center justify-center relative min-h-[420px] max-h-[700px] overflow-hidden">
          {currentMedia ? (
            currentMedia.type === 'VIDEO' ? (
              <video
                src={currentMedia.url}
                controls
                autoPlay
                className="w-full h-full object-contain max-h-[700px]"
              />
            ) : (
              <img
                src={currentMedia.url}
                alt={post.title || 'Media'}
                className="w-full h-full object-contain max-h-[700px]"
              />
            )
          ) : (
            <div className="text-gray-400 text-sm">Media fayl mavjud emas</div>
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
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 backdrop-blur-md shadow-md transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setActiveMediaIndex((prev) =>
                    prev < post.media.length - 1 ? prev + 1 : 0,
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 backdrop-blur-md shadow-md transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 flex gap-1.5 justify-center">
                {post.media.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === activeMediaIndex ? 'bg-white w-4' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Post Details & Author */}
        <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                    isLiked
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{likesCount}</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                  title="Havolani nusxalash"
                >
                  {copySuccess ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>

                {currentMedia && (
                  <a
                    href={currentMedia.url}
                    download={`visual-${post.id}`}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    title="Yuklab olish"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}

                {isOwner && (
                  <button
                    onClick={handleDeletePost}
                    className="p-2 rounded-full hover:bg-rose-50 text-rose-500 transition-colors"
                    title="O‘chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={() => {
                  if (!isAuthenticated) openAuthModal('signin');
                  else setIsCollectionModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saqlash</span>
              </button>
            </div>

            {/* Destination URL */}
            {post.destinationUrl && (
              <a
                href={post.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 underline truncate max-w-full"
              >
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{post.destinationUrl}</span>
              </a>
            )}

            {/* Title & Description */}
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-snug">
                {post.title || 'Sarlavhasiz post'}
              </h1>
              {post.description && (
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                  {post.description}
                </p>
              )}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {post.tags.map((t) => (
                  <Link
                    key={t.id}
                    to={`/explore?q=${encodeURIComponent(t.name)}`}
                    className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors"
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Author Block */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <Link
              to={`/profile/${post.author?.username}`}
              className="flex items-center gap-3 hover:opacity-85 transition-opacity"
            >
              <Avatar
                src={post.author?.avatarUrl}
                name={post.author?.fullName || post.author?.username}
                size="md"
              />
              <div>
                <p className="font-bold text-sm text-gray-900 leading-tight">
                  {post.author?.fullName || post.author?.username}
                </p>
                <p className="text-xs text-gray-400">@{post.author?.username}</p>
              </div>
            </Link>

            {!isOwner && (
              <button
                onClick={handleFollow}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Kuzatildi
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" /> Kuzatish
                  </>
                )}
              </button>
            )}
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
