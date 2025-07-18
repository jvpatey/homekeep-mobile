import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

export const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  liquidGlassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 20,
    padding: 40,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  featuresContainer: {
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(46, 196, 182, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.light.text,
    flex: 1,
  },
});
