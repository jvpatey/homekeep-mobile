import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

export const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    minHeight: 48,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 20,
  },
  featureText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.light.text,
    flex: 1,
    letterSpacing: 0.1,
  },
});
