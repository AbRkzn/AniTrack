import { View, Text, StyleSheet } from "react-native";
import { useThemeStore } from "@store/useThemeStore";
import { spacing, typography } from "@constants/theme";

/**
 * Placeholder for Phase 2 — Crop Management Module.
 * Will include search, filters, crop cards, and the
 * multi-step Add Crop wizard described in the UX spec.
 */
export default function CropsScreen() {
  const colors = useThemeStore((s) => s.colors);
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Crops</Text>
      <Text style={{ color: colors.textSecondary }}>
        Crop Management module ships in Phase 2.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  title: { fontSize: typography.heading1.fontSize, fontWeight: typography.heading1.fontWeight, marginBottom: spacing.sm },
});
