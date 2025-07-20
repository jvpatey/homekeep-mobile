import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 16,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  buttonContainer: {
    gap: 12,
  },
  gradientButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  googleButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    margin: 0,
  },
  buttonContent: {
    paddingVertical: 8,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  googleIconContainer: {
    marginRight: 8,
  },
  appleIcon: {
    fontSize: 18,
    color: "#FFFFFF",
    // Apple icon would go here - for now using text
    width: 18,
    height: 18,
  },
});
