import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

export const styles = StyleSheet.create({
  preview: {
    alignItems: "center",
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.lg,
  },
  previewName: {
    ...DesignSystem.typography.callout,
    fontWeight: "600",
    marginTop: DesignSystem.spacing.md,
  },
  previewHint: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
    marginTop: DesignSystem.spacing.xs,
  },
  photoAction: {
    marginTop: DesignSystem.spacing.md,
    minWidth: 180,
  },
  footerRow: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
  pickerWrap: {
    paddingBottom: DesignSystem.spacing.lg,
  },
});
