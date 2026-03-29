import React, { useState } from 'react';
import type { Post } from '@ride-out/shared';
import { formatRelativeTime } from '@ride-out/shared';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { useNavigate } from 'react-router-dom';

interface PostCardProps {
  post: Post;
  onLike: (postId: string, liked: boolean) => void;
  onDelete?: (postId: string) => void;
  currentUserId?: string;
}

export function PostCard({ post, onLike, onDelete, currentUserId }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const navigate = useNavigate();

  return (
    <Card className="p-4">
      {/* Author */}
      <div className="flex items-center justify-between mb-3">
        <button
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          onClick={() => navigate(`/profile/${post.authorId}`)}
        >
          <Avatar
            src={post.author.profile?.avatarUrl}
            name={post.author.profile?.displayName}
            size="sm"
          />
          <div className="text-left">
            <p className="text-sm font-semibold text-brand-text">
              {post.author.profile?.displayName}
            </p>
            <p className="text-xs text-brand-muted">{formatRelativeTime(post.createdAt)}</p>
          </div>
        </button>
        {currentUserId === post.authorId && onDelete && (
          <button
            onClick={() => onDelete(post.id)}
            className="text-brand-muted hover:text-red-400 transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-brand-text text-sm leading-relaxed mb-3 whitespace-pre-line">
          {post.content}
        </p>
      )}

      {/* Photos */}
      {post.photoUrls.length > 0 && (
        <div className={`grid gap-1.5 mb-3 ${post.photoUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.photoUrls.slice(0, 4).map((url, i) => (
            <div key={i} className="relative">
              <img
                src={url}
                alt=""
                className="w-full h-48 object-cover rounded-lg"
              />
              {i === 3 && post.photoUrls.length > 4 && (
                <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">+{post.photoUrls.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-brand-border/50">
        <button
          onClick={() => onLike(post.id, post.isLiked ?? false)}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            post.isLiked ? 'text-brand-orange' : 'text-brand-muted hover:text-brand-orange'
          }`}
        >
          <svg className="w-5 h-5" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{post._count.likes}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post._count.comments}</span>
        </button>
      </div>
    </Card>
  );
}
