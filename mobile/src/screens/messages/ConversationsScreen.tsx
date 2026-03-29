import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { messagesApi } from '../../api/messages.api';
import { useAuthStore } from '../../store/auth.store';
import { formatRelativeTime } from '@ride-out/shared';

export function ConversationsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesApi.getConversations,
  });

  const conversations = data?.data.data ?? [];

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color="#FF6B00" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 12, gap: 2 }}
        renderItem={({ item }) => {
          const other = item.participants.find((p) => p.userId !== user?.id);
          return (
            <TouchableOpacity
              style={styles.convItem}
              onPress={() => navigation.navigate('Chat', {
                convId: item.id,
                participantName: other?.user.profile?.displayName ?? 'Rider',
              })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(other?.user.profile?.displayName?.[0] ?? '?').toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{other?.user.profile?.displayName ?? 'Rider'}</Text>
                {item.lastMessage ? (
                  <Text style={styles.preview} numberOfLines={1}>{item.lastMessage.content}</Text>
                ) : null}
              </View>
              {item.lastMessage ? (
                <Text style={styles.time}>{formatRelativeTime(item.lastMessage.createdAt)}</Text>
              ) : null}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No conversations yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
  convItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderRadius: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF6B00', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  info: { flex: 1, minWidth: 0 },
  name: { color: '#F0F0F0', fontWeight: '600', marginBottom: 2 },
  preview: { color: '#888', fontSize: 13 },
  time: { color: '#888', fontSize: 12, flexShrink: 0 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
});
