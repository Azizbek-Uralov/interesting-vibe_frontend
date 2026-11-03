import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Bookmark, ExternalLink, Play, Download } from 'lucide-react';
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
      // Revert on failure
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
      a.download = `visual-${post.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <>
      <div className="masonry-item group relative">
        <div
          onClick={() => navigate(`/post/${post.id}`)}
          className="relative bg-gray-100 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
        >
          {/* Media Content */}
          {mainMedia ? (
            mainMedia.type === 'VIDEO' ? (
              <div className="relative">
                <video
                  src={mainMedia.url}
                  className="w-full object-cover rounded-2xl"
                  muted
                  loop
                  onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                  onMouseLeave={(e) => {
                    const v = e.target as HTMLVideoElement;
                    v.pause();
                    v.currentTime = 0;
                  }}
                />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-1.5 rounded-full text-white pointer-events-none">
                  <Play className="w-3.5 h-3.5 fill-white" />
                </div>
              </div>
            ) : (
              <img
                src={mainMedia.url}
                alt={post.title || 'Visual content'}
                loading="lazy"
                className="w-full object-cover rounded-2xl group-hover:scale-[1.02] transition-transform duration-300"
              />
            )
          ) : (
            <div className="h-48 flex items-center justify-center bg-gray-200 text-gray-400">
              Media yo‘q
            </div>
          )}

          {/* Hover Overlay Controls */}
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-between rounded-2xl pointer-events-none">
            {/* Top Bar: Save Button */}
            <div className="flex justify-end pointer-events-auto">
              <button
                onClick={handleSaveClick}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-md shadow-brand-500/30 active:scale-95 transition-all"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saqlash</span>
              </button>
            </div>

            {/* Bottom Bar: Link & Action Icons */}
            <div className="flex items-center justify-between pointer-events-auto">
              {post.destinationUrl ? (
                <a
                  href={post.destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-gray-800 text-xs font-medium backdrop-blur-md truncate max-w-[140px]"
                >
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{new URL(post.destinationUrl).hostname}</span>
                </a>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-800 backdrop-blur-md shadow-sm active:scale-90 transition-all"
                  title="Yuklab olish"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={handleLike}
                  className={`p-2 rounded-full backdrop-blur-md shadow-sm active:scale-90 transition-all ${
                    isLiked
                      ? 'bg-rose-500 text-white'
                      : 'bg-white/90 hover:bg-white text-gray-800'
                  }`}
                  title="Like"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card Info Below */}
        <div className="mt-2 px-1">
          {post.title && (
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 leading-snug">
              {post.title}
            </h3>
          )}

          <div className="flex items-center justify-between mt-1.5">
            <Link
              to={`/profile/${post.author?.username}`}
              className="flex items-center gap-2 group/author hover:opacity-80 transition-opacity"
            >
              <Avatar
                src={post.author?.avatarUrl}
                name={post.author?.fullName || post.author?.username}
                size="sm"
              />
              <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                {post.author?.fullName || post.author?.username || 'Muallif'}
              </span>
            </Link>

            {likesCount > 0 && (
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
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
