import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../../api/posts.api';
import { PostCard } from '../../components/feed/PostCard';
import { PostComposer } from '../../components/feed/PostComposer';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuthStore } from '../../store/auth.store';

export function FeedPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: () => postsApi.getFeed(),
  });

  const createPost = useMutation({
    mutationFn: ({ content, files }: { content: string; files: File[] }) =>
      postsApi.create({ content, photoFiles: files }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const likePost = useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      liked ? postsApi.unlike(postId) : postsApi.like(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const deletePost = useMutation({
    mutationFn: (postId: string) => postsApi.delete(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  if (isLoading) return <PageSpinner />;

  const posts = data?.data.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-2xl font-bold text-brand-text">Feed</h1>
      </div>

      <PostComposer
        onSubmit={(content, files) =>
          createPost.mutateAsync({ content, files })
        }
      />

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-brand-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p className="text-brand-muted text-lg font-medium">No posts yet</p>
          <p className="text-brand-muted/60 text-sm mt-1">Follow other riders or share your first post</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={user?.id}
            onLike={(postId, liked) => likePost.mutate({ postId, liked })}
            onDelete={(postId) => deletePost.mutate(postId)}
          />
        ))
      )}
    </div>
  );
}
