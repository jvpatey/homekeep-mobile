import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

export const styles = StyleSheet.create({
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: "white",
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.lg,
    margin: DesignSystem.spacing.lg,
    maxWidth: 320,
    width: "100%",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  menuAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignSystem.spacing.md,
  },
  menuAvatarInitial: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  menuDivider: {
    height: 1,
    marginVertical: DesignSystem.spacing.md,
  },
  menuActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.sm,
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
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
  },
  signOutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignSystem.spacing.md,
  },
  signOutText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
});
