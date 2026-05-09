import { StyleSheet, Dimensions } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

const { width: screenWidth } = Dimensions.get("window");

// Dashboard Header Styles
export const headerStyles = StyleSheet.create({
  headerSection: {
    marginBottom: 0,
    position: "relative",
    paddingBottom: DesignSystem.spacing.md,
  },
  headerGradient: {
    position: "relative",
    overflow: "hidden",
    paddingTop: DesignSystem.spacing.xl + DesignSystem.spacing.md,
  },
  contentLayer: {
    paddingTop: DesignSystem.spacing.xl + DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    position: "relative",
    zIndex: 15,
  },
  headerTopBar: {
    position: "absolute",
    top: DesignSystem.spacing.md,
    left: DesignSystem.spacing.md,
    right: DesignSystem.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  headerContent: {
    alignItems: "center",
    paddingTop: DesignSystem.spacing.sm,
  },
  greetingContainer: {
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  greeting: {
    ...DesignSystem.typography.h1,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  userName: {
    ...DesignSystem.typography.h1,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm,
  },
  motivationalMessage: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm,
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: "row",
    borderRadius: DesignSystem.borders.radius.xlarge,
    padding: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.md,
    ...DesignSystem.shadows.softKey,
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
