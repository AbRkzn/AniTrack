import { View, Text, StyleSheet } from "react-native";
import { useThemeStore } from "@store/useThemeStore";
import { radius, spacing, typography } from "@constants/theme";

export type BadgeTone = "growing" | "ready" | "harvested" | "delayed" | "neutral";

const toneKeyMap: Record<BadgeTone, string> = {
  growing: "statusGrowing",
  ready: "statusReady",
  harvested: "statusHarvested",
  delayed: "statusDelayed",
  neutral: "textSecondary",
};

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const colors = useThemeStore((s) => s.colors);
  const color = (colors as Record<string, string>)[toneKeyMap[tone]] ?? colors.textSecondary;

  return (
    <View style={[styles.container, { backgroundColor: `${color}1A`, borderColor: color }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.badge,
    borderWidth: 1,
  },
  label: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
});
