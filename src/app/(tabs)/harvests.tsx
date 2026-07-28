import { View, Text, StyleSheet } from "react-native";
import { useThemeStore } from "@store/useThemeStore";
import { spacing, typography } from "@constants/theme";

export default function HarvestsScreen() {
  const colors = useThemeStore((s) => s.colors);
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Harvests</Text>
      <Text style={{ color: colors.textSecondary }}>
        This module ships in a later phase per the roadmap.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  title: { fontSize: typography.heading1.fontSize, fontWeight: typography.heading1.fontWeight, marginBottom: spacing.sm },
});
