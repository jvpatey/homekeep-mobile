import { StyleSheet } from "react-native";

/**
 * Shared styles for authentication screens
 * Provides consistent styling across all auth pages
 */
export const authStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header styles
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  largeTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "400",
    lineHeight: 20,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  // Form styles
  formCard: {
    borderRadius: 16,
    marginBottom: 16,
  },
  formContent: {
    padding: 24,
  },
  compactFormContent: {
    padding: 16,
  },
  input: {
    marginBottom: 8,
    backgroundColor: "transparent",
    fontSize: 16,
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  helperText: {
    marginBottom: 2,
    fontSize: 13,
  },

  // Progress styles
  progressContainer: {
    marginBottom: 14,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    textAlign: "center",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },

  // Button styles
  gradientButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  primaryButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    margin: 0,
  },
  buttonContainer: {
    marginTop: 16,
  },
  buttonContainerWithGap: {
    marginTop: 16,
    gap: 12,
  },
  outlineButton: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  buttonContent: {
    paddingVertical: 8,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  outlineButtonLabel: {
    fontSize: 16,
    fontWeight: "500",
  },

  // Link styles
  linkContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    textAlign: "center",
  },
  link: {
    fontWeight: "600",
  },
  verificationContainer: {
    marginTop: 8,
    alignItems: "center",
  },
  verificationText: {
    fontSize: 14,
    textDecorationLine: "underline",
  },

  // Configuration card styles
  configCard: {
    borderRadius: 16,
    marginBottom: 20,
  },
  configContent: {
    padding: 20,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  configText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  // Status styles
  statusContainer: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    fontSize: 30,
    color: "white",
    fontWeight: "bold",
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  errorMark: {
    fontSize: 30,
    color: "white",
    fontWeight: "bold",
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Footer styles
  footerText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 8,
  },
});
