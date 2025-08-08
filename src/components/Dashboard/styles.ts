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
    overflow: "visible",
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
    borderRadius: 16, // Match task item border radius
  },
  deleteBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0, // Lower than task item
    marginBottom: 8, // Match task item marginBottom
  },
  deleteButton: {
    width: 72,
    height: 72, // Match exact minHeight of task item
    borderTopRightRadius: 16, // Match task item border radius
    borderBottomRightRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonText: {
    fontSize: 10,
    fontWeight: "600",
  },

  // Tab Styles
  tabBar: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  // Task Detail Modal Styles
  taskDetailContainer: {
    flex: 1,
  },
  taskDetailHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  taskDetailHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  taskDetailHeaderLeft: {
    flex: 1,
  },
  taskDetailCategoryBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  taskDetailCategoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  taskDetailPriority: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  taskDetailPriorityText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  taskDetailCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  taskDetailContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  taskDetailTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
    lineHeight: 34,
  },
  taskDetailSection: {
    marginBottom: 32,
  },
  taskDetailSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  taskDetailDescription: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  taskDetailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  taskDetailGridItem: {
    width: "48%",
    marginHorizontal: "1%",
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  taskDetailGridLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 4,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  taskDetailGridValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.1,
  },
  taskDetailActions: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  taskDetailActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskDetailActionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  taskDetailCompleteButton: {
    flex: 1.2, // Slightly larger for primary action
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

  // Profile Menu Styles
  profileButton: {
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
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.1,
    color: "white",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 100,
    paddingRight: 32,
  },
  menuContainer: {
    borderRadius: 20,
    minWidth: 280,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  menuAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  menuAvatarInitial: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.1,
    color: "white",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 20,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  signOutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
});
