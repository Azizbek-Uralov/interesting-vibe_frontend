import React, { useEffect, useState } from 'react';
import { Shield, Users, Layers, Activity, Search, Check, Plus, Loader2 } from 'lucide-react';
import { adminApi, AdminStats } from '../api/admin';
import { UserProfile, UserStatus, Roles } from '../types';
import { Avatar } from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New Category
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catNameUz, setCatNameUz] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameRu, setCatNameRu] = useState('');

  useEffect(() => {
    setIsLoading(true);
    Promise.all([adminApi.getStats(), adminApi.getUsers({ limit: 50 })])
      .then(([statsData, usersData]) => {
        setStats(statsData);
        setUsers(usersData.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await adminApi.getUsers({ search: search.trim() || undefined, limit: 50 });
    setUsers(data.data);
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      await adminApi.updateUserStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)),
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Holatni o‘zgartirishda xatolik.');
    }
  };

  const handleRoleChange = async (userId: string, newRole: Roles) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Rolni o‘zgartirishda xatolik.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameUz) return;

    try {
      await adminApi.createCategory({
        translations: [
          { language: 'UZ', name: catNameUz, slug: catNameUz.toLowerCase().replace(/\s+/g, '-') },
          ...(catNameEn ? [{ language: 'EN', name: catNameEn, slug: catNameEn.toLowerCase().replace(/\s+/g, '-') }] : []),
          ...(catNameRu ? [{ language: 'RU', name: catNameRu, slug: catNameRu.toLowerCase().replace(/\s+/g, '-') }] : []),
        ],
      });
      alert('Kategoriya muvaffaqiyatli yaratildi!');
      setIsCategoryModalOpen(false);
      setCatNameUz('');
      setCatNameEn('');
      setCatNameRu('');
    } catch {
      alert('Kategoriya yaratishda xatolik.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B5E3C]" />
      </div>
    );
  }

  const isSuperAdmin = user?.role === 'SUPERADMIN';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D2]">
        <div>
          <h1 className="text-2xl font-black text-[#2C221E] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#8B5E3C]" />
            Admin Boshqaruv Paneli
          </h1>
          <p className="text-xs text-[#8C7A6B] mt-1">
            Platforma foydalanuvchilari, statistikasi va kategoriyalar boshqaruvi
          </p>
        </div>

        <button
          onClick={() => setIsCategoryModalOpen(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#8B5E3C] hover:bg-[#6E472B] text-white font-bold text-xs shadow-md shadow-[#8B5E3C]/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Yangi Kategoriya
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-[20px] bg-white border border-[#E6DEC3] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EFE7DD] text-[#8B5E3C] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#2C221E]">{stats.users.total}</p>
              <p className="text-xs text-[#8C7A6B] font-semibold">Foydalanuvchilar</p>
            </div>
          </div>

          <div className="p-5 rounded-[20px] bg-white border border-[#E6DEC3] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#2C221E]">{stats.users.active}</p>
              <p className="text-xs text-[#8C7A6B] font-semibold">Faol akkauntlar</p>
            </div>
          </div>

          <div className="p-5 rounded-[20px] bg-white border border-[#E6DEC3] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] text-[#8B5E3C] flex items-center justify-center border border-[#E6DEC3]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#2C221E]">{stats.posts.total}</p>
              <p className="text-xs text-[#8C7A6B] font-semibold">Jami postlar</p>
            </div>
          </div>

          <div className="p-5 rounded-[20px] bg-white border border-[#E6DEC3] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#2C221E]">{stats.sessions.active}</p>
              <p className="text-xs text-[#8C7A6B] font-semibold">Faol sessiyalar</p>
            </div>
          </div>
        </div>
      )}

      {/* Users Management Section */}
      <div className="bg-white rounded-[24px] border border-[#E6DEC3] shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-[#2C221E]">Foydalanuvchilar boshqaruvi</h2>

          <form onSubmit={handleSearchUsers} className="relative">
            <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish (ism, username)..."
              className="pl-10 pr-4 py-2 text-xs rounded-full bg-[#EFE7DD] border border-[#E6DEC3] text-[#2C221E] placeholder-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C] focus:bg-white transition-all"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAE3D2] text-[#8C7A6B] uppercase font-semibold">
                <th className="py-3 px-3">Foydalanuvchi</th>
                <th className="py-3 px-3">Telefon</th>
                <th className="py-3 px-3">Rol</th>
                <th className="py-3 px-3">Holat</th>
                <th className="py-3 px-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3D2]/50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={u.avatarUrl} name={u.fullName || u.username} size="sm" />
                      <div>
                        <p className="font-bold text-[#2C221E]">{u.fullName || u.username}</p>
                        <p className="text-[11px] text-[#8C7A6B]">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[#8C7A6B] font-mono">{u.phone || '—'}</td>
                  <td className="py-3 px-3">
                    {isSuperAdmin && u.id !== user?.id ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as Roles)}
                        className="py-1 px-2 rounded-lg border border-[#E6DEC3] bg-[#FAF7F2] text-[#2C221E] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPERADMIN">SUPERADMIN</option>
                      </select>
                    ) : (
                      <span className="font-bold px-2 py-0.5 rounded-md bg-[#EFE7DD] text-[#2C221E] text-[11px]">
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : u.status === 'SUSPENDED'
                          ? 'bg-rose-50 text-[#C85A5A]'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {u.id !== user?.id && u.role !== 'SUPERADMIN' && (
                      <div className="flex items-center justify-end gap-1.5">
                        {u.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                            className="px-2.5 py-1 rounded-lg text-[#C85A5A] hover:bg-[#C85A5A]/10 font-semibold transition-colors"
                          >
                            Bloklash
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                            className="px-2.5 py-1 rounded-lg text-emerald-700 hover:bg-emerald-50 font-semibold transition-colors"
                          >
                            Faollashtirish
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#E6DEC3] shadow-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-extrabold text-base text-[#2C221E]">Yangi Kategoriya qo‘shish</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#2C221E] mb-1">Nomi (O‘zbekcha)</label>
                <input
                  type="text"
                  required
                  value={catNameUz}
                  onChange={(e) => setCatNameUz(e.target.value)}
                  placeholder="masalan: Dizayn"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E6DEC3] text-[#2C221E] placeholder-[#8C7A6B]/60 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C221E] mb-1">Nomi (Inglizcha)</label>
                <input
                  type="text"
                  value={catNameEn}
                  onChange={(e) => setCatNameEn(e.target.value)}
                  placeholder="masalan: Design"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E6DEC3] text-[#2C221E] placeholder-[#8C7A6B]/60 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C221E] mb-1">Nomi (Ruscha)</label>
                <input
                  type="text"
                  value={catNameRu}
                  onChange={(e) => setCatNameRu(e.target.value)}
                  placeholder="masalan: Дизайн"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E6DEC3] text-[#2C221E] placeholder-[#8C7A6B]/60 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-[#8C7A6B] hover:bg-[#EFE7DD] rounded-full transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-[#8B5E3C] hover:bg-[#6E472B] text-white rounded-full transition-colors shadow-sm"
                >
                  Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
