import { StyleSheet, Dimensions } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },

  backdropPressable: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: screenHeight * 0.75,
    maxHeight: screenHeight * 0.9,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },

  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
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

  previewSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },

  previewLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.7,
  },

  previewContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  previewAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },

  previewInitial: {
    fontSize: 36,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.1,
  },

  previewInfo: {
    alignItems: "center",
    maxWidth: 280,
  },

  previewGradientName: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.2,
    marginBottom: 6,
  },

  previewDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.8,
  },

  pickerScrollView: {
    flex: 1,
    paddingTop: 8,
  },

  footerActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 32,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.08)",
  },

  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  saveButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    overflow: "hidden",
  },

  saveButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    letterSpacing: 0.1,
  },
});
