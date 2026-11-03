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
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  // Inside a collection view
  if (selectedCollection) {
    const posts = selectedCollection.items?.map((item) => item.post) || [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <button
            onClick={() => setSelectedCollection(null)}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" /> Barcha to‘plamlar
          </button>

          <button
            onClick={() => handleDeleteCollection(selectedCollection.id)}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
            title="To‘plamni o‘chirish"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {selectedCollection.name}
          </h1>
          {selectedCollection.description && (
            <p className="text-xs text-gray-500 mt-1">{selectedCollection.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">{posts.length} ta post saqlangan</p>
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
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Mening to‘plamlarim
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            O‘zingizga yoqqan g‘oyalarni to‘plamlarga ajrating
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Yangi to‘plam
        </button>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="p-4 rounded-3xl bg-white border border-gray-100 shadow-lg max-w-md">
          <h3 className="font-bold text-sm text-gray-900 mb-3">Yangi to‘plam yaratish</h3>
          <form onSubmit={handleCreateCollection} className="space-y-3">
            <input
              type="text"
              required
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="To‘plam nomi..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Tavsif (ixtiyoriy)..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-brand-500 text-white rounded-lg hover:bg-brand-600"
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
          <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">Hozircha hech qanday to‘plam yo‘q</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {collections.map((col) => (
            <div
              key={col.id}
              onClick={() => handleOpenCollection(col.id)}
              className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg cursor-pointer transition-all p-3"
            >
              <div className="h-40 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                {col.coverUrl ? (
                  <img
                    src={col.coverUrl}
                    alt={col.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <Bookmark className="w-10 h-10 text-brand-500/40" />
                )}
              </div>
              <div className="mt-3 px-1">
                <p className="font-extrabold text-sm text-gray-900 truncate">{col.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{col.itemsCount || 0} ta post</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
