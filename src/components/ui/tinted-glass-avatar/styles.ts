import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  pressable: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    alignItems: "center",
    justifyContent: "center",
  },
  surface: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
  },
  initial: {
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
