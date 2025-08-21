import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

/**
 * Shared styles for authentication screens - Updated for modern 2025 design
 * Provides consistent styling across all auth pages matching the dashboard
 */
export const authStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header styles
  headerContainer: {
    alignItems: "center",
    marginBottom: DesignSystem.spacing.xl,
  },
  title: {
    ...DesignSystem.typography.h2,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
  largeTitle: {
    ...DesignSystem.typography.h1,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
  subtitle: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.xs,
  },
  email: {
    ...DesignSystem.typography.smallSemiBold,
    textAlign: "center",
  },

  // Form styles
  formCard: {
    borderRadius: DesignSystem.borders.radius.large,
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.medium,
  },
  formContent: {
    padding: DesignSystem.spacing.lg,
  },
  compactFormContent: {
    padding: DesignSystem.spacing.md,
  },
  input: {
    marginBottom: DesignSystem.spacing.sm,
    backgroundColor: "transparent",
    fontSize: DesignSystem.typography.body.fontSize,
  },
  errorText: {
    ...DesignSystem.typography.caption,
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm,
  },
  helperText: {
    marginBottom: DesignSystem.spacing.xs,
    ...DesignSystem.typography.caption,
  },

  // Progress styles
  progressContainer: {
    marginBottom: DesignSystem.spacing.sm,
  },
  progressLabel: {
    ...DesignSystem.typography.captionMedium,
    marginBottom: DesignSystem.spacing.xs,
    textAlign: "center",
  },
  progressBar: {
    height: 4,
    borderRadius: DesignSystem.borders.radius.small,
  },

  // Button styles
  gradientButton: {
    borderRadius: DesignSystem.borders.radius.large,
    overflow: "hidden",
    ...DesignSystem.shadows.medium,
  },
  primaryButton: {
    backgroundColor: "transparent",
    borderRadius: DesignSystem.borders.radius.large,
    margin: 0,
  },
  buttonContainer: {
    marginTop: DesignSystem.spacing.md,
  },
  buttonContainerWithGap: {
    marginTop: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
  },
  outlineButton: {
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: DesignSystem.borders.widthThick,
  },
  buttonContent: {
    paddingVertical: DesignSystem.spacing.sm,
    height: DesignSystem.components.buttonLarge,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonLabel: {
    ...DesignSystem.typography.button,
    letterSpacing: 0.5,
  },
  outlineButtonLabel: {
    ...DesignSystem.typography.button,
    fontWeight: "500",
  },

  // Link styles
  linkContainer: {
    marginTop: DesignSystem.spacing.lg,
    alignItems: "center",
  },
  linkText: {
    ...DesignSystem.typography.small,
    textAlign: "center",
  },
  link: {
    fontWeight: "600",
  },
  verificationContainer: {
    marginTop: DesignSystem.spacing.sm,
    alignItems: "center",
  },
  verificationText: {
    ...DesignSystem.typography.small,
    textDecorationLine: "underline",
  },

  // Configuration card styles
  configCard: {
    borderRadius: DesignSystem.borders.radius.large,
    marginBottom: DesignSystem.spacing.lg,
    ...DesignSystem.shadows.medium,
  },
  configContent: {
    padding: DesignSystem.spacing.lg,
  },
  configTitle: {
    ...DesignSystem.typography.h4,
    marginBottom: DesignSystem.spacing.sm,
    textAlign: "center",
  },
  configText: {
    ...DesignSystem.typography.small,
    textAlign: "center",
  },

  // Status styles
  statusContainer: {
    marginTop: DesignSystem.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    ...DesignSystem.shadows.medium,
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
    ...DesignSystem.shadows.medium,
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
    ...DesignSystem.typography.caption,
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm,
  },
});
