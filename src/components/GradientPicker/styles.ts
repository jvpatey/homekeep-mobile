import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },

  headerContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    textAlign: "center",
    opacity: 0.8,
  },

  gradientContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },

  gradientOption: {
    alignItems: "center",
    justifyContent: "center",
  },

  gradientWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  selectionBorder: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    top: -3,
    left: -3,
    zIndex: 1,
  },

  gradientCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: "relative",
  },

  checkContainer: {
    position: "absolute",
    bottom: -2,
    right: -2,
    zIndex: 2,
  },

  checkBackground: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  gradientName: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
    letterSpacing: 0.1,
  },
});
