import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
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
import { Country, State } from "country-state-city";
import { useTheme } from "../../../context/ThemeContext";
import { useGradients, useHaptics } from "../../../hooks";
import { useProfile, AddressInput } from "../../../context/ProfileContext";
import { DesignSystem } from "../../../theme/designSystem";
import {
  GlassCard,
  SearchableSelectModal,
  SearchableOption,
  SheetGrabber,
} from "../../ui";
import {
  MapboxSearchService,
  MapboxSuggestion,
  isMapboxConfigured,
} from "../../../services/MapboxSearchService";
import { styles } from "./styles";

const { height: screenHeight } = Dimensions.get("window");

interface HomeAddressOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  /** When true, "Skip for now" is hidden — used from Settings where the user already has a value (or none) but is just editing. */
  hideSkip?: boolean;
}

interface FormState {
  address_line1: string;
  address_line2: string;
  city: string;
  /** ISO subdivision code, e.g. "CA" (California). Mapped to full name on save. */
  region_iso: string;
  postal_code: string;
  /** ISO 3166-1 alpha-2 country code, e.g. "US". Mapped to full name on save. */
  country_iso: string;
}

const EMPTY_FORM: FormState = {
  address_line1: "",
  address_line2: "",
  city: "",
  region_iso: "",
  postal_code: "",
  country_iso: "",
};

function deriveDefaultCountryIso(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? "";
    const region = locale.split("-")[1];
    return region ? region.toUpperCase() : "";
  } catch {
    return "";
  }
}

/**
 * Resolve a stored country value (could be ISO code or full name) back to
 * an ISO code so the dropdown can show the right selection on edit.
 */
function lookupCountryIso(stored: string | null | undefined): string {
  if (!stored) return "";
  const trimmed = stored.trim();
  if (!trimmed) return "";
  if (trimmed.length === 2) {
    const upper = trimmed.toUpperCase();
    if (Country.getCountryByCode(upper)) return upper;
  }
  const all = Country.getAllCountries();
  const match = all.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );
  return match?.isoCode ?? "";
}

function lookupRegionIso(
  countryIso: string,
  stored: string | null | undefined
): string {
  if (!countryIso || !stored) return "";
  const trimmed = stored.trim();
  if (!trimmed) return "";
  const states = State.getStatesOfCountry(countryIso);
  // Try ISO first
  const byIso = states.find(
    (s) => s.isoCode.toLowerCase() === trimmed.toLowerCase()
  );
  if (byIso) return byIso.isoCode;
  // Then full name
  const byName = states.find(
    (s) => s.name.toLowerCase() === trimmed.toLowerCase()
  );
  return byName?.isoCode ?? "";
}

const SUGGEST_DEBOUNCE_MS = 250;

