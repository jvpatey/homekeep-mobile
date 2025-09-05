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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  completedContainer: {
    opacity: 0.7,
  },
  overdueContainer: {
    borderWidth: 2,
    borderColor: "#FF6B6B",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: DesignSystem.spacing.lg,
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
    fontWeight: "600",
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
    fontWeight: "600",
  },
  title: {
    ...DesignSystem.typography.h3,
    fontWeight: "700",
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
    marginLeft: DesignSystem.spacing.xs,
    fontWeight: "500",
  },
  overdueText: {
    fontWeight: "600",
  },
  completeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});

export { CARD_WIDTH };
