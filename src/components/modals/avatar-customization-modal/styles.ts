import { StyleSheet, Dimensions } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

const { height: screenHeight } = Dimensions.get("window");

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },

  sheetContainer: {
    width: "100%",
    height: screenHeight * 0.85,
  },

  glassOuter: {
    flex: 1,
    width: "100%",
    borderTopLeftRadius: DesignSystem.borders.radius.glass,
    borderTopRightRadius: DesignSystem.borders.radius.glass,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
  },

  glassInner: {
    flex: 1,
    borderTopLeftRadius: DesignSystem.borders.radius.glass,
    borderTopRightRadius: DesignSystem.borders.radius.glass,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  haloFill: {
    ...StyleSheet.absoluteFillObject,
  },

  sheetSafeArea: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.md,
    borderBottomWidth: 1,
  },

  headerTitle: {
    ...DesignSystem.typography.h3,
    fontSize: 20,
    flex: 1,
    marginRight: DesignSystem.spacing.md,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  previewSection: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.lg,
    alignItems: "center",
  },

  previewLabel: {
    ...DesignSystem.typography.smallMedium,
    fontSize: 13,
    marginBottom: DesignSystem.spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.85,
  },

  previewContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: DesignSystem.spacing.md,
  },

  previewInfo: {
    alignItems: "center",
    maxWidth: 280,
  },

  previewGradientName: {
    ...DesignSystem.typography.h4,
    fontSize: 18,
    marginBottom: 4,
  },

  previewDescription: {
    ...DesignSystem.typography.small,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.85,
  },

  pickerWrap: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
  },

  footerActions: {
    flexDirection: "row",
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
    borderTopWidth: 1,
  },

  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    ...DesignSystem.typography.button,
    fontSize: 16,
  },

  saveButtonWrap: {
    flex: 1,
  },
});
