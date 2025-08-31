import { useTheme } from "../../context/ThemeContext";

// useCategoryColors - Features use of the theme colors
export const useCategoryColors = () => {
  const { colors } = useTheme();

  // getCategoryColor - Features getting the category color
  const getCategoryColor = (category: string): string => {
    const categoryColors: { [key: string]: string } = {
      hvac: "#FF6B6B",
      HVAC: "#FF6B6B",
      exterior: "#4ECDC4",
      Exterior: "#4ECDC4",
      safety: "#FFA726",
      Safety: "#FFA726",
      plumbing: "#9B59B6",
      Plumbing: "#9B59B6",
      electrical: "#3498DB",
      Electrical: "#3498DB",
      appliances: "#2ECC71",
      Appliances: "#2ECC71",
    };
    return categoryColors[category] || colors.primary;
  };
  return { getCategoryColor };
};

// formatDueDate - Features formatting of due date for task items
export const formatDueDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

// sortTasksByPriorityAndDate - Features sorting of tasks by priority and date
export const sortTasksByPriorityAndDate = (tasks: any[]) => {
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  return [...tasks].sort((a, b) => {
    const priorityDiff =
      priorityOrder[b.priority as keyof typeof priorityOrder] -
      priorityOrder[a.priority as keyof typeof priorityOrder];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });
};
