import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Bookmark, Play, Download, Share2, Layers } from 'lucide-react';
import { Post } from '../../types';
import { Avatar } from '../common/Avatar';
import { likesApi } from '../../api/likes';
import { useAuth } from '../../context/AuthContext';
import { SaveToCollectionModal } from '../modal/SaveToCollectionModal';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? 0);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);

  useEffect(() => {
    setIsLiked(post.isLiked ?? false);
    setLikesCount(post.likesCount ?? 0);
  }, [post.isLiked, post.likesCount]);

  const mainMedia = post.media && post.media.length > 0 ? post.media[0] : null;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

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

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }
    setIsCollectionModalOpen(true);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (mainMedia?.url) {
      const a = document.createElement('a');
      a.href = mainMedia.url;
      a.download = `vibe-${post.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: post.title || undefined, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <>
      <div className="masonry-item group relative">
        <div
          onClick={() => navigate(`/post/${post.id}`)}
          className="relative bg-[#F4EFE6] rounded-[18px] overflow-hidden cursor-pointer shadow-sm hover:shadow-vibe-hover transition-all duration-300"
        >
          {/* Media Content */}
          {mainMedia ? (
            mainMedia.type === 'VIDEO' ? (
              <div className="relative">
                <video
                  src={mainMedia.url}
                  className="w-full object-cover rounded-[18px]"
                  muted
                  loop
                  onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                  onMouseLeave={(e) => {
                    const v = e.target as HTMLVideoElement;
                    v.pause();
                    v.currentTime = 0;
                  }}
                />
                {/* Video Duration Badge & Play Icon */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-bold flex items-center gap-1 pointer-events-none">
                  <Play className="w-3 h-3 fill-white" />
                  <span>Video</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={mainMedia.url}
                  alt={post.title || 'Interesting content'}
                  loading="lazy"
                  className="w-full object-cover rounded-[18px] group-hover:scale-[1.015] transition-transform duration-300"
                />
                {/* 1 dan ortiq media bo'lsa (Karusel badge) */}
                {post.media && post.media.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-white text-[11px] font-bold flex items-center gap-1 pointer-events-none group-hover:opacity-0 transition-opacity">
                    <Layers className="w-3 h-3" />
                    <span>{post.media.length}</span>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="h-48 flex items-center justify-center bg-[#EFE7DD] text-[#8C7A6B] text-xs font-semibold">
              Media mavjud emas
            </div>
          )}

          {/* Hover Overlay Controls (rgba(0,0,0,0.18)) */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3.5 flex flex-col justify-between rounded-[18px] pointer-events-none">
            {/* Top Bar: Save Button */}
            <div className="flex justify-end pointer-events-auto">
              <button
                onClick={handleSaveClick}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#8B5E3C] hover:bg-[#6E472B] text-white font-bold text-xs shadow-md shadow-[#8B5E3C]/30 active:scale-95 transition-all"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saqlash</span>
              </button>
            </div>

            {/* Bottom Bar: Quick Download, Share, Like */}
            <div className="flex items-end justify-between pointer-events-auto">
              {/* Author Badge over image */}
              <Link
                to={`/profile/${post.author?.username}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md py-1 px-2.5 rounded-full text-white hover:bg-black/60 transition-colors"
              >
                <Avatar
                  src={post.author?.avatarUrl}
                  name={post.author?.fullName || post.author?.username}
                  size="sm"
                  className="w-5 h-5 border-0"
                />
                <span className="text-[11px] font-medium truncate max-w-[100px]">
                  {post.author?.fullName || post.author?.username || 'Muallif'}
                </span>
              </Link>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-full bg-[#FAF7F2]/95 hover:bg-white text-[#2C221E] backdrop-blur-md shadow-sm active:scale-90 transition-all"
                  title="Yuklab olish"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-[#FAF7F2]/95 hover:bg-white text-[#2C221E] backdrop-blur-md shadow-sm active:scale-90 transition-all"
                  title="Ulashish"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleLike}
                  className={`p-2 rounded-full backdrop-blur-md shadow-sm active:scale-90 transition-all ${
                    isLiked
                      ? 'bg-[#8B5E3C] text-white'
                      : 'bg-[#FAF7F2]/95 hover:bg-white text-[#2C221E]'
                  }`}
                  title="Like"
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card Info Below */}
        <div className="mt-2.5 px-1">
          {post.title && (
            <h3 className="text-sm font-bold text-[#2C221E] line-clamp-1 leading-snug">
              {post.title}
            </h3>
          )}

          <div className="flex items-center justify-between mt-1">
            <Link
              to={`/profile/${post.author?.username}`}
              className="text-xs text-[#8C7A6B] hover:text-[#2C221E] font-medium transition-colors truncate max-w-[160px]"
            >
              @{post.author?.username || 'user'}
            </Link>

            {likesCount > 0 && (
              <span className="text-[11px] text-[#8C7A6B] flex items-center gap-1 font-medium">
                <Heart className="w-3 h-3 text-[#8B5E3C] fill-[#8B5E3C]" />
                {likesCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <SaveToCollectionModal
        postId={post.id}
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
      />
    </>
  );
};
