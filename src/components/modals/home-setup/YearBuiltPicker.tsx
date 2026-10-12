import React, { useMemo, useRef, useState } from "react";
import {
  AccessibilityActionEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useHaptics, useReducedMotion } from "../../../hooks";
import { MIN_YEAR_BUILT } from "../../../data/maintenancePlans";
import { DesignSystem } from "../../../theme/designSystem";

const ROW_HEIGHT = 40;
const VISIBLE_ROWS = 5;
const PAD_ROWS = (VISIBLE_ROWS - 1) / 2;
const NOT_SURE = "Not sure";

type WheelItem = number | null;

// A plain ScrollView (not FlatList) because the wheel sits inside the setup
// step's vertical ScrollView; ~330 static rows render cheaply.
function YearWheel({
  items,
  value,
  onChange,
}: {
  items: WheelItem[];
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const { colors } = useTheme();
  const { triggerSelection } = useHaptics();
  const scrollRef = useRef<ScrollView>(null);
  const initialIndex = Math.max(0, items.indexOf(value));
  const selectedIndex = useRef(initialIndex);
  const positioned = useRef(false);
  const tickIndex = useSharedValue(initialIndex);

  const commitOffset = (offsetY: number) => {
    const index = Math.min(
      items.length - 1,
      Math.max(0, Math.round(offsetY / ROW_HEIGHT))
    );
    if (index === selectedIndex.current) return;
    selectedIndex.current = index;
    onChange(items[index]);
  };

  const selectIndex = (index: number) => {
    const next = Math.min(items.length - 1, Math.max(0, index));
    scrollRef.current?.scrollTo({ y: next * ROW_HEIGHT, animated: true });
    selectedIndex.current = next;
    onChange(items[next]);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const index = Math.round(event.contentOffset.y / ROW_HEIGHT);
      if (index !== tickIndex.value && index >= 0 && index < items.length) {
        tickIndex.value = index;
        runOnJS(triggerSelection)();
      }
    },
  });

  const handleScrollEndDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    // No momentum phase follows a slow release, so commit here.
    if (Math.abs(event.nativeEvent.velocity?.y ?? 0) < 0.05) {
      commitOffset(event.nativeEvent.contentOffset.y);
    }
  };

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === "increment") {
      selectIndex(selectedIndex.current - 1);
    } else if (event.nativeEvent.actionName === "decrement") {
      selectIndex(selectedIndex.current + 1);
    }
  };

  return (
    <View
      style={styles.wheel}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Year built"
      accessibilityValue={{ text: value === null ? NOT_SURE : String(value) }}
      accessibilityActions={[
        { name: "increment" },
        { name: "decrement" },
      ]}
      onAccessibilityAction={handleAccessibilityAction}
    >
      <View
        pointerEvents="none"
        style={[
          styles.selectionBand,
          { backgroundColor: colors.fieldFill, borderColor: colors.border },
        ]}
      />
      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.wheelContent}
        contentOffset={{ x: 0, y: initialIndex * ROW_HEIGHT }}
        onLayout={() => {
          if (positioned.current) return;
          positioned.current = true;
          scrollRef.current?.scrollTo({
            y: initialIndex * ROW_HEIGHT,
            animated: false,
          });
        }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW_HEIGHT}
        decelerationRate="fast"
        nestedScrollEnabled
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) =>
          commitOffset(event.nativeEvent.contentOffset.y)
        }
        onScrollEndDrag={handleScrollEndDrag}
        importantForAccessibility="no-hide-descendants"
      >
        {items.map((item) => (
          <View key={item === null ? "unknown" : item} style={styles.row}>
            <Text
              style={[
                styles.rowText,
                { color: item === null ? colors.textSecondary : colors.text },
              ]}
            >
              {item === null ? NOT_SURE : item}
            </Text>
          </View>
        ))}
      </Animated.ScrollView>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.surface, colors.surface + "00"]}
        style={[styles.fade, styles.fadeTop]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[colors.surface + "00", colors.surface]}
        style={[styles.fade, styles.fadeBottom]}
      />
    </View>
  );
}

/** Compact "Year built" row that expands into a year wheel. */
export function YearBuiltPicker({
  value,
  onChange,
  onOpen,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  /** Lets the parent scroll the wheel into view. */
  onOpen?: () => void;
}) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  const items = useMemo<WheelItem[]>(() => {
    const currentYear = new Date().getFullYear();
    const years: WheelItem[] = [null];
    for (let year = currentYear; year >= MIN_YEAR_BUILT; year -= 1) {
      years.push(year);
    }
    return years;
  }, []);

  return (
    <View>
      <Pressable
        onPress={() => {
          triggerLight();
          if (!open) onOpen?.();
          setOpen(!open);
        }}
        style={({ pressed }) => [
          styles.summary,
          {
            backgroundColor: colors.fieldFill,
            borderColor: open ? colors.primary : colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Built in ${value ?? NOT_SURE}`}
        accessibilityHint={open ? "Hides the year picker" : "Shows the year picker"}
        accessibilityState={{ expanded: open }}
      >
        <Text style={[styles.summaryLabel, { color: colors.text }]}>
          Built in
        </Text>
        <Text
          style={[
            styles.summaryValue,
            { color: value === null ? colors.textSecondary : colors.primary },
          ]}
        >
          {value ?? NOT_SURE}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.textSecondary}
        />
      </Pressable>
      {open ? (
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(200)}
          exiting={reducedMotion ? undefined : FadeOut.duration(120)}
        >
          <YearWheel items={items} value={value} onChange={onChange} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    minHeight: 52,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summaryLabel: {
    ...DesignSystem.typography.smallMedium,
    flex: 1,
  },
  summaryValue: {
    ...DesignSystem.typography.bodySemiBold,
  },
  wheel: {
    height: ROW_HEIGHT * VISIBLE_ROWS,
    marginTop: DesignSystem.spacing.sm,
    justifyContent: "center",
  },
  wheelContent: {
    paddingVertical: ROW_HEIGHT * PAD_ROWS,
  },
  selectionBand: {
    position: "absolute",
    left: 0,
    right: 0,
    top: ROW_HEIGHT * PAD_ROWS,
    height: ROW_HEIGHT,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    height: ROW_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    height: ROW_HEIGHT * PAD_ROWS,
  },
  fadeTop: {
    top: 0,
  },
  fadeBottom: {
    bottom: 0,
  },
  rowText: {
    ...DesignSystem.typography.title2,
    fontVariant: ["tabular-nums"],
  },
});
