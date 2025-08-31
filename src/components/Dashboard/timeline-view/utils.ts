import { MaintenanceTask } from "../../../types/maintenance";
import { ThemeColors } from "../../../types/navigation";

// groupTasksByDate function to group the tasks by date
export const groupTasksByDate = (tasks: MaintenanceTask[]) => {
  const groups: { [key: string]: MaintenanceTask[] } = {};

  tasks.forEach((task) => {
    const date = new Date(task.due_date);
    const dateKey = date.toDateString();

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(task);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([dateKey, tasks]) => ({
      date: new Date(dateKey),
      tasks: tasks.sort((a, b) => {
        // Sort by priority first, then by due time
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }),
    }));
};

// formatDate function to format the date
export const formatDate = (date: Date) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }
};

// formatTime function to format the time
export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// getPriorityColor function to get the priority color
export const getPriorityColor = (priority: string, colors: ThemeColors) => {
  switch (priority) {
    case "urgent":
      return colors.error;
    case "high":
      return "#FF6B35";
    case "medium":
      return colors.warning;
    case "low":
      return colors.success;
    default:
      return colors.textSecondary;
  }
};
