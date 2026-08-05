import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Icon } from '../components/ui/Icon';
import { typography, spacing, borderRadius, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { formatPhilippinePhone, isValidPhilippinePhone } from '../utils/helpers';

type AuthMethod = 'email' | 'phone';
type PhoneStep = 'number' | 'otp';
type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const sendPhoneOtp = useAuthStore((s) => s.sendPhoneOtp);
  const verifyPhoneOtp = useAuthStore((s) => s.verifyPhoneOtp);

  const [method, setMethod] = useState<AuthMethod>('email');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('number');
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentPhone, setSentPhone] = useState('');

  const onSubmit = useCallback(async () => {
    if (method === 'email') {
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
      return;
    }

    // Phone flow
    if (phoneStep === 'number') {
      const formatted = formatPhilippinePhone(phone);
      if (!isValidPhilippinePhone(phone)) {
        setError('Enter a valid Philippine mobile number (e.g. 9123456789 or 09123456789).');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await sendPhoneOtp(formatted);
        setSentPhone(formatted);
        setPhoneStep('otp');
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to send OTP.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // OTP verify step
    if (!otp.trim()) {
      setError('Enter the OTP code sent to your phone.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verifyPhoneOtp(sentPhone, otp.trim());
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  }, [method, phoneStep, mode, email, password, phone, otp, sentPhone, signIn, signUp, sendPhoneOtp, verifyPhoneOtp]);

  const title = useMemo(() => {
    if (method === 'email') return mode === 'signin' ? 'Welcome back' : 'Create account';
    return phoneStep === 'number' ? 'Sign in with Phone' : 'Verify OTP';
  }, [method, mode, phoneStep]);

  const subtitle = useMemo(() => {
    if (method === 'email') return 'Sign in to back up your farm data and keep it in sync across devices.';
    return phoneStep === 'number'
      ? 'Enter your Philippine mobile number and we will send you an SMS code.'
      : `We sent a code to ${sentPhone}. Enter it below to sign in.`;
  }, [method, phoneStep, sentPhone]);

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

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Method toggle */}
          <View style={styles.methodToggle}>
            <TouchableOpacity
              style={[styles.methodButton, method === 'email' && styles.methodButtonActive]}
              onPress={() => { setMethod('email'); setPhoneStep('number'); setError(null); }}
            >
              <Text style={[styles.methodButtonText, method === 'email' && styles.methodButtonTextActive]}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodButton, method === 'phone' && styles.methodButtonActive]}
              onPress={() => { setMethod('phone'); setPhoneStep('number'); setError(null); }}
            >
              <Text style={[styles.methodButtonText, method === 'phone' && styles.methodButtonTextActive]}>Phone</Text>
            </TouchableOpacity>
          </View>

          {method === 'email' ? (
            <>
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
            </>
          ) : phoneStep === 'number' ? (
            <Input
              label="Philippine Mobile Number"
              leftIcon="phone-portrait-outline"
              placeholder="9123456789"
              keyboardType="phone-pad"
              autoComplete="tel"
              value={phone}
              onChangeText={setPhone}
            />
          ) : (
            <Input
              label="OTP Code"
              leftIcon="shield-checkmark-outline"
              placeholder="Enter 6-digit code"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <Button title={loading ? 'Please wait...' : (method === 'phone' && phoneStep === 'number' ? 'Send Code' : method === 'phone' && phoneStep === 'otp' ? 'Verify' : mode === 'signin' ? 'Sign In' : 'Create Account')} fullWidth loading={loading} onPress={onSubmit} style={styles.submit} />

          {method === 'email' && (
            <TouchableOpacity onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }} style={styles.switchRow}>
              <Text style={styles.switchText}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.switchLink}>{mode === 'signin' ? 'Create one' : 'Sign in'}</Text>
              </Text>
            </TouchableOpacity>
          )}

          {method === 'phone' && phoneStep === 'otp' && (
            <TouchableOpacity onPress={() => { setPhoneStep('number'); setOtp(''); setError(null); }} style={styles.switchRow}>
              <Text style={styles.switchText}>Change number</Text>
            </TouchableOpacity>
          )}

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
    methodToggle: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    methodButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    methodButtonActive: {
      backgroundColor: colors.primaryFaded,
      borderColor: colors.primary,
    },
    methodButtonText: { ...typography.bodySmall, color: colors.textSecondary },
    methodButtonTextActive: { color: colors.primary, fontWeight: '600' },
  });
