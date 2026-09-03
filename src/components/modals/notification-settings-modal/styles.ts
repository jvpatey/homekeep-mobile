import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

export const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 0,
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.xl,
  },
  globalCard: {
    marginBottom: DesignSystem.spacing.md,
  },
  globalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: DesignSystem.spacing.md,
  },
  globalLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: DesignSystem.spacing.sm,
  },
  globalInfo: {
    flex: 1,
  },
  globalTitle: {
    ...DesignSystem.typography.callout,
    fontWeight: "600",
  },
  globalDescription: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignSystem.spacing.md,
  },
  iconWellLarge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignSystem.spacing.md,
  },
  permissionCard: {
    marginBottom: DesignSystem.spacing.md,
  },
  permissionCopy: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.md,
    paddingBottom: 0,
  },
  permissionText: {
    ...DesignSystem.typography.footnote,
    flex: 1,
  },
  permissionButton: {
    padding: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.sm,
  },
  tokenError: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.md,
  },
  sectionTitle: {
    ...DesignSystem.typography.title2,
    fontSize: 20,
    marginTop: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.xs,
  },
  sectionDescription: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.md,
  },
  typeCard: {
    marginBottom: DesignSystem.spacing.sm,
  },
  typeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: DesignSystem.spacing.md,
  },
  typeHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: DesignSystem.spacing.sm,
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    ...DesignSystem.typography.callout,
    fontWeight: "600",
  },
  typeDescription: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
  },
  typeHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
  },
  categories: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  categoriesTitle: {
    ...DesignSystem.typography.callout,
    fontWeight: "600",
    marginTop: DesignSystem.spacing.md,
  },
  categoriesDescription: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
    marginBottom: DesignSystem.spacing.sm,
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
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    ...DesignSystem.typography.callout,
  },
});
