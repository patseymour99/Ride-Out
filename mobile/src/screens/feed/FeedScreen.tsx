import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../../api/posts.api';
import { useAuthStore } from '../../store/auth.store';
import { formatRelativeTime } from '@ride-out/shared';
import type { Post } from '@ride-out/shared';

export function FeedScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['feed'],
    queryFn: () => postsApi.getFeed(),
  });

  const createMutation = useMutation({
    mutationFn: (content: string) => postsApi.create({ content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      setNewPost('');
    },
  });

  const likeMutation = useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      liked ? postsApi.unlike(postId) : postsApi.like(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    await createMutation.mutateAsync(newPost);
    setPosting(false);
  };

  const posts = data?.data.data ?? [];

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.author.profile?.displayName?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.authorName}>{item.author.profile?.displayName}</Text>
          <Text style={styles.timestamp}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
      </View>
      {item.content && <Text style={styles.postContent}>{item.content}</Text>}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => likeMutation.mutate({ postId: item.id, liked: item.isLiked ?? false })}
        >
          <Text style={[styles.actionText, item.isLiked && styles.liked]}>
            ♥ {item._count.likes}
          </Text>
        </TouchableOpacity>
        <Text style={styles.actionText}>💬 {item._count.comments}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Composer */}
      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          placeholder="Share something with the community..."
          placeholderTextColor="#888"
          multiline
          value={newPost}
          onChangeText={setNewPost}
        />
        <TouchableOpacity
          style={[styles.postButton, !newPost.trim() && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={!newPost.trim() || posting}
        >
          {posting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#FF6B00" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={renderPost}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#FF6B00"
              colors={['#FF6B00']}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No posts yet. Follow some riders!</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  composer: { backgroundColor: '#242424', padding: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  composerInput: { backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: '#333', borderRadius: 10, padding: 10, color: '#F0F0F0', minHeight: 60, marginBottom: 8 },
  postButton: { backgroundColor: '#FF6B00', borderRadius: 8, padding: 10, alignItems: 'center', alignSelf: 'flex-end', paddingHorizontal: 20 },
  postButtonDisabled: { opacity: 0.5 },
  postButtonText: { color: '#fff', fontWeight: '700' },
  postCard: { backgroundColor: '#242424', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#333' },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FF6B00', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  authorName: { color: '#F0F0F0', fontWeight: '600', fontSize: 14 },
  timestamp: { color: '#888', fontSize: 12 },
  postContent: { color: '#F0F0F0', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  postActions: { flexDirection: 'row', gap: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#333' },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: '#888', fontSize: 14 },
  liked: { color: '#FF6B00' },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
});
