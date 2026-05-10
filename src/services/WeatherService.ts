import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Tiny wrapper around Open-Meteo's free current-weather endpoint. We round
 * lat/lng to one decimal (~11 km) for cache keys and re-use results for
 * 30 minutes — the weather tile never needs minute-level freshness.
 *
 * https://open-meteo.com/en/docs
 */

export type WeatherIconName =
  | "sunny-outline"
  | "moon-outline"
  | "partly-sunny-outline"
  | "cloudy-outline"
  | "cloud-outline"
  | "rainy-outline"
  | "thunderstorm-outline"
  | "snow-outline";

export interface CurrentWeather {
  temperatureF: number;
  conditionLabel: string;
  iconName: WeatherIconName;
  isDay: boolean;
  windSpeed: number;
  fetchedAt: number;
}

interface OpenMeteoCurrent {
  temperature_2m?: number;
  weather_code?: number;
  wind_speed_10m?: number;
  is_day?: number;
}

interface OpenMeteoForecastResponse {
  current?: OpenMeteoCurrent;
}

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_KEY_PREFIX = "@homekeep/weather_cache:";

const memoryCache = new Map<string, CurrentWeather>();

const cacheKey = (lat: number, lng: number) =>
  `${CACHE_KEY_PREFIX}${lat.toFixed(1)}_${lng.toFixed(1)}`;

const isFresh = (entry: CurrentWeather) =>
  Date.now() - entry.fetchedAt < CACHE_TTL_MS;

/**
 * Maps the WMO weather code returned by Open-Meteo into a friendly label
 * and one of our Ionicons. Based on https://open-meteo.com/en/docs (WMO).
 */
function describeWeatherCode(
  code: number | undefined,
  isDay: boolean
): { label: string; icon: WeatherIconName } {
  if (code === undefined || code === null) {
    return { label: "Unknown", icon: "cloud-outline" };
  }

  if (code === 0) {
    return {
      label: isDay ? "Clear" : "Clear night",
      icon: isDay ? "sunny-outline" : "moon-outline",
    };
  }
  if (code === 1 || code === 2) {
    return {
      label: code === 1 ? "Mostly clear" : "Partly cloudy",
      icon: "partly-sunny-outline",
    };
  }
  if (code === 3) {
    return { label: "Overcast", icon: "cloudy-outline" };
  }
  if (code === 45 || code === 48) {
    return { label: "Fog", icon: "cloud-outline" };
  }
  if (code >= 51 && code <= 57) {
    return { label: "Drizzle", icon: "rainy-outline" };
  }
  if (code >= 61 && code <= 67) {
    return { label: "Rain", icon: "rainy-outline" };
  }
  if (code >= 71 && code <= 77) {
    return { label: "Snow", icon: "snow-outline" };
  }
  if (code >= 80 && code <= 82) {
    return { label: "Rain showers", icon: "rainy-outline" };
  }
  if (code >= 85 && code <= 86) {
    return { label: "Snow showers", icon: "snow-outline" };
  }
  if (code === 95) {
    return { label: "Thunderstorm", icon: "thunderstorm-outline" };
  }
  if (code === 96 || code === 99) {
    return { label: "Thunderstorm w/ hail", icon: "thunderstorm-outline" };
  }

  return { label: "Cloudy", icon: "cloud-outline" };
}

export class WeatherService {
  static async getCurrentWeather(
    latitude: number,
    longitude: number,
    options: { forceRefresh?: boolean } = {}
  ): Promise<CurrentWeather | null> {
    const key = cacheKey(latitude, longitude);

    if (!options.forceRefresh) {
      const inMem = memoryCache.get(key);
      if (inMem && isFresh(inMem)) return inMem;

      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as CurrentWeather;
          if (isFresh(parsed)) {
            memoryCache.set(key, parsed);
            return parsed;
          }
        }
      } catch {
        // ignore cache read errors and fall through to network
      }
    }

    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      current: "temperature_2m,weather_code,wind_speed_10m,is_day",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
    });

    try {
      const response = await fetch(`${FORECAST_ENDPOINT}?${params.toString()}`);
      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as OpenMeteoForecastResponse;
      const current = payload.current;
      if (!current || current.temperature_2m === undefined) {
        return null;
      }

      const isDay = (current.is_day ?? 1) === 1;
      const description = describeWeatherCode(current.weather_code, isDay);

      const weather: CurrentWeather = {
        temperatureF: Math.round(current.temperature_2m),
        conditionLabel: description.label,
        iconName: description.icon,
        isDay,
        windSpeed: Math.round(current.wind_speed_10m ?? 0),
        fetchedAt: Date.now(),
      };

      memoryCache.set(key, weather);
      try {
        await AsyncStorage.setItem(key, JSON.stringify(weather));
      } catch {
        // best-effort cache write
      }

      return weather;
    } catch (error) {
      console.warn("Weather fetch failed", error);
      return null;
    }
  }
}
