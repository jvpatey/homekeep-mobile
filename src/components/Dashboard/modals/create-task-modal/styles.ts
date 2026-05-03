import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../../theme/designSystem";

export const styles = StyleSheet.create({
  // Modal container styles - Glass morphism
  createTaskContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.lg,
  },

  // Modal header styles - Liquid glass with gradient accent
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.lg,
    borderBottomWidth: DesignSystem.glass.borderWidth,
    ...DesignSystem.shadows.glass,
  },
  modalTitle: {
    ...DesignSystem.typography.h2,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: DesignSystem.borders.radius.medium,
    alignItems: "center",
    justifyContent: "center",
    ...DesignSystem.shadows.small,
  },
  headerSpacer: {
    width: 40,
  },

  // Form field styles - Glass input treatment
  inputGroup: {
    marginBottom: DesignSystem.spacing.md,
  },
  inputLabel: {
    ...DesignSystem.typography.bodyMedium,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.sm,
  },
  required: {
    color: "#EF4444",
    fontWeight: "700",
  },
  glassInputWrapper: {
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: DesignSystem.glass.borderWidth,
    overflow: "hidden",
  },
  textInput: {
    backgroundColor: "transparent",
    fontSize: DesignSystem.typography.body.fontSize,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    minHeight: DesignSystem.components.inputLarge,
  },
  textArea: {
    backgroundColor: "transparent",
    fontSize: DesignSystem.typography.body.fontSize,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    minHeight: 100,
    textAlignVertical: "top",
  },
  helperText: {
    marginTop: DesignSystem.spacing.xs,
    marginLeft: DesignSystem.spacing.md,
  },

  // Category/Priority chip container - Glass morphism
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
  },
  categoryChip: {
    marginBottom: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: DesignSystem.glass.borderWidth,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
    minHeight: DesignSystem.components.buttonMedium,
    ...DesignSystem.shadows.small,
  },
  priorityChip: {
    marginBottom: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: DesignSystem.glass.borderWidth,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
    minHeight: DesignSystem.components.buttonMedium,
    ...DesignSystem.shadows.small,
  },
  chipText: {
    fontSize: DesignSystem.typography.small.fontSize,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Summary section styles - Glass card with gradient
  summaryContainer: {
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.lg,
    marginTop: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.lg,
    borderWidth: DesignSystem.glass.borderWidth,
    ...DesignSystem.shadows.glassStrong,
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

  // Submit button footer - Glass treatment
  modalFooter: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: 0,
    paddingTop: DesignSystem.spacing.lg,
    borderTopWidth: DesignSystem.glass.borderWidth,
  },
  submitButton: {
    borderRadius: DesignSystem.borders.radius.large,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderWidth: 1,
  },
  submitButtonText: {
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
    borderWidth: DesignSystem.borders.width,
    borderRadius: DesignSystem.borders.radius.medium,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    fontSize: 16,
  },
  errorText: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.xs,
  },

  // Priority selector styles - Legacy
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

  // Interval selector styles - Legacy
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

  // Date selector styles - Legacy
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

  // Gradient glow effects - Override existing shadows with stronger colored glows
  selectedItemGlow: {
    shadowColor: "#2EC4B6", // Teal
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedItemGlowAlt: {
    shadowColor: "#3A86FF", // Blue
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedItemGlowAccent: {
    shadowColor: "#FF9F1C", // Orange
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  filledFieldGlow: {
    shadowColor: "#2EC4B6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  focusGlow: {
    shadowColor: "#2EC4B6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  focusGlowAlt: {
    shadowColor: "#3A86FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
});
