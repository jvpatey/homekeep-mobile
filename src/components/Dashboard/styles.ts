import { StyleSheet, Dimensions } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

const { width: screenWidth } = Dimensions.get("window");

// Dashboard Header Styles
export const headerStyles = StyleSheet.create({
  headerSection: {
    marginBottom: 0,
    position: "relative",
    /** Zeroed so spacing between the stats card and the quick-action buttons
     * comes solely from a single token below — keeps tiles → stats → buttons
     * gaps visually consistent. */
    paddingBottom: 0,
  },
  headerGradient: {
    position: "relative",
    overflow: "hidden",
    paddingTop: DesignSystem.spacing.xl + DesignSystem.spacing.md,
  },
  contentLayer: {
    paddingTop: DesignSystem.spacing.xl + DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.sm,
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
    alignItems: "center",
    /** Matches the address/weather tiles and quick-action buttons (all
     * `large` = 16pt) so the four cards in the stack share one radius. */
    borderRadius: DesignSystem.borders.radius.large,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
    /** Matches the address/weather tile minHeight so all three cards in the
     * collapsible region share the same visual height. */
    minHeight: 64,
    ...DesignSystem.shadows.softKey,
  },
  statItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  statNumber: {
    ...DesignSystem.typography.h2,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  statLabel: {
    ...DesignSystem.typography.caption,
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 14,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    /** alignSelf needed because the parent uses alignItems: center, which
     * otherwise collapses zero-height children. */
    alignSelf: "stretch",
    marginVertical: DesignSystem.spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  collapseToggle: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs,
    marginTop: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.round,
  },
  collapseToggleText: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
  },
  collapsibleSection: {
    overflow: "hidden",
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
