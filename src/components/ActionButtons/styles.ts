import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

// Styles for the action buttons section used in the home screen
export const styles = StyleSheet.create({
  buttonContainer: {
    gap: 12,
    marginBottom: 0,
  },
  buttonContent: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  primaryButton: {
    borderRadius: 20,
    minHeight: 56,
    width: "100%",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButton: {
    flex: 1,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 56,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  secondaryButtonContainer: {
    borderRadius: 20,
    minHeight: 56,
    width: "100%",
  },
  gradientBorder: {
    borderRadius: 20,
    padding: 1.5,
    width: "100%",
    minHeight: 56,
  },
  secondaryButtonInner: {
    backgroundColor: "transparent",
    borderRadius: 18.5,
    minHeight: 53,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderRadius: 20,
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: "rgba(46, 196, 182, 0.3)",
    width: "100%",
  },
  secondaryButtonText: {
    color: colors.light.primary,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  footerText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    textAlign: "center",
    fontWeight: "400",
    marginTop: 24,
    letterSpacing: 0.1,
  },
});
