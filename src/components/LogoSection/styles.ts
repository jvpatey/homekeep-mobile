import { StyleSheet } from "react-native";

// Styles for the logo section
export const styles = StyleSheet.create({
  logoContainer: {
    marginTop: 0,
    marginBottom: 20,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  logo: {
    width: 200,
    height: 100,
    resizeMode: "contain",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: 1.2,
    marginTop: 12,
    textAlign: "center",
    fontFamily: "System",
  },
});
