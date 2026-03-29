import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user: me, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const userId = me?.id ?? '';

  const { data, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => usersApi.getProfile(userId),
    enabled: !!userId,
  });

  const profile = data?.data.data;

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color="#FF6B00" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {(profile?.profile?.displayName?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.displayName}>{profile?.profile?.displayName}</Text>
        {profile?.profile?.location ? (
          <Text style={styles.location}>📍 {profile.profile.location}</Text>
        ) : null}
        {profile?.profile?.bio ? (
          <Text style={styles.bio}>{profile.profile.bio}</Text>
        ) : null}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile?._count?.followers ?? 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile?._count?.following ?? 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile?._count?.hostedEvents ?? 0}</Text>
            <Text style={styles.statLabel}>Rides hosted</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Bikes */}
      {profile?.bikes && profile.bikes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY BIKES</Text>
          {profile.bikes.map((bike) => (
            <View key={bike.id} style={styles.bikeRow}>
              <Text style={styles.bikeText}>🏍️ {bike.year} {bike.make} {bike.model}</Text>
              <View style={[styles.bikeBadge, bike.type === 'OFF_ROAD' ? styles.badgeGreen : styles.badgeBlue]}>
                <Text style={styles.badgeText}>{bike.type.replace('_', ' ')}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
  header: { padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333' },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF6B00', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarLargeText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  displayName: { fontSize: 22, fontWeight: '800', color: '#F0F0F0', marginBottom: 4 },
  location: { color: '#888', fontSize: 14, marginBottom: 8 },
  bio: { color: '#AAAAAA', fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  stats: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#F0F0F0' },
  statLabel: { color: '#888', fontSize: 12 },
  editButton: { backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: '#333', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  editButtonText: { color: '#F0F0F0', fontWeight: '600' },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  sectionLabel: { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  bikeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  bikeText: { color: '#F0F0F0', fontSize: 14 },
  bikeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeBlue: { backgroundColor: 'rgba(59,130,246,0.2)' },
  badgeGreen: { backgroundColor: 'rgba(34,197,94,0.2)' },
  badgeText: { color: '#F0F0F0', fontSize: 10, fontWeight: '600' },
  logoutButton: { margin: 16, padding: 14, alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  logoutText: { color: '#f87171', fontWeight: '600' },
});
