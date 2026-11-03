import React, { useState, useRef } from 'react';
import { X, UploadCloud, Film, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { mediaApi } from '../../api/media';
import { postsApi } from '../../api/posts';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setFileType(selectedFile.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Iltimos, rasm yoki video tanlang.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Upload media file to storage
      const uploadResult = await mediaApi.upload(file);

      // 2. Parse tags
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // 3. Create Draft Post
      const post = await postsApi.create({
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        destinationUrl: destinationUrl.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      // 4. Attach media to Post
      await postsApi.addMedia(post.id, {
        type: uploadResult.type,
        storageKey: uploadResult.storageKey,
        mimeType: uploadResult.mimeType,
        fileSize: uploadResult.fileSize,
      });

      // 5. Publish post
      await postsApi.update(post.id, {
        status: 'PUBLISHED',
      });

      // Reset & Done
      setFile(null);
      setPreviewUrl(null);
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Yangi Pin yaratish
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 pr-1">
          {/* Media Uploader / Preview */}
          <div className="flex flex-col">
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Media fayl (Rasm yoki Video)
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-h-[280px] border-2 border-dashed border-gray-200 hover:border-brand-500 rounded-3xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors relative overflow-hidden bg-gray-50 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                fileType === 'VIDEO' ? (
                  <video
                    src={previewUrl}
                    controls
                    className="absolute inset-0 w-full h-full object-contain bg-black rounded-3xl"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-contain rounded-3xl"
                  />
                )
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-brand-50 flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Yuklash uchun bu yerga bosing
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPEG, PNG, WEBP, MP4 (max 20MB / 100MB)
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-gray-400 text-xs">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" /> Rasm
                    </span>
                    <span className="flex items-center gap-1">
                      <Film className="w-3.5 h-3.5" /> Video
                    </span>
                  </div>
                </div>
              )}
            </div>

            {previewUrl && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="mt-2 text-xs font-semibold text-rose-500 hover:text-rose-600 text-center"
              >
                Boshqa fayl tanlash
              </button>
            )}
          </div>

          {/* Details Form */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Sarlavha
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="G‘oyangiz haqida sarlavha..."
                  maxLength={200}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Tavsif
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Batafsil ma’lumot yoki tavsif..."
                  maxLength={3000}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Teglar (vergul bilan ajrating)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="tabiat, dizayn, arxitektura"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Tashqi havola (Destination URL)
                </label>
                <input
                  type="url"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !file}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSubmitting ? 'Chiqarilmoqda...' : 'E’lon qilish'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

