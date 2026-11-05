import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Tag, Users, Grid, Check, UserPlus, X, Loader2 } from 'lucide-react';
import { searchApi, SearchResult } from '../api/search';
import { tagsApi } from '../api/tags';
import { MasonryGrid } from '../components/feed/MasonryGrid';
import { Avatar } from '../components/common/Avatar';
import { followsApi } from '../api/follows';
import { useAuth } from '../context/AuthContext';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const { isAuthenticated, openAuthModal } = useAuth();
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<'all' | 'posts' | 'users' | 'tags'>('all');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Trenddagi teglarni olish
  useEffect(() => {
    tagsApi
      .getAll({ limit: 12 })
      .then((tags) => setTrendingTags(tags))
      .catch(() => {});
  }, []);

  const handleSearch = useCallback(
    async (q: string, type: 'all' | 'posts' | 'users' | 'tags') => {
      if (!q.trim()) {
        setSearchResult(null);
        return;
      }
      setIsLoading(true);
      try {
        const res = await searchApi.search({ q: q.trim(), type, limit: 30 });
        setSearchResult(res);
      } catch {
        // error
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Real-time debounced qidiruv (Enter bosishga hojat yo'q, 300ms kechikish bilan avtomatik izlaydi)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (initialQuery) {
        setSearchTerm(initialQuery);
        handleSearch(initialQuery, activeFilter);
      }
      return;
    }

    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSearchResult(null);
      if (searchParams.get('q')) {
        setSearchParams({}, { replace: true });
      }
      return;
    }

    const debounceTimer = setTimeout(() => {
      setSearchParams({ q: trimmed }, { replace: true });
      handleSearch(trimmed, activeFilter);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, activeFilter, handleSearch]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      handleSearch(searchTerm.trim(), activeFilter);
    }
  };

  const handleTagClick = (tagName: string) => {
    setSearchTerm(tagName);
    setSearchParams({ q: tagName }, { replace: true });
    handleSearch(tagName, activeFilter);
  };

  const handleFollowUser = async (userId: string) => {
    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }

    try {
      if (followingMap[userId]) {
        await followsApi.unfollow(userId);
        setFollowingMap((prev) => ({ ...prev, [userId]: false }));
      } else {
        await followsApi.follow(userId);
        setFollowingMap((prev) => ({ ...prev, [userId]: true }));
      }
    } catch {
      // error
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-[#2C221E] tracking-tight">
          G‘oyalarni kashf qiling
        </h1>
        <p className="text-sm text-[#8C7A6B]">
          Dizayn, texnologiya, san’at va ilhom baxsh etuvchi minglab vizual kontentlar
        </p>

        <form onSubmit={onSearchSubmit} className="relative">
          <Search className="w-5 h-5 text-[#8C7A6B] absolute left-4 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Qidiruv so‘zini kiriting... (yozishingiz bilan real-time qidiradi)"
            className="w-full pl-12 pr-12 py-3 rounded-full bg-[#EFE7DD] text-sm text-[#2C221E] placeholder-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C] focus:bg-white border border-[#E6DEC3] shadow-sm transition-all"
          />
          <div className="absolute right-4 top-3.5 flex items-center gap-1.5">
            {isLoading && (
              <Loader2 className="w-4 h-4 text-[#8B5E3C] animate-spin" />
            )}
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSearchParams({}, { replace: true });
                  setSearchResult(null);
                }}
                className="p-1 rounded-full text-[#8C7A6B] hover:text-[#2C221E] hover:bg-[#E6DEC3] transition-colors"
                title="Tozalash"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {(
            [
              { key: 'all', label: 'Barchasi', icon: Grid },
              { key: 'posts', label: 'Postlar', icon: Grid },
              { key: 'users', label: 'Mualliflar', icon: Users },
              { key: 'tags', label: 'Teglar', icon: Tag },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setActiveFilter(item.key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeFilter === item.key
                    ? 'bg-[#2C221E] text-[#FAF7F2] shadow-sm'
                    : 'bg-[#EFE7DD] text-[#8C7A6B] hover:text-[#2C221E] hover:bg-[#E6DEC3]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trending Tags Section */}
      {!searchTerm && trendingTags.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#2C221E] flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#8B5E3C]" />
            Trenddagi teglar
          </h2>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map((t) => {
              const name = t.translations[0]?.name || 'teg';
              return (
                <button
                  key={t.id}
                  onClick={() => handleTagClick(name)}
                  className="px-4 py-2 rounded-2xl bg-[#EFE7DD] hover:bg-[#E6DEC3] text-[#2C221E] text-xs font-semibold border border-[#E6DEC3] transition-all flex items-center gap-1.5"
                >
                  <span>#{name}</span>
                  <span className="text-[10px] text-[#8C7A6B]">({t.postsCount})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResult && (
        <div className="space-y-8">
          {/* Users Results */}
          {(activeFilter === 'all' || activeFilter === 'users') &&
            searchResult.users &&
            searchResult.users.data.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#2C221E] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#8B5E3C]" />
                  Topilgan mualliflar ({searchResult.users.total})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {searchResult.users.data.map((u) => (
                    <div
                      key={u.id}
                      className="p-4 bg-white rounded-[18px] border border-[#E6DEC3] hover:border-[#8B5E3C] shadow-sm flex items-center justify-between gap-3 transition-all"
                    >
                      <Link
                        to={`/profile/${u.username}`}
                        className="flex items-center gap-3 overflow-hidden"
                      >
                        <Avatar src={u.avatarUrl} name={u.fullName || u.username} size="md" />
                        <div className="truncate">
                          <p className="font-bold text-sm text-[#2C221E] truncate">
                            {u.fullName || u.username}
                          </p>
                          <p className="text-xs text-[#8C7A6B] truncate">@{u.username}</p>
                        </div>
                      </Link>

                      <button
                        onClick={() => handleFollowUser(u.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          followingMap[u.id]
                            ? 'bg-[#EFE7DD] text-[#2C221E]'
                            : 'bg-[#8B5E3C] hover:bg-[#6E472B] text-white shadow-sm shadow-[#8B5E3C]/20'
                        }`}
                      >
                        {followingMap[u.id] ? (
                          <>
                            <Check className="w-3 h-3" /> Kuzatildi
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" /> Kuzatish
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Posts Results */}
          {(activeFilter === 'all' || activeFilter === 'posts') && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#2C221E] flex items-center gap-2">
                <Grid className="w-4 h-4 text-[#8B5E3C]" />
                Topilgan postlar ({searchResult.posts?.total || 0})
              </h3>
              <MasonryGrid
                posts={searchResult.posts?.data || []}
                isLoading={isLoading}
                emptyMessage={`"${searchTerm}" bo‘yicha hech qanday post topilmadi.`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
