import { photos } from "@/data/photos";
import { performanceProfiles, type PerformanceSourceType } from "@/data/performance";
export const analyticsEvents = [
  "contact_cta_click",
  "contact_form_start",
  "contact_form_submit",
  "contact_form_success",
  "contact_form_error",
  "gallery_open",
  "gallery_view_all",
  "gallery_mode",
  "gallery_toggle_card",
  "gallery_toggle_lightbox",
  "cabin_toggle_staged",
  "view_specs",
  "view_service_history",
  "owner_story_view",
  "range_calculator_interaction",
  "range_calculator_profile_select",
  "range_calculator_reserve_change",
  "range_calculator_rpm_change",
  "trip_planner_use",
  "social_share_click",
] as const;
export type AnalyticsEvent = (typeof analyticsEvents)[number];
export type AnalyticsProperties = {
  performance_profile?: string;
  reserve_percent?: number;
  data_source?: PerformanceSourceType;
  distance_band?: string;
  photo_id?: string;
  target_id?: string;
  mode?: "staged" | "unstaged" | "all";
  cta_location?: string;
  error_type?: string;
  section?: string;
};
const safePhotoIds = new Set(photos.map((photo) => photo.id));
const safeProfileIds = new Set<string>([
  ...performanceProfiles.map((profile) => profile.id),
  "custom-rpm",
]);
const safeValues: Record<keyof AnalyticsProperties, RegExp> = {
  performance_profile: /^[a-zA-Z0-9_-]{1,40}$/,
  reserve_percent: /^(0|10|15|20)$/,
  data_source: /^(published|interpolated)$/,
  distance_band: /^([0-9]{1,3}-[0-9]{1,3}|invalid)$/,
  photo_id: /^[a-zA-Z0-9_-]{1,90}$/,
  target_id: /^[a-zA-Z0-9_-]{1,90}$/,
  mode: /^(staged|unstaged|all)$/,
  cta_location: /^(header|hero|mobile|footer|overview|accommodations)$/,
  error_type: /^(validation|network|server)$/,
  section: /^(specifications|service|owner-story)$/,
};
export function sanitizeAnalyticsProperties(
  properties: AnalyticsProperties,
): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(properties)) {
    const pattern = safeValues[key as keyof AnalyticsProperties];
    if (key === "photo_id" && !safePhotoIds.has(String(value))) continue;
    if (key === "target_id" && !safePhotoIds.has(String(value))) continue;
    if (key === "performance_profile" && !safeProfileIds.has(String(value)))
      continue;
    if (
      pattern &&
      (typeof value === "number" || typeof value === "string") &&
      pattern.test(String(value))
    )
      result[key] = value;
  }
  return result;
}
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}
export function getMeasurementId(
  value = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
): string | null {
  return value && /^G-[A-Z0-9]{4,20}$/.test(value) ? value : null;
}
export function trackEvent(
  event: AnalyticsEvent,
  properties: AnalyticsProperties = {},
) {
  if (
    typeof window === "undefined" ||
    !getMeasurementId() ||
    !window.gtag ||
    !analyticsEvents.includes(event)
  )
    return;
  window.gtag("event", event, sanitizeAnalyticsProperties(properties));
}
