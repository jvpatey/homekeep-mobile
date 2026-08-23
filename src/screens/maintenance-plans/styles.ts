import { StyleSheet } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

export const maintenancePlansStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
  },
  backButton: {
    padding: DesignSystem.spacing.sm,
    marginLeft: -DesignSystem.spacing.sm,
    zIndex: 1,
  },
  headerTitle: {
    ...DesignSystem.typography.title2,
    flex: 1,
    textAlign: "center",
  },
  headerRightSpacer: {
    width: 40,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xxxl + 72,
  },
  cardContainer: {
    marginBottom: DesignSystem.spacing.md,
  },
  cardSurface: {
    overflow: "hidden",
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
  },
  planRowText: {
    flex: 1,
  },
  planIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  planTitle: {
    ...DesignSystem.typography.bodySemiBold,
    marginBottom: DesignSystem.spacing.xs,
  },
  planSubtitle: {
    ...DesignSystem.typography.small,
  },
  tagPill: {
    alignSelf: "flex-start",
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignSystem.borders.radius.round,
    marginBottom: DesignSystem.spacing.xs,
  },
  tagPillText: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
  },
  detailBody: {
    ...DesignSystem.typography.body,
    marginBottom: DesignSystem.spacing.lg,
    lineHeight: 24,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: DesignSystem.spacing.sm,
  },
  taskBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  taskRowMain: {
    flex: 1,
  },
  taskTitle: {
    ...DesignSystem.typography.bodyMedium,
    marginBottom: 2,
  },
  taskMeta: {
    ...DesignSystem.typography.small,
  },
  pickIntro: {
    ...DesignSystem.typography.small,
    marginBottom: DesignSystem.spacing.md,
    lineHeight: 20,
  },
  pickActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  pickActionText: {
    ...DesignSystem.typography.smallSemiBold,
  },
  taskRowSelectable: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: DesignSystem.spacing.md,
  },
  taskCheckboxHit: {
    paddingTop: 2,
    paddingRight: DesignSystem.spacing.xs,
  },
  applyFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyButton: {
    borderRadius: DesignSystem.borders.radius.large,
    paddingVertical: DesignSystem.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    ...DesignSystem.typography.bodySemiBold,
  },
});
