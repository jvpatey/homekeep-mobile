import { useCallback, useEffect, useRef, useState } from "react";
import {
  WeatherService,
  CurrentWeather,
  TemperatureUnit,
} from "../services/WeatherService";

interface UseWeatherInput {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  temperatureUnit?: TemperatureUnit;
}

interface UseWeatherResult {
  weather: CurrentWeather | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Subscribes the given coords to the weather service. Re-fetches when the
 * coords or temperature unit change; refresh() forces a network bypass of
 * the cache.
 */
export function useWeather({
  latitude,
  longitude,
  temperatureUnit,
}: UseWeatherInput): UseWeatherResult {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  const fetchWeather = useCallback(
    async (forceRefresh: boolean) => {
      if (
        latitude === null ||
        latitude === undefined ||
        longitude === null ||
        longitude === undefined
      ) {
        setWeather(null);
        return;
      }

      const id = ++reqIdRef.current;
      setLoading(true);
      setError(null);

      const result = await WeatherService.getCurrentWeather(
        latitude,
        longitude,
        { forceRefresh, temperatureUnit }
      );

      if (id !== reqIdRef.current) return;
      if (result) {
        setWeather(result);
      } else {
        setError("Couldn't load weather right now");
      }
      setLoading(false);
    },
    [latitude, longitude, temperatureUnit]
  );

  useEffect(() => {
    void fetchWeather(false);
  }, [fetchWeather]);

  const refresh = useCallback(() => {
    void fetchWeather(true);
  }, [fetchWeather]);

  return { weather, loading, error, refresh };
}
