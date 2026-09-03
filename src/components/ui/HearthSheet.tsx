import React, { ReactNode, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
  StyleProp,
  ViewStyle,
  Keyboard,
  KeyboardEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useGradients, useDevice, useSheetMount } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { SheetGrabber } from "./sheet-grabber";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

function useSheetKeyboardInset(enabled: boolean) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setHeight(0);
      return;
    }

    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e: KeyboardEvent) => setHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setHeight(0)
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled]);

  return height;
}

interface HearthSheetProps {
  visible: boolean;
  /** Called when the user requests close (backdrop tap, close button, back). */
  onClose: () => void;
  /** Called after the exit animation finishes (visible became false). */
  onDismissed?: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Optional control to the left of the close button. */
  headerRight?: ReactNode;
  /**
   * Render sheet chrome without an RN Modal. Use for stack
   * `transparentModal` routes so sheets can stack without nested Modals.
   */
  embedded?: boolean;
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
  headerRight,
  embedded = false,
  maxHeightRatio = 0.92,
  fillMaxHeight = false,
  keyboardAvoiding = true,
  contentStyle,
  accessibilityLabel,
}: HearthSheetProps) {
  const { colors } = useTheme();
  const { authAtmosphere } = useGradients();
  const { getTabletSheetContainerStyle } = useDevice();
  const insets = useSafeAreaInsets();
  const keyboardInset = useSheetKeyboardInset(keyboardAvoiding && visible);
  const { mounted, backdropStyle, sheetStyle } = useSheetMount(
    visible,
    onDismissed
  );

  const dismiss = () => {
    onClose();
  };

  if (!mounted) return null;

  const maxHeight = Math.min(
    SCREEN_HEIGHT * maxHeightRatio,
    SCREEN_HEIGHT - insets.top - keyboardInset
  );

  const sheetInterior = (
    <View
      style={[
        styles.safeArea,
        fillMaxHeight && styles.safeAreaFill,
        {
          paddingBottom:
            keyboardInset > 0 ? DesignSystem.spacing.sm : insets.bottom,
        },
      ]}
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
        {headerRight ? (
          <View style={styles.headerRight}>{headerRight}</View>
        ) : null}
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
          styles.body,
          fillMaxHeight && styles.bodyFill,
        ]}
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
      </View>
    </View>
  );

  const sheetLayer = (
    <View
      style={[
        styles.keyboardRoot,
        keyboardInset > 0 && { paddingBottom: keyboardInset },
      ]}
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
          {sheetInterior}
        </View>
      </Animated.View>
    </View>
  );

  if (embedded) {
    return <View style={styles.embeddedHost}>{sheetLayer}</View>;
  }

  return (
    <Modal
      transparent
      animationType="none"
      visible={mounted}
      onRequestClose={dismiss}
      statusBarTranslucent
      accessibilityViewIsModal
    >
      {sheetLayer}
    </Modal>
  );
}

const styles = StyleSheet.create({
  embeddedHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
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
  body: {
    flexShrink: 1,
  },
  bodyFill: {
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
  headerRight: {
    marginRight: DesignSystem.spacing.xs,
    minWidth: DesignSystem.components.minTouchTarget,
    minHeight: DesignSystem.components.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
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
