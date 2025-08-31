import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

// authStyles for the authStyles on the home screen
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
    marginBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.md,
  },
  title: {
    ...DesignSystem.typography.h1,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.xs,
  },
  largeTitle: {
    ...DesignSystem.typography.h1,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.xs,
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
    marginBottom: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.medium,
  },
  formContent: {
    padding: DesignSystem.spacing.md,
  },
  compactFormContent: {
    padding: DesignSystem.spacing.md,
  },
  input: {
    marginBottom: DesignSystem.spacing.xs,
    backgroundColor: "transparent",
    fontSize: DesignSystem.typography.body.fontSize,
  },
  errorText: {
    ...DesignSystem.typography.caption,
    textAlign: "center",
    marginTop: DesignSystem.spacing.xs,
  },
  helperText: {
    marginBottom: DesignSystem.spacing.xs,
    ...DesignSystem.typography.caption,
  },

  // Progress styles
  progressContainer: {
    marginBottom: DesignSystem.spacing.xs,
    marginTop: DesignSystem.spacing.md,
    width: "100%",
    paddingHorizontal: DesignSystem.spacing.md,
  },
  progressLabel: {
    ...DesignSystem.typography.captionMedium,
    marginBottom: DesignSystem.spacing.xs,
    textAlign: "center",
  },
  progressBar: {
    height: 6,
    borderRadius: DesignSystem.borders.radius.small,
    width: "100%",
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
    paddingVertical: DesignSystem.spacing.md,
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
    marginTop: DesignSystem.spacing.xs,
    alignItems: "center",
  },
  verificationText: {
    ...DesignSystem.typography.small,
    textDecorationLine: "underline",
  },

  // Configuration card styles
  configCard: {
    borderRadius: DesignSystem.borders.radius.large,
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.medium,
  },
  configContent: {
    padding: DesignSystem.spacing.md,
  },
  configTitle: {
    ...DesignSystem.typography.h4,
    marginBottom: DesignSystem.spacing.xs,
    textAlign: "center",
  },
  configText: {
    ...DesignSystem.typography.small,
    textAlign: "center",
  },

  // Status styles
  statusContainer: {
    marginTop: DesignSystem.spacing.lg,
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
    marginTop: DesignSystem.spacing.xs,
  },
});
