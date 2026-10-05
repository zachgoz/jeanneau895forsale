import { describe, expect, it } from "vitest";
import {
  performanceProfiles,
  performanceSliderMarkers,
  performanceSources,
  referencePerformance,
  SUPPORTED_RPM_MIN,
  SUPPORTED_RPM_MAX,
  SUPPORTED_RPM_STEP,
} from "../data/performance";
import {
  calculateRange,
  calculateRunTime,
  calculateTrip,
  calculateUsableFuel,
  deriveFuelBurn,
  interpolatePerformance,
  mphToKnots,
  nauticalMilesToStatuteMiles,
  statuteMilesToNauticalMiles,
  tripDistanceBand,
} from "./performance";

const efficientCruise = referencePerformance.find((point) => point.rpm === 4000)!;
const standardCruise = referencePerformance.find((point) => point.rpm === 4500)!;

describe("Yamaha cruise range and reserves", () => {
  it("calculates the official 4,000 RPM reference with a ten-percent reserve", () => {
    expect(calculateUsableFuel(158, 0.1)).toBeCloseTo(142.2, 8);
    expect(deriveFuelBurn(efficientCruise.speedMph, efficientCruise.mpg)).toBeCloseTo(14.8, 8);
    const range = calculateRange(158, 0.1, efficientCruise.mpg);
    expect(range.statuteMiles).toBeCloseTo(257.4972973, 6);
    expect(range.nauticalMiles).toBeCloseTo(223.7589264, 6);
    expect(calculateRunTime(158, 0.1, efficientCruise.gph)).toBeCloseTo(9.6081081, 6);
  });

  it.each([
    [0, 158, 286.1081081, 10.6756757],
    [0.15, 134.3, 243.1918919, 9.0743243],
    [0.2, 126.4, 228.8864865, 8.5405405],
  ])("protects the %s reserve", (reserve, usable, miles, hours) => {
    expect(calculateUsableFuel(158, reserve)).toBeCloseTo(usable, 8);
    expect(calculateRange(158, reserve, efficientCruise.mpg).statuteMiles).toBeCloseTo(
      miles,
      6,
    );
    expect(calculateRunTime(158, reserve, efficientCruise.gph)).toBeCloseTo(hours, 6);
  });

  it("rejects invalid calculation assumptions rather than showing impossible estimates", () => {
    expect(() => calculateUsableFuel(158, -0.1)).toThrow(RangeError);
    expect(() => calculateUsableFuel(158, 10)).toThrow(RangeError);
    expect(() => calculateUsableFuel(-1, 0.1)).toThrow(RangeError);
    expect(() => calculateRange(158, 0.1, 0)).toThrow(RangeError);
    expect(() => calculateRunTime(158, 0.1, NaN)).toThrow(RangeError);
    expect(() => deriveFuelBurn(standardCruise.speedMph, 0)).toThrow(RangeError);
  });
});

