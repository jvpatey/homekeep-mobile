import { StyleSheet, Dimensions } from "react-native";

const { height: screenHeight } = Dimensions.get("window");

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  backdropPressable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },

  modalContainer: {
    width: "92%",
    maxWidth: 420,
    minHeight: screenHeight * 0.6,
    maxHeight: screenHeight * 0.85,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 16,
  },

  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
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
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
    borderWidth: 1,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
    marginRight: 12,
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
    fontSize: 13,
    lineHeight: 18,
  },

  notificationTypeHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  expandIcon: {
    marginLeft: 4,
  },

  categoriesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },

  categoriesTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },

  categoriesDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
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
    height: 32,
  },
});
