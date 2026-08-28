import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

export const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  option: {
    width: "25%",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.sm,
  },
  ring: {
    padding: 3,
    borderRadius: 31,
    borderWidth: 2,
  },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  caption: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.xs,
    textAlign: "center",
  },
});
