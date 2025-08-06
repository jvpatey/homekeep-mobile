import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useFeatureAnimation, useHaptics } from "../../hooks";
import { styles } from "./styles";

/**
 * TaskSummaryCards - Display key task metrics in gradient cards
 * Features staggered animations and haptic feedback following iOS design patterns
 */
export function TaskSummaryCards() {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const cardAnimatedStyles = useFeatureAnimation(3, 400);

  // TODO: Replace with real task data from API
  const summaryData = [
    {
      title: "Due Today",
      count: 0, // Will be populated from API
      icon: "today-outline" as const,
      gradient: [colors.primary, colors.secondary] as const,
      iconColor: "#FFFFFF",
      animatedStyle: cardAnimatedStyles[0],
    },
    {
      title: "This Week",
      count: 0, // Will be populated from API
      icon: "calendar-outline" as const,
      gradient: [colors.secondary, colors.accent] as const,
      iconColor: "#FFFFFF",
      animatedStyle: cardAnimatedStyles[1],
    },
    {
      title: "Overdue",
      count: 0, // Will be populated from API
      icon: "warning-outline" as const,
      gradient: [colors.warning, colors.accent] as const,
      iconColor: "#FFFFFF",
      animatedStyle: cardAnimatedStyles[2],
    },
  ];

  const handleCardPress = (cardType: string) => {
    triggerLight();
    // TODO: Navigate to filtered task list
    console.log(`Pressed ${cardType} card`);
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
              onPress={() => handleCardPress(card.title)}
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
