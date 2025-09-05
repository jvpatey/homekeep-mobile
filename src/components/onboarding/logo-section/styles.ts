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
    shadowColor: "rgba(255, 255, 255, 0.3)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  logoCompact: {
    width: 140,
    height: 70,
    resizeMode: "contain",
    shadowColor: "rgba(255, 255, 255, 0.3)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: {
    ...DesignSystem.typography.h1,
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm,
    fontFamily: "System",
    fontWeight: "700",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0, 0, 0, 0.08)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontSize: 42,
    lineHeight: 48,
  },
});