export function HomeAddressOnboardingModal({
  visible,
  onClose,
  hideSkip = false,
}: HomeAddressOnboardingModalProps) {
  const { colors, isDark } = useTheme();
  const { haloGradient } = useGradients();
  const { triggerLight, triggerSuccess, triggerError } = useHaptics();
  const { profile, updateAddress, skipAddressOnboarding } = useProfile();

  const [mounted, setMounted] = useState(visible);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  /** lat/lng captured from a Mapbox autocomplete pick — when present we
   * skip the Open-Meteo geocode fallback in ProfileContext. */
  const [pickedCoords, setPickedCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [skipping, setSkipping] = useState(false);

  // Mapbox autocomplete state
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  /** Set true while we apply a Mapbox pick so the next debounce cycle is
   * skipped (otherwise typing the picked value re-fires suggestions). */
  const skipNextSuggestRef = useRef(false);
  const sessionTokenRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Picker modals
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);

  // Pre-fill from existing profile when re-opening (Settings edit case).
  useEffect(() => {
    if (visible) {
      const countryIso =
        lookupCountryIso(profile?.country) || deriveDefaultCountryIso();
      setForm({
        address_line1: profile?.address_line1 ?? "",
        address_line2: profile?.address_line2 ?? "",
        city: profile?.city ?? "",
        region_iso: lookupRegionIso(countryIso, profile?.region),
        postal_code: profile?.postal_code ?? "",
        country_iso: countryIso,
      });
      // Reuse stored coords (no need to re-geocode if user only tweaks
      // line2 / postal etc.).
      if (
        profile?.latitude !== null &&
        profile?.latitude !== undefined &&
        profile?.longitude !== null &&
        profile?.longitude !== undefined
      ) {
        setPickedCoords({
          latitude: profile.latitude,
          longitude: profile.longitude,
        });
      } else {
        setPickedCoords(null);
      }
      sessionTokenRef.current = MapboxSearchService.newSessionToken();
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [visible, profile]);

  useEffect(() => {
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
  }, [visible, opacity, translateY]);

  // Debounced Mapbox suggest as the user types in the address field.
  useEffect(() => {
    if (!visible || !isMapboxConfigured()) return;
    if (skipNextSuggestRef.current) {
      skipNextSuggestRef.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    const query = form.address_line1;
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestLoading(false);
      return;
    }

    setSuggestLoading(true);
    setShowSuggestions(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      const token =
        sessionTokenRef.current ||
        (sessionTokenRef.current = MapboxSearchService.newSessionToken());
      const results = await MapboxSearchService.suggest(query, token, {
        country: form.country_iso || undefined,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setSuggestions(results);
      setSuggestLoading(false);
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form.address_line1, form.country_iso, visible]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const inputBackground = isDark
    ? "rgba(35, 37, 38, 0.55)"
    : "rgba(255, 255, 255, 0.65)";
  const inputBorder = isDark
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(15, 23, 42, 0.08)";
  const surfaceBackground = isDark
    ? "rgba(35, 37, 38, 0.7)"
    : "rgba(255, 255, 255, 0.8)";

  const canSubmit = useMemo(
    () =>
      form.city.trim().length > 0 || form.address_line1.trim().length > 0,
    [form.city, form.address_line1]
  );

  // Country + state options for dropdowns (memoized — large arrays).
  const countryOptions = useMemo<SearchableOption[]>(
    () =>
      Country.getAllCountries().map((c) => ({
        value: c.isoCode,
        label: `${c.flag ?? ""} ${c.name}`.trim(),
        hint: c.isoCode,
      })),
    []
  );

  const regionOptions = useMemo<SearchableOption[]>(() => {
    if (!form.country_iso) return [];
    return State.getStatesOfCountry(form.country_iso).map((s) => ({
      value: s.isoCode,
      label: s.name,
      hint: s.isoCode,
    }));
  }, [form.country_iso]);

  const selectedCountryLabel = useMemo(() => {
    if (!form.country_iso) return "";
    const c = Country.getCountryByCode(form.country_iso);
    if (!c) return form.country_iso;
    return `${c.flag ?? ""} ${c.name}`.trim();
  }, [form.country_iso]);

  const selectedRegionLabel = useMemo(() => {
    if (!form.country_iso || !form.region_iso) return "";
    const states = State.getStatesOfCountry(form.country_iso);
    return states.find((s) => s.isoCode === form.region_iso)?.name ?? "";
  }, [form.country_iso, form.region_iso]);

  const regionFieldLabel = useMemo(() => {
    if (form.country_iso === "CA") return "Province";
    if (form.country_iso === "GB") return "County";
    return "State / Region";
  }, [form.country_iso]);

  const handleClose = async () => {
    await triggerLight();
    onClose();
  };

  const handlePickSuggestion = async (suggestion: MapboxSuggestion) => {
    await triggerLight();
    const token =
      sessionTokenRef.current ||
      (sessionTokenRef.current = MapboxSearchService.newSessionToken());
    setSuggestLoading(true);
    const resolved = await MapboxSearchService.retrieve(
      suggestion.mapboxId,
      token
    );
    setSuggestLoading(false);

    if (!resolved) {
      // Fall back to writing the raw suggestion text as line 1.
      skipNextSuggestRef.current = true;
      setForm((prev) => ({
        ...prev,
        address_line1: suggestion.fullAddress || suggestion.name,
      }));
      setShowSuggestions(false);
      return;
    }

    skipNextSuggestRef.current = true;
    setForm((prev) => ({
      ...prev,
      address_line1: resolved.addressLine1 ?? prev.address_line1,
      city: resolved.city ?? prev.city,
      postal_code: resolved.postalCode ?? prev.postal_code,
      country_iso: resolved.countryCode ?? prev.country_iso,
      // resolved.region is a full name; map to ISO if we can.
      region_iso: resolved.countryCode
        ? lookupRegionIso(resolved.countryCode, resolved.region) ||
          prev.region_iso
        : prev.region_iso,
    }));
    if (
      resolved.latitude !== undefined &&
      resolved.longitude !== undefined
    ) {
      setPickedCoords({
        latitude: resolved.latitude,
        longitude: resolved.longitude,
      });
    } else {
      setPickedCoords(null);
    }
    setShowSuggestions(false);
    setSuggestions([]);
    // New session token after a successful retrieve (Mapbox best practice).
    sessionTokenRef.current = MapboxSearchService.newSessionToken();
  };

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    await triggerLight();
    setSaving(true);
    try {
      const country = form.country_iso
        ? Country.getCountryByCode(form.country_iso)
        : undefined;
      const region =
        form.country_iso && form.region_iso
          ? State.getStatesOfCountry(form.country_iso).find(
              (s) => s.isoCode === form.region_iso
            )
          : undefined;

      const payload: AddressInput = {
        address_line1: form.address_line1,
        address_line2: form.address_line2,
        city: form.city,
        region: region?.name ?? "",
        postal_code: form.postal_code,
        country: country?.name ?? form.country_iso,
      };
      const result = await updateAddress(payload, pickedCoords ?? undefined);
      if (result.success) {
        await triggerSuccess();
        if (!result.geocoded) {
          Alert.alert(
            "Address saved",
            "We couldn't find an exact match for the city, so weather may be unavailable. You can edit your address anytime from Settings."
          );
        }
        onClose();
      } else {
        await triggerError();
        Alert.alert("Couldn't save", result.error ?? "Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (skipping) return;
    await triggerLight();
    setSkipping(true);
    try {
      await skipAddressOnboarding();
      onClose();
    } finally {
      setSkipping(false);
    }
  };

  const renderTextField = (
    label: string,
    field: keyof FormState,
    placeholder: string,
    extra?: {
      autoCapitalize?: "characters" | "words" | "none";
      keyboardType?: "default" | "email-address";
      onFocus?: () => void;
    }
  ) => (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <TextInput
        value={form[field]}
        onChangeText={(text) => {
          // User typed manually — drop coords + reset region if country
          // wasn't touched. (We don't know if address now matches old coords.)
          if (field === "address_line1") {
            setPickedCoords(null);
          }
          setForm((prev) => ({ ...prev, [field]: text }));
        }}
        onFocus={extra?.onFocus}
        placeholder={placeholder}
        placeholderTextColor={
          isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(15, 23, 42, 0.35)"
        }
        style={[
          styles.input,
          {
            backgroundColor: inputBackground,
            borderColor: inputBorder,
            color: colors.text,
          },
        ]}
        autoCapitalize={extra?.autoCapitalize ?? "words"}
        keyboardType={extra?.keyboardType ?? "default"}
        keyboardAppearance={isDark ? "dark" : "light"}
        returnKeyType="next"
      />
    </View>
  );

  const renderSelectField = (
    label: string,
    valueLabel: string,
    placeholder: string,
    onPress: () => void,
    disabled?: boolean
  ) => (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            backgroundColor: inputBackground,
            borderColor: inputBorder,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={valueLabel ? `${label}: ${valueLabel}` : label}
        accessibilityState={{ disabled: !!disabled }}
      >
        <Text
          style={[
            styles.selectButtonText,
            {
              color: valueLabel
                ? colors.text
                : isDark
                ? "rgba(255,255,255,0.35)"
                : "rgba(15,23,42,0.35)",
            },
          ]}
          numberOfLines={1}
        >
          {valueLabel || placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );

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
          style={[styles.sheetContainer, animatedSheetStyle]}
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

              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
              >
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
                    Your home
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

                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                  automaticallyAdjustKeyboardInsets
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.intro}>
                    <View
                      style={[
                        styles.introIcon,
                        { backgroundColor: colors.primary + "15" },
                      ]}
                    >
                      <Ionicons
                        name="home-outline"
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.introCopy}>
                      <Text
                        style={[styles.introTitle, { color: colors.text }]}
                      >
                        Tell us about your home
                      </Text>
                      <Text
                        style={[
                          styles.introBody,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {isMapboxConfigured()
                          ? "Start typing your address — we'll fill in the rest. Your city is used to display local weather."
                          : "We'll show your address on the dashboard and use the city to display local weather."}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <View>
                      {renderTextField(
                        "Address",
                        "address_line1",
                        "123 Main Street",
                        {
                          onFocus: () => {
                            if (suggestions.length > 0) setShowSuggestions(true);
                          },
                        }
                      )}

                      {!isMapboxConfigured() && __DEV__ ? (
                        <Text
                          style={[
                            styles.helperText,
                            { color: colors.textSecondary, opacity: 0.7 },
                          ]}
                        >
                          Tip: add EXPO_PUBLIC_MAPBOX_TOKEN to .env and restart
                          Expo with --clear to enable address autocomplete.
                        </Text>
                      ) : null}

                      {showSuggestions &&
                      isMapboxConfigured() &&
                      (suggestLoading || suggestions.length > 0) ? (
                        <View
                          style={[
                            styles.suggestionList,
                            {
                              backgroundColor: surfaceBackground,
                              borderColor: inputBorder,
                            },
                          ]}
                        >
                          {suggestLoading ? (
                            <View style={styles.suggestionLoading}>
                              <ActivityIndicator
                                size="small"
                                color={colors.primary}
                              />
                              <Text
                                style={{
                                  color: colors.textSecondary,
                                  fontSize: 13,
                                }}
                              >
                                Searching addresses…
                              </Text>
                            </View>
                          ) : null}
                          {!suggestLoading
                            ? suggestions.map((s) => (
                                <TouchableOpacity
                                  key={s.mapboxId}
                                  style={[
                                    styles.suggestionRow,
                                    {
                                      borderBottomColor: isDark
                                        ? "rgba(255, 255, 255, 0.06)"
                                        : "rgba(15, 23, 42, 0.06)",
                                      borderBottomWidth: 1,
                                    },
                                  ]}
                                  onPress={() => handlePickSuggestion(s)}
                                  accessibilityRole="button"
                                  accessibilityLabel={s.fullAddress || s.name}
                                >
                                  <Ionicons
                                    name="location-outline"
                                    size={16}
                                    color={colors.primary}
                                    style={{ marginTop: 2 }}
                                  />
                                  <View style={styles.suggestionText}>
                                    <Text
                                      style={[
                                        styles.suggestionPrimary,
                                        { color: colors.text },
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {s.name}
                                    </Text>
                                    {s.placeFormatted ? (
                                      <Text
                                        style={[
                                          styles.suggestionSecondary,
                                          { color: colors.textSecondary },
                                        ]}
                                        numberOfLines={1}
                                      >
                                        {s.placeFormatted}
                                      </Text>
                                    ) : null}
                                  </View>
                                </TouchableOpacity>
                              ))
                            : null}
                          {!suggestLoading && suggestions.length > 0 ? (
                            <Text
                              style={[
                                styles.suggestionAttribution,
                                { color: colors.textSecondary },
                              ]}
                            >
                              Powered by Mapbox
                            </Text>
                          ) : null}
                        </View>
                      ) : null}
                    </View>

                    {renderTextField(
                      "Apartment, suite, etc. (optional)",
                      "address_line2",
                      "Apt 4B"
                    )}
                    {renderTextField("City", "city", "City")}

                    {renderSelectField(
                      "Country",
                      selectedCountryLabel,
                      "Select country",
                      () => setCountryPickerOpen(true)
                    )}

                    <View style={styles.fieldRow}>
                      <View style={styles.fieldRowItem}>
                        {renderSelectField(
                          regionFieldLabel,
                          selectedRegionLabel,
                          form.country_iso
                            ? `Select ${regionFieldLabel.toLowerCase()}`
                            : "Pick country first",
                          () => setRegionPickerOpen(true),
                          !form.country_iso || regionOptions.length === 0
                        )}
                      </View>
                      <View style={styles.fieldRowItem}>
                        {renderTextField(
                          "Postal code",
                          "postal_code",
                          "Postal",
                          { autoCapitalize: "characters" }
                        )}
                      </View>
                    </View>
                  </View>
                </ScrollView>

                <View
                  style={[
                    styles.actions,
                    {
                      borderTopColor: isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.06)",
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: canSubmit
                          ? colors.primary
                          : colors.primary + "55",
                      },
                    ]}
                    onPress={handleSubmit}
                    disabled={!canSubmit || saving}
                    accessibilityRole="button"
                    accessibilityLabel="Save home address"
                  >
                    <Text style={styles.primaryButtonText}>
                      {saving ? "Saving…" : "Save"}
                    </Text>
                  </TouchableOpacity>

                  {hideSkip ? null : (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={handleSkip}
                      disabled={skipping}
                      accessibilityRole="button"
                      accessibilityLabel="Skip for now"
                    >
                      <Text
                        style={[
                          styles.secondaryButtonText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {skipping ? "Skipping…" : "Skip for now"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </GlassCard>
        </Animated.View>
      </Animated.View>

      <SearchableSelectModal
        visible={countryPickerOpen}
        title="Country"
        options={countryOptions}
        selectedValue={form.country_iso}
        searchPlaceholder="Search countries"
        emptyMessage="No countries match"
        onClose={() => setCountryPickerOpen(false)}
        onSelect={(opt) =>
          setForm((prev) => ({
            ...prev,
            country_iso: opt.value,
            // Different country → clear stale region.
            region_iso:
              prev.country_iso === opt.value ? prev.region_iso : "",
          }))
        }
      />

      <SearchableSelectModal
        visible={regionPickerOpen}
        title={regionFieldLabel}
        options={regionOptions}
        selectedValue={form.region_iso}
        searchPlaceholder={`Search ${regionFieldLabel.toLowerCase()}`}
        emptyMessage="No matches"
        onClose={() => setRegionPickerOpen(false)}
        onSelect={(opt) =>
          setForm((prev) => ({ ...prev, region_iso: opt.value }))
        }
      />
    </Modal>
  );
}
