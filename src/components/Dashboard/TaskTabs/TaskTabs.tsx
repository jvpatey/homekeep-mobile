import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useTasks } from "../../../context/TasksContext";
import { DesignSystem } from "../../../theme/designSystem";
import { UpcomingTasks } from "../UpcomingTasks";
import { CompletedTasks } from "../CompletedTasks";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type TabType = "upcoming" | "completed";

interface TaskTabsProps {
  searchQuery?: string;
}

interface TabInfo {
  id: TabType;
  label: string;
  icon: string;
  count: number;
}

export function TaskTabs({ searchQuery = "" }: TaskTabsProps) {
  const { colors } = useTheme();
  const { upcomingTasks, completedTasks } = useTasks();
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [slideAnim] = useState(new Animated.Value(0));

  const tabs: TabInfo[] = [
    {
      id: "upcoming",
      label: "Upcoming",
      icon: "time-outline",
      count: upcomingTasks.length,
    },
    {
      id: "completed",
      label: "Completed",
      icon: "checkmark-circle-outline",
      count: completedTasks.length,
    },
  ];

  const handleTabPress = (tabId: TabType) => {
    if (tabId === activeTab) return;

    const toValue = tabId === "completed" ? 1 : 0;

    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    setActiveTab(tabId);
  };

  const renderTabButton = (tab: TabInfo) => {
    const isActive = activeTab === tab.id;

    return (
      <TouchableOpacity
        key={tab.id}
        style={[
          styles.tabButton,
          isActive && [
            styles.activeTabButton,
            { backgroundColor: colors.primary },
          ],
        ]}
        onPress={() => handleTabPress(tab.id)}
        activeOpacity={0.7}
      >
        <View style={styles.tabContent}>
          <Ionicons
            name={tab.icon as any}
            size={20}
            color={isActive ? "white" : colors.textSecondary}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: isActive ? "white" : colors.textSecondary,
                fontWeight: isActive ? "700" : "500",
              },
            ]}
          >
            {tab.label}
          </Text>
          {tab.count > 0 && (
            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor: isActive
                    ? "rgba(255, 255, 255, 0.2)"
                    : colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.countText,
                  { color: isActive ? "white" : "white" },
                ]}
              >
                {tab.count}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "upcoming":
        return <UpcomingTasks searchQuery={searchQuery} />;
      case "completed":
        return <CompletedTasks searchQuery={searchQuery} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Header */}
      <View style={styles.tabHeader}>
        <View
          style={[styles.tabContainer, { backgroundColor: colors.surface }]}
        >
          {tabs.map(renderTabButton)}
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabHeader: {
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingTop: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.lg,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.xs,
    ...DesignSystem.shadows.medium,
  },
  tabButton: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.sm + 2, // 10px
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    alignItems: "center",
    justifyContent: "center",
    minHeight: DesignSystem.components.minTouchTarget,
  },
  activeTabButton: {
    ...DesignSystem.shadows.small,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  tabIcon: {
    // Icon styling
  },
  tabLabel: {
    ...DesignSystem.typography.smallSemiBold,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: DesignSystem.borders.radius.round,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DesignSystem.spacing.xs + 2, // 6px
  },
  countText: {
    ...DesignSystem.typography.captionSemiBold,
    lineHeight: 16,
  },
  contentContainer: {
    flex: 1,
    marginTop: -DesignSystem.spacing.sm,
  },
});
