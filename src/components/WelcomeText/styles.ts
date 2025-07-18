import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

// Styles for the welcome text section
export const styles = StyleSheet.create({
  textContainer: {
    paddingHorizontal: 32,
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 40,
  },
  headline: {
    fontSize: 26,
    lineHeight: 34,
    textAlign: "center",
    color: colors.light.text,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: "center",
    color: colors.light.textSecondary,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
});
