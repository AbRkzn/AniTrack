/**
 * AniTrack Design Tokens — Spacing, Radius, Typography
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  card: 16,
  button: 12,
  input: 12,
  bottomSheet: 24,
  badge: 999,
} as const;

export const typography = {
  fontFamily: {
    regular: "System",
    medium: "System",
    bold: "System",
  },
  heading1: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
  heading2: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  heading3: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  button: { fontSize: 15, fontWeight: "600" as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "500" as const, lineHeight: 16 },
} as const;

export const elevation = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modal: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const touchTarget = {
  minHeight: 48,
  minWidth: 48,
} as const;
