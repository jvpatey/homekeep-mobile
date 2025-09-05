import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

// styles for the welcome text section
export const styles = StyleSheet.create({
  textContainer: {
    paddingHorizontal: DesignSystem.spacing.md,
    alignItems: "center",
    alignSelf: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  headline: {
    ...DesignSystem.typography.h2,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.sm,
    textShadowColor: "rgba(0, 0, 0, 0.05)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  subtitle: {
    ...DesignSystem.typography.bodyMedium,
    textAlign: "center",
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.05)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});
