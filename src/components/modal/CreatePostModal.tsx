import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  Film,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { mediaApi } from '../../api/media';
import { postsApi } from '../../api/posts';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface MediaItem {
  id: string;
  file: File;
  previewUrl: string;
  type: 'IMAGE' | 'VIDEO';
}

const MAX_MEDIA_COUNT = 8;

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesSelected = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setError(null);
    const incomingFiles = Array.from(selectedFiles);

    const availableSlots = MAX_MEDIA_COUNT - mediaItems.length;
    if (availableSlots <= 0) {
      setError(`Bitta postga ko‘pi bilan ${MAX_MEDIA_COUNT} ta media yuklash mumkin.`);
      return;
    }

    if (incomingFiles.length > availableSlots) {
      setError(
        `Maksimal ${MAX_MEDIA_COUNT} ta fayl yuklashingiz mumkin. Birinchi ${availableSlots} tasi qabul qilindi.`,
      );
    }

    const filesToProcess = incomingFiles.slice(0, availableSlots);
    const newItems: MediaItem[] = filesToProcess.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
    }));

    setMediaItems((prev) => {
      const combined = [...prev, ...newItems];
      if (prev.length === 0) {
        setActiveIndex(0);
      }
      return combined;
    });

    // Inputni tozalash, shunda bir xil faylni qayta tanlash mumkin
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = (indexToRemove: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setMediaItems((prev) => {
      const itemToRemove = prev[indexToRemove];
      if (itemToRemove) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (activeIndex >= updated.length) {
        setActiveIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaItems.length === 0) {
      setError('Iltimos, kamida bitta rasm yoki video tanlang.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setUploadProgress(`Fayllar yuklanmoqda (0/${mediaItems.length})...`);

    try {
      // 1. Fayllarni yuklash (uploadMultiple orqali yoki parallel)
      let uploadResults;
      try {
        const filesToUpload = mediaItems.map((m) => m.file);
        setUploadProgress(`Fayllar serverga yuklanmoqda...`);
        uploadResults = await mediaApi.uploadMultiple(filesToUpload);
      } catch {
        // Fallback: parallel bittalab yuklash
        uploadResults = await Promise.all(
          mediaItems.map((m) => mediaApi.upload(m.file)),
        );
      }

      setUploadProgress('Post yaratilmoqda...');

      // 2. Teglarni ajratish
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // 3. Draft Post yaratish
      const post = await postsApi.create({
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        destinationUrl: destinationUrl.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      // 4. Barcha medialarni postga biriktirish (batch)
      setUploadProgress('Medialar postga biriktirilmoqda...');
      const mediaDtos = uploadResults.map((res) => ({
        type: res.type,
        storageKey: res.storageKey,
        mimeType: res.mimeType,
        fileSize: res.fileSize,
      }));

      try {
        await postsApi.addMediaBatch(post.id, mediaDtos);
      } catch {
        // Fallback: ketma-ket biriktirish
        for (const dto of mediaDtos) {
          await postsApi.addMedia(post.id, dto);
        }
      }

      // 5. Postni e'lon qilish (PUBLISHED)
      setUploadProgress('E’lon qilinmoqda...');
      await postsApi.update(post.id, {
        status: 'PUBLISHED',
      });

      // Tozalash va yopish
      mediaItems.forEach((m) => URL.revokeObjectURL(m.previewUrl));
      setMediaItems([]);
      setTitle('');
      setDescription('');
      setTagsInput('');
      setDestinationUrl('');
      onCreated();
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Post yaratishda xatolik yuz berdi.',
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const activeMedia = mediaItems[activeIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C221E]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#FAF7F2] rounded-[28px] shadow-2xl p-6 sm:p-8 border border-[#E6DEC3] overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D2]">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-[#2C221E] tracking-tight">
              Yangi Pin yaratish
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EFE7DD] text-[#8B5E3C] text-xs font-bold">
              {mediaItems.length} / {MAX_MEDIA_COUNT} ta rasm
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#8C7A6B] hover:text-[#2C221E] hover:bg-[#EFE7DD] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-[14px] bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-xs text-[#C85A5A] font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#C85A5A]" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto mt-4 grid grid-cols-1 md:grid-cols-12 gap-6 pr-1"
        >
          {/* Chap ustun: 8 tagacha Media galereyasi va Preview (5 ustun) */}
          <div className="md:col-span-6 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#2C221E]">
                Media fayllar (Ko‘pi bilan 8 ta)
              </label>
              {mediaItems.length > 0 && mediaItems.length < MAX_MEDIA_COUNT && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs font-bold text-[#8B5E3C] hover:text-[#6E472B] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Yana rasm qo‘shish
                </button>
              )}
            </div>

            {/* Asosiy Katta Ko'rish Ekran (Preview Box) */}
            <div
              className={`min-h-[290px] max-h-[360px] h-[330px] border-2 ${
                mediaItems.length === 0
                  ? 'border-dashed border-[#E6DEC3] hover:border-[#8B5E3C] cursor-pointer'
                  : 'border-solid border-[#E6DEC3]'
              } rounded-[20px] flex flex-col items-center justify-center relative overflow-hidden bg-white group transition-all`}
              onClick={() => {
                if (mediaItems.length === 0) {
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />

              {activeMedia ? (
                <>
                  {activeMedia.type === 'VIDEO' ? (
                    <video
                      src={activeMedia.previewUrl}
                      controls
                      className="absolute inset-0 w-full h-full object-contain bg-[#2C221E] rounded-[18px]"
                    />
                  ) : (
                    <img
                      src={activeMedia.previewUrl}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-contain rounded-[18px]"
                    />
                  )}

                  {/* Yuqori o'ng burchakdagi joriy rasmni o'chirish tugmasi */}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveMedia(activeIndex, e)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-[#C85A5A] hover:text-white text-[#2C221E] shadow-md backdrop-blur-xs transition-all z-10"
                    title="Ushbu rasmni o‘chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Karusel strelkalari (agar bir nechta rasm bo'lsa) */}
                  {mediaItems.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveIndex((prev) =>
                            prev > 0 ? prev - 1 : mediaItems.length - 1,
                          );
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-[#2C221E] shadow-md backdrop-blur-xs transition-all z-10"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveIndex((prev) =>
                            prev < mediaItems.length - 1 ? prev + 1 : 0,
                          );
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-[#2C221E] shadow-md backdrop-blur-xs transition-all z-10"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="space-y-3 p-6 text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#EFE7DD] flex items-center justify-center text-[#8B5E3C] group-hover:scale-110 transition-transform shadow-xs">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#2C221E]">
                      Bir vaqtning o‘zida 8 tagacha rasm yuklang
                    </p>
                    <p className="text-xs text-[#8C7A6B] mt-1">
                      Fayllarni tanlash uchun bu yerga bosing
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-[#8C7A6B] text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-[#8B5E3C]" /> JPEG, PNG, WEBP
                    </span>
                    <span className="flex items-center gap-1">
                      <Film className="w-3.5 h-3.5 text-[#8B5E3C]" /> MP4 Video
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 8 tagacha rasmlar miniatyura (Thumbnails) paneli */}
            {mediaItems.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto py-2 pr-1">
                {mediaItems.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveIndex(idx)}
                      className={`relative w-14 h-14 flex-shrink-0 rounded-[12px] overflow-hidden cursor-pointer transition-all border-2 group ${
                        isActive
                          ? 'border-[#8B5E3C] shadow-md scale-105 ring-2 ring-[#8B5E3C]/30'
                          : 'border-[#E6DEC3] opacity-75 hover:opacity-100 hover:border-[#8B5E3C]'
                      }`}
                    >
                      {item.type === 'VIDEO' ? (
                        <div className="w-full h-full bg-[#2C221E] flex items-center justify-center">
                          <Film className="w-5 h-5 text-white/80" />
                        </div>
                      ) : (
                        <img
                          src={item.previewUrl}
                          alt={`thumb-${idx}`}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Miniatyura raqami (1, 2, ... 8) */}
                      <span className="absolute bottom-0.5 left-0.5 bg-[#2C221E]/80 text-white text-[9px] font-bold px-1 rounded-sm">
                        {idx + 1}
                      </span>

                      {/* O'chirish ikonkasi */}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveMedia(idx, e)}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-[#C85A5A] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="O‘chirish"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {/* Yana rasm qo'shish plyus qutisi */}
                {mediaItems.length < MAX_MEDIA_COUNT && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 flex-shrink-0 rounded-[12px] border-2 border-dashed border-[#E6DEC3] hover:border-[#8B5E3C] hover:bg-[#EFE7DD]/40 flex flex-col items-center justify-center text-[#8C7A6B] hover:text-[#8B5E3C] transition-all"
                    title="Yana rasm qo‘shish"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[9px] font-bold mt-0.5">Qo‘shish</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* O'ng ustun: Sarlavha, Tavsif, Teglar, Havola (6 ustun) */}
          <div className="md:col-span-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2C221E] mb-1.5">
                  Sarlavha
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="G‘oyangiz haqida qiziqarli sarlavha..."
                  maxLength={200}
                  className="w-full px-4 py-2.5 rounded-[14px] bg-white border border-[#E6DEC3] text-sm text-[#2C221E] placeholder-[#8C7A6B]/60 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C221E] mb-1.5">
                  Tavsif
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="G‘oyangiz haqida batafsil ma’lumot yoki tavsif..."
                  maxLength={3000}
                  className="w-full px-4 py-2.5 rounded-[14px] bg-white border border-[#E6DEC3] text-sm text-[#2C221E] placeholder-[#8C7A6B]/60 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C] transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C221E] mb-1.5">
                  Teglar (vergul bilan ajrating)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="tabiat, interyer, san’at, vibe"
                  className="w-full px-4 py-2.5 rounded-[14px] bg-white border border-[#E6DEC3] text-sm text-[#2C221E] placeholder-[#8C7A6B]/60 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C221E] mb-1.5">
                  Tashqi havola (Destination URL)
                </label>
                <input
                  type="url"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 rounded-[14px] bg-white border border-[#E6DEC3] text-sm text-[#2C221E] placeholder-[#8C7A6B]/60 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C] transition-all"
                />
              </div>
            </div>

            {/* Actions & Submit Panel */}
            <div className="pt-4 border-t border-[#EAE3D2] flex items-center justify-between gap-3">
              <span className="text-xs text-[#8C7A6B] font-medium">
                {uploadProgress || `${mediaItems.length} ta media tanlandi`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-[#8C7A6B] hover:text-[#2C221E] hover:bg-[#EFE7DD] transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || mediaItems.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#8B5E3C] hover:bg-[#6E472B] active:scale-95 text-white font-extrabold text-sm shadow-md shadow-[#8B5E3C]/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSubmitting ? 'Chiqarilmoqda...' : 'E’lon qilish'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
