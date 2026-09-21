// Core domain types for LY.
// Kept minimal on purpose — new fields (audio, tags, AI summaries, …)
// can be added here later without breaking stored data.

export interface Moment {
  id: string;
  text: string;
  /** Local file URI of the attached photo, or null if the moment has no photo. */
  photoUri: string | null;
  /** ISO 8601 timestamp of when the moment was saved. */
  createdAt: string;
}
