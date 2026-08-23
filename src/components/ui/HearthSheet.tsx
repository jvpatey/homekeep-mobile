import React, { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleProp,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useGradients, useDevice } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { SheetGrabber } from "./sheet-grabber";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface HearthSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Max height as fraction of screen (0–1). Default 0.92 */
  maxHeightRatio?: number;
  /**
   * When true, sheet fills maxHeight (needed for FlatList / scroll surfaces).
   * When false, sheet sizes to content up to maxHeight.
   */
  fillMaxHeight?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function HearthSheet({
  visible,
  onClose,
  title,
  children,
  footer,
  maxHeightRatio = 0.92,
  fillMaxHeight = false,
  contentStyle,
  accessibilityLabel,
}: HearthSheetProps) {
  const { colors } = useTheme();
  const { authAtmosphere } = useGradients();
  const { getTabletSheetContainerStyle } = useDevice();

  const [mounted, setMounted] = useState(visible);
  const isAnimatingOut = useRef(false);
  const wasVisible = useRef(visible);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const animateIn = useCallback(() => {
    translateY.value = SCREEN_HEIGHT;
    opacity.value = withTiming(1, {
      duration: DesignSystem.motion.duration.fast,
    });
    translateY.value = withSpring(0, DesignSystem.motion.spring.snappy);
  }, [opacity, translateY]);

  const finishClose = useCallback(
    (notifyParent: boolean) => {
      isAnimatingOut.current = false;
      setMounted(false);
      if (notifyParent) {
        onClose();
      }
    },
    [onClose]
  );

  const animateOut = useCallback(
    (notifyParent: boolean) => {
      if (isAnimatingOut.current) return;
      isAnimatingOut.current = true;
      opacity.value = withTiming(0, {
        duration: DesignSystem.motion.duration.fast,
      });
      translateY.value = withTiming(
        SCREEN_HEIGHT,
        { duration: DesignSystem.motion.duration.fast },
        (finished) => {
          if (finished) {
            runOnJS(finishClose)(notifyParent);
          }
        }
      );
    },
    [finishClose, opacity, translateY]
  );

  useEffect(() => {
    if (visible && !wasVisible.current) {
      isAnimatingOut.current = false;
      setMounted(true);
      animateIn();
    } else if (!visible && wasVisible.current && mounted) {
      animateOut(false);
    }
    wasVisible.current = visible;
  }, [visible, mounted, animateIn, animateOut]);

  const dismiss = () => {
    animateOut(true);
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) return null;

  const maxHeight = SCREEN_HEIGHT * maxHeightRatio;

  return (
    <Modal
      transparent
      animationType="none"
      visible={mounted}
      onRequestClose={dismiss}
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardRoot}
      >
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? "Close"}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetContainer,
            getTabletSheetContainerStyle(),
            fillMaxHeight ? { height: maxHeight } : { maxHeight },
            sheetStyle,
          ]}
        >
          <View
            style={[
              styles.sheetSurface,
              fillMaxHeight && styles.sheetSurfaceFill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              DesignSystem.shadows.softKey,
            ]}
          >
            <LinearGradient
              colors={authAtmosphere}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.35 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            <SafeAreaView
              edges={["bottom"]}
              style={[styles.safeArea, fillMaxHeight && styles.safeAreaFill]}
            >
              <SheetGrabber />

              <View style={styles.titleRow}>
                <Text
                  style={[styles.title, { color: colors.text }]}
                  numberOfLines={1}
                  accessibilityRole="header"
                >
                  {title}
                </Text>
                <Pressable
                  onPress={dismiss}
                  hitSlop={8}
                  style={styles.closeHit}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View
                style={[
                  styles.content,
                  fillMaxHeight && styles.contentFill,
                  contentStyle,
                ]}
              >
                {children}
              </View>
              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </SafeAreaView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26, 22, 18, 0.45)",
  },
  sheetContainer: {
    width: "100%",
  },
  sheetSurface: {
    borderTopLeftRadius: DesignSystem.borders.radius.xlarge + 4,
    borderTopRightRadius: DesignSystem.borders.radius.xlarge + 4,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  sheetSurfaceFill: {
    flex: 1,
  },
  safeArea: {
    flexShrink: 1,
  },
  safeAreaFill: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.sm,
  },
  title: {
    ...DesignSystem.typography.title2,
    flex: 1,
    paddingRight: DesignSystem.spacing.md,
  },
  closeHit: {
    minWidth: DesignSystem.components.minTouchTarget,
    minHeight: DesignSystem.components.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: DesignSystem.spacing.lg,
    flexShrink: 1,
  },
  contentFill: {
    flex: 1,
    minHeight: 0,
  },
  footer: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.md,
  },
});
