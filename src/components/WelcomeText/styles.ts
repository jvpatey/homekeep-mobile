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
  welcomeText: {
    fontSize: 22,
    lineHeight: 32,
    textAlign: "center",
    color: colors.light.text,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
