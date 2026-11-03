import React, { useState, useEffect } from 'react';
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Logo & Navigation */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              V
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-gray-950 to-gray-700 bg-clip-text text-transparent hidden sm:inline">
              Visual<span className="text-brand-500">.</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 ml-2">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                location.pathname === '/'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Asosiy</span>
            </Link>

            <Link
              to="/explore"
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                location.pathname === '/explore'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="hidden md:inline">Kashf qilish</span>
            </Link>
          </nav>
        </div>

        {/* Center: Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="G‘oyalar, rasmlar, videolar yoki mualliflarni qidiring..."
              className="w-full pl-11 pr-10 py-2.5 rounded-full bg-gray-100/90 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white border border-transparent transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Right: Actions / Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              {/* Create Post Button */}
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-md shadow-brand-500/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">Yaratish</span>
              </button>

              {/* Messages */}
              <Link
                to="/messages"
                className={`relative p-2.5 rounded-full text-gray-600 hover:bg-gray-100 transition-colors ${
                  location.pathname === '/messages' ? 'bg-gray-100 text-gray-900' : ''
                }`}
                title="Xabarlar"
              >
                <MessageSquare className="w-5 h-5" />
                {totalUnreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative p-2.5 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                title="Bildirishnomalar"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-gray-200 transition-all focus:outline-none"
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
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-40 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-bold text-gray-900 truncate">
                          {user?.fullName || 'Foydalanuvchi'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          @{user?.username || 'user'}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          to={`/profile/${user?.username}`}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-gray-500" />
                          Mening profilim
                        </Link>

                        <Link
                          to="/messages"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-4 h-4 text-gray-500" />
                            Xabarlar
                          </div>
                          {totalUnreadCount > 0 && (
                            <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {totalUnreadCount}
                            </span>
                          )}
                        </Link>

                        <Link
                          to="/collections"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Bookmark className="w-4 h-4 text-gray-500" />
                          To‘plamlarim
                        </Link>

                        {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
                          >
                            <Shield className="w-4 h-4 text-indigo-600" />
                            Admin Panel ({user.role})
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logoutUser();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          Tizimdan chiqish
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
                className="px-4 py-2 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Kirish
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-4 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-md shadow-brand-500/20 active:scale-95 transition-all"
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

