import { StyleSheet } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

export const completionHistoryStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    paddingTop: 52,
    paddingBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.md,
    position: "relative",
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    position: "absolute",
    top: DesignSystem.spacing.md,
    left: DesignSystem.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroContent: {
    alignItems: "center",
    paddingTop: DesignSystem.spacing.md,
  },
  heroTitle: {
    ...DesignSystem.typography.h1,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
  heroSubtitle: {
    ...DesignSystem.typography.body,
    textAlign: "center",
  },
  routinesList: {
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
  },
  routineItem: {
    borderRadius: DesignSystem.borders.radius.medium,
    padding: DesignSystem.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    ...DesignSystem.shadows.small,
    marginBottom: DesignSystem.spacing.md,
    backgroundColor: "white",
  },
  routineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  routineHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  routineHeaderRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  routineTitle: {
    ...DesignSystem.typography.bodySemiBold,
    fontSize: 18,
    lineHeight: 24,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borders.radius.small,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  categoryText: {
    ...DesignSystem.typography.captionSemiBold,
    fontSize: 12,
    fontWeight: "600",
  },
  progressContainer: {
    marginBottom: DesignSystem.spacing.md,
  },
  progressBar: {
    marginBottom: DesignSystem.spacing.sm,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
  },
  progressText: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
  },
  lastCompletion: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.sm,
  },
  lastCompletionText: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
  },
  instanceDetails: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
    paddingTop: DesignSystem.spacing.md,
  },
  instanceTitle: {
    ...DesignSystem.typography.bodySemiBold,
    marginBottom: DesignSystem.spacing.sm,
    fontSize: 14,
  },
  instanceItem: {
    paddingVertical: DesignSystem.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  instanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  instanceDate: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
  },
  instancePriority: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
  },
  priorityText: {
    ...DesignSystem.typography.caption,
    fontSize: 11,
    textTransform: "capitalize",
  },
  detailText: {
    ...DesignSystem.typography.body,
    fontSize: 14,
  },
  priorityIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: DesignSystem.spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.xxl,
  },
  emptyStateTitle: {
    ...DesignSystem.typography.h2,
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  emptyStateSubtitle: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    opacity: 0.7,
  },
});
