import { useTheme } from "../../context/ThemeContext";
import { MaintenanceTask } from "../../types/maintenance";

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

const startOfLocalDay = (dateString: string) => {
  const d = new Date(dateString);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Due soon / schedule lists: calendar order first, then priority within the same day. */
export const sortTasksByDateThenPriority = (tasks: MaintenanceTask[]) => {
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  return [...tasks].sort((a, b) => {
    const dayDiff = startOfLocalDay(a.due_date) - startOfLocalDay(b.due_date);
    if (dayDiff !== 0) return dayDiff;

    const pa = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 0;
    const pb = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 0;
    if (pb !== pa) return pb - pa;

    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

export const getUserName = (fullName?: string, email?: string) => {
  // Get user's first name from full name, or use email, or fallback to "User"
  if (fullName) {
    const firstName = fullName.split(" ")[0];
    return firstName;
  }
  // If no full name, use email prefix
  if (email) {
    const emailPrefix = email.split("@")[0];
    return emailPrefix;
  }
  return "User";
};

export const getMotivationalMessage = (upcomingTasks: MaintenanceTask[]) => {
  if (upcomingTasks.length === 0) {
    return "Ready to get organized? Add a task to get started! ✨";
  }

  // Find the next due task
  const nextTask = upcomingTasks[0]; // Tasks are already sorted by due date
  if (!nextTask) {
    return "Ready to get organized? Add a task to get started! ✨";
  }

  const nextDueDate = new Date(nextTask.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Reset the due date to start of day for accurate comparison
  const dueDateStart = new Date(nextDueDate);
  dueDateStart.setHours(0, 0, 0, 0);

  const diffTime = dueDateStart.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Overdue task
    return "You have overdue tasks that need attention!";
  } else if (diffDays === 0) {
    // Due today
    return "You have tasks due today! Let's get them done.";
  } else if (diffDays === 1) {
    // Due tomorrow
    return "You have tasks due tomorrow. Time to prepare!";
  } else if (diffDays <= 7) {
    // Due this week
    return `You have tasks due in ${diffDays} days. Getting close!`;
  } else if (diffDays <= 30) {
    // Due this month
    const weeks = Math.ceil(diffDays / 7);
    return `Your next task is due in ${weeks} week${weeks > 1 ? "s" : ""}.`;
  } else {
    // Due far in the future
    const months = Math.ceil(diffDays / 30);
    if (months >= 12) {
      const years = Math.ceil(months / 12);
      return `Your next task is due in ${years} year${years > 1 ? "s" : ""}.`;
    } else {
      return `Your next task is due in ${months} month${
        months > 1 ? "s" : ""
      }.`;
    }
  }
};

export const getDueSoonTasks = (tasks: MaintenanceTask[]) => {
  return tasks.filter((task) => {
    if (task.is_completed) return false;

    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0); // Normalize to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Tasks are overdue only if due BEFORE today (not including today)
    // Ignore database is_overdue flag and use our corrected logic
    const isOverdue = diffDays < 0;

    // Only include tasks due within 7 days (exclude past due tasks)
    return !isOverdue && diffDays <= 7;
  });
};

export const getUpcomingTasks = (tasks: MaintenanceTask[]) => {
  const upcomingTasks = tasks.filter((task) => {
    if (task.is_completed) return false;

    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0); // Normalize to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Tasks are overdue only if due BEFORE today (not including today)
    // Ignore database is_overdue flag and use our corrected logic
    const isOverdue = diffDays < 0;

    // Only include tasks due today or in the future (exclude past due tasks)
    return !isOverdue;
  });

  return upcomingTasks;
};

export const getPastDueTasks = (tasks: MaintenanceTask[]) => {
  const pastDueTasks = tasks.filter((task) => {
    if (task.is_completed) return false;

    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0); // Normalize to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Tasks are overdue only if due BEFORE today (not including today)
    // Ignore database is_overdue flag and use our corrected logic
    const isOverdue = diffDays < 0;

    return isOverdue;
  });

  return pastDueTasks;
};
