import React, { useEffect, useState } from 'react';
import { X, Plus, Bookmark, Check, Loader2 } from 'lucide-react';
import { collectionsApi } from '../../api/collections';
import { Collection } from '../../types';

interface SaveToCollectionModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SaveToCollectionModal: React.FC<SaveToCollectionModalProps> = ({
  postId,
  isOpen,
  onClose,
}) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedCollectionIds, setSavedCollectionIds] = useState<string[]>([]);

  // Create new collection
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      collectionsApi
        .getAll()
        .then((cols) => {
          setCollections(cols);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveToCollection = async (collectionId: string) => {
    try {
      await collectionsApi.addPost(collectionId, postId);
      setSavedCollectionIds((prev) => [...prev, collectionId]);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch {
      // ignore
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await collectionsApi.create({
        name: newCollectionName.trim(),
      });
      await collectionsApi.addPost(created.id, postId);
      setCollections((prev) => [created, ...prev]);
      setSavedCollectionIds((prev) => [...prev, created.id]);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h3 className="font-extrabold text-gray-900 tracking-tight">
            To‘plamga saqlash
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Collections List */}
        <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : collections.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">
              Hozircha to‘plamlaringiz yo‘q. Yangi to‘plam yarating!
            </p>
          ) : (
            collections.map((col) => {
              const isSaved = savedCollectionIds.includes(col.id);
              return (
                <button
                  key={col.id}
                  onClick={() => handleSaveToCollection(col.id)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 border border-gray-100 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                      <Bookmark className="w-5 h-5 text-brand-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 line-clamp-1">
                        {col.name}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {col.itemsCount || 0} ta saqlangan
                      </p>
                    </div>
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isSaved
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 group-hover:bg-brand-500 group-hover:text-white text-gray-700'
                    }`}
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5" /> : 'Saqlash'}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Create New Collection Inline */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Yangi to‘plam yaratish
            </button>
          ) : (
            <form onSubmit={handleCreateCollection} className="space-y-3">
              <input
                type="text"
                autoFocus
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="To‘plam nomi..."
                maxLength={100}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newCollectionName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Yaratilmoqda...' : 'Yaratish va Saqlash'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

