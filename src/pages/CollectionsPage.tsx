import React, { useEffect, useState, useCallback } from 'react';
import { Bookmark, Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { collectionsApi } from '../api/collections';
import { Collection } from '../types';
import { MasonryGrid } from '../components/feed/MasonryGrid';

export const CollectionsPage: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New Collection Form
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const loadCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await collectionsApi.getAll();
      setCollections(data);
    } catch {
      // error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const handleOpenCollection = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await collectionsApi.getOne(id);
      setSelectedCollection(data);
    } catch {
      alert('To‘plamni ochishda xatolik.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const created = await collectionsApi.create({
        name: newTitle.trim(),
        description: newDesc.trim() || undefined,
      });
      setCollections((prev) => [created, ...prev]);
      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');
    } catch {
      alert('Xatolik yuz berdi.');
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!window.confirm('To‘plamni o‘chirmoqchimisiz?')) return;
    try {
      await collectionsApi.delete(id);
      setCollections((prev) => prev.filter((c) => c.id !== id));
      if (selectedCollection?.id === id) {
        setSelectedCollection(null);
      }
    } catch {
      alert('Xatolik yuz berdi.');
    }
  };

  if (isLoading && collections.length === 0) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B5E3C]" />
      </div>
    );
  }

  // Inside a collection view
  if (selectedCollection) {
    const posts = selectedCollection.items?.map((item) => item.post) || [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D2]">
          <button
            onClick={() => setSelectedCollection(null)}
            className="flex items-center gap-2 text-sm font-bold text-[#8C7A6B] hover:text-[#2C221E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Barcha to‘plamlar
          </button>

          <button
            onClick={() => handleDeleteCollection(selectedCollection.id)}
            className="p-2 text-[#C85A5A] hover:bg-[#C85A5A]/10 rounded-full transition-colors"
            title="To‘plamni o‘chirish"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-black text-[#2C221E] tracking-tight">
            {selectedCollection.name}
          </h1>
          {selectedCollection.description && (
            <p className="text-xs text-[#8C7A6B] mt-1">{selectedCollection.description}</p>
          )}
          <p className="text-xs text-[#8C7A6B] mt-1">{posts.length} ta post saqlangan</p>
        </div>

        <MasonryGrid
          posts={posts}
          emptyMessage="Bu to‘plamda hali postlar saqlanmagan."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#2C221E] tracking-tight">
            Mening to‘plamlarim
          </h1>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            O‘zingizga yoqqan g‘oyalarni to‘plamlarga ajrating
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#8B5E3C] hover:bg-[#6E472B] text-white font-bold text-xs shadow-md shadow-[#8B5E3C]/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Yangi to‘plam
        </button>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="p-5 rounded-[24px] bg-[#FAF7F2] border border-[#E6DEC3] shadow-xl max-w-md">
          <h3 className="font-bold text-sm text-[#2C221E] mb-3">Yangi to‘plam yaratish</h3>
          <form onSubmit={handleCreateCollection} className="space-y-3">
            <input
              type="text"
              required
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="To‘plam nomi..."
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-white border border-[#E6DEC3] text-[#2C221E] placeholder-[#8C7A6B]/60 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C]"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Tavsif (ixtiyoriy)..."
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-white border border-[#E6DEC3] text-[#2C221E] placeholder-[#8C7A6B]/60 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C]"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-1.5 text-xs font-semibold text-[#8C7A6B] hover:bg-[#EFE7DD] rounded-full transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 text-xs font-bold bg-[#8B5E3C] hover:bg-[#6E472B] text-white rounded-full transition-colors shadow-sm"
              >
                Yaratish
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#EFE7DD] flex items-center justify-center text-[#8C7A6B]">
            <Bookmark className="w-8 h-8" />
          </div>
          <p className="text-[#2C221E] font-bold text-sm">Hozircha hech qanday to‘plam yo‘q</p>
          <p className="text-xs text-[#8C7A6B] mt-1">Yoqtirgan postlaringizni to‘plamlarga saqlang</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {collections.map((col) => (
            <div
              key={col.id}
              onClick={() => handleOpenCollection(col.id)}
              className="group bg-white rounded-[18px] border border-[#E6DEC3] hover:border-[#8B5E3C] overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all p-3"
            >
              <div className="h-40 bg-[#F4EFE6] rounded-[14px] flex items-center justify-center overflow-hidden">
                {col.coverUrl ? (
                  <img
                    src={col.coverUrl}
                    alt={col.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Bookmark className="w-10 h-10 text-[#8B5E3C]/40" />
                )}
              </div>
              <div className="mt-3 px-1">
                <p className="font-extrabold text-sm text-[#2C221E] truncate">{col.name}</p>
                <p className="text-[11px] text-[#8C7A6B] mt-0.5">{col.itemsCount || 0} ta post</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
