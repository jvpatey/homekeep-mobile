import { StyleSheet } from "react-native";

export const notificationPreferencesStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  globalSection: {
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
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
    marginRight: 16,
  },
  globalInfo: {
    flex: 1,
  },
  globalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  globalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  permissionSection: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  permissionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  permissionText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  permissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 20,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  notificationTypeSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  notificationTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
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
    marginRight: 16,
  },
  notificationTypeInfo: {
    flex: 1,
  },
  notificationTypeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  notificationTypeDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  notificationTypeHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  expandIcon: {
    marginLeft: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  categoriesDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  categoryRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryRowName: {
    fontSize: 14,
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 40,
  },
});
