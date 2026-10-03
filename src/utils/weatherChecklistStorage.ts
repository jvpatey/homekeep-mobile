import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { ClimateAlertKind } from "../services/WeatherService";

const KEY_PREFIX = "@homekeep/weather_checklist:";

export function weatherChecklistDedupeKey(
  kind: ClimateAlertKind,
  day: Date = new Date()
): string {
  return `${KEY_PREFIX}${kind}:${format(day, "yyyy-MM-dd")}`;
}

export async function hasAppliedWeatherChecklist(
  kind: ClimateAlertKind,
  day?: Date
): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(
      weatherChecklistDedupeKey(kind, day)
    );
    return value === "1";
  } catch {
    return false;
  }
}

export async function markWeatherChecklistApplied(
  kind: ClimateAlertKind,
  day?: Date
): Promise<void> {
  try {
    await AsyncStorage.setItem(weatherChecklistDedupeKey(kind, day), "1");
  } catch {
    // best-effort
  }
}
