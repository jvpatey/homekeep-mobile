import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

// Styles for the action buttons section used in the home screen
export const styles = StyleSheet.create({
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: colors.light.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "rgba(46, 196, 182, 0.15)",
  },
  secondaryButtonText: {
    color: colors.light.primary,
    fontSize: 17,
    fontWeight: "600",
  },
  footerText: {
    fontSize: 13,
    color: colors.light.textSecondary,
    textAlign: "center",
    fontWeight: "400",
  },
});
