import {
  referencePerformance,
  type PerformancePoint,
} from "../data/performance";

export const STATUTE_MILES_PER_NAUTICAL_MILE = 1.15078;

function finiteNonnegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0)
    throw new RangeError(`${name} must be a finite nonnegative number.`);
}

function finitePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0)
    throw new RangeError(`${name} must be a finite positive number.`);
}

export function mphToKnots(speedMph: number): number {
  finiteNonnegative(speedMph, "Speed");
  return speedMph / STATUTE_MILES_PER_NAUTICAL_MILE;
}

export function statuteMilesToNauticalMiles(miles: number): number {
  finiteNonnegative(miles, "Distance");
  return miles / STATUTE_MILES_PER_NAUTICAL_MILE;
}

export function nauticalMilesToStatuteMiles(nauticalMiles: number): number {
  finiteNonnegative(nauticalMiles, "Distance");
  return nauticalMiles * STATUTE_MILES_PER_NAUTICAL_MILE;
}

export function deriveFuelBurn(speedMph: number, mpgStatute: number): number {
  finitePositive(speedMph, "Speed");
  finitePositive(mpgStatute, "Economy");
  return speedMph / mpgStatute;
}

export function calculateUsableFuel(
  fuelCapacityGallons: number,
  reservePercent: number,
): number {
  finiteNonnegative(fuelCapacityGallons, "Fuel capacity");
  if (
    !Number.isFinite(reservePercent) ||
    reservePercent < 0 ||
    reservePercent > 1
  ) {
    throw new RangeError("Reserve must be a fraction between zero and one.");
  }
  return fuelCapacityGallons * (1 - reservePercent);
}

export function calculateRange(
  fuelCapacityGallons: number,
  reservePercent: number,
  mpgStatute: number,
) {
  finitePositive(mpgStatute, "Economy");
  const usableFuelGallons = calculateUsableFuel(
    fuelCapacityGallons,
    reservePercent,
  );
  const statuteMiles = usableFuelGallons * mpgStatute;
  return {
    usableFuelGallons,
    statuteMiles,
    nauticalMiles: statuteMilesToNauticalMiles(statuteMiles),
  };
}

export function calculateRunTime(
  fuelCapacityGallons: number,
  reservePercent: number,
  gph: number,
): number {
  finitePositive(gph, "Fuel burn");
  return calculateUsableFuel(fuelCapacityGallons, reservePercent) / gph;
}

/** Returns null outside the official bulletin's supported RPM range. */
export function interpolatePerformance(
  rpm: number,
  points: readonly PerformancePoint[] = referencePerformance,
): PerformancePoint | null {
  if (!Number.isFinite(rpm) || points.length === 0) return null;
  const sorted = [...points].sort((a, b) => a.rpm - b.rpm);
  if (rpm < sorted[0].rpm || rpm > sorted[sorted.length - 1].rpm) return null;
  const exact = sorted.find((point) => point.rpm === rpm);
  if (exact) return { ...exact };
  const upperIndex = sorted.findIndex((point) => point.rpm > rpm);
  const lower = sorted[upperIndex - 1];
  const upper = sorted[upperIndex];
  const fraction = (rpm - lower.rpm) / (upper.rpm - lower.rpm);
  const lerp = (a: number, b: number) => a + (b - a) * fraction;
  const speedMph = lerp(lower.speedMph, upper.speedMph);
  const gph = lerp(lower.gph, upper.gph);
  return {
    rpm,
    speedMph,
    gph,
    mpg: speedMph / gph,
    sourceType: "interpolated",
    sourceLabel:
      "Interpolated estimate from the official Yamaha NC 895 / twin F200XCA & LF200XCA bulletin",
    sourceUrl: lower.sourceUrl,
    burnBasis: "interpolated",
  };
}

export type TripStatus =
  "comfortable" | "fits" | "near-reserve" | "exceeds-reserve";

export function calculateTrip(
  tripNauticalMiles: number,
  performance: Pick<PerformancePoint, "speedMph" | "mpg">,
  fuelCapacityGallons: number,
  reservePercent: number,
) {
  finitePositive(tripNauticalMiles, "Trip distance");
  finitePositive(performance.speedMph, "Speed");
  finitePositive(performance.mpg, "Economy");
  const tripStatuteMiles = nauticalMilesToStatuteMiles(tripNauticalMiles);
  const speedKnots = mphToKnots(performance.speedMph);
  const tripHours = tripNauticalMiles / speedKnots;
  const fuelRequired = tripStatuteMiles / performance.mpg;
  const usableFuel = calculateUsableFuel(fuelCapacityGallons, reservePercent);
  const reserveGallons = fuelCapacityGallons - usableFuel;
  const remainingFuelTotal = fuelCapacityGallons - fuelRequired;
  const remainingUsableFuel = usableFuel - fuelRequired;
  const remainingReserveProtectedRangeNm = statuteMilesToNauticalMiles(
    Math.max(0, remainingUsableFuel * performance.mpg),
  );
  const fuelFraction = usableFuel > 0 ? fuelRequired / usableFuel : Infinity;
  const status: TripStatus =
    fuelFraction > 1
      ? "exceeds-reserve"
      : fuelFraction >= 0.9
        ? "near-reserve"
        : fuelFraction > 0.75
          ? "fits"
          : "comfortable";
  return {
    tripNauticalMiles,
    tripStatuteMiles,
    speedKnots,
    tripHours,
    fuelRequired,
    reserveGallons,
    usableFuel,
    remainingFuelTotal,
    remainingUsableFuel,
    remainingReserveProtectedRangeNm,
    fuelShortfallGallons: Math.max(0, -remainingFuelTotal),
    exceedsAvailableFuel: remainingFuelTotal < 0,
    status,
  };
}

export function tripDistanceBand(distanceNm: number): string {
  if (!Number.isFinite(distanceNm) || distanceNm < 0.1 || distanceNm > 500)
    return "invalid";
  if (distanceNm <= 10) return "0-10";
  if (distanceNm <= 50) return "11-50";
  if (distanceNm <= 100) return "51-100";
  if (distanceNm <= 150) return "101-150";
  if (distanceNm <= 200) return "151-200";
  return "201-500";
}
