export const getCategoryColor = (category: string): string => {
  const categoryColors: { [key: string]: string } = {
    hvac: "#FF6B6B",
    plumbing: "#4ECDC4",
    electrical: "#45B7D1",
    appliances: "#96CEB4",
    maintenance: "#FFEAA7",
    cleaning: "#DDA0DD",
    landscaping: "#98D8C8",
  };
  return categoryColors[category.toLowerCase()] || "#95A5A6";
};

export const getCategoryGradient = (category: string): [string, string] => {
  const baseColor = getCategoryColor(category);
  // Create a gradient by lightening the base color
  const lightColor = baseColor + "CC"; // Add transparency for lighter effect
  return [baseColor, lightColor];
};

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
      weekday: "short",
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }
};
