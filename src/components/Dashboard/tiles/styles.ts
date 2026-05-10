import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

export const tileStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.sm,
  },
  tile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.sm + 2,
    paddingHorizontal: DesignSystem.spacing.sm + 4,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 64,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  primaryText: {
    ...DesignSystem.typography.smallSemiBold,
    fontSize: 13,
  },
  secondaryText: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
    marginTop: 1,
    opacity: 0.85,
  },
  weatherTempRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  weatherTemp: {
    ...DesignSystem.typography.h4,
    fontSize: 18,
    fontWeight: "700",
  },
  weatherUnit: {
    ...DesignSystem.typography.caption,
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.75,
  },
});
