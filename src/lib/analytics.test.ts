import { describe, it, expect } from "vitest";
import { getMeasurementId, sanitizeAnalyticsProperties, type AnalyticsProperties } from "./analytics";
import { performanceProfiles } from "@/data/performance";
describe("analytics privacy", () => {
  it("only enables valid configured GA IDs", () => {
    expect(getMeasurementId("")).toBeNull();
    expect(getMeasurementId("hello")).toBeNull();
    expect(getMeasurementId("G-TEST1234")).toBe("G-TEST1234");
  });
  it("removes unknown fields and PII disguised as safe fields", () => {
    const supplied = {
      email: "private@example.com",
      message: "private",
      cta_location: "private@example.com",
      performance_profile: "standard-cruise",
      reserve_percent: 10,
      data_source: "published",
      distance_band: "101-150",
    } as const;
    expect(sanitizeAnalyticsProperties(supplied)).toEqual({
      performance_profile: "standard-cruise",
      reserve_percent: 10,
      data_source: "published",
      distance_band: "101-150",
    });
  });
  it("rejects free text in identifier fields", () => {
    expect(
      sanitizeAnalyticsProperties({
        performance_profile: "JohnSmith",
        photo_id: "John-Smith",
      }),
    ).toEqual({});
  });
  it("accepts every current Yamaha profile and interpolated custom settings", () => {
    for (const profile of performanceProfiles) {
      expect(sanitizeAnalyticsProperties({ performance_profile: profile.id, data_source: profile.sourceType })).toEqual({
        performance_profile: profile.id,
        data_source: "published",
      });
    }
    expect(sanitizeAnalyticsProperties({ performance_profile: "custom-rpm", data_source: "interpolated", distance_band: "0-10" })).toEqual({
      performance_profile: "custom-rpm",
      data_source: "interpolated",
      distance_band: "0-10",
    });
  });
  it("explicitly rejects retired performance profiles and sources", () => {
    const legacy = { performance_profile: "owner-cruise", data_source: "owner", reserve_percent: 10 };
    expect(sanitizeAnalyticsProperties(legacy as unknown as AnalyticsProperties)).toEqual({ reserve_percent: 10 });
    expect(sanitizeAnalyticsProperties({ performance_profile: "standard-cruise", data_source: "owner" } as unknown as AnalyticsProperties)).toEqual({ performance_profile: "standard-cruise" });
    expect(sanitizeAnalyticsProperties({ performance_profile: "owner-cruise", data_source: "published" })).toEqual({ data_source: "published" });
  });
  it("sanitizes gallery staging modes and paired photo targets strictly", () => {
    expect(
      sanitizeAnalyticsProperties({
        mode: "staged",
        photo_id: "forward-cabin-staged",
        target_id: "forward-cabin",
      }),
    ).toEqual({
      mode: "staged",
      photo_id: "forward-cabin-staged",
      target_id: "forward-cabin",
    });
    expect(
      sanitizeAnalyticsProperties({
        mode: "invalid_mode" as unknown as "staged",
        photo_id: "arbitrary-injection",
        target_id: "fake-id",
      }),
    ).toEqual({});
  });
});
