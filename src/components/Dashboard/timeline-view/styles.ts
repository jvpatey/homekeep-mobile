import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

export const timelineStyles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: DesignSystem.spacing.md,
  },
  header: {
    paddingHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
  },
  title: {
    ...DesignSystem.typography.h2,
  },
  subtitle: {
    ...DesignSystem.typography.body,
    marginTop: DesignSystem.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DesignSystem.spacing.xxxl + DesignSystem.spacing.xl,
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
  /** Rounded-square date badge (day + month; taller variant adds year) */
  dateIndicator: {
    width: 52,
    height: 52,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: DesignSystem.spacing.md,
    ...DesignSystem.shadows.softKey,
  },
  dateIndicatorWithYear: {
    height: 58,
  },
  dateNumber: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "700",
  },
  dateMonth: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "600",
  },
  dateBadgeYear: {
    fontSize: 9,
    lineHeight: 11,
    marginTop: 1,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    ...DesignSystem.typography.bodySemiBold,
  },
  taskCount: {
    ...DesignSystem.typography.small,
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
    borderWidth: 2,
    ...DesignSystem.shadows.small,
  },
  timelineConnector: {
    width: 2,
    height: 40,
    marginTop: DesignSystem.spacing.xs,
  },
  taskContent: {
    flex: 1,
    borderRadius: DesignSystem.borders.radius.xlarge,
    padding: DesignSystem.spacing.md,
    ...DesignSystem.shadows.softKey,
  },
  taskHeader: {
    marginBottom: DesignSystem.spacing.sm,
  },
  taskTitle: {
    ...DesignSystem.typography.bodySemiBold,
    marginBottom: DesignSystem.spacing.xs,
  },
  taskMeta: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
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
    textTransform: "capitalize",
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignSystem.borders.radius.small,
  },
  durationText: {
    ...DesignSystem.typography.caption,
    marginLeft: DesignSystem.spacing.xs,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskTime: {
    ...DesignSystem.typography.small,
  },
  completeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    ...DesignSystem.shadows.softAmbient,
  },
  emptyContainer: {
    height: 180,
    marginVertical: DesignSystem.spacing.lg,
    marginHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.xl,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  emptyIconBackground: {
    flex: 1,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    ...DesignSystem.typography.h3,
    marginBottom: DesignSystem.spacing.sm,
    textAlign: "center",
    fontWeight: "700",
  },
  emptySubtitle: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    opacity: 0.8,
  },
});
