import React, { useState } from "react";
import { View, TouchableOpacity, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import {
  useSimpleAnimation,
  useGradients,
  useHaptics,
  useTasks,
} from "../../hooks";
import { CreateTaskModal } from "./CreateTaskModal/CreateTaskModal";
import { styles } from "./styles";

// FloatingActionButton - Features gradient styling, haptic feedback, and bottom sheet modal

export function FloatingActionButton() {
  const { colors } = useTheme();
  const { primaryGradient } = useGradients();
  const { triggerMedium } = useHaptics();
  const { refreshTasks } = useTasks();
  const [modalVisible, setModalVisible] = useState(false);

  const fabAnimatedStyle = useSimpleAnimation(800, 600, 30);

  const handlePress = () => {
    triggerMedium();
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleTaskCreated = () => {
    setModalVisible(false);
    // Task list is automatically refreshed by useTasks.createTask()
  };

  return (
    <>
      <Animated.View style={[styles.fabContainer, fabAnimatedStyle]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={primaryGradient}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom Sheet Modal for Task Creation */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <CreateTaskModal
            onClose={handleCloseModal}
            onTaskCreated={handleTaskCreated}
          />
        </View>
      </Modal>
    </>
  );
}
