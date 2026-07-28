/**
 * AniTrack Design Tokens — Color System
 * Modern Agriculture Theme, Material Design 3 inspired.
 */

export const lightColors = {
  primary: "#2E7D32",
  primaryContainer: "#C8E6C9",
  secondary: "#4CAF50",
  success: "#66BB6A",
  warning: "#F9A825",
  error: "#D32F2F",

  background: "#F7F9F4",
  surface: "#FFFFFF",
  surfaceVariant: "#EEF3EA",

  textPrimary: "#1A1A1A",
  textSecondary: "#666666",
  textOnPrimary: "#FFFFFF",
  textDisabled: "#A0A0A0",

  border: "#E0E0E0",
  divider: "#EEEEEE",

  // Status colors used across Crop / Fertilizer / Harvest badges
  statusGrowing: "#4CAF50",
  statusReady: "#F9A825",
  statusHarvested: "#2E7D32",
  statusDelayed: "#D32F2F",

  overlay: "rgba(0,0,0,0.4)",
  skeleton: "#E5E9E2",
} as const;

export const darkColors = {
  primary: "#66BB6A",
  primaryContainer: "#1B4F1E",
  secondary: "#4CAF50",
  success: "#81C784",
  warning: "#FFB74D",
  error: "#EF5350",

  background: "#121212",
  surface: "#1E1E1E",
  surfaceVariant: "#262626",

  textPrimary: "#F2F2F2",
  textSecondary: "#B0B0B0",
  textOnPrimary: "#0A0A0A",
  textDisabled: "#6B6B6B",

  border: "#333333",
  divider: "#2A2A2A",

  statusGrowing: "#66BB6A",
  statusReady: "#FFB74D",
  statusHarvested: "#81C784",
  statusDelayed: "#EF5350",

  overlay: "rgba(0,0,0,0.6)",
  skeleton: "#2C2C2C",
} as const;

export type ColorScheme = typeof lightColors;
export type ThemeMode = "light" | "dark" | "system";
