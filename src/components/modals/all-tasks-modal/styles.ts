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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
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

  flatList: {
    flex: 1,
  },

  listContainer: {
    padding: 20,
    flexGrow: 1,
  },

  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },

  taskContent: {
    flex: 1,
    marginRight: 12,
  },

  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },

  taskDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  taskCategory: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 12,
  },

  taskInterval: {
    fontSize: 14,
  },

  taskDuration: {
    fontSize: 12,
    fontStyle: "italic",
  },

  routineStatus: {
    marginTop: 4,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "500",
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
    paddingHorizontal: 32,
    paddingVertical: 80,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },

  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
