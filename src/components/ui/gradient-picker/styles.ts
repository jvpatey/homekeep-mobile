import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  gradientContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 16,
  },

  gradientOption: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },

  gradientWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: 4,
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

  gradientName: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
    letterSpacing: 0.1,
  },
});
