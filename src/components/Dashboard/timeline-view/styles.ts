import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";
import { colors } from "src/theme/colors";

export const timelineStyles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: DesignSystem.spacing.lg,
  },
  header: {
    paddingHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
  },
  title: {
    ...DesignSystem.typography.h2,
    color: colors.light.text,
  },
  subtitle: {
    ...DesignSystem.typography.body,
    color: colors.light.textSecondary,
    marginTop: DesignSystem.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DesignSystem.spacing.xxl,
  },
  dateGroup: {
    marginBottom: DesignSystem.spacing.xl,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
  },
  dateIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: DesignSystem.spacing.md,
    ...DesignSystem.shadows.small,
  },
  dateNumber: {
    ...DesignSystem.typography.h4,
    color: colors.light.surface,
    fontWeight: "700",
  },
  dateMonth: {
    ...DesignSystem.typography.caption,
    color: colors.light.surface,
    fontWeight: "600",
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    ...DesignSystem.typography.bodySemiBold,
    color: colors.light.text,
  },
  taskCount: {
    ...DesignSystem.typography.small,
    color: colors.light.textSecondary,
    marginTop: 2,
  },
  taskItem: {
    flexDirection: "row",
    paddingHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  lastTaskItem: {
    marginBottom: 0,
  },
  timelineLine: {
    width: 50,
    alignItems: "center",
    marginRight: DesignSystem.spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.light.primary,
    borderWidth: 2,
    borderColor: colors.light.surface,
    ...DesignSystem.shadows.small,
  },
  timelineConnector: {
    width: 2,
    height: 40,
    backgroundColor: colors.light.border,
    marginTop: DesignSystem.spacing.xs,
  },
  taskContent: {
    flex: 1,
    backgroundColor: colors.light.surface,
    borderRadius: DesignSystem.borders.radius.medium,
    padding: DesignSystem.spacing.md,
    ...DesignSystem.shadows.small,
  },
  taskHeader: {
    marginBottom: DesignSystem.spacing.sm,
  },
  taskTitle: {
    ...DesignSystem.typography.bodySemiBold,
    color: colors.light.text,
    marginBottom: DesignSystem.spacing.xs,
  },
  taskMeta: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.background,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignSystem.borders.radius.small,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: DesignSystem.spacing.xs,
  },
  priorityText: {
    ...DesignSystem.typography.caption,
    color: colors.light.textSecondary,
    textTransform: "capitalize",
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.background,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignSystem.borders.radius.small,
  },
  durationText: {
    ...DesignSystem.typography.caption,
    color: colors.light.textSecondary,
    marginLeft: DesignSystem.spacing.xs,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskTime: {
    ...DesignSystem.typography.small,
    color: colors.light.textSecondary,
  },
  completeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  completedButton: {
    backgroundColor: colors.light.success,
  },
  emptyContainer: {
    height: 160,
    marginVertical: DesignSystem.spacing.md,
    marginHorizontal: DesignSystem.spacing.md,
  },
  emptyGradient: {
    flex: 1,
    borderRadius: DesignSystem.borders.radius.large,
    justifyContent: "center",
    alignItems: "center",
    padding: DesignSystem.spacing.md,
    ...DesignSystem.shadows.medium,
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  emptyIconBackground: {
    flex: 1,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    ...DesignSystem.typography.h3,
    marginTop: DesignSystem.spacing.md,
    textAlign: "center",
    fontWeight: "700",
  },
  emptySubtitle: {
    ...DesignSystem.typography.body,
    marginTop: DesignSystem.spacing.xs,
    textAlign: "center",
    opacity: 0.9,
  },
});
