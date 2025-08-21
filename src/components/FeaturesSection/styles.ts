import { StyleSheet } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

// Styles for the features section - Updated for modern 2025 design
export const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xl,
  },
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: DesignSystem.spacing.xl,
    gap: DesignSystem.spacing.md,
  },
  featureItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.lg,
    ...DesignSystem.shadows.medium,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
    backgroundColor: "#f0f8f6",
  },
  featureText: {
    ...DesignSystem.typography.captionMedium,
    textAlign: "center",
    color: "#333",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "600",
  },
});
