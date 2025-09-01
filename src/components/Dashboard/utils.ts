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

// sortTasksByPriorityAndDate - Features sorting of tasks by priority and date
export const sortTasksByPriorityAndDate = (tasks: MaintenanceTask[]) => {
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  return [...tasks].sort((a, b) => {
    const priorityDiff =
      priorityOrder[b.priority as keyof typeof priorityOrder] -
      priorityOrder[a.priority as keyof typeof priorityOrder];
    if (priorityDiff !== 0) return priorityDiff;
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

export const calculateConsecutiveStreak = (
  completedTasks: MaintenanceTask[]
) => {
  if (completedTasks.length === 0) return 0;

  // Sort completed tasks by completion date (newest first)
  const sortedCompletions = completedTasks
    .filter((task) => task.completed_at)
    .sort(
      (a, b) =>
        new Date(b.completed_at!).getTime() -
        new Date(a.completed_at!).getTime()
    );

  if (sortedCompletions.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Start of today

  // Check if we have a completion today
  const todayCompletion = sortedCompletions.find((task) => {
    const completionDate = new Date(task.completed_at!);
    completionDate.setHours(0, 0, 0, 0);
    return completionDate.getTime() === currentDate.getTime();
  });

  if (todayCompletion) {
    streak = 1;
    currentDate.setDate(currentDate.getDate() - 1); // Move to yesterday

    // Count consecutive days backwards
    for (let i = 1; i <= 365; i++) {
      // Max 1 year streak
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);

      const hasCompletion = sortedCompletions.some((task) => {
        const completionDate = new Date(task.completed_at!);
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === checkDate.getTime();
      });

      if (hasCompletion) {
        streak++;
      } else {
        break; // Streak broken
      }
    }
  }

  return streak;
};

export const getDueSoonTasks = (tasks: MaintenanceTask[]) => {
  return tasks.filter((task) => {
    if (task.is_completed) return false;

    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Include overdue tasks and tasks due within 7 days
    return diffDays <= 7;
  });
};
