import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  // Dashboard Header Styles
  headerContainer: {
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  userName: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    marginTop: 16,
  },
  searchBar: {
    borderRadius: 16,
    elevation: 0,
    borderWidth: 1,
  },
  searchInput: {
    fontSize: 16,
  },

  // Task Summary Cards Styles
  summaryContainer: {
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minHeight: 120,
  },
  cardTouchable: {
    flex: 1,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardHeader: {
    alignItems: "flex-end",
  },
  cardBody: {
    alignItems: "flex-start",
  },
  cardCount: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    opacity: 0.9,
    letterSpacing: 0.1,
  },

  // Upcoming Tasks Styles
  upcomingContainer: {
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    minHeight: 72,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  taskItemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 16,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    letterSpacing: -0.1,
  },
  priorityIcon: {
    marginLeft: 8,
  },
  taskSubtitle: {
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  taskItemRight: {
    marginLeft: 16,
  },

  // Swipe to Delete Styles
  swipeContainer: {
    position: "relative",
    overflow: "hidden",
  },
  deleteBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#E74C3C",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  deleteButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  // Empty State Styles
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    fontWeight: "400",
    textAlign: "center",
    opacity: 0.8,
  },

  // Floating Action Button Styles
  fabContainer: {
    position: "absolute",
    bottom: 34,
    right: 32,
    zIndex: 1000,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  createTaskContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },

  // Form Input Styles
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  required: {
    color: "#E74C3C",
    fontWeight: "700",
  },
  textInput: {
    borderRadius: 12,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  textArea: {
    borderRadius: 12,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },

  // Chip Styles
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    marginRight: 0,
    marginBottom: 0,
    borderRadius: 20,
  },
  priorityChip: {
    marginRight: 0,
    marginBottom: 0,
    borderRadius: 20,
  },
  recurrenceChip: {
    marginRight: 0,
    marginBottom: 0,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  // Recurring Task Toggle
  recurringToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  recurringLeft: {
    flex: 1,
  },
  recurringSubtext: {
    fontSize: 14,
    fontWeight: "400",
    marginTop: 2,
  },

  // Date Picker
  datePickerButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  datePickerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  datePickerText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
  datePickerContainer: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  datePickerDone: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  datePickerDoneText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  // Submit Button
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.2,
  },
});
