import { create } from "zustand";
import { Appearance } from "react-native";
import { lightColors, darkColors, ThemeMode, ColorScheme } from "@constants/colors";
import { settingsRepository } from "@database/repositories/settingsRepository";

interface ThemeState {
  mode: ThemeMode;
  resolvedScheme: "light" | "dark";
  colors: ColorScheme;
  setMode: (mode: ThemeMode) => Promise<void>;
  hydrate: () => Promise<void>;
}

function resolveScheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return Appearance.getColorScheme() === "dark" ? "dark" : "light";
  }
  return mode;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "system",
  resolvedScheme: resolveScheme("system"),
  colors: resolveScheme("system") === "dark" ? darkColors : lightColors,

  setMode: async (mode: ThemeMode) => {
    const resolvedScheme = resolveScheme(mode);
    set({
      mode,
      resolvedScheme,
      colors: resolvedScheme === "dark" ? darkColors : lightColors,
    });
    await settingsRepository.set("theme_mode", mode);
  },

  hydrate: async () => {
    const stored = await settingsRepository.get("theme_mode");
    const mode = (stored as ThemeMode) ?? "system";
    const resolvedScheme = resolveScheme(mode);
    set({
      mode,
      resolvedScheme,
      colors: resolvedScheme === "dark" ? darkColors : lightColors,
    });
  },
}));

// Keep in sync with OS-level appearance changes when mode === "system"
Appearance.addChangeListener(() => {
  const { mode } = useThemeStore.getState();
  if (mode === "system") {
    const resolvedScheme = resolveScheme("system");
    useThemeStore.setState({
      resolvedScheme,
      colors: resolvedScheme === "dark" ? darkColors : lightColors,
    });
  }
});
