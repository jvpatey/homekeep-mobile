import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

export const styles = StyleSheet.create({
  avatarEditWrap: {
    position: "relative",
  },
  editBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: DesignSystem.spacing.md,
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
  actionsCard: {
    marginBottom: DesignSystem.spacing.sm,
  },
  actionsSurface: {
    overflow: "hidden",
    paddingVertical: DesignSystem.spacing.xs,
  },
  householdAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  householdAvatar: {
    borderRadius: 14,
    borderWidth: 1.5,
  },
  householdOverflow: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    marginLeft: 6,
  },
});
