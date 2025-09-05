import { StyleSheet, Dimensions } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

const { width: screenWidth } = Dimensions.get("window");

// Dashboard Header Styles
export const headerStyles = StyleSheet.create({
  headerSection: {
    marginBottom: DesignSystem.spacing.lg,
  },
  headerGradient: {
    paddingTop: 52,
    paddingBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.md,
    position: "relative",
  },
  profileButtonContainer: {
    position: "absolute",
    top: DesignSystem.spacing.md,
    right: DesignSystem.spacing.md,
    zIndex: 10,
  },
  headerContent: {
    alignItems: "center",
    paddingTop: DesignSystem.spacing.md,
  },
  greetingContainer: {
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  greeting: {
    ...DesignSystem.typography.h1,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  motivationalMessage: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm,
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    ...DesignSystem.typography.h2,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  statLabel: {
    ...DesignSystem.typography.caption,
    opacity: 0.8,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
});

// Floating Action Button Styles
export const fabStyles = StyleSheet.create({
  floatingActionButton: {
    position: "absolute",
    bottom: DesignSystem.spacing.xl,
    right: DesignSystem.spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 1000,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  floatingActionButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});

// Main Dashboard Styles
export const dashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  bottomSpacing: {
    height: DesignSystem.spacing.xxl,
  },
});

// Re-export timeline styles for convenience
export { timelineStyles } from "./timeline-view/styles";

// Re-export completion history styles for convenience
export { completionHistoryStyles } from "../../screens/completion-history/styles";

// Re-export notification preferences styles for convenience
export { notificationPreferencesStyles } from "../../screens/notification-preferences/styles";
