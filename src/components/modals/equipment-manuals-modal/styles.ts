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
    paddingBottom: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
  },

  headerForm: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  headerList: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  headerCloseRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
    marginBottom: DesignSystem.spacing.xs,
  },

  headerFormToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: DesignSystem.spacing.sm,
  },

  headerToolbarSpacer: {
    flex: 1,
  },

  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
  },

  headerTitleBlockForm: {
    flex: 0,
    alignSelf: "stretch",
  },

  headerHeroTitle: {
    ...DesignSystem.typography.h2,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 28,
  },

  headerHeroSubtitle: {
    ...DesignSystem.typography.small,
    fontSize: 14,
    lineHeight: 20,
    marginTop: DesignSystem.spacing.xs,
    opacity: 0.92,
  },

  addEquipmentButton: {
    marginTop: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borders.radius.medium,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },

  addEquipmentButtonText: {
    ...DesignSystem.typography.bodySemiBold,
    fontSize: 16,
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

  equipmentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
  },

  equipmentMain: {
    flex: 1,
  },

  equipmentMainTouchable: {
    flex: 1,
    minWidth: 0,
  },

  equipmentTitle: {
    ...DesignSystem.typography.bodySemiBold,
    fontSize: 16,
    marginBottom: DesignSystem.spacing.xs,
  },

  equipmentMeta: {
    ...DesignSystem.typography.small,
    fontSize: 14,
    marginBottom: 2,
  },

  equipmentRowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
  },

  viewManualButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
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
    ...DesignSystem.typography.h4,
    fontSize: 18,
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

  formScroll: {
    flex: 1,
  },

  formScrollContent: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.xxxl,
    paddingTop: DesignSystem.spacing.sm,
  },

  sectionLabel: {
    ...DesignSystem.typography.smallMedium,
    fontSize: 13,
    marginBottom: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md,
  },

  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
    gap: DesignSystem.spacing.sm,
  },

  dateButtonText: {
    ...DesignSystem.typography.body,
    fontSize: 16,
    flex: 1,
  },

  attachCard: {
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
    marginTop: DesignSystem.spacing.sm,
  },

  attachHint: {
    ...DesignSystem.typography.small,
    fontSize: 13,
    marginTop: DesignSystem.spacing.sm,
    lineHeight: 18,
  },

  rowButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md,
  },

  textButton: {
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
  },

  saveButton: {
    marginTop: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    alignItems: "center",
  },

  saveButtonText: {
    ...DesignSystem.typography.bodySemiBold,
    fontSize: 16,
  },
});
