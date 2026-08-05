import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from '../services/supabase';
import { isSupabaseConfigured } from '../config/supabase';

const GUEST_KEY = 'anitrack.guest_mode';

export interface AuthUser {
  id: string;
  email: string | null;
  fullName: string | null;
}

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  guestMode: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
}

async function readGuestFlag(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(GUEST_KEY)) === 'true';
  } catch {
    return false;
  }
}

async function clearGuestFlag(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GUEST_KEY);
  } catch {
    // ignore
  }
}

export const useAuthStore = create<AuthState>((set) => {
  let unsubscribe: (() => void) | null = null;

  const subscribeToAuth = () => {
    const client = getSupabaseClient();
    if (!client) return;
    unsubscribe?.();
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        set({
          status: 'signedIn',
          user: {
            id: session.user.id,
            email: session.user.email ?? null,
            fullName: session.user.user_metadata?.full_name ?? null,
          },
          guestMode: false,
          error: null,
        });
      }
    });
    unsubscribe = data?.subscription.unsubscribe;
  };

  subscribeToAuth();

  return {
    status: 'loading',
    user: null,
    guestMode: false,
    error: null,

    initialize: async () => {
      const client = getSupabaseClient();
      const guestFlag = await readGuestFlag();
      if (!client) {
        set({ status: 'signedOut', user: null, guestMode: guestFlag });
        return;
      }
      try {
        const { data } = await client.auth.getSession();
        if (data.session?.user) {
          set({
            status: 'signedIn',
            user: {
              id: data.session.user.id,
              email: data.session.user.email ?? null,
              fullName: data.session.user.user_metadata?.full_name ?? null,
            },
            guestMode: false,
          });
          return;
        }
      } catch {
        // fall through to guest / signed out
      }
      set({ status: 'signedOut', user: null, guestMode: guestFlag });
    },

    signIn: async (email, password) => {
      const client = getSupabaseClient();
      if (!client) throw new Error('Cloud sync is not configured.');
      set({ error: null });
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Sign in failed.');
      await clearGuestFlag();
      set({
        status: 'signedIn',
        user: {
          id: data.user.id,
          email: data.user.email ?? null,
          fullName: data.user.user_metadata?.full_name ?? null,
        },
        guestMode: false,
      });
    },

    signUp: async (email, password) => {
      const client = getSupabaseClient();
      if (!client) throw new Error('Cloud sync is not configured.');
      set({ error: null });
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.session) {
        throw new Error('Check your email to confirm your account, then sign in.');
      }
      if (!data.user) throw new Error('Sign up failed.');
      await clearGuestFlag();
      set({
        status: 'signedIn',
        user: {
          id: data.user.id,
          email: data.user.email ?? null,
          fullName: data.user.user_metadata?.full_name ?? null,
        },
        guestMode: false,
      });
    },

    signOut: async () => {
      const client = getSupabaseClient();
      await clearGuestFlag();
      if (client) {
        await client.auth.signOut().catch(() => {});
      }
      set({ status: 'signedOut', user: null, guestMode: false, error: null });
    },

    continueAsGuest: async () => {
      try {
        await AsyncStorage.setItem(GUEST_KEY, 'true');
      } catch {
        // ignore
      }
      set({ status: 'signedIn', user: null, guestMode: true, error: null });
    },
  };
});

export const isAuthConfigured = isSupabaseConfigured;
