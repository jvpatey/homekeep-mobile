import { MaintenanceCategory, Priority } from "../../../../types/maintenance";

// categories array
export const categories: Array<{
  id: MaintenanceCategory;
  name: string;
  icon: string;
  color: string;
}> = [
  { id: "HVAC", name: "HVAC", icon: "snow-outline", color: "#C45C26" },
  { id: "PLUMBING", name: "Plumbing", icon: "water-outline", color: "#2F5D50" },
  {
    id: "ELECTRICAL",
    name: "Electrical",
    icon: "flash-outline",
    color: "#C49A3C",
  },
  {
    id: "APPLIANCES",
    name: "Appliances",
    icon: "hardware-chip-outline",
    color: "#8B6914",
  },
  { id: "EXTERIOR", name: "Exterior", icon: "home-outline", color: "#6B645C" },
  { id: "INTERIOR", name: "Interior", icon: "bed-outline", color: "#A67C52" },
  {
    id: "LANDSCAPING",
    name: "Landscaping",
    icon: "leaf-outline",
    color: "#2F5D50",
  },
  {
    id: "SAFETY",
    name: "Safety",
    icon: "shield-checkmark-outline",
    color: "#C0392B",
  },
  {
    id: "GENERAL",
    name: "General",
    icon: "construct-outline",
    color: "#6B645C",
  },
];

// priorities array
export const priorities: Array<{
  id: Priority;
  name: string;
  color: string;
}> = [
  { id: "low", name: "Low", color: "#2F5D50" },
  { id: "medium", name: "Medium", color: "#C49A3C" },
  { id: "high", name: "High", color: "#C45C26" },
  { id: "urgent", name: "Urgent", color: "#C0392B" },
];

// interval options array
export const intervalOptions = [
  { id: 7, name: "Weekly", description: "Every week" },
  { id: 30, name: "Monthly", description: "Every month" },
  { id: 90, name: "Quarterly", description: "Every 3 months" },
  { id: 365, name: "Yearly", description: "Every year" },
  { id: 0, name: "Custom", description: "Custom interval in days" },
];

// interval value examples object
export const intervalValueExamples = {
  7: "e.g., every 2 weeks (14 days)",
  30: "e.g., every 3 months (90 days)",
  90: "e.g., every 6 months (180 days)",
  365: "e.g., every 2 years (730 days)",
  0: "e.g., every 6 months (180 days)",
};
