import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  MessageSquare,
  Plus,
  Compass,
  Home,
  Bookmark,
  Shield,
  LogOut,
  User as UserIcon,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';
import { notificationsApi } from '../../api/notifications';

interface NavbarProps {
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateModal }) => {
  const { user, isAuthenticated, openAuthModal, logoutUser } = useAuth();
  const { totalUnreadCount } = useChat();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      notificationsApi
        .getAll({ limit: 1, unreadOnly: true })
        .then((res) => {
          setUnreadCount(res.meta.unreadCount || 0);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  // URL o'zgarganda qidiruv maydonini sinxronlashtirish
  useEffect(() => {
    if (location.pathname === '/explore') {
      const q = new URLSearchParams(location.search).get('q') || '';
      setSearchQuery(q);
    }
  }, [location.pathname, location.search]);

  // Real-time debounced qidiruv
  const isTypingRef = useRef(false);
  const handleInputChange = (val: string) => {
    isTypingRef.current = true;
    setSearchQuery(val);
  };

  useEffect(() => {
    if (!isTypingRef.current) return;
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      if (location.pathname === '/explore') {
        navigate('/explore', { replace: true });
      }
      return;
    }

    const timer = setTimeout(() => {
      navigate(`/explore?q=${encodeURIComponent(trimmed)}`, {
        replace: location.pathname === '/explore',
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, navigate, location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#EAE3D2] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Logo & Navigation */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-[#8B5E3C] text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-[#8B5E3C]/20 group-hover:bg-[#6E472B] transition-all">
              <Sparkles className="w-5 h-5 fill-white/20 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-[#2C221E] hidden sm:inline">
              Interesting<span className="text-[#8B5E3C]">-Vibe</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2 ml-1">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-bold transition-all relative ${
                location.pathname === '/'
                  ? 'text-[#2C221E]'
                  : 'text-[#8C7A6B] hover:text-[#2C221E]'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Bosh sahifa</span>
              {location.pathname === '/' && (
                <span className="absolute bottom-[-14px] left-0 right-0 h-0.5 bg-[#8B5E3C] rounded-full" />
              )}
            </Link>

            <Link
              to="/explore"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-bold transition-all relative ${
                location.pathname === '/explore'
                  ? 'text-[#2C221E]'
                  : 'text-[#8C7A6B] hover:text-[#2C221E]'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="hidden md:inline">Kashf qilish</span>
              {location.pathname === '/explore' && (
                <span className="absolute bottom-[-14px] left-0 right-0 h-0.5 bg-[#8B5E3C] rounded-full" />
              )}
            </Link>
          </nav>
        </div>

        {/* Center: Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#8C7A6B] absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="G‘oyalar, rasmlar va videolarni qidiring..."
              className="w-full pl-11 pr-10 py-2.5 rounded-full bg-[#EFE7DD] text-[#2C221E] placeholder-[#8C7A6B] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] focus:bg-white border border-transparent transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleInputChange('')}
                className="absolute right-3.5 text-[#8C7A6B] hover:text-[#2C221E]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Right: Actions & User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              {/* Create (+) Button */}
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#8B5E3C] hover:bg-[#6E472B] active:scale-95 text-white font-bold text-sm shadow-md shadow-[#8B5E3C]/20 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">Yaratish</span>
              </button>

              {/* Collections Button */}
              <Link
                to="/collections"
                className={`p-2.5 rounded-full text-[#2C221E] hover:bg-[#EFE7DD] transition-colors ${
                  location.pathname === '/collections' ? 'bg-[#EFE7DD]' : ''
                }`}
                title="To‘plamlar (Collections)"
              >
                <Bookmark className="w-5 h-5" />
              </Link>

              {/* Messages */}
              <Link
                to="/messages"
                className={`relative p-2.5 rounded-full text-[#2C221E] hover:bg-[#EFE7DD] transition-colors ${
                  location.pathname === '/messages' ? 'bg-[#EFE7DD]' : ''
                }`}
                title="Xabarlar"
              >
                <MessageSquare className="w-5 h-5" />
                {totalUnreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#8B5E3C] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <Link
                to="/notifications"
                className={`relative p-2.5 rounded-full text-[#2C221E] hover:bg-[#EFE7DD] transition-colors ${
                  location.pathname === '/notifications' ? 'bg-[#EFE7DD]' : ''
                }`}
                title="Bildirishnomalar"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#8B5E3C] ring-2 ring-[#FAF7F2]" />
                )}
              </Link>

              {/* Profile Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-[#8B5E3C]/30 transition-all focus:outline-none"
                >
                  <Avatar
                    src={user?.avatarUrl}
                    name={user?.fullName || user?.username}
                    size="md"
                  />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#EAE3D2] py-2 z-40 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-3 border-b border-[#EAE3D2]">
                        <p className="font-bold text-[#2C221E] truncate">
                          {user?.fullName || 'Foydalanuvchi'}
                        </p>
                        <p className="text-xs text-[#8C7A6B] truncate">
                          @{user?.username || 'user'}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          to={`/profile/${user?.username}`}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2C221E] hover:bg-[#FAF7F2] transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-[#8C7A6B]" />
                          Mening profilim
                        </Link>

                        <Link
                          to="/collections"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2C221E] hover:bg-[#FAF7F2] transition-colors"
                        >
                          <Bookmark className="w-4 h-4 text-[#8C7A6B]" />
                          Saqlanganlar
                        </Link>

                        {user?.role === 'SUPERADMIN' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#8B5E3C] font-semibold hover:bg-[#FAF7F2] transition-colors"
                          >
                            <Shield className="w-4 h-4 text-[#8B5E3C]" />
                            Admin panel
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-[#EAE3D2] pt-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logoutUser();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#C85A5A] hover:bg-rose-50 transition-colors font-medium text-left"
                        >
                          <LogOut className="w-4 h-4 text-[#C85A5A]" />
                          Chiqish
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('signin')}
                className="px-4 py-2 rounded-full text-[#2C221E] hover:bg-[#EFE7DD] text-sm font-bold transition-all"
              >
                Kirish
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-4 py-2 rounded-full bg-[#8B5E3C] hover:bg-[#6E472B] active:scale-95 text-white text-sm font-bold shadow-md shadow-[#8B5E3C]/20 transition-all"
              >
                Ro‘yxatdan o‘tish
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
