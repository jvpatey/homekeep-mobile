import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  sortedCountryRows,
  flagEmoji,
  getRegionsForCountry,
  countryNameForIso,
  lookupCountryIso,
  lookupRegionIso,
} from "../../../utils/countryRegionData";
import { useTheme } from "../../../context/ThemeContext";
import { useHaptics } from "../../../hooks";
import { useProfile, AddressInput } from "../../../context/ProfileContext";
import { SearchableSelectModal, SearchableOption } from "../../ui";
import {
  MapboxSearchService,
  MapboxSuggestion,
  isMapboxConfigured,
} from "../../../services/MapboxSearchService";
import { styles } from "./styles";

interface FormState {
  address_line1: string;
  address_line2: string;
  city: string;
  region_iso: string;
  postal_code: string;
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

const SUGGEST_DEBOUNCE_MS = 250;

export type HomeAddressFieldsHandle = {
  canSubmit: boolean;
  save: (opts?: { quietGeocodeMiss?: boolean }) => Promise<boolean>;
};

interface HomeAddressFieldsProps {
  /** When false, suggestion fetching pauses. Prefill runs when this becomes true. */
  active: boolean;
  onCanSubmitChange?: (canSubmit: boolean) => void;
}

export const HomeAddressFields = forwardRef<
  HomeAddressFieldsHandle,
  HomeAddressFieldsProps
>(function HomeAddressFields({ active, onCanSubmitChange }, ref) {
  const { colors, isDark } = useTheme();
  const { triggerLight, triggerSuccess, triggerError } = useHaptics();
  const { profile, updateAddress } = useProfile();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pickedCoords, setPickedCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const skipNextSuggestRef = useRef(false);
  const allowAddressSuggestRef = useRef(false);
  const sessionTokenRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);

  const didPrefillRef = useRef(false);

  useEffect(() => {
    if (!active) {
      didPrefillRef.current = false;
      setCountryPickerOpen(false);
      setRegionPickerOpen(false);
      setShowSuggestions(false);
      return;
    }
    if (didPrefillRef.current) return;
    didPrefillRef.current = true;
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
    if (
      profile?.latitude != null &&
      profile?.longitude != null
    ) {
      setPickedCoords({
        latitude: profile.latitude,
        longitude: profile.longitude,
      });
    } else {
      setPickedCoords(null);
    }
    sessionTokenRef.current = MapboxSearchService.newSessionToken();
    allowAddressSuggestRef.current = false;
    setSuggestions([]);
    setShowSuggestions(false);
    // Prefill once per activation so saving the address does not reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (!active || !isMapboxConfigured()) return;
    if (!allowAddressSuggestRef.current) return;
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
      debounceRef.current = null;
      abortRef.current?.abort();
    };
  }, [form.address_line1, form.country_iso, active]);

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

  useEffect(() => {
    onCanSubmitChange?.(canSubmit);
  }, [canSubmit, onCanSubmitChange]);

  const countryOptions = useMemo<SearchableOption[]>(
    () =>
      sortedCountryRows.map((c) => ({
        value: c[1],
        label: `${flagEmoji(c[1])} ${c[0]}`.trim(),
        hint: c[1],
      })),
    []
  );

  const regionOptions = useMemo<SearchableOption[]>(() => {
    if (!form.country_iso) return [];
    return getRegionsForCountry(form.country_iso).map((s) => ({
      value: s.isoCode,
      label: s.name,
      hint: s.isoCode,
    }));
  }, [form.country_iso]);

  const selectedCountryLabel = useMemo(() => {
    if (!form.country_iso) return "";
    const name = countryNameForIso(form.country_iso);
    if (!name) return form.country_iso;
    return `${flagEmoji(form.country_iso)} ${name}`.trim();
  }, [form.country_iso]);

  const selectedRegionLabel = useMemo(() => {
    if (!form.country_iso || !form.region_iso) return "";
    const states = getRegionsForCountry(form.country_iso);
    return states.find((s) => s.isoCode === form.region_iso)?.name ?? "";
  }, [form.country_iso, form.region_iso]);

  const regionFieldLabel = useMemo(() => {
    if (form.country_iso === "CA") return "Province";
    if (form.country_iso === "GB") return "County";
    return "State / Region";
  }, [form.country_iso]);

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
    sessionTokenRef.current = MapboxSearchService.newSessionToken();
  };

  const save = useCallback(
    async (opts?: { quietGeocodeMiss?: boolean }): Promise<boolean> => {
      if (!canSubmit) return false;
      await triggerLight();
      const countryName = form.country_iso
        ? countryNameForIso(form.country_iso)
        : undefined;
      const region =
        form.country_iso && form.region_iso
          ? getRegionsForCountry(form.country_iso).find(
              (s) => s.isoCode === form.region_iso
            )
          : undefined;

      const payload: AddressInput = {
        address_line1: form.address_line1,
        address_line2: form.address_line2,
        city: form.city,
        region: region?.name ?? "",
        postal_code: form.postal_code,
        country: countryName ?? form.country_iso,
      };
      const result = await updateAddress(payload, pickedCoords ?? undefined);
      if (result.success) {
        await triggerSuccess();
        if (!result.geocoded && !opts?.quietGeocodeMiss) {
          Alert.alert(
            "Address saved",
            "We couldn't find an exact match for the city, so weather may be unavailable. You can edit your address anytime from Settings."
          );
        }
        return true;
      }
      await triggerError();
      Alert.alert("Couldn't save", result.error ?? "Please try again.");
      return false;
    },
    [
      canSubmit,
      form,
      pickedCoords,
      triggerError,
      triggerLight,
      triggerSuccess,
      updateAddress,
    ]
  );

  useImperativeHandle(
    ref,
    () => ({
      canSubmit,
      save,
    }),
    [canSubmit, save]
  );

  const renderTextField = (
    label: string,
    field: keyof FormState,
    placeholder: string,
    extra?: {
      autoCapitalize?: "characters" | "words" | "none";
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
          if (field === "address_line1") {
            allowAddressSuggestRef.current = true;
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
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <View style={styles.intro}>
        <View
          style={[styles.introIcon, { backgroundColor: colors.primary + "15" }]}
        >
          <Ionicons name="home-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.introCopy}>
          <Text style={[styles.introTitle, { color: colors.text }]}>
            Where is this house?
          </Text>
          <Text style={[styles.introBody, { color: colors.textSecondary }]}>
            {isMapboxConfigured()
              ? "Start typing your address — we'll fill in the rest. City is used for local weather and seasonal tasks."
              : "We'll show your address on the dashboard and use the city for local weather and seasonal tasks."}
          </Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <View>
          {renderTextField("Address", "address_line1", "123 Main Street", {
            onFocus: () => {
              if (suggestions.length > 0) setShowSuggestions(true);
            },
          })}

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
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
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
                      onPress={() => void handlePickSuggestion(s)}
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
            {renderTextField("Postal code", "postal_code", "Postal", {
              autoCapitalize: "characters",
            })}
          </View>
        </View>
      </View>

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
    </>
  );
});
