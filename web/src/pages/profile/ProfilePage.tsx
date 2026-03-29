import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users.api';
import { postsApi } from '../../api/posts.api';
import { PageSpinner } from '../../components/ui/Spinner';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PostCard } from '../../components/feed/PostCard';
import { useAuthStore } from '../../store/auth.store';

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: me } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOwnProfile = me?.id === userId;

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => usersApi.getProfile(userId!),
    enabled: !!userId,
  });

  const { data: postsData } = useQuery({
    queryKey: ['user-posts', userId],
    queryFn: () => postsApi.getUserPosts(userId!),
    enabled: !!userId,
  });

  const followMutation = useMutation({
    mutationFn: (follow: boolean) =>
      follow ? usersApi.follow(userId!) : usersApi.unfollow(userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
  });

  if (isLoading) return <PageSpinner />;
  const profile = profileData?.data.data;
  if (!profile) return <div className="text-brand-muted text-center py-16">User not found</div>;

  const posts = postsData?.data.data ?? [];

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <Avatar
            src={profile.profile?.avatarUrl}
            name={profile.profile?.displayName}
            size="xl"
          />
          <div className="flex gap-2">
            {isOwnProfile ? (
              <Button size="sm" variant="secondary" onClick={() => navigate('/profile/edit')}>
                Edit profile
              </Button>
            ) : (
              <Button
                size="sm"
                variant={profile.isFollowing ? 'secondary' : 'primary'}
                onClick={() => followMutation.mutate(!profile.isFollowing)}
                loading={followMutation.isPending}
              >
                {profile.isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-brand-text mb-1">
          {profile.profile?.displayName}
        </h1>

        {profile.profile?.location && (
          <p className="text-brand-muted text-sm mb-2 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {profile.profile.location}
          </p>
        )}

        {profile.profile?.bio && (
          <p className="text-brand-text-secondary text-sm mb-3 leading-relaxed">{profile.profile.bio}</p>
        )}

        {profile.profile?.ridingStyle && (
          <Badge variant="orange" className="mb-4">
            {profile.profile.ridingStyle.replace('_', ' ')}
          </Badge>
        )}

        {/* Stats */}
        <div className="flex gap-6 pt-3 border-t border-brand-border">
          <div className="text-center">
            <p className="font-bold text-brand-text">{profile._count.followers}</p>
            <p className="text-xs text-brand-muted">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-brand-text">{profile._count.following}</p>
            <p className="text-xs text-brand-muted">Following</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-brand-text">{profile._count.hostedEvents}</p>
            <p className="text-xs text-brand-muted">Rides hosted</p>
          </div>
        </div>
      </div>

      {/* Bikes */}
      {profile.bikes.length > 0 && (
        <div className="card p-4">
          <p className="text-xs text-brand-muted uppercase tracking-wider mb-3">Bikes</p>
          <div className="space-y-2">
            {profile.bikes.map((bike) => (
              <div key={bike.id} className="flex items-center justify-between">
                <span className="text-brand-text font-medium">
                  {bike.year} {bike.make} {bike.model}
                </span>
                <Badge variant={bike.type === 'OFF_ROAD' ? 'green' : bike.type === 'ON_ROAD' ? 'blue' : 'muted'}>
                  {bike.type.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        <p className="text-xs text-brand-muted uppercase tracking-wider">Posts</p>
        {posts.length === 0 ? (
          <p className="text-brand-muted text-center py-8">No posts yet</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={me?.id}
              onLike={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
}
