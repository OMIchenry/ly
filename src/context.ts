import * as Location from 'expo-location';
import type { MomentWeather } from './types';

export interface CaptureContext {
  locationName: string | null;
  weather: MomentWeather | null;
  latitude: number | null;
  longitude: number | null;
}

/** Map an Open-Meteo WMO weather code to a short human label. */
function weatherLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mostly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Drizzly';
  if (code >= 61 && code <= 67) return 'Rainy';
  if (code >= 71 && code <= 77) return 'Snowy';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 95) return 'Stormy';
  return '—';
}

async function fetchWeather(
  latitude: number,
  longitude: number,
): Promise<MomentWeather | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
      `&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const current = json?.current;
    if (typeof current?.temperature_2m !== 'number') return null;
    return {
      tempC: Math.round(current.temperature_2m),
      label: weatherLabel(Number(current.weather_code ?? -1)),
    };
  } catch {
    return null;
  }
}

/**
 * Quietly capture where + what the weather is like right now.
 * Never throws and never blocks for long — returns nulls when the
 * permission is denied, the device is offline, or anything else fails.
 */
export async function captureContext(): Promise<CaptureContext> {
  const empty: CaptureContext = {
    locationName: null,
    weather: null,
    latitude: null,
    longitude: null,
  };
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return empty;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = position.coords;

    const [places, weather] = await Promise.all([
      Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []),
      fetchWeather(latitude, longitude),
    ]);

    const place = places[0];
    const locationName =
      place?.city ?? place?.subregion ?? place?.region ?? null;

    return { locationName, weather, latitude, longitude };
  } catch {
    return empty;
  }
}
