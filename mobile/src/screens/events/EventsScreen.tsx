import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { eventsApi } from '../../api/events.api';
import { formatDateTime } from '@ride-out/shared';
import type { Event } from '@ride-out/shared';

export function EventsScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.list(),
  });

  const joinMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.join(eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  const events = data?.data.data ?? [];

  const renderEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={[styles.badge, item.bikeType === 'OFF_ROAD' ? styles.badgeGreen : styles.badgeBlue]}>
          <Text style={styles.badgeText}>{item.bikeType.replace('_', ' ')}</Text>
        </View>
      </View>
      <Text style={styles.meta}>📅 {formatDateTime(item.startsAt)}</Text>
      <Text style={styles.meta} numberOfLines={1}>📍 {item.meetingPoint}</Text>
      <View style={styles.footer}>
        <Text style={styles.participants}>
          {item._count?.participants ?? 0} riders joining
          {item.maxParticipants ? ` / ${item.maxParticipants}` : ''}
        </Text>
        {!item.isJoined ? (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => joinMutation.mutate(item.id)}
          >
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.joinedBadge}>
            <Text style={styles.joinedText}>Joined ✓</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateEvent')}
      >
        <Text style={styles.createButtonText}>+ Create Ride-Out</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator color="#FF6B00" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          renderItem={renderEvent}
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
            <Text style={styles.empty}>No rides found. Create the first one!</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  createButton: { margin: 12, backgroundColor: '#FF6B00', borderRadius: 10, padding: 14, alignItems: 'center' },
  createButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { backgroundColor: '#242424', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  title: { flex: 1, color: '#F0F0F0', fontWeight: '700', fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  badgeBlue: { backgroundColor: 'rgba(59,130,246,0.2)' },
  badgeGreen: { backgroundColor: 'rgba(34,197,94,0.2)' },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#F0F0F0' },
  meta: { color: '#888', fontSize: 13, marginBottom: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#333' },
  participants: { color: '#888', fontSize: 12 },
  joinButton: { backgroundColor: '#FF6B00', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7 },
  joinButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  joinedBadge: { backgroundColor: 'rgba(34,197,94,0.2)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  joinedText: { color: '#4ade80', fontWeight: '600', fontSize: 13 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
});
