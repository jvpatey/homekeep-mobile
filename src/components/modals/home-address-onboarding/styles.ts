import { StyleSheet, Dimensions } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

const { height: screenHeight } = Dimensions.get("window");

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    width: "100%",
    height: screenHeight * 0.8,
  },
  glassOuter: {
    flex: 1,
    width: "100%",
    borderTopLeftRadius: DesignSystem.borders.radius.glass,
    borderTopRightRadius: DesignSystem.borders.radius.glass,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
  },
  glassInner: {
    flex: 1,
    borderTopLeftRadius: DesignSystem.borders.radius.glass,
    borderTopRightRadius: DesignSystem.borders.radius.glass,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  haloFill: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetSafeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...DesignSystem.typography.h3,
    fontSize: 20,
    flex: 1,
    marginRight: DesignSystem.spacing.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.lg,
  },
  intro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.lg,
  },
  introIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  introCopy: {
    flex: 1,
  },
  introTitle: {
    ...DesignSystem.typography.h4,
    fontSize: 17,
    marginBottom: 4,
  },
  introBody: {
    ...DesignSystem.typography.small,
    fontSize: 14,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: DesignSystem.spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  fieldRowItem: {
    flex: 1,
  },
  fieldLabel: {
    ...DesignSystem.typography.smallSemiBold,
    fontSize: 13,
    marginBottom: DesignSystem.spacing.xs,
  },
  input: {
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md - 2,
    fontSize: 16,
  },
  helperText: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.xs,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md - 2,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
    minHeight: 44,
  },
  selectButtonText: {
    fontSize: 16,
    flex: 1,
  },
  suggestionList: {
    marginTop: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
    overflow: "hidden",
  },
  suggestionRow: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 2,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignSystem.spacing.sm,
  },
  suggestionText: {
    flex: 1,
    minWidth: 0,
  },
  suggestionPrimary: {
    fontSize: 14,
    fontWeight: "600",
  },
  suggestionSecondary: {
    fontSize: 12,
    marginTop: 1,
  },
  suggestionLoading: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  suggestionAttribution: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs,
    fontSize: 10,
    textAlign: "right",
  },
  actions: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
    borderTopWidth: 1,
    gap: DesignSystem.spacing.sm,
  },
  primaryButton: {
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    ...DesignSystem.typography.bodySemiBold,
    color: "#FFFFFF",
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: DesignSystem.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    ...DesignSystem.typography.smallSemiBold,
    fontSize: 14,
  },
});
