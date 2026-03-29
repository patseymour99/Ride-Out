import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import { eventsApi } from '../../api/events.api';
import { formatDateTime } from '@ride-out/shared';
import { useAuthStore } from '../../store/auth.store';

export function EventDetailScreen() {
  const route = useRoute<any>();
  const { eventId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.get(eventId),
  });

  const joinMutation = useMutation({
    mutationFn: () => eventsApi.join(eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event', eventId] }),
  });

  const leaveMutation = useMutation({
    mutationFn: () => eventsApi.leave(eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event', eventId] }),
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#FF6B00" />
      </View>
    );
  }

  const event = data?.data.data;
  if (!event) return <View style={styles.centered}><Text style={styles.notFound}>Event not found</Text></View>;

  const isHost = user?.id === event.hostId;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{event.title}</Text>

      {event.description ? (
        <Text style={styles.description}>{event.description}</Text>
      ) : null}

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.infoText}>{formatDateTime(event.startsAt)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoText}>{event.meetingPoint}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🏍️</Text>
          <Text style={styles.infoText}>
            {event.bikeType.replace('_', ' ')} · {event.difficulty}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>👥</Text>
          <Text style={styles.infoText}>
            {event._count?.participants ?? 0} riders joined
            {event.maxParticipants ? ` / ${event.maxParticipants} max` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.hostedBy}>
        <Text style={styles.sectionLabel}>HOSTED BY</Text>
        <Text style={styles.hostName}>{event.host.profile?.displayName}</Text>
      </View>

      {!isHost && (
        <View style={styles.actions}>
          {!event.isJoined ? (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.joinButtonText}>Join Ride-Out</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
            >
              <Text style={styles.leaveButtonText}>Leave Ride-Out</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
  notFound: { color: '#888' },
  title: { fontSize: 24, fontWeight: '800', color: '#F0F0F0', marginBottom: 8 },
  description: { color: '#AAAAAA', fontSize: 14, lineHeight: 21, marginBottom: 16 },
  infoSection: { backgroundColor: '#242424', borderRadius: 12, padding: 14, gap: 10, marginBottom: 16 },
  infoRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  infoIcon: { fontSize: 16 },
  infoText: { color: '#F0F0F0', fontSize: 14, flex: 1 },
  hostedBy: { backgroundColor: '#242424', borderRadius: 12, padding: 14, marginBottom: 16 },
  sectionLabel: { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  hostName: { color: '#F0F0F0', fontWeight: '600', fontSize: 15 },
  actions: { gap: 10 },
  joinButton: { backgroundColor: '#FF6B00', borderRadius: 12, padding: 16, alignItems: 'center' },
  joinButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  leaveButton: { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  leaveButtonText: { color: '#F0F0F0', fontWeight: '700', fontSize: 16 },
});
