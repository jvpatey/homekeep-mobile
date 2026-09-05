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
    ...StyleSheet.absoluteFill,
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
    ...StyleSheet.absoluteFill,
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

  list: {
    flex: 1,
  },

  listContent: {
    padding: DesignSystem.spacing.lg,
    flexGrow: 1,
    paddingBottom: DesignSystem.spacing.xxxl,
  },

  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },

  taskContent: {
    flex: 1,
    marginRight: DesignSystem.spacing.md,
  },

  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: DesignSystem.spacing.sm,
  },

  taskTitle: {
    ...DesignSystem.typography.bodySemiBold,
    fontSize: 16,
    flex: 1,
    marginRight: DesignSystem.spacing.sm,
  },

  taskDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.xs,
  },

  taskCategory: {
    ...DesignSystem.typography.smallMedium,
    fontSize: 14,
    marginRight: DesignSystem.spacing.md,
  },

  taskInterval: {
    ...DesignSystem.typography.small,
    fontSize: 14,
  },

  taskDuration: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
    fontStyle: "italic",
  },

  routineStatus: {
    marginTop: DesignSystem.spacing.xs,
  },

  statusText: {
    ...DesignSystem.typography.captionMedium,
    fontSize: 12,
  },

  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  deletingButton: {
    opacity: 0.5,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.xxxl,
  },

  emptyText: {
    ...DesignSystem.typography.title2,
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    textAlign: "center",
  },

  emptySubtext: {
    ...DesignSystem.typography.small,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
