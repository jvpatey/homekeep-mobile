import { StyleSheet, Dimensions } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";
import { colors } from "src/theme/colors";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth - 80;

export const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 200,
    borderRadius: DesignSystem.borders.radius.large,
    marginHorizontal: DesignSystem.spacing.md,
    ...DesignSystem.shadows.large,
  },
  completedContainer: {
    opacity: 0.7,
  },
  overdueContainer: {
    borderWidth: 2,
    borderColor: "#FF6B6B",
  },
  gradientBackground: {
    flex: 1,
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: DesignSystem.borders.radius.large,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    marginRight: DesignSystem.spacing.xs,
  },
  categoryText: {
    ...DesignSystem.typography.smallSemiBold,
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: DesignSystem.spacing.xs,
  },
  priorityText: {
    ...DesignSystem.typography.captionSemiBold,
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
  },
  title: {
    ...DesignSystem.typography.h3,
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 2,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  metaInfo: {
    flex: 1,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.xs,
  },
  metaText: {
    ...DesignSystem.typography.small,
    color: "white",
    marginLeft: DesignSystem.spacing.xs,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
  },
  overdueText: {
    color: colors.light.error,
    fontWeight: "600",
  },
  completeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    ...DesignSystem.shadows.medium,
  },
});

export { CARD_WIDTH };
