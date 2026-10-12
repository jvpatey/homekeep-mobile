import React, { ReactNode } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../context/ThemeContext";
import { useCurrency } from "../../hooks/useCurrency";
import { DesignSystem } from "../../theme/designSystem";
import { currencySymbol } from "../../utils/formatMoney";
import { SegmentedControl } from "../ui/SegmentedControl";
import { LaborType, RecordDetailsValue } from "./recordDetails";

interface RecordDetailsFieldsProps {
  value: RecordDetailsValue;
  onChange: (next: RecordDetailsValue) => void;
  /** Rendered under "Who did it?" when Hired is selected (the pro picker). */
  proSlot?: ReactNode;
  notePlaceholder?: string;
  disabled?: boolean;
}

export function RecordDetailsFields({
  value,
  onChange,
  proSlot,
  notePlaceholder = "What did you do? Parts, settings, anything worth remembering",
  disabled,
}: RecordDetailsFieldsProps) {
  const { colors } = useTheme();
  const { currency } = useCurrency();
  const symbol = currencySymbol(currency);

  const set = (patch: Partial<RecordDetailsValue>) =>
    onChange({ ...value, ...patch });

  const fieldStyle = {
    color: colors.text,
    borderColor: colors.border,
    backgroundColor: colors.fieldFill,
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Camera access needed",
        "Allow camera access in Settings to snap a photo of the work."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      set({ photoUri: result.assets[0].uri });
    }
  };

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      set({ photoUri: result.assets[0].uri });
    }
  };

  const openPhotoMenu = () => {
    if (disabled) return;
    const hasPhoto = Boolean(value.photoUri);
    if (Platform.OS === "ios") {
      const options = hasPhoto
        ? ["Take photo", "Choose from library", "Remove photo", "Cancel"]
        : ["Take photo", "Choose from library", "Cancel"];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: hasPhoto ? 2 : undefined,
        },
        (index) => {
          if (index === 0) void takePhoto();
          else if (index === 1) void choosePhoto();
          else if (hasPhoto && index === 2) set({ photoUri: null });
        }
      );
      return;
    }
    Alert.alert("Photo", undefined, [
      { text: "Take photo", onPress: () => void takePhoto() },
      { text: "Choose from library", onPress: () => void choosePhoto() },
      ...(hasPhoto
        ? [
            {
              text: "Remove photo",
              style: "destructive" as const,
              onPress: () => set({ photoUri: null }),
            },
          ]
        : []),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  return (
    <View style={styles.root}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Who did it?
      </Text>
      <SegmentedControl<LaborType>
        value={value.labor}
        onChange={(labor) =>
          set({ labor, contactId: labor === "hired" ? value.contactId : null })
        }
        options={[
          { value: "diy", label: "I did it", icon: "hammer-outline" },
          { value: "hired", label: "Hired a pro", icon: "person-outline" },
        ]}
        accessibilityLabel="Who did the work"
      />
      {value.labor === "hired" && proSlot ? (
        <View style={styles.proSlot}>{proSlot}</View>
      ) : null}

      <View style={styles.row}>
        <View style={styles.costCol}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Cost
          </Text>
          <View style={[styles.costField, fieldStyle]}>
            <Text style={[styles.costPrefix, { color: colors.textSecondary }]}>
              {symbol}
            </Text>
            <TextInput
              value={value.cost}
              onChangeText={(cost) => set({ cost })}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textSecondary}
              style={[styles.costInput, { color: colors.text }]}
              editable={!disabled}
              accessibilityLabel={`Cost in ${currency}`}
              returnKeyType="done"
            />
          </View>
        </View>

        <View>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Photo
          </Text>
          <Pressable
            onPress={openPhotoMenu}
            style={({ pressed }) => [
              styles.photoTile,
              {
                borderColor: value.photoUri ? colors.border : colors.primary + "66",
                backgroundColor: value.photoUri ? "transparent" : colors.primary + "0D",
              },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={value.photoUri ? "Change photo" : "Add a photo"}
          >
            {value.photoUri ? (
              <>
                <Image
                  source={{ uri: value.photoUri }}
                  style={styles.photo}
                  accessibilityIgnoresInvertColors
                />
                <View style={styles.photoBadge}>
                  <Ionicons name="camera-reverse-outline" size={12} color="#FFFFFF" />
                </View>
              </>
            ) : (
              <Ionicons name="camera-outline" size={22} color={colors.primary} />
            )}
          </Pressable>
        </View>
      </View>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Note</Text>
      <TextInput
        value={value.notes}
        onChangeText={(notes) => set({ notes })}
        placeholder={notePlaceholder}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, styles.notes, fieldStyle]}
        multiline
        textAlignVertical="top"
        editable={!disabled}
        accessibilityLabel="Note"
      />
    </View>
  );
}

const PHOTO_SIZE = 52;

const styles = StyleSheet.create({
  root: {
    gap: DesignSystem.spacing.xs,
  },
  label: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.xs,
  },
  proSlot: {
    marginTop: DesignSystem.spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: DesignSystem.spacing.md,
    alignItems: "flex-end",
  },
  costCol: {
    flex: 1,
  },
  costField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: DesignSystem.borders.radius.medium,
    paddingHorizontal: DesignSystem.spacing.md,
    height: PHOTO_SIZE,
  },
  costPrefix: {
    ...DesignSystem.typography.bodyMedium,
    marginRight: 6,
  },
  costInput: {
    flex: 1,
    ...DesignSystem.typography.bodyMedium,
    fontVariant: ["tabular-nums"],
    paddingVertical: 0,
  },
  photoTile: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
  },
  photoBadge: {
    position: "absolute",
    right: 3,
    bottom: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: DesignSystem.borders.radius.medium,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 4,
    ...DesignSystem.typography.body,
  },
  notes: {
    minHeight: 88,
  },
});
