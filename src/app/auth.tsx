import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Icon } from '../components/ui/Icon';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [email, password, mode, signIn, signUp]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Icon name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Create account'}</Text>
          <Text style={styles.subtitle}>
            Sign in to back up your farm data and keep it in sync across devices.
          </Text>

          <Input
            label="Email"
            leftIcon="mail-outline"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Password"
            leftIcon="lock-closed-outline"
            placeholder="••••••••"
            secureTextEntry
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Button title={mode === 'signin' ? 'Sign In' : 'Create Account'} fullWidth loading={loading} onPress={onSubmit} style={styles.submit} />

          <TouchableOpacity onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }} style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchLink}>{mode === 'signin' ? 'Create one' : 'Sign in'}</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>Offline changes are queued and sync automatically when you're back online.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    flex: { flex: 1 },
    content: { padding: spacing.xl, paddingTop: spacing.xxxl },
    closeButton: { alignSelf: 'flex-end', marginBottom: spacing.md },
    title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
    error: { ...typography.caption, color: colors.error, marginBottom: spacing.sm },
    submit: { marginTop: spacing.sm },
    switchRow: { alignItems: 'center', marginTop: spacing.lg },
    switchText: { ...typography.bodySmall, color: colors.textSecondary },
    switchLink: { color: colors.primary, fontWeight: '600' },
    note: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
  });
