import { View, ViewProps, StyleSheet } from "react-native";
import { useThemeStore } from "@store/useThemeStore";
import { radius, spacing, elevation } from "@constants/theme";

interface CardProps extends ViewProps {
  padded?: boolean;
}

export function Card({ style, padded = true, children, ...rest }: CardProps) {
  const colors = useThemeStore((s) => s.colors);

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          padding: padded ? spacing.lg : 0,
        },
        elevation.card,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
  },
});
