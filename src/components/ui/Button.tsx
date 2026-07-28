import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps } from "react-native";
import { useThemeStore } from "@store/useThemeStore";
import { radius, spacing, typography, touchTarget } from "@constants/theme";

type Variant = "primary" | "secondary" | "outline";

interface ButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = "primary",
  loading = false,
  fullWidth = false,
  disabled,
  ...rest
}: ButtonProps) {
  const colors = useThemeStore((s) => s.colors);

  const backgroundColor =
    variant === "primary" ? colors.primary : variant === "secondary" ? colors.surfaceVariant : "transparent";
  const textColor = variant === "primary" ? colors.textOnPrimary : colors.primary;
  const borderColor = variant === "outline" ? colors.primary : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || loading }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === "outline" ? 1.5 : 0,
          width: fullWidth ? "100%" : undefined,
          opacity: pressed ? 0.85 : disabled ? 0.5 : 1,
        },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.minHeight,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
  },
});
