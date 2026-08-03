import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useAppStore } from '../store/appStore';
import { colors, ColorScheme, ThemeMode } from './theme';

type Scheme = 'light' | 'dark';

interface ThemeContextValue {
  colors: ColorScheme;
  scheme: Scheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: colors.light,
  scheme: 'light',
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme: ThemeMode = useAppStore((s) => s.settings.theme);
  const systemScheme = useColorScheme();

  const scheme: Scheme =
    theme === 'dark' ? 'dark' : theme === 'system' && systemScheme === 'dark' ? 'dark' : 'light';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: scheme === 'dark' ? colors.dark : colors.light,
      scheme,
      isDark: scheme === 'dark',
    }),
    [scheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
