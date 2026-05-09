import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

// styles for the welcome text section
export const styles = StyleSheet.create({
  textContainer: {
    alignItems: "center",
    marginTop: DesignSystem.spacing.lg,
    width: "100%",
  },
  headline: {
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 36,
    letterSpacing: -0.7,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 22,
    letterSpacing: -0.12,
    textAlign: "center",
  },
});
