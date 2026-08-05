import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { isSupabaseConfigured } from '../config/supabase';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';

export default function LandingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const status = useAuthStore((s) => s.status);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);

  const onContinueAsGuest = useCallback(() => {
    continueAsGuest()
      .then(() => router.replace('/(tabs)'))
      .catch(() => {});
  }, [continueAsGuest]);

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === 'signedIn') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.logoTile}>
          <Icon name="leaf-outline" size={56} color={colors.primary} />
        </View>
        <Text style={styles.title}>AniTrack</Text>
        <Text style={styles.subtitle}>
          Farm management that works even offline. Sign in to back up and sync your data to the cloud.
        </Text>

        <Button title="Continue as Guest" variant="primary" fullWidth onPress={onContinueAsGuest} style={styles.button} />
        {isSupabaseConfigured && (
          <Button title="Sign In / Create Account" variant="outline" fullWidth onPress={() => router.push('/auth')} style={styles.button} />
        )}
        <Text style={styles.note}>
          {isSupabaseConfigured
            ? 'Your data stays on this device until you sign in.'
            : 'Cloud sync is not configured. You can still use the app offline.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    logoTile: {
      width: 96,
      height: 96,
      borderRadius: 28,
      backgroundColor: colors.primaryFaded,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm },
    subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 },
    button: { marginTop: spacing.md },
    note: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
  });
