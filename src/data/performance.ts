export type PerformanceSourceType = "published" | "interpolated";

export interface PerformancePoint {
  rpm: number;
  speedMph: number;
  gph: number;
  mpg: number;
  publishedMpg?: number;
  sourceType: PerformanceSourceType;
  sourceLabel: string;
  sourceUrl?: string;
  burnBasis: "published" | "interpolated";
}

const yamahaSource = {
  label: "Yamaha — NC 895 / twin F200XCA & LF200XCA performance bulletin",
  url: "https://yamahaoutboards.com/outboards/350-150-hp/in-line-4/f200-(i4)/pb_jea_nc895_t_f200xca_2016-09-18_owa",
  verifiedDate: "2026-10-04",
  testDate: "2016-09-18",
  bulletinId: "PB_JEA_NC895_t_F200XCA_2016-09-18_OWA",
  caveat:
    "Manufacturer test of the model with twin F200XCA / LF200XCA engines, two people and 50 gallons in the test load. These are not measurements of EZ Livin. Actual performance varies with conditions and configuration.",
} as const;

export const performanceSources = {
  modelReference: yamahaSource,
  yamaha: yamahaSource,
} as const;

// Retain source-rounded MPG for provenance; use speed / GPH for consistent calculations.
export const referencePerformance: readonly PerformancePoint[] = [
  { rpm: 1000, speedMph: 4.8, gph: 1.6, mpg: 3.0 },
  { rpm: 1500, speedMph: 6.3, gph: 2.6, mpg: 2.42 },
  { rpm: 2000, speedMph: 7.8, gph: 4.2, mpg: 1.86 },
  { rpm: 2500, speedMph: 9.2, gph: 6.5, mpg: 1.42 },
  { rpm: 3000, speedMph: 10.2, gph: 9.6, mpg: 1.06 },
  { rpm: 3500, speedMph: 17.1, gph: 12.7, mpg: 1.35 },
  { rpm: 4000, speedMph: 26.8, gph: 14.8, mpg: 1.81 },
  { rpm: 4500, speedMph: 32.0, gph: 18.9, mpg: 1.69 },
  { rpm: 5000, speedMph: 36.5, gph: 25.5, mpg: 1.43 },
  { rpm: 5500, speedMph: 40.2, gph: 32.5, mpg: 1.24 },
  { rpm: 5950, speedMph: 44.0, gph: 39.5, mpg: 1.11 },
].map((point) => ({
  ...point,
  publishedMpg: point.mpg,
  mpg: point.speedMph / point.gph,
  sourceType: "published" as const,
  sourceLabel: performanceSources.modelReference.label,
  sourceUrl: performanceSources.modelReference.url,
  burnBasis: "published" as const,
}));

export const SUPPORTED_RPM_MIN = referencePerformance[0].rpm;
export const SUPPORTED_RPM_MAX = referencePerformance[referencePerformance.length - 1].rpm;
export const SUPPORTED_RPM_STEP = 50;

export interface PerformanceProfile {
  id: string;
  label: string;
  rpm: number;
  sourceType: "published";
}

export const performanceProfiles = [
  {
    id: "trolling",
    label: "Trolling",
    rpm: 1000,
    sourceType: "published",
  },
  {
    id: "slow-trolling",
    label: "Slow trolling",
    rpm: 1500,
    sourceType: "published",
  },
  {
    id: "efficient-cruise",
    label: "Efficient cruise",
    rpm: 4000,
    sourceType: "published",
  },
  {
    id: "standard-cruise",
    label: "Cruise",
    rpm: 4500,
    sourceType: "published",
  },
  {
    id: "fast-cruise",
    label: "Fast cruise",
    rpm: 5000,
    sourceType: "published",
  },
  {
    id: "wot-reference",
    label: "WOT reference",
    rpm: 5950,
    sourceType: "published",
  },
] as const satisfies readonly PerformanceProfile[];

export const performanceSliderMarkers = performanceProfiles
  .filter((profile) => profile.id !== "standard-cruise" && profile.id !== "fast-cruise")
  .map(({ id, rpm, label }) => ({ rpm, label: id === "wot-reference" ? "WOT" : label }));

export const reserveOptions = [
  { value: 0, label: "Full tank / no reserve" },
  { value: 0.1, label: "10% reserve" },
  { value: 0.15, label: "15% reserve" },
  { value: 0.2, label: "20% reserve" },
] as const;
