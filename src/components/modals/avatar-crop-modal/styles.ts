import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  canvas: {
    flex: 1,
  },
  image: {
    position: "absolute",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  chrome: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  hint: {
    ...DesignSystem.typography.footnote,
    color: "rgba(255,255,255,0.78)",
    textAlign: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  footerRow: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
});
