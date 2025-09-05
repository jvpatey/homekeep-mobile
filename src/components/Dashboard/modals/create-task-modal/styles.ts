import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../../theme/designSystem";

export const styles = StyleSheet.create({
  // Modal container styles
  createTaskContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.lg,
  },

  // Modal header styles - Minimalist design
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalTitle: {
    ...DesignSystem.typography.h2,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerSpacer: {
    width: 40,
  },

  // Form field styles - Modern and polished with proper spacing
  inputGroup: {
    marginBottom: DesignSystem.spacing.lg,
  },
  inputLabel: {
    ...DesignSystem.typography.bodyMedium,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.sm,
    color: "#1F2937",
  },
  required: {
    color: "#EF4444",
    fontWeight: "700",
  },
  textInput: {
    backgroundColor: "transparent",
    fontSize: DesignSystem.typography.body.fontSize,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: 0,
  },
  textArea: {
    backgroundColor: "transparent",
    fontSize: DesignSystem.typography.body.fontSize,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: 0,
    minHeight: 80,
    textAlignVertical: "top",
  },
  helperText: {
    marginTop: DesignSystem.spacing.xs,
    marginLeft: 16,
  },

  // Category selector styles - Enhanced with modern design
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
  },
  categoryChip: {
    marginBottom: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 2,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.small,
  },
  chipText: {
    fontSize: DesignSystem.typography.small.fontSize,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Priority selector styles - Modern card-based design
  priorityContainer: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
    alignItems: "center",
    borderWidth: 2,
    ...DesignSystem.shadows.small,
  },
  priorityText: {
    fontSize: DesignSystem.typography.small.fontSize,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Interval selector styles - Enhanced with better visual hierarchy
  intervalContainer: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  intervalOption: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
    alignItems: "center",
    borderWidth: 2,
    ...DesignSystem.shadows.small,
  },
  intervalText: {
    fontSize: DesignSystem.typography.small.fontSize,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Date selector styles - Modern button design
  dateContainer: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  dateOption: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
    alignItems: "center",
    borderWidth: 2,
    ...DesignSystem.shadows.small,
  },
  dateText: {
    fontSize: DesignSystem.typography.small.fontSize,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  customDateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 2,
    gap: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.small,
  },
  dateButtonText: {
    fontSize: DesignSystem.typography.body.fontSize,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Summary section styles - Minimalist design
  summaryContainer: {
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.lg,
    marginTop: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.lg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: DesignSystem.typography.h4.fontSize,
    fontWeight: "700",
    marginBottom: DesignSystem.spacing.sm,
  },
  summaryText: {
    fontSize: DesignSystem.typography.body.fontSize,
    lineHeight: 24,
  },

  // Submit button styles - Enhanced with modern design
  modalFooter: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "white",
  },
  submitButton: {
    borderRadius: DesignSystem.borders.radius.large,
    overflow: "hidden",
    ...DesignSystem.shadows.medium,
  },
  submitGradient: {
    borderRadius: DesignSystem.borders.radius.large,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    alignItems: "center",
    minHeight: DesignSystem.components.buttonLarge,
  },
  submitButtonText: {
    color: "white",
    fontSize: DesignSystem.typography.button.fontSize,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Legacy styles for backward compatibility
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBody: {
    padding: DesignSystem.spacing.lg,
  },
  scrollContent: {
    paddingBottom: DesignSystem.spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderRadius: DesignSystem.borders.radius.medium,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    fontSize: 16,
  },
  errorText: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.xs,
  },
  priorityChip: {
    marginBottom: DesignSystem.spacing.xs,
  },
});
