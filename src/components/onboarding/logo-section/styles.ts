import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

// styles for the logo section
export const styles = StyleSheet.create({
  logoContainer: {
    marginTop: DesignSystem.spacing.md,
    marginBottom: 0,
    alignItems: "center",
    backgroundColor: "transparent",
    width: "100%",
    alignSelf: "center",
  },
  logoContainerCompact: {
    marginTop: DesignSystem.spacing.md,
    marginBottom: 0,
    alignItems: "center",
    backgroundColor: "transparent",
    width: "100%",
    maxWidth: 280,
    alignSelf: "center",
  },
  logo: {
    width: 380,
    height: 190,
    resizeMode: "contain",
  },
  logoCompact: {
    width: 140,
    height: 70,
    resizeMode: "contain",
  },
  logoText: {
    textAlign: "center",
    marginTop: 0,
    fontFamily: "System",
    fontWeight: "800",
    // Keep the brand wordmark secondary to the value prop headline.
    letterSpacing: -0.9,
    fontSize: 34,
    lineHeight: 40,
  },
});
