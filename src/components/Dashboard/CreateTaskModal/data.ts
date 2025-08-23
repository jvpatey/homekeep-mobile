// Data for the CreateTaskModal - Updated for new Maintenance Routine structure

import { MaintenanceCategory, Priority } from "../../../types/maintenance";

export const categories: Array<{
  id: MaintenanceCategory;
  name: string;
  icon: string;
  color: string;
}> = [
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

export const priorities: Array<{
  id: Priority;
  name: string;
  color: string;
}> = [
  { id: "low", name: "Low", color: "#95A5A6" },
  { id: "medium", name: "Medium", color: "#3498DB" },
  { id: "high", name: "High", color: "#E74C3C" },
  { id: "urgent", name: "Urgent", color: "#C0392B" },
];

export const intervalOptions = [
  { id: 7, name: "Weekly", description: "Every week" },
  { id: 30, name: "Monthly", description: "Every month" },
  { id: 90, name: "Quarterly", description: "Every 3 months" },
  { id: 365, name: "Yearly", description: "Every year" },
  { id: 0, name: "Custom", description: "Custom interval in days" },
];

export const intervalValueExamples = {
  7: "e.g., every 2 weeks (14 days)",
  30: "e.g., every 3 months (90 days)",
  90: "e.g., every 6 months (180 days)",
  365: "e.g., every 2 years (730 days)",
  0: "e.g., every 6 months (180 days)",
};
