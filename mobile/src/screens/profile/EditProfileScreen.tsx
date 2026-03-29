import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const p = user?.profile;

  const [form, setForm] = useState({
    displayName: p?.displayName ?? '',
    bio: p?.bio ?? '',
    location: p?.location ?? '',
    ridingStyle: p?.ridingStyle ?? 'BOTH',
  });
  const [error, setError] = useState('');

  const updateMutation = useMutation({
    mutationFn: () => usersApi.updateMe(form as any),
    onSuccess: async () => {
      const res = await usersApi.getMe();
      setUser(res.data.data);
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      navigation.goBack();
    },
    onError: (err: any) => setError(err.response?.data?.error?.message ?? 'Update failed'),
  });

  const Field = ({ label, value, onChange, ...props }: any) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#888"
        {...props}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content}>
        <Field label="Display name" value={form.displayName} onChange={(v: string) => setForm({ ...form, displayName: v })} placeholder="Your name" />
        <Field label="Bio" value={form.bio} onChange={(v: string) => setForm({ ...form, bio: v })} placeholder="Tell the community about yourself..." multiline numberOfLines={3} />
        <Field label="Location" value={form.location} onChange={(v: string) => setForm({ ...form, location: v })} placeholder="e.g. Manchester, England" />

        <Text style={styles.label}>Riding style</Text>
        <View style={styles.selector}>
          {[
            { value: 'BOTH', label: 'Both' },
            { value: 'ON_ROAD', label: 'On-road' },
            { value: 'OFF_ROAD', label: 'Off-road' },
          ].map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              style={[styles.option, form.ridingStyle === value && styles.optionActive]}
              onPress={() => setForm({ ...form, ridingStyle: value })}
            >
              <Text style={[styles.optionText, form.ridingStyle === value && styles.optionTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save changes</Text>
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
  selector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  option: { flex: 1, backgroundColor: '#242424', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 10, alignItems: 'center' },
  optionActive: { backgroundColor: 'rgba(255,107,0,0.15)', borderColor: '#FF6B00' },
  optionText: { color: '#888', fontWeight: '600', fontSize: 12 },
  optionTextActive: { color: '#FF6B00' },
  error: { color: '#f87171', fontSize: 13 },
  saveButton: { backgroundColor: '#FF6B00', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
