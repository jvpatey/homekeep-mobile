import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

// Styles for the action buttons section used in the home screen
export const styles = StyleSheet.create({
  buttonContainer: {
    gap: 16,
    marginBottom: 0,
  },
  buttonContent: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: colors.light.primary,
    borderRadius: 16,
    minHeight: 56,
    width: "100%",
    shadowColor: colors.light.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    minHeight: 56,
    borderWidth: 1,
    borderColor: "rgba(46, 196, 182, 0.15)",
    width: "100%",
  },
  secondaryButtonText: {
    color: colors.light.primary,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  footerText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    textAlign: "center",
    fontWeight: "400",
    marginTop: 20,
    letterSpacing: 0.1,
  },
});