describe("units and reference interpolation", () => {
  it.each([
    [1000, 4.8, 1.6, 3.0],
    [1500, 6.3, 2.6, 2.42],
    [2000, 7.8, 4.2, 1.86],
    [2500, 9.2, 6.5, 1.42],
    [3000, 10.2, 9.6, 1.06],
    [3500, 17.1, 12.7, 1.35],
    [4000, 26.8, 14.8, 1.81],
    [4500, 32.0, 18.9, 1.69],
    [5000, 36.5, 25.5, 1.43],
    [5500, 40.2, 32.5, 1.24],
    [5950, 44.0, 39.5, 1.11],
  ])("matches the verified Yamaha bulletin at %s RPM", (rpm, speedMph, gph, publishedMpg) => {
    const point = interpolatePerformance(rpm);
    expect(point).toMatchObject({ rpm, speedMph, gph, publishedMpg, sourceType: "published", burnBasis: "published" });
    expect(point?.mpg).toBeCloseTo(speedMph / gph, 10);
    expect(point?.sourceUrl).toBe(performanceSources.yamaha.url);
  });

  it("covers the entire official range and exposes supported slider landmarks", () => {
    expect(referencePerformance).toHaveLength(11);
    expect(SUPPORTED_RPM_MIN).toBe(1000);
    expect(SUPPORTED_RPM_MAX).toBe(5950);
    expect(SUPPORTED_RPM_STEP).toBe(50);
    expect((SUPPORTED_RPM_MAX - SUPPORTED_RPM_MIN) % SUPPORTED_RPM_STEP).toBe(0);
    expect(performanceSliderMarkers).toEqual([
      { rpm: 1000, label: "Trolling" },
      { rpm: 1500, label: "Slow trolling" },
      { rpm: 4000, label: "Efficient cruise" },
      { rpm: 5950, label: "WOT" },
    ]);
    for (const profile of performanceProfiles) {
      expect(interpolatePerformance(profile.rpm)?.sourceType).toBe("published");
    }
    expect(performanceProfiles.find((profile) => profile.id === "standard-cruise")).toMatchObject({ label: "Cruise", rpm: 4500, sourceType: "published" });
    expect(performanceProfiles).toHaveLength(6);
    expect(performanceSources.modelReference).toBe(performanceSources.yamaha);
    expect(performanceSources.yamaha.testDate).toBe("2016-09-18");
  });

  it("distinguishes best trolling economy from efficient planing cruise", () => {
    const bestEconomy = referencePerformance.reduce((best, point) => point.mpg > best.mpg ? point : best);
    const cruisingPoints = referencePerformance.filter((point) => point.rpm >= 4000);
    const bestCruiseEconomy = cruisingPoints.reduce((best, point) => point.mpg > best.mpg ? point : best);
    expect(bestEconomy.rpm).toBe(1000);
    expect(bestEconomy.publishedMpg).toBe(3);
    expect(bestCruiseEconomy.rpm).toBe(performanceProfiles.find((profile) => profile.id === "efficient-cruise")?.rpm);
    expect(bestCruiseEconomy.rpm).toBe(4000);
  });

  it("converts mph to knots and statute miles to nautical miles and back", () => {
    expect(mphToKnots(32)).toBeCloseTo(27.8072264, 6);
    expect(statuteMilesToNauticalMiles(257.4972973)).toBeCloseTo(223.7589264, 6);
    expect(nauticalMilesToStatuteMiles(150)).toBeCloseTo(172.617, 8);
    expect(
      statuteMilesToNauticalMiles(nauticalMilesToStatuteMiles(150)),
    ).toBeCloseTo(150, 8);
  });

  it("preserves the official 4,500 RPM observation and its rounded MPG", () => {
    expect(interpolatePerformance(4500)).toMatchObject({
      rpm: 4500,
      speedMph: 32.0,
      gph: 18.9,
      sourceType: "published",
      publishedMpg: 1.69,
    });
    expect(interpolatePerformance(4500)?.mpg).toBeCloseTo(32.0 / 18.9, 8);
  });

  it("linearly interpolates speed and burn and derives consistent economy", () => {
    const result = interpolatePerformance(4250);
    expect(result).toMatchObject({
      rpm: 4250,
      sourceType: "interpolated",
      burnBasis: "interpolated",
    });
    expect(result?.speedMph).toBeCloseTo(29.4, 8);
    expect(result?.gph).toBeCloseTo(16.85, 8);
    expect(result?.mpg).toBeCloseTo(29.4 / 16.85, 8);
    expect(result?.sourceUrl).toBe(referencePerformance[0].sourceUrl);
    expect(referencePerformance[0].speedMph).toBe(4.8);
    expect(result?.publishedMpg).toBeUndefined();
  });

  it("interpolates trolling and the shorter final WOT interval without assigning a published MPG", () => {
    const trolling = interpolatePerformance(1250);
    expect(trolling?.sourceType).toBe("interpolated");
    expect(trolling?.speedMph).toBeCloseTo(5.55, 8);
    expect(trolling?.gph).toBeCloseTo(2.1, 8);
    expect(trolling?.mpg).toBeCloseTo(5.55 / 2.1, 8);
    const high = interpolatePerformance(5750);
    expect(high?.sourceType).toBe("interpolated");
    expect(high?.speedMph).toBeCloseTo(40.2 + (44 - 40.2) * (250 / 450), 8);
    expect(high?.gph).toBeCloseTo(32.5 + (39.5 - 32.5) * (250 / 450), 8);
    expect(high?.mpg).toBeCloseTo(high!.speedMph / high!.gph, 8);
    expect(high?.publishedMpg).toBeUndefined();
  });

  it("does not invent data outside the supported RPM range", () => {
    expect(interpolatePerformance(999)).toBeNull();
    expect(interpolatePerformance(5951)).toBeNull();
    expect(interpolatePerformance(6000)).toBeNull();
    expect(interpolatePerformance(NaN)).toBeNull();
    expect(interpolatePerformance(4000, [])).toBeNull();
    expect(interpolatePerformance(4000)?.sourceType).toBe("published");
    expect(interpolatePerformance(1000)?.sourceType).toBe("published");
    expect(interpolatePerformance(5950)?.speedMph).toBe(44);
  });
});

