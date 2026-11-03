import React from 'react';
import { Post } from '../../types';
import { PostCard } from './PostCard';

interface MasonryGridProps {
  posts: Post[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  posts,
  isLoading = false,
  emptyMessage = 'Hozircha hech qanday post topilmadi.',
}) => {
  if (isLoading && posts.length === 0) {
    return (
      <div className="masonry-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="masonry-item">
            <div
              className="bg-gray-200 animate-pulse rounded-2xl"
              style={{ height: `${220 + (i % 3) * 80}px` }}
            />
            <div className="mt-2 space-y-1.5">
              <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
              <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
          🔍
        </div>
        <p className="text-gray-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="masonry-grid">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

