import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

// styles for the welcome text section
export const styles = StyleSheet.create({
  textContainer: {
    alignItems: "center",
    marginTop: DesignSystem.spacing.lg,
    maxWidth: 280,
    width: "100%",
    paddingHorizontal: DesignSystem.spacing.sm,
  },
  headline: {
    ...DesignSystem.typography.h2,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.md,
    textShadowColor: "rgba(0, 0, 0, 0.05)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    width: "100%",
  },
  subtitle: {
    ...DesignSystem.typography.bodyMedium,
    textAlign: "center",
    opacity: 0.85,
    textShadowColor: "rgba(0, 0, 0, 0.05)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    width: "100%",
  },
});
