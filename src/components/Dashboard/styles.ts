import { StyleSheet, Dimensions } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  // New Dashboard Styles
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  headerGradient: {
    paddingTop: 52, // Reduced to 52px - just enough for profile button (40px) + 12px margin
    paddingBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.md,
    position: "relative",
  },
  headerContent: {
    alignItems: "center",
    paddingTop: DesignSystem.spacing.md, // Reduced to 16px - just enough clearance
  },
  greetingContainer: {
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  greeting: {
    ...DesignSystem.typography.h1,
    color: "white",
    textAlign: "center",
    marginBottom: DesignSystem.spacing.xs,
  },
  motivationalMessage: {
    ...DesignSystem.typography.body,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.md,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    ...DesignSystem.typography.h2,
    color: "white",
    fontWeight: "700",
  },
  statLabel: {
    ...DesignSystem.typography.caption,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: DesignSystem.spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: DesignSystem.spacing.sm,
  },
  bottomSpacing: {
    height: 100,
  },

  // Floating Action Button
  floatingActionButton: {
    position: "absolute",
    bottom: 30,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    ...DesignSystem.shadows.large,
  },
  floatingActionButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  // Create Task Modal Styles
  createTaskContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 100, // Add bottom padding for submit button
  },
  summaryContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  datePickerContainer: {
    marginTop: 16,
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  datePicker: {
    backgroundColor: "white",
    borderRadius: 12,
    minHeight: 120,
  },

  // Form Input Styles
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  required: {
    color: "#E74C3C",
    fontWeight: "700",
  },
  textInput: {
    borderRadius: 12,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  textArea: {
    borderRadius: 12,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },

  // Chip Styles
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    marginRight: 0,
    marginBottom: 0,
    borderRadius: 20,
  },
  priorityChip: {
    marginRight: 0,
    marginBottom: 0,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  // Modal Header Styles
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },

  // Modal Footer Styles
  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },

  // Submit Button Styles
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.2,
  },

  // Date Picker Styles
  datePickerButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  datePickerText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
  datePickerDone: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  datePickerDoneText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  // Profile Menu Styles
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.1,
    color: "white",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 100,
    paddingRight: 32,
  },
  menuContainer: {
    borderRadius: 20,
    minWidth: 280,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  menuAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  menuAvatarInitial: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.1,
    color: "white",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 20,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  signOutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  menuActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  menuActionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  menuActionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
});
