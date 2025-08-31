import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../../theme/designSystem";

export const styles = StyleSheet.create({
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: DesignSystem.borders.radius.large,
    borderTopRightRadius: DesignSystem.borders.radius.large,
    paddingTop: DesignSystem.spacing.lg,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    ...DesignSystem.typography.h2,
    fontWeight: "600",
  },
  closeButton: {
    padding: DesignSystem.spacing.sm,
  },
  modalBody: {
    padding: DesignSystem.spacing.lg,
  },
  scrollContent: {
    paddingBottom: DesignSystem.spacing.xl,
  },

  // Form field styles
  inputGroup: {
    marginBottom: DesignSystem.spacing.lg,
  },
  inputLabel: {
    ...DesignSystem.typography.body,
    fontWeight: "500",
    marginBottom: DesignSystem.spacing.sm,
  },
  required: {
    color: "#EF4444",
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

  // Category selector styles
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
  },
  categoryChip: {
    marginBottom: DesignSystem.spacing.xs,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Priority selector styles
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
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Interval selector styles
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
    borderWidth: 1,
  },
  intervalText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Date selector styles
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
    borderWidth: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "500",
  },
  customDateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
    gap: DesignSystem.spacing.sm,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },

  // Submit button styles
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borders.radius.medium,
    alignItems: "center",
    marginTop: DesignSystem.spacing.lg,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },

  // Additional modal styles
  createTaskContainer: {
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: DesignSystem.borders.radius.medium,
    padding: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.md,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.xs,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Form field additional styles
  textInput: {
    borderWidth: 1,
    borderRadius: DesignSystem.borders.radius.medium,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: DesignSystem.borders.radius.medium,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },

  // Header styles
  headerSpacer: {
    width: 40,
  },

  // Priority selector additional styles
  priorityChip: {
    marginBottom: DesignSystem.spacing.xs,
  },

  // Submit button additional styles
  modalFooter: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: DesignSystem.spacing.md,
  },
  submitGradient: {
    borderRadius: DesignSystem.borders.radius.medium,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    alignItems: "center",
  },
});
