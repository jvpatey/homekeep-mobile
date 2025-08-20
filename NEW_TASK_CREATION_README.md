# New Task Creation System

This document describes the updated task creation system that reflects the new `TaskSeries` and `TaskInstance` data structure.

## Overview

The new system allows users to create recurring task series rather than individual tasks. Each task series can generate multiple task instances based on the specified interval and start date.

## Data Structure

### TaskSeries Interface

```typescript
interface TaskSeries {
  id: string;
  title: string;
  category: string;
  interval: "weekly" | "monthly" | "yearly" | "custom";
  intervalValue: number; // e.g., 3 for "every 3 months"
  startDate: Date;
  nextDueDate: Date;
  isActive: boolean;
  priority: "low" | "medium" | "high";
  estimatedDuration: number; // in minutes
  instructions?: string;
}
```

### TaskInstance Interface

```typescript
interface TaskInstance {
  id: string;
  seriesId: string;
  dueDate: Date;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}
```

## Components

### 1. CreateTaskModal

The main modal for creating new task series. Features:

- Task title and category selection
- Priority selection (low, medium, high)
- Instructions field (optional)
- Estimated duration in minutes
- Interval selection (weekly, monthly, yearly, custom)
- Interval value adjustment (e.g., every 2 weeks)
- Start date selection with quick options
- Real-time summary of the task series

### 2. IntervalSelector

Allows users to select how often the task should repeat:

- **Weekly**: Every X weeks
- **Monthly**: Every X months
- **Yearly**: Every X years
- **Custom**: Flexible interval (defaults to months)

### 3. StartDateSelector

Provides both quick date options and custom date selection:

- Quick options: Today, Tomorrow, Next Week, Next Month
- Custom date picker with minimum date validation

### 4. CategorySelector

Updated to use the new comprehensive home maintenance categories:

- HVAC (displayed in all caps)
- Plumbing, Electrical, Appliances
- Exterior, Interior, Landscaping
- Safety, General

## Usage

### Testing the New System

1. Navigate to the NewDashboardDemoScreen
2. Tap the floating action button (+)
3. Fill out the task series form
4. Submit to see the success message

### Form Validation

- Title is required
- Category selection is required
- Estimated duration must be greater than 0
- Interval value must be greater than 0

## Future Implementation

When ready to implement the actual services and database:

1. **TaskService**: Update to handle TaskSeries creation
2. **Database**: Add tables for task_series and task_instances
3. **Scheduling**: Implement logic to generate TaskInstances based on intervals
4. **Notifications**: Set up reminders for upcoming task instances

## UI/UX Features

- **Real-time Summary**: Shows exactly what will be created
- **Smart Defaults**: Sensible starting values for all fields
- **Visual Feedback**: Clear indication of selected options
- **Error Handling**: Comprehensive validation with helpful error messages
- **Responsive Design**: Works well on all screen sizes

## Category Display Rules

- **HVAC**: Always displayed in ALL CAPS
- **All other categories**: First letter capitalized only

This maintains consistency with the existing design while highlighting the HVAC category as requested.
