import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Pressable,
  Dimensions,
  Alert,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useNotifications } from "../../../context/NotificationContext";
import { useGradients, useHaptics, useDevice } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import { GlassCard, SheetGrabber } from "../../ui";
import { HOME_MAINTENANCE_CATEGORIES } from "../../../types/maintenance";
import { MaintenanceCategory } from "../../../types/maintenance";
import {
  getNotificationTypeConfig,
  isNotificationTypeEnabled,
  getNotificationTypes,
} from "../../../screens/notification-preferences/utils";
import { styles } from "./styles";

const { height: screenHeight } = Dimensions.get("window");

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationSettingsModal({
  visible,
  onClose,
}: NotificationSettingsModalProps) {
  const { colors, isDark } = useTheme();
  const {
    notificationSettings,
    updateNotificationPreferences,
    updateGlobalNotificationSettings,
    permissionStatus,
    syncPushToken,
    pushTokenError,
  } = useNotifications();
  const { haloGradient } = useGradients();
  const { triggerLight } = useHaptics();
  const { isTablet, getFontMultiplier, getResponsiveValue, getTabletSheetContainerStyle } =
    useDevice();
  const fontMultiplier = getFontMultiplier();
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [mounted, setMounted] = useState(visible);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);

  React.useEffect(() => {
    if (visible) {
      setMounted(true);
      opacity.value = withTiming(1, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      });
      translateY.value = withSpring(0, DesignSystem.motion.spring.snappy);
    } else {
      opacity.value = withTiming(0, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      });
      translateY.value = withTiming(
        screenHeight,
        {
          duration: DesignSystem.motion.duration.fast,
          easing: DesignSystem.motion.easing.standard,
        },
        (finished) => {
          if (finished) runOnJS(setMounted)(false);
        }
      );
    }
  }, [visible]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleClose = async () => {
    await triggerLight();
    onClose();
  };

  const handleGlobalToggle = async (enabled: boolean) => {
    await triggerLight();
    await updateGlobalNotificationSettings(enabled);
  };

  const handleNotificationTypeToggle = async (
    type: string,
    enabled: boolean
  ) => {
    await triggerLight();
    Object.keys(notificationSettings.categories).forEach((category) => {
      updateNotificationPreferences(category as MaintenanceCategory, {
        [type]: enabled,
      });
    });
  };

  const toggleTypeExpansion = (type: string) => {
    setExpandedType(expandedType === type ? null : type);
  };

  const handleEnablePermissions = async () => {
    await triggerLight();
    if (permissionStatus.canAskAgain) {
      const registered = await syncPushToken();
      if (!registered) {
        Alert.alert(
          "Notifications Not Enabled",
          "Allow notifications when prompted to receive task reminders."
        );
      }
      return;
    }
    await Linking.openSettings();
  };

  const renderNotificationTypeSection = (type: string) => {
    const config = getNotificationTypeConfig(type, colors);
    if (!config) return null;

    const isEnabled = isNotificationTypeEnabled(type, notificationSettings);
    const isExpanded = expandedType === type;

    return (
      <View
        key={type}
        style={[
          styles.notificationTypeSection,
          {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.02)",
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.05)",
          },
          isTablet && {
            borderRadius: getResponsiveValue(16, 20, 24),
            padding: getResponsiveValue(16, 20, 24),
            marginBottom: getResponsiveValue(12, 16, 20),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.notificationTypeHeader}
          onPress={() => toggleTypeExpansion(type)}
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          accessibilityLabel={`${config.title}, ${
            isExpanded ? "expanded" : "collapsed"
          }`}
        >
          <View style={styles.notificationTypeHeaderLeft}>
            <View
              style={[
                styles.notificationTypeIcon,
                { backgroundColor: config.color + "15" },
                isTablet && {
                  width: getResponsiveValue(40, 48, 52),
                  height: getResponsiveValue(40, 48, 52),
                  borderRadius: getResponsiveValue(20, 24, 26),
                  marginRight: getResponsiveValue(12, 16, 20),
                },
              ]}
            >
              <Ionicons
                name={config.icon as any}
                size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
                color={config.color}
              />
            </View>
            <View style={styles.notificationTypeInfo}>
              <Text
                style={[
                  styles.notificationTypeName,
                  { color: colors.text },
                  isTablet && {
                    fontSize:
                      (styles.notificationTypeName.fontSize || 16) *
                      fontMultiplier,
                    lineHeight:
                      (styles.notificationTypeName.fontSize || 16) *
                      fontMultiplier *
                      1.2,
                  },
                ]}
              >
                {config.title}
              </Text>
              <Text
                style={[
                  styles.notificationTypeDescription,
                  { color: colors.textSecondary },
                  isTablet && {
                    fontSize:
                      (styles.notificationTypeDescription.fontSize || 13) *
                      fontMultiplier,
                    lineHeight:
                      (styles.notificationTypeDescription.fontSize || 13) *
                      fontMultiplier *
                      1.4,
                  },
                ]}
              >
                {config.description}
              </Text>
            </View>
          </View>
          <View style={styles.notificationTypeHeaderRight}>
            <Switch
              value={isEnabled}
              onValueChange={(value) =>
                handleNotificationTypeToggle(type, value)
              }
              trackColor={{ false: colors.border, true: colors.primary + "40" }}
              thumbColor={isEnabled ? colors.primary : colors.textSecondary}
            />
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
              color={colors.textSecondary}
              style={styles.expandIcon}
            />
          </View>
        </TouchableOpacity>

        {isExpanded ? (
          <View
            style={[
              styles.categoriesContainer,
              {
                borderTopColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.06)",
              },
            ]}
          >
            <Text
              style={[
                styles.categoriesTitle,
                { color: colors.textSecondary },
                isTablet && {
                  fontSize:
                    (styles.categoriesTitle.fontSize || 14) * fontMultiplier,
                },
              ]}
            >
              Categories
            </Text>
            <Text
              style={[
                styles.categoriesDescription,
                { color: colors.textSecondary },
                isTablet && {
                  fontSize:
                    (styles.categoriesDescription.fontSize || 13) *
                    fontMultiplier,
                  lineHeight:
                    (styles.categoriesDescription.fontSize || 13) *
                    fontMultiplier *
                    1.4,
                },
              ]}
            >
              Choose which maintenance categories receive{" "}
              {config.title.toLowerCase()}
            </Text>

            {Object.keys(HOME_MAINTENANCE_CATEGORIES).map((category) => {
              const categoryData =
                HOME_MAINTENANCE_CATEGORIES[category as MaintenanceCategory];
              const preferences =
                notificationSettings.categories[
                  category as MaintenanceCategory
                ];

              if (!preferences) return null;

              return (
                <View
                  key={category}
                  style={[
                    styles.categoryRow,
                    {
                      borderBottomColor: isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.05)",
                    },
                  ]}
                >
                  <View style={styles.categoryRowLeft}>
                    <LinearGradient
                      colors={categoryData.gradient}
                      style={[
                        styles.categoryRowIcon,
                        isTablet && {
                          width: getResponsiveValue(32, 40, 44),
                          height: getResponsiveValue(32, 40, 44),
                          borderRadius: getResponsiveValue(16, 20, 22),
                        },
                      ]}
                    >
                      <Ionicons
                        name={categoryData.icon as any}
                        size={isTablet ? getResponsiveValue(16, 20, 22) : 16}
                        color="white"
                      />
                    </LinearGradient>
                    <Text
                      style={[
                        styles.categoryRowName,
                        { color: colors.text },
                        isTablet && {
                          fontSize:
                            (styles.categoryRowName.fontSize || 14) *
                            fontMultiplier,
                        },
                      ]}
                    >
                      {categoryData.displayName}
                    </Text>
                  </View>
                  <Switch
                    value={
                      preferences[type as keyof typeof preferences] as boolean
                    }
                    onValueChange={(value) =>
                      updateNotificationPreferences(
                        category as MaintenanceCategory,
                        { [type]: value }
                      )
                    }
                    trackColor={{
                      false: colors.border,
                      true: colors.primary + "40",
                    }}
                    thumbColor={
                      (preferences[type as keyof typeof preferences] as boolean)
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable
          style={styles.backdropPressable}
          onPress={handleClose}
          accessibilityLabel="Dismiss"
        />
        <Animated.View
          style={[
            styles.sheetContainer,
            getTabletSheetContainerStyle(),
            animatedSheetStyle,
          ]}
          pointerEvents="auto"
        >
          <GlassCard
            material="thick"
            radius={DesignSystem.borders.radius.glass}
            containerStyle={styles.glassOuter}
            style={styles.glassInner}
          >
            <LinearGradient
              colors={[...haloGradient]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.haloFill}
              pointerEvents="none"
            />

            <SafeAreaView edges={["bottom"]} style={styles.sheetSafeArea}>
              <SheetGrabber />

              {/* Header */}
              <View
                style={[
                  styles.header,
                  {
                    borderBottomColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.08)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.headerTitle,
                    { color: colors.text },
                    isTablet && {
                      fontSize:
                        (styles.headerTitle.fontSize || 20) * fontMultiplier,
                      lineHeight:
                        (styles.headerTitle.fontSize || 20) *
                        fontMultiplier *
                        1.2,
                    },
                  ]}
                >
                  Notification Settings
                </Text>
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    {
                      backgroundColor: isDark
                        ? "rgba(35, 37, 38, 0.55)"
                        : "rgba(255, 255, 255, 0.45)",
                      borderWidth: DesignSystem.borders.hairline,
                      borderColor: colors.glassStroke,
                    },
                    isTablet && {
                      width: getResponsiveValue(36, 44, 48),
                      height: getResponsiveValue(36, 44, 48),
                      borderRadius: getResponsiveValue(18, 22, 24),
                    },
                  ]}
                  onPress={handleClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons
                    name="close"
                    size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                  styles.scrollContent,
                  isTablet && {
                    paddingHorizontal: getResponsiveValue(20, 28, 32),
                  },
                ]}
                showsVerticalScrollIndicator
              >
                {/* Global Settings */}
                <View
                  style={[
                    styles.globalSection,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.02)",
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.05)",
                    },
                    isTablet && {
                      marginTop: getResponsiveValue(20, 28, 32),
                      padding: getResponsiveValue(20, 28, 32),
                      marginBottom: getResponsiveValue(20, 28, 32),
                      borderRadius: getResponsiveValue(16, 20, 24),
                    },
                  ]}
                >
                  <View style={styles.globalHeader}>
                    <View style={styles.globalHeaderLeft}>
                      <View
                        style={[
                          styles.globalIcon,
                          { backgroundColor: colors.primary + "15" },
                          isTablet && {
                            width: getResponsiveValue(48, 56, 64),
                            height: getResponsiveValue(48, 56, 64),
                            borderRadius: getResponsiveValue(24, 28, 32),
                            marginRight: getResponsiveValue(16, 20, 24),
                          },
                        ]}
                      >
                        <Ionicons
                          name="notifications"
                          size={isTablet ? getResponsiveValue(24, 28, 32) : 24}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.globalInfo}>
                        <Text
                          style={[
                            styles.globalTitle,
                            { color: colors.text },
                            isTablet && {
                              fontSize:
                                (styles.globalTitle.fontSize || 18) *
                                fontMultiplier,
                              lineHeight:
                                (styles.globalTitle.fontSize || 18) *
                                fontMultiplier *
                                1.2,
                            },
                          ]}
                        >
                          All Notifications
                        </Text>
                        <Text
                          style={[
                            styles.globalDescription,
                            { color: colors.textSecondary },
                            isTablet && {
                              fontSize:
                                (styles.globalDescription.fontSize || 14) *
                                fontMultiplier,
                              lineHeight:
                                (styles.globalDescription.fontSize || 14) *
                                fontMultiplier *
                                1.4,
                            },
                          ]}
                        >
                          Enable or disable all notifications
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={notificationSettings.globalEnabled}
                      onValueChange={handleGlobalToggle}
                      trackColor={{
                        false: colors.border,
                        true: colors.primary + "40",
                      }}
                      thumbColor={
                        notificationSettings.globalEnabled
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                  </View>
                </View>

                {/* Permission Status */}
                {!permissionStatus.granted ? (
                  <View
                    style={[
                      styles.permissionSection,
                      {
                        backgroundColor: isDark
                          ? "rgba(255, 107, 107, 0.1)"
                          : "rgba(255, 107, 107, 0.05)",
                        borderColor: isDark
                          ? "rgba(255, 107, 107, 0.2)"
                          : "rgba(235, 87, 87, 0.2)",
                      },
                    ]}
                  >
                    <View style={styles.permissionContent}>
                      <Ionicons
                        name="warning"
                        size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
                        color={colors.error}
                      />
                      <Text
                        style={[
                          styles.permissionText,
                          { color: colors.error },
                          isTablet && {
                            fontSize:
                              (styles.permissionText.fontSize || 14) *
                              fontMultiplier,
                            lineHeight:
                              (styles.permissionText.fontSize || 14) *
                              fontMultiplier *
                              1.4,
                            marginLeft: getResponsiveValue(12, 16, 20),
                          },
                        ]}
                      >
                        {permissionStatus.canAskAgain
                          ? "Notifications are disabled. Enable them to receive task reminders."
                          : "Notifications are blocked. Please enable them in device settings."}
                      </Text>
                    </View>
                    {permissionStatus.canAskAgain ? (
                      <TouchableOpacity
                        style={[
                          styles.permissionButton,
                          { backgroundColor: colors.error },
                          isTablet && {
                            paddingHorizontal: getResponsiveValue(16, 20, 24),
                            paddingVertical: getResponsiveValue(8, 10, 12),
                            borderRadius: getResponsiveValue(8, 10, 12),
                          },
                        ]}
                        onPress={handleEnablePermissions}
                      >
                        <Text
                          style={[
                            styles.permissionButtonText,
                            isTablet && {
                              fontSize:
                                (styles.permissionButtonText.fontSize || 14) *
                                fontMultiplier,
                            },
                          ]}
                        >
                          Enable
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.permissionButton,
                          { backgroundColor: colors.error },
                        ]}
                        onPress={() => Linking.openSettings()}
                      >
                        <Text style={styles.permissionButtonText}>
                          Open Settings
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}

                {permissionStatus.granted && pushTokenError ? (
                  <View style={styles.permissionSection}>
                    <Text
                      style={[
                        styles.permissionText,
                        { color: colors.error, marginTop: 8 },
                      ]}
                    >
                      Token save error: {pushTokenError}
                    </Text>
                  </View>
                ) : null}

                {/* Notification Types */}
                {notificationSettings.globalEnabled ? (
                  <>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.text },
                        isTablet && {
                          fontSize:
                            (styles.sectionTitle.fontSize || 18) *
                            fontMultiplier,
                          lineHeight:
                            (styles.sectionTitle.fontSize || 18) *
                            fontMultiplier *
                            1.2,
                          marginBottom: getResponsiveValue(8, 12, 16),
                          marginTop: getResponsiveValue(20, 28, 32),
                        },
                      ]}
                    >
                      Notification Types
                    </Text>
                    <Text
                      style={[
                        styles.sectionDescription,
                        { color: colors.textSecondary },
                        isTablet && {
                          fontSize:
                            (styles.sectionDescription.fontSize || 14) *
                            fontMultiplier,
                          lineHeight:
                            (styles.sectionDescription.fontSize || 14) *
                            fontMultiplier *
                            1.4,
                          marginBottom: getResponsiveValue(20, 28, 32),
                        },
                      ]}
                    >
                      Configure which types of notifications you want to receive
                    </Text>

                    {getNotificationTypes().map((type) =>
                      renderNotificationTypeSection(type)
                    )}
                  </>
                ) : null}

                <View style={styles.bottomSpacer} />
              </ScrollView>
            </SafeAreaView>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
