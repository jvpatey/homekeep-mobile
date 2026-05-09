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
    height: screenHeight * 0.85,
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

  globalSection: {
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.lg,
    borderWidth: 1,
  },

  globalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  globalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  globalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignSystem.spacing.md,
  },

  globalInfo: {
    flex: 1,
  },

  globalTitle: {
    ...DesignSystem.typography.h4,
    fontSize: 18,
    marginBottom: 4,
  },

  globalDescription: {
    ...DesignSystem.typography.small,
    fontSize: 14,
    lineHeight: 20,
  },

  permissionSection: {
    marginBottom: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },

  permissionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  permissionText: {
    ...DesignSystem.typography.small,
    fontSize: 14,
    marginLeft: DesignSystem.spacing.sm,
    flex: 1,
    lineHeight: 20,
  },

  permissionButton: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.small,
  },

  permissionButtonText: {
    ...DesignSystem.typography.smallSemiBold,
    color: "white",
    fontSize: 14,
  },

  sectionTitle: {
    ...DesignSystem.typography.h4,
    fontSize: 18,
    marginBottom: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.lg,
  },

  sectionDescription: {
    ...DesignSystem.typography.small,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: DesignSystem.spacing.lg,
  },

  notificationTypeSection: {
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
    borderWidth: 1,
  },

  notificationTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  notificationTypeHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  notificationTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignSystem.spacing.md,
  },

  notificationTypeInfo: {
    flex: 1,
  },

  notificationTypeName: {
    ...DesignSystem.typography.bodySemiBold,
    fontSize: 16,
    marginBottom: 2,
  },

  notificationTypeDescription: {
    ...DesignSystem.typography.caption,
    fontSize: 13,
    lineHeight: 18,
  },

  notificationTypeHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },

  expandIcon: {
    marginLeft: DesignSystem.spacing.xs,
  },

  categoriesContainer: {
    marginTop: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.md,
    borderTopWidth: 1,
  },

  categoriesTitle: {
    ...DesignSystem.typography.smallSemiBold,
    fontSize: 14,
    marginBottom: 4,
  },

  categoriesDescription: {
    ...DesignSystem.typography.caption,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: DesignSystem.spacing.md,
  },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: DesignSystem.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  categoryRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: DesignSystem.spacing.sm,
  },

  categoryRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryRowName: {
    ...DesignSystem.typography.smallMedium,
    fontSize: 14,
  },

  bottomSpacer: {
    height: DesignSystem.spacing.lg,
  },
});
