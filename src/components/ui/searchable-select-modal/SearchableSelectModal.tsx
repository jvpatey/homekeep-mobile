import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  Dimensions,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useGradients, useHaptics, useDevice, useSheetMount } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import { GlassCard } from "../glass-card";
import { SheetGrabber } from "../sheet-grabber";

export interface SearchableOption {
  /** Unique key for the option (e.g. ISO code or id). */
  value: string;
  /** Human-readable label shown in the list and selected state. */
  label: string;
  /** Optional secondary line shown beneath the label (e.g. country code). */
  hint?: string;
}

interface SearchableSelectModalProps {
  visible: boolean;
  title: string;
  options: SearchableOption[];
  selectedValue?: string | null;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
  /** Message shown when filtering yields no results. */
  emptyMessage?: string;
  onClose: () => void;
  onSelect: (option: SearchableOption) => void;
}

export function SearchableSelectModal({
  visible,
  title,
  options,
  selectedValue,
  searchPlaceholder = "Search…",
  emptyMessage = "No matches",
  onClose,
  onSelect,
}: SearchableSelectModalProps) {
  const { colors, isDark } = useTheme();
  const { haloGradient } = useGradients();
  const { triggerLight } = useHaptics();
  const { getTabletSheetContainerStyle } = useDevice();

  const [query, setQuery] = useState("");
  const { mounted, backdropStyle, sheetStyle } = useSheetMount(visible);

  useEffect(() => {
    if (visible) {
      setQuery("");
    }
  }, [visible]);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(trimmed) ||
        opt.value.toLowerCase().includes(trimmed) ||
        (opt.hint?.toLowerCase().includes(trimmed) ?? false)
    );
  }, [query, options]);

  const handleClose = async () => {
    await triggerLight();
    onClose();
  };

  const handleSelect = async (option: SearchableOption) => {
    await triggerLight();
    onSelect(option);
    onClose();
  };

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable
          style={styles.backdropPressable}
          onPress={handleClose}
          accessibilityLabel="Dismiss"
        />
        <Animated.View
          style={[
            styles.sheetContainer,
            getTabletSheetContainerStyle(),
            sheetStyle,
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
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />

            <SafeAreaView edges={["bottom"]} style={styles.sheetSafeArea}>
              <SheetGrabber />

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
                  style={[styles.headerTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {title}
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
                  ]}
                  onPress={handleClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchWrap}>
                <View
                  style={[
                    styles.searchBox,
                    {
                      backgroundColor: isDark
                        ? "rgba(35, 37, 38, 0.55)"
                        : "rgba(255, 255, 255, 0.65)",
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.12)"
                        : "rgba(15, 23, 42, 0.08)",
                    },
                  ]}
                >
                  <Ionicons
                    name="search"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={searchPlaceholder}
                    placeholderTextColor={
                      isDark ? "rgba(255,255,255,0.35)" : "rgba(15,23,42,0.35)"
                    }
                    style={[styles.searchInput, { color: colors.text }]}
                    keyboardAppearance={isDark ? "dark" : "light"}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                  />
                  {query ? (
                    <TouchableOpacity
                      onPress={() => setQuery("")}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      accessibilityRole="button"
                      accessibilityLabel="Clear search"
                    >
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <FlatList
                style={styles.list}
                data={filtered}
                keyExtractor={(item) => item.value}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => (
                  <View
                    style={[
                      styles.separator,
                      {
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.06)"
                          : "rgba(15, 23, 42, 0.06)",
                      },
                    ]}
                  />
                )}
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    <Text
                      style={[
                        styles.emptyText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {emptyMessage}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isSelected = item.value === selectedValue;
                  return (
                    <TouchableOpacity
                      style={styles.row}
                      onPress={() => handleSelect(item)}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                    >
                      <View style={styles.rowText}>
                        <Text
                          style={[
                            styles.rowLabel,
                            {
                              color: colors.text,
                              fontWeight: isSelected ? "700" : "500",
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        {item.hint ? (
                          <Text
                            style={[
                              styles.rowHint,
                              { color: colors.textSecondary },
                            ]}
                            numberOfLines={1}
                          >
                            {item.hint}
                          </Text>
                        ) : null}
                      </View>
                      {isSelected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.primary}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                }}
              />
            </SafeAreaView>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const { height: screenHeight } = Dimensions.get("window");

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    width: "100%",
    height: screenHeight * 0.75,
  },
  glassOuter: {
    flex: 1,
    width: "100%",
    borderTopLeftRadius: DesignSystem.borders.radius.glass,
    borderTopRightRadius: DesignSystem.borders.radius.glass,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
  },
  glassInner: {
    flex: 1,
    borderTopLeftRadius: DesignSystem.borders.radius.glass,
    borderTopRightRadius: DesignSystem.borders.radius.glass,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sheetSafeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...DesignSystem.typography.h3,
    fontSize: 20,
    flex: 1,
    marginRight: DesignSystem.spacing.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.sm,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  list: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    ...DesignSystem.typography.bodyMedium,
    fontSize: 15,
  },
  rowHint: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
    marginTop: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  emptyWrap: {
    paddingVertical: DesignSystem.spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    ...DesignSystem.typography.small,
  },
});
