import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useFeatureAnimation, useHaptics } from "../../hooks";
import { useTasks } from "../../context/TasksContext";
import { AppStackParamList } from "../../navigation/types";
import { styles } from "./styles";

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

// TaskSummaryCards - Features staggered animations and haptic feedback

export function TaskSummaryCards() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { triggerLight } = useHaptics();
  const { stats } = useTasks();
  const cardAnimatedStyles = useFeatureAnimation(3, 400);

  const summaryData = [
    {
      title: "Due Today",
      count: stats.dueToday,
      icon: "today-outline" as const,
      gradient: [colors.primary, colors.secondary] as const,
      iconColor: "#FFFFFF",
      animatedStyle: cardAnimatedStyles[0],
      filterType: "dueToday" as const,
    },
    {
      title: "This Week",
      count: stats.thisWeek,
      icon: "calendar-outline" as const,
      gradient: [colors.secondary, colors.accent] as const,
      iconColor: "#FFFFFF",
      animatedStyle: cardAnimatedStyles[1],
      filterType: "thisWeek" as const,
    },
    {
      title: "Overdue",
      count: stats.overdue,
      icon: "warning-outline" as const,
      gradient: [colors.warning, colors.accent] as const,
      iconColor: "#FFFFFF",
      animatedStyle: cardAnimatedStyles[2],
      filterType: "overdue" as const,
    },
  ];

  const handleCardPress = (cardType: string, filterType: string) => {
    triggerLight();
    navigation.navigate("FilteredTasks", {
      filterType,
      title: cardType,
    });
  };

  return (
    <View style={styles.summaryContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Overview
      </Text>

      <View style={styles.cardsRow}>
        {summaryData.map((card, index) => (
          <Animated.View
            key={index}
            style={[styles.summaryCard, card.animatedStyle]}
          >
            <TouchableOpacity
              onPress={() => handleCardPress(card.title, card.filterType)}
              style={styles.cardTouchable}
            >
              <LinearGradient
                colors={card.gradient}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Ionicons
                      name={card.icon}
                      size={24}
                      color={card.iconColor}
                    />
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardCount}>{card.count}</Text>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
