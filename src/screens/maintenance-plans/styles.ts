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
  listScroll: {
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  listIntro: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    marginBottom: DesignSystem.spacing.lg,
  },
  cardContainer: {
    marginBottom: DesignSystem.spacing.md,
  },
  cardSurface: {
    overflow: "hidden",
  },
  planRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
  },
  planRowText: {
    flex: 1,
    minWidth: 0,
  },
  planIconBubble: {
    width: 44,
    height: 44,
    borderRadius: DesignSystem.borders.radius.medium,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  planTitle: {
    ...DesignSystem.typography.callout,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.xs,
  },
  planSubtitle: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
  },
  planCaption: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    marginTop: DesignSystem.spacing.sm,
  },
  tagPill: {
    alignSelf: "flex-start",
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: DesignSystem.spacing.xs,
  },
  tagPillText: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.xs,
    marginBottom: DesignSystem.spacing.xs,
  },
  suggestedPill: {
    alignSelf: "flex-start",
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  suggestedPillText: {
    ...DesignSystem.typography.caption,
    fontWeight: "700",
  },
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
  },
  profileBannerText: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
    flex: 1,
  },
  alreadyScheduled: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    marginTop: DesignSystem.spacing.xs,
  },
  chevron: {
    marginTop: DesignSystem.spacing.sm,
  },
  pickerScroll: {
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  pickIntro: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.md,
    lineHeight: 20,
  },
  pickCount: {
    ...DesignSystem.typography.callout,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.md,
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
  categoryHeader: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md,
  },
  taskRowSelectable: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
  },
  taskCheckboxHit: {
    paddingTop: 2,
  },
  taskRowMain: {
    flex: 1,
    minWidth: 0,
  },
  taskTitle: {
    ...DesignSystem.typography.bodyMedium,
    marginBottom: 2,
  },
  taskMeta: {
    ...DesignSystem.typography.caption,
  },
  taskDescription: {
    ...DesignSystem.typography.caption,
    lineHeight: 18,
    marginTop: DesignSystem.spacing.xs,
  },
  applyFooter: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  emptyState: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.xxxl,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  emptyTitle: {
    ...DesignSystem.typography.h3,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
  emptySubtext: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: DesignSystem.spacing.xl,
  },
  emptyAction: {
    alignSelf: "stretch",
    maxWidth: 280,
  },
  questionnaireIntro: {
    ...DesignSystem.typography.body,
    marginBottom: DesignSystem.spacing.lg,
    lineHeight: 22,
  },
  warningHint: {
    ...DesignSystem.typography.footnote,
    marginTop: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
    lineHeight: 20,
  },
});
