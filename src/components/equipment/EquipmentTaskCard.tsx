import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { useEquipmentIndex } from "../../hooks/useEquipmentIndex";
import { equipmentTypeIcon } from "../../types/equipmentManual";
import { bestConsumableForTask } from "../../data/equipmentTaskHints";
import { DesignSystem } from "../../theme/designSystem";
import { equipmentTint } from "./equipmentGroups";

/**
 * "For: Basement furnace" card on a task, with its parts as chips. Tapping a
 * chip copies the part number or size for reordering.
 */
export function EquipmentTaskCard({
  equipmentId,
  taskTitle,
  onOpen,
}: {
  equipmentId: string;
  taskTitle: string;
  onOpen?: (equipmentId: string) => void;
}) {
  const { colors } = useTheme();
  const { triggerLight, triggerSuccess } = useHaptics();
  const { byId } = useEquipmentIndex({ refreshOnFocus: false });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const item = byId.get(equipmentId);
  const parts = useMemo(() => {
    const consumables = item?.consumables ?? [];
    const best = bestConsumableForTask(taskTitle, consumables);
    return best
      ? [best, ...consumables.filter((part) => part.id !== best.id)]
      : consumables;
  }, [item?.consumables, taskTitle]);

  if (!item) return null;

  const tint = equipmentTint(item.equipment_type);
  const identity = [
    item.manufacturer,
    item.model_number ? `Model ${item.model_number}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const copy = async (id: string, value: string) => {
    await Clipboard.setStringAsync(value);
    triggerSuccess();
    setCopiedId(id);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.fieldFill, borderColor: colors.border },
      ]}
    >
      <Pressable
        onPress={
          onOpen
            ? () => {
                triggerLight();
                onOpen(item.id);
              }
            : undefined
        }
        disabled={!onOpen}
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.7 }]}
        accessibilityRole={onOpen ? "button" : undefined}
        accessibilityLabel={`For ${item.name}${identity ? `, ${identity}` : ""}`}
      >
        <View style={[styles.icon, { backgroundColor: tint }]}>
          <Ionicons
            name={equipmentTypeIcon(item.equipment_type)}
            size={18}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.text}>
          <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>
            For
          </Text>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {identity ? (
            <Text
              style={[styles.identity, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {identity}
            </Text>
          ) : null}
        </View>
        {onOpen ? (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textSecondary}
          />
        ) : null}
      </Pressable>

      {parts.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {parts.map((part, index) => {
            const detail = part.size || part.partNumber;
            const value =
              [part.partNumber, part.size].filter(Boolean).join(" ") ||
              part.label;
            const copied = copiedId === part.id;
            const primary = index === 0;
            return (
              <Pressable
                key={part.id}
                onPress={() => void copy(part.id, value)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: primary
                      ? colors.primary + "14"
                      : colors.surface,
                    borderColor: primary
                      ? colors.primary + "44"
                      : colors.border,
                  },
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${part.label}${
                  detail ? ` ${detail}` : ""
                }. Copy`}
              >
                <Ionicons
                  name={copied ? "checkmark" : "cube-outline"}
                  size={13}
                  color={primary ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.chipLabel,
                    { color: primary ? colors.primary : colors.text },
                  ]}
                >
                  {copied ? "Copied" : part.label}
                </Text>
                {detail && !copied ? (
                  <Text
                    style={[
                      styles.chipDetail,
                      {
                        color: primary ? colors.primary : colors.textSecondary,
                      },
                    ]}
                  >
                    {detail}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: DesignSystem.spacing.sm + 2,
    marginBottom: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.sm + 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm + 2,
    paddingHorizontal: DesignSystem.spacing.md,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    ...DesignSystem.typography.caption,
  },
  name: {
    ...DesignSystem.typography.bodySemiBold,
  },
  identity: {
    ...DesignSystem.typography.footnote,
  },
  chips: {
    gap: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: DesignSystem.spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipLabel: {
    ...DesignSystem.typography.smallSemiBold,
  },
  chipDetail: {
    ...DesignSystem.typography.small,
    fontVariant: ["tabular-nums"],
  },
});
