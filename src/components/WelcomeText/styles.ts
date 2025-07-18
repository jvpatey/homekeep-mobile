import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

// Styles for the welcome text section
export const styles = StyleSheet.create({
  textContainer: {
    paddingHorizontal: 32,
    alignItems: "center",
    maxWidth: 320,
    alignSelf: "center",
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: "center",
    color: colors.light.text,
    fontWeight: "400",
  },
});
