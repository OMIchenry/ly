// Core domain types for LY.
// Fields are all optional-by-design at read time: older stored moments
// simply miss the newer keys, and the UI treats missing as null.

import type { PhotoShape } from './shapes';

export interface MomentWeather {
  /** Temperature in Celsius at capture time. */
  tempC: number;
  /** Short human label, e.g. "Clear", "Rain". */
  label: string;
}

export interface Moment {
  id: string;
  text: string;
  /** Local file URI of the attached photo, or null if the moment has no photo. */
  photoUri: string | null;
  /** Local file URI of the attached voice note, or null. */
  audioUri?: string | null;
  /** Auto-generated title, editable by the user. Older moments without one
      get a generated fallback at render time via displayTitle(). */
  title?: string | null;
  /** Frame shape for the photo. Older moments without this render as square. */
  photoShape?: PhotoShape | null;
  /** Coordinates captured with the moment, for the map view. */
  latitude?: number | null;
  longitude?: number | null;
  /** Human-readable place name stamped at capture, e.g. "Scarborough". */
  locationName?: string | null;
  /** Weather stamped at capture. */
  weather?: MomentWeather | null;
  /** ISO 8601 timestamp of when the moment was saved. */
  createdAt: string;
}
