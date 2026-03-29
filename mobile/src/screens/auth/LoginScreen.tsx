import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authApi } from '../../api/auth.api';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { useSocketStore } from '../../store/socket.store';

export function LoginScreen() {
  const navigation = useNavigation<any>();
  const { setAuth } = useAuthStore();
  const { connect } = useSocketStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { user, tokens } = res.data.data;
      await setAuth(user as any, tokens.accessToken, tokens.refreshToken);
      const profileRes = await usersApi.getMe();
      await setAuth(profileRes.data.data, tokens.accessToken, tokens.refreshToken);
      connect();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>▶</Text>
          </View>
          <Text style={styles.logoText}>RIDE-OUT</Text>
        </View>
        <Text style={styles.subtitle}>The community for motorcycle riders</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>
              Don't have an account? <Text style={styles.linkHighlight}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  content: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FF6B00', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  logoIconText: { color: '#fff', fontSize: 20 },
  logoText: { fontSize: 32, fontWeight: '800', color: '#F0F0F0', letterSpacing: 2 },
  subtitle: { textAlign: 'center', color: '#888', marginBottom: 36 },
  form: { gap: 12 },
  label: { color: '#AAAAAA', fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: '#242424', borderWidth: 1, borderColor: '#333', borderRadius: 10, padding: 14, color: '#F0F0F0', fontSize: 16 },
  error: { color: '#f87171', fontSize: 13 },
  button: { backgroundColor: '#FF6B00', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', color: '#888', fontSize: 14, marginTop: 8 },
  linkHighlight: { color: '#FF6B00', fontWeight: '600' },
});
