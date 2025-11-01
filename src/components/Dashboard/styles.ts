import { StyleSheet, Dimensions } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

const { width: screenWidth } = Dimensions.get("window");

// Dashboard Header Styles
export const headerStyles = StyleSheet.create({
  headerSection: {
    marginBottom: 0,
    position: "relative",
    paddingBottom: DesignSystem.spacing.lg,
  },
  headerGradient: {
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    paddingTop: DesignSystem.spacing.xl + DesignSystem.spacing.md,
  },
  gradientBase: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    opacity: 1,
  },
  gradientGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  gradientAmbient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  bottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 10,
  },
  contentLayer: {
    paddingTop: DesignSystem.spacing.xl + DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.md,
    position: "relative",
    zIndex: 15,
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
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  userName: {
    ...DesignSystem.typography.h1,
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
    marginTop: DesignSystem.spacing.md,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  motivationalMessage: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    marginTop: DesignSystem.spacing.md,
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statsContainer: {
    flexDirection: "row",
    borderRadius: DesignSystem.borders.radius.xlarge,
    padding: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.md,
    shadowColor: "#2EC4B6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
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
    textAlign: "center",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
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
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
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
