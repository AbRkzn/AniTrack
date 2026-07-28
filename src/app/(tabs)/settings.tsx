import { View, Text, StyleSheet, Pressable } from "react-native";
import { useThemeStore } from "@store/useThemeStore";
import { Card } from "@components/ui/Card";
import { spacing, typography, radius } from "@constants/theme";
import { ThemeMode } from "@constants/colors";

const MODES: ThemeMode[] = ["light", "dark", "system"];

export default function SettingsScreen() {
  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Theme</Text>
        <View style={styles.row}>
          {MODES.map((m) => (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityLabel={`Set theme to ${m}`}
              onPress={() => setMode(m)}
              style={[
                styles.pill,
                {
                  backgroundColor: mode === m ? colors.primary : colors.surfaceVariant,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: mode === m ? colors.textOnPrimary : colors.textSecondary,
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {m}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Backup & Restore</Text>
        <Text style={{ color: colors.textSecondary }}>Available in Phase 7.</Text>
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notifications</Text>
        <Text style={{ color: colors.textSecondary }}>Available in Phase 3.</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  title: {
    fontSize: typography.heading1.fontSize,
    fontWeight: typography.heading1.fontWeight,
  },
  sectionTitle: {
    fontSize: typography.heading3.fontSize,
    fontWeight: typography.heading3.fontWeight,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1,
  },
});