describe("trip planner", () => {
  it("derives a 150 NM trip from Yamaha's 4,500 RPM test and protects the selected reserve", () => {
    const trip = calculateTrip(150, standardCruise, 158, 0.1);
    expect(trip.tripStatuteMiles).toBeCloseTo(172.617, 8);
    expect(trip.fuelRequired).toBeCloseTo(101.9519156, 6);
    expect(trip.speedKnots).toBeCloseTo(27.8072264, 6);
    expect(trip.tripHours).toBeCloseTo(5.39428125, 8);
    expect(trip.remainingFuelTotal).toBeCloseTo(56.0480844, 6);
    expect(trip.reserveGallons).toBeCloseTo(15.8, 8);
    expect(trip.remainingUsableFuel).toBeCloseTo(40.2480844, 6);
    expect(trip.remainingReserveProtectedRangeNm).toBeCloseTo(59.2162748, 6);
    expect(trip.status).toBe("comfortable");
    expect(trip.exceedsAvailableFuel).toBe(false);
  });

  it("distinguishes crossing the reserve from exhausting the full tank", () => {
    const trip = calculateTrip(220, standardCruise, 158, 0.1);
    expect(trip.status).toBe("exceeds-reserve");
    expect(trip.remainingUsableFuel).toBeLessThan(0);
    expect(trip.remainingFuelTotal).toBeGreaterThan(0);
    expect(trip.remainingReserveProtectedRangeNm).toBe(0);
    expect(trip.exceedsAvailableFuel).toBe(false);
  });

  it("reports a fuel shortfall beyond available fuel without negative remaining range", () => {
    const trip = calculateTrip(500, standardCruise, 158, 0.1);
    expect(trip.status).toBe("exceeds-reserve");
    expect(trip.exceedsAvailableFuel).toBe(true);
    expect(trip.fuelShortfallGallons).toBeCloseTo(181.83971875, 6);
    expect(trip.remainingReserveProtectedRangeNm).toBe(0);
  });

  it("reflects reserve changes dynamically and treats no reserve as theoretical", () => {
    const none = calculateTrip(170, standardCruise, 158, 0);
    const twenty = calculateTrip(170, standardCruise, 158, 0.2);
    expect(none.reserveGallons).toBe(0);
    expect(none.remainingUsableFuel).toBe(none.remainingFuelTotal);
    expect(none.remainingReserveProtectedRangeNm).toBeGreaterThan(
      twenty.remainingReserveProtectedRangeNm,
    );
    expect(twenty.status).toBe("near-reserve");
    expect(twenty.remainingFuelTotal).toBe(none.remainingFuelTotal);
  });

  it("shows useful status thresholds from the estimated range", () => {
    const range = calculateRange(158, 0.1, standardCruise.mpg).nauticalMiles;
    expect(calculateTrip(range * 0.5, standardCruise, 158, 0.1).status).toBe(
      "comfortable",
    );
    expect(calculateTrip(range * 0.8, standardCruise, 158, 0.1).status).toBe(
      "fits",
    );
    expect(calculateTrip(range * 0.95, standardCruise, 158, 0.1).status).toBe(
      "near-reserve",
    );
    expect(calculateTrip(range * 1.01, standardCruise, 158, 0.1).status).toBe(
      "exceeds-reserve",
    );
  });

  it("keeps trip time and fuel burn consistent across every reference profile", () => {
    for (const point of referencePerformance) {
      const trip = calculateTrip(50, point, 158, 0.1);
      expect(trip.tripHours).toBeCloseTo(trip.fuelRequired / point.gph, 8);
    }
  });

  it("calculates a short local trip at the verified trolling speed", () => {
    const trolling = interpolatePerformance(1000)!;
    const trip = calculateTrip(0.1, trolling, 158, 0.1);
    expect(trip.tripStatuteMiles).toBeCloseTo(0.115078, 8);
    expect(trip.tripHours).toBeCloseTo(0.115078 / 4.8, 8);
    expect(trip.fuelRequired).toBeCloseTo(0.115078 / 3, 8);
    expect(trip.tripHours * trolling.gph).toBeCloseTo(trip.fuelRequired, 8);
    expect(trip.status).toBe("comfortable");
    expect(tripDistanceBand(trip.tripNauticalMiles)).toBe("0-10");
  });

  it("rejects negative, zero and nonfinite distances", () => {
    expect(() => calculateTrip(-150, standardCruise, 158, 0.1)).toThrow(
      RangeError,
    );
    expect(() => calculateTrip(0, standardCruise, 158, 0.1)).toThrow(RangeError);
    expect(() => calculateTrip(NaN, standardCruise, 158, 0.1)).toThrow(RangeError);
  });

  it("sends only bounded distance bands to analytics", () => {
    expect(tripDistanceBand(0.1)).toBe("0-10");
    expect(tripDistanceBand(5)).toBe("0-10");
    expect(tripDistanceBand(10)).toBe("0-10");
    expect(tripDistanceBand(10.1)).toBe("11-50");
    expect(tripDistanceBand(50)).toBe("11-50");
    expect(tripDistanceBand(100)).toBe("51-100");
    expect(tripDistanceBand(150)).toBe("101-150");
    expect(tripDistanceBand(200)).toBe("151-200");
    expect(tripDistanceBand(500)).toBe("201-500");
    expect(tripDistanceBand(0)).toBe("invalid");
    expect(tripDistanceBand(0.01)).toBe("invalid");
    expect(tripDistanceBand(-1)).toBe("invalid");
    expect(tripDistanceBand(NaN)).toBe("invalid");
    expect(tripDistanceBand(501)).toBe("invalid");
  });
});
