// Data for the CreateTaskModal - Updated for new TaskSeries structure

export const categories = [
  { id: "HVAC", name: "HVAC", icon: "snow-outline", color: "#FF6B6B" },
  { id: "PLUMBING", name: "Plumbing", icon: "water-outline", color: "#4ECDC4" },
  {
    id: "ELECTRICAL",
    name: "Electrical",
    icon: "flash-outline",
    color: "#FFE66D",
  },
  {
    id: "APPLIANCES",
    name: "Appliances",
    icon: "hardware-chip-outline",
    color: "#A8E6CF",
  },
  { id: "EXTERIOR", name: "Exterior", icon: "home-outline", color: "#FF9A8B" },
  { id: "INTERIOR", name: "Interior", icon: "bed-outline", color: "#B8E0D2" },
  {
    id: "LANDSCAPING",
    name: "Landscaping",
    icon: "leaf-outline",
    color: "#95E1D3",
  },
  {
    id: "SAFETY",
    name: "Safety",
    icon: "shield-checkmark-outline",
    color: "#F38181",
  },
  {
    id: "GENERAL",
    name: "General",
    icon: "construct-outline",
    color: "#C7CEEA",
  },
];

export const priorities = [
  { id: "low", name: "Low", color: "#95A5A6" },
  { id: "medium", name: "Medium", color: "#3498DB" },
  { id: "high", name: "High", color: "#E74C3C" },
];

export const intervalOptions = [
  { id: "weekly" as const, name: "Weekly", description: "Every week" },
  { id: "monthly" as const, name: "Monthly", description: "Every month" },
  { id: "yearly" as const, name: "Yearly", description: "Every year" },
  { id: "custom" as const, name: "Custom", description: "Custom interval" },
];

export const intervalValueExamples = {
  weekly: "e.g., every 2 weeks",
  monthly: "e.g., every 3 months",
  yearly: "e.g., every 2 years",
  custom: "e.g., every 6 months",
};
