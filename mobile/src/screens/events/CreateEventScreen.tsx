import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../../api/events.api';

export function CreateEventScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    startsAt: '',
    meetingPoint: '',
    meetingLat: '51.5074',
    meetingLng: '-0.1278',
    bikeType: 'BOTH',
    difficulty: 'INTERMEDIATE',
  });
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      eventsApi.create({
        title: form.title,
        description: form.description || undefined,
        startsAt: new Date(form.startsAt).toISOString(),
        meetingPoint: form.meetingPoint,
        meetingLat: parseFloat(form.meetingLat),
        meetingLng: parseFloat(form.meetingLng),
        bikeType: form.bikeType as any,
        difficulty: form.difficulty as any,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigation.navigate('EventDetail', { eventId: res.data.data.id });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message ?? 'Failed to create event');
    },
  });

  const Field = ({ label, value, onChange, ...props }: any) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChange}
        {...props}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content}>
        <Field label="Title *" value={form.title} onChange={(v: string) => setForm({ ...form, title: v })} placeholder="e.g. Peak District Sunday Blast" />
        <Field label="Description" value={form.description} onChange={(v: string) => setForm({ ...form, description: v })} placeholder="Tell riders what to expect..." multiline numberOfLines={3} />
        <Field label="Start date & time *" value={form.startsAt} onChange={(v: string) => setForm({ ...form, startsAt: v })} placeholder="2025-12-25T10:00" />
        <Field label="Meeting point *" value={form.meetingPoint} onChange={(v: string) => setForm({ ...form, meetingPoint: v })} placeholder="Snake Pass Inn, A57, Sheffield" />
        <Field label="Latitude" value={form.meetingLat} onChange={(v: string) => setForm({ ...form, meetingLat: v })} keyboardType="numeric" />
        <Field label="Longitude" value={form.meetingLng} onChange={(v: string) => setForm({ ...form, meetingLng: v })} keyboardType="numeric" />

        {/* Bike type selector */}
        <Text style={styles.label}>Bike type</Text>
        <View style={styles.selector}>
          {['BOTH', 'ON_ROAD', 'OFF_ROAD'].map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.option, form.bikeType === v && styles.optionActive]}
              onPress={() => setForm({ ...form, bikeType: v })}
            >
              <Text style={[styles.optionText, form.bikeType === v && styles.optionTextActive]}>
                {v.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Create Ride-Out</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  content: { padding: 16, gap: 4 },
  fieldContainer: { marginBottom: 12 },
  label: { color: '#AAAAAA', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#242424', borderWidth: 1, borderColor: '#333', borderRadius: 10, padding: 12, color: '#F0F0F0' },
  selector: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  option: { flex: 1, backgroundColor: '#242424', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 10, alignItems: 'center' },
  optionActive: { backgroundColor: 'rgba(255,107,0,0.15)', borderColor: '#FF6B00' },
  optionText: { color: '#888', fontWeight: '600', fontSize: 12 },
  optionTextActive: { color: '#FF6B00' },
  error: { color: '#f87171', fontSize: 13 },
  submitButton: { backgroundColor: '#FF6B00', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
