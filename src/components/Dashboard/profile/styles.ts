import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

export const styles = StyleSheet.create({
  // Bottom-sheet overlay
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    width: "100%",
  },
  glassOuter: {
    width: "100%",
    borderTopLeftRadius: DesignSystem.borders.radius.glass,
    borderTopRightRadius: DesignSystem.borders.radius.glass,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
  },
  glassInner: {
    borderTopLeftRadius: DesignSystem.borders.radius.glass,
    borderTopRightRadius: DesignSystem.borders.radius.glass,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  haloFill: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetSafeArea: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
  },

  // User identity row
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    ...DesignSystem.typography.h4,
    fontSize: 18,
    marginBottom: 2,
  },
  profileEmail: {
    ...DesignSystem.typography.small,
    fontSize: 14,
    opacity: 0.85,
  },
  householdCard: {
    marginTop: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: DesignSystem.spacing.sm,
  },
  householdCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  householdCardText: {
    flex: 1,
    minWidth: 0,
  },
  householdTitle: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  householdPeople: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
  },
  householdAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  householdAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  householdAvatarLetter: {
    ...DesignSystem.typography.caption,
    fontWeight: "700",
    fontSize: 11,
  },
  householdOverflow: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    marginLeft: 6,
  },

  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: DesignSystem.spacing.sm,
    opacity: 0.6,
  },

  actions: {
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
  },
  menuActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
  },
  menuActionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignSystem.spacing.md,
  },
  menuActionText: {
    ...DesignSystem.typography.bodyMedium,
    flex: 1,
    fontSize: 16,
  },
  menuActionRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  counterBadge: {
    minWidth: 28,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  counterText: {
    ...DesignSystem.typography.captionSemiBold,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
