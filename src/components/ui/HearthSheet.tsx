import React, { ReactNode } from "react";
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
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useGradients, useDevice, useSheetMount } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { SheetGrabber } from "./sheet-grabber";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface HearthSheetProps {
  visible: boolean;
  /** Called when the user requests close (backdrop tap, close button, back). */
  onClose: () => void;
  /** Called after the exit animation finishes (visible became false). */
  onDismissed?: () => void;
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
  /** Lift sheet when the keyboard opens (iOS forms). Default true. */
  keyboardAvoiding?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function HearthSheet({
  visible,
  onClose,
  onDismissed,
  title,
  children,
  footer,
  maxHeightRatio = 0.92,
  fillMaxHeight = false,
  keyboardAvoiding = true,
  contentStyle,
  accessibilityLabel,
}: HearthSheetProps) {
  const { colors } = useTheme();
  const { authAtmosphere } = useGradients();
  const { getTabletSheetContainerStyle } = useDevice();
  const { mounted, backdropStyle, sheetStyle } = useSheetMount(
    visible,
    onDismissed
  );

  const dismiss = () => {
    onClose();
  };

  if (!mounted) return null;

  const maxHeight = SCREEN_HEIGHT * maxHeightRatio;

  const sheetInterior = (
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

      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[
            styles.keyboardAvoiding,
            fillMaxHeight && styles.keyboardAvoidingFill,
          ]}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <View
            style={[
              styles.content,
              fillMaxHeight && styles.contentFill,
              contentStyle,
            ]}
          >
            {children}
          </View>
          {footer ? (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              {footer}
            </View>
          ) : null}
        </KeyboardAvoidingView>
      ) : (
        <>
          <View
            style={[
              styles.content,
              fillMaxHeight && styles.contentFill,
              contentStyle,
            ]}
          >
            {children}
          </View>
          {footer ? (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              {footer}
            </View>
          ) : null}
        </>
      )}
    </SafeAreaView>
  );

  return (
    <Modal
      transparent
      animationType="none"
      visible={mounted}
      onRequestClose={dismiss}
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <View style={styles.keyboardRoot}>
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
            {sheetInterior}
          </View>
        </Animated.View>
      </View>
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
  keyboardAvoiding: {
    flexShrink: 1,
  },
  keyboardAvoidingFill: {
    flex: 1,
    minHeight: 0,
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
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
