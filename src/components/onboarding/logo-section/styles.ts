import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

// styles for the logo section
export const styles = StyleSheet.create({
  logoContainer: {
    marginTop: 0,
    marginBottom: DesignSystem.spacing.sm,
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    backgroundColor: "transparent",
  },
  logoContainerCompact: {
    marginTop: 0,
    marginBottom: DesignSystem.spacing.sm,
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    backgroundColor: "transparent",
  },
  logo: {
    width: 380,
    height: 190,
    resizeMode: "contain",
    shadowColor: "rgba(255, 255, 255, 0.5)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 30,
    elevation: 12,
  },
  logoCompact: {
    width: 140,
    height: 70,
    resizeMode: "contain",
    shadowColor: "rgba(255, 255, 255, 0.5)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 30,
    elevation: 12,
  },
  logoText: {
    ...DesignSystem.typography.h1,
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm,
    fontFamily: "System",
    fontWeight: "700",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontSize: 42,
    lineHeight: 48,
  },
});
