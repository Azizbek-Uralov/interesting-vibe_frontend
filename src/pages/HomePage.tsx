import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, Users as UsersIcon } from 'lucide-react';
import { feedApi } from '../api/feed';
import { Post } from '../types';
import { MasonryGrid } from '../components/feed/MasonryGrid';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(
    async (pageNum: number, tabType: 'all' | 'following', replace = false) => {
      setIsLoading(true);
      try {
        const res = await feedApi.getFeed({
          page: pageNum,
          limit: 20,
          type: tabType,
        });

        if (replace) {
          setPosts(res.data);
        } else {
          setPosts((prev) => [...prev, ...res.data]);
        }

        setHasMore(pageNum < res.meta.totalPages);
      } catch {
        // error handling
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    setPage(1);
    fetchPosts(1, activeTab, true);
  }, [activeTab, fetchPosts]);

  const handleTabChange = (tab: 'all' | 'following') => {
    if (tab === 'following' && !isAuthenticated) {
      openAuthModal('signin');
      return;
    }
    setActiveTab(tab);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, activeTab, false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feed Filter Tabs */}
      <div className="flex items-center justify-center gap-2.5">
        <button
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-extrabold transition-all ${
            activeTab === 'all'
              ? 'bg-[#2C221E] text-white shadow-md'
              : 'bg-[#EFE7DD] text-[#8C7A6B] hover:text-[#2C221E] hover:bg-[#E6DEC3]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#8B5E3C]" />
          <span>Siz uchun</span>
        </button>

        <button
          onClick={() => handleTabChange('following')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-extrabold transition-all ${
            activeTab === 'following'
              ? 'bg-[#2C221E] text-white shadow-md'
              : 'bg-[#EFE7DD] text-[#8C7A6B] hover:text-[#2C221E] hover:bg-[#E6DEC3]'
          }`}
        >
          <UsersIcon className="w-4 h-4" />
          <span>Kuzatilayotganlar</span>
        </button>
      </div>

      {/* Grid */}
      <MasonryGrid
        posts={posts}
        isLoading={isLoading}
        emptyMessage={
          activeTab === 'following'
            ? 'Siz kuzatayotgan foydalanuvchilar hali hech qanday post joylashtirishmagan.'
            : 'Hozircha ommaviy postlar mavjud emas. Birinchi bo‘lib post joylang!'
        }
      />

      {/* Infinite Scroll / Load More */}
      {hasMore && posts.length > 0 && (
        <div className="py-8 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-full bg-[#EFE7DD] hover:bg-[#E6DEC3] text-[#2C221E] text-xs font-bold transition-all disabled:opacity-50"
          >
            {isLoading ? 'Yuklanmoqda...' : 'Yana yuklash'}
          </button>
        </div>
      )}
    </div>
  );
};
