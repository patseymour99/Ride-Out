import React, { useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/auth.store';

interface PostComposerProps {
  onSubmit: (content: string, files: File[]) => Promise<void>;
}

export function PostComposer({ onSubmit }: PostComposerProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;
    setLoading(true);
    try {
      await onSubmit(content, files);
      setContent('');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <Avatar
            src={user?.profile?.avatarUrl}
            name={user?.profile?.displayName}
            size="sm"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share something with the community..."
              rows={3}
              className="input resize-none mb-3"
            />

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {files.map((f, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(f)}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-brand-muted hover:text-brand-text transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])])}
                />
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </label>
              <Button
                type="submit"
                size="sm"
                loading={loading}
                disabled={!content.trim() && files.length === 0}
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
