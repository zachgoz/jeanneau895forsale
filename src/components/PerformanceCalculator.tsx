"use client";

import { useRef, useState } from "react";
import { boat } from "../data/boat";
import {
  performanceProfiles,
  performanceSliderMarkers,
  performanceSources,
  referencePerformance,
  reserveOptions,
  SUPPORTED_RPM_MIN,
  SUPPORTED_RPM_MAX,
  SUPPORTED_RPM_STEP,
  type PerformancePoint,
  type PerformanceProfile,
} from "../data/performance";
import {
  calculateRange,
  calculateRunTime,
  interpolatePerformance,
  mphToKnots,
} from "../lib/performance";
import { trackEvent } from "../lib/analytics";
import { TripPlanner } from "./TripPlanner";
import "./performance.css";

export function PerformanceCalculator() {
  const [rpm, setRpm] = useState(4000);
  const [reserve, setReserve] = useState(0.1);
  const [announcement, setAnnouncement] = useState("");
  const engaged = useRef(false);
  const lastRpmTracked = useRef<number | null>(null);
  const point = interpolatePerformance(rpm);
  const profile = performanceProfiles.find(item => item.rpm === rpm)?.id ?? "custom-rpm";
  const range = point
    ? calculateRange(boat.fuelCapacityGallons, reserve, point.mpg)
    : null;
  const hours = point
    ? calculateRunTime(boat.fuelCapacityGallons, reserve, point.gph)
    : 0;

  function interaction() {
    if (engaged.current) return;
    engaged.current = true;
    trackEvent("range_calculator_interaction", {
      performance_profile: profile,
      reserve_percent: Math.round(reserve * 100),
      data_source: point?.sourceType ?? "published",
    });
  }

  function announcePerformance(nextPoint: PerformancePoint, nextReserve = reserve) {
    const nextRange = calculateRange(boat.fuelCapacityGallons, nextReserve, nextPoint.mpg);
    setAnnouncement(`${nextPoint.rpm.toLocaleString("en-US")} RPM. ${nextPoint.speedMph.toFixed(1)} miles per hour. Estimated range ${Math.round(nextRange.nauticalMiles)} nautical miles with ${Math.round(nextReserve * 100)} percent reserve. Cruise estimates updated.`);
  }

  function settleRpm(nextRpm = rpm) {
    if (lastRpmTracked.current === nextRpm) return;
    lastRpmTracked.current = nextRpm;
    const nextPoint = interpolatePerformance(nextRpm);
    if (!nextPoint) return;
    announcePerformance(nextPoint);
    interaction();
    trackEvent("range_calculator_rpm_change", {
      performance_profile: performanceProfiles.find(item => item.rpm === nextRpm)?.id ?? "custom-rpm",
      reserve_percent: Math.round(reserve * 100),
      data_source: nextPoint.sourceType,
    });
  }

  function selectProfile(item: PerformanceProfile) {
    interaction();
    setRpm(item.rpm);
    lastRpmTracked.current = item.rpm;
    const nextPoint = interpolatePerformance(item.rpm);
    if (nextPoint) announcePerformance(nextPoint);
    trackEvent("range_calculator_profile_select", {
      performance_profile: item.id,
      reserve_percent: Math.round(reserve * 100),
      data_source: item.sourceType,
    });
  }

  const sourceLabel = point?.sourceType === "interpolated"
      ? "Interpolated estimate"
      : "Official Yamaha test";

  return (
    <section
      id="performance"
      className="performance-block"
      aria-labelledby="performance-heading"
    >
      <div className="perf-section-heading">
        <div>
          <p className="perf-eyebrow">04 · Performance & cruising range</p>
          <h2 id="performance-heading">Find your cruising pace.</h2>
        </div>
        <p>
          Explore Yamaha’s official NC 895 / twin F200 test, from trolling speed
          to full throttle. Then plan a cruise along the Carolina coast.
        </p>
      </div>
      <div className="perf-dashboard">
        <div className="perf-instruments">
          <div className="perf-rpm-heading">
            <div>
              <span
                className={`perf-source perf-source--${point?.sourceType ?? "published"}`}
              >
                {sourceLabel}
              </span>
              <p className="perf-source-description">
                NC 895 / twin F200XCA · Yamaha, September 2016
              </p>
            </div>
            <div className="perf-rpm-value">
              <strong>{rpm.toLocaleString("en-US")}</strong>
              <span>RPM</span>
            </div>
          </div>
          <label className="perf-slider-label" htmlFor="performance-rpm">
            Explore engine speed
          </label>
          <div className="perf-slider-control">
          <input
            id="performance-rpm"
            className="perf-rpm-slider"
            type="range"
            min={SUPPORTED_RPM_MIN}
            max={SUPPORTED_RPM_MAX}
            step={SUPPORTED_RPM_STEP}
            value={rpm}
            aria-valuetext={`${rpm.toLocaleString("en-US")} RPM, ${sourceLabel}`}
            aria-describedby="performance-slider-help"
            onChange={(event) => {
              setRpm(Number(event.target.value));
            }}
            onPointerUp={(event) => settleRpm(Number(event.currentTarget.value))}
            onKeyUp={(event) => {
              if (
                [
                  "ArrowLeft",
                  "ArrowRight",
                  "ArrowUp",
                  "ArrowDown",
                  "Home",
                  "End",
                  "PageUp",
                  "PageDown",
                ].includes(event.key)
              )
                settleRpm(Number(event.currentTarget.value));
            }}
            onBlur={() => settleRpm()}
          />
          <div className="perf-slider-landmarks" role="group" aria-label="Yamaha test operating points">
            {performanceSliderMarkers.map((marker, index) => {
              const item = performanceProfiles.find(item => item.rpm === marker.rpm)!;
              return (
                <button
                  key={marker.rpm}
                  type="button"
                  className={`perf-slider-marker perf-slider-marker--${index}`}
                  style={{ left: `${(marker.rpm - SUPPORTED_RPM_MIN) / (SUPPORTED_RPM_MAX - SUPPORTED_RPM_MIN) * 100}%` }}
                  aria-pressed={rpm === marker.rpm}
                  aria-label={`${marker.label}, ${marker.rpm.toLocaleString("en-US")} RPM`}
                  onClick={() => selectProfile(item)}
                >
                  <span aria-hidden="true" className="perf-marker-dot" />
                  <span>{marker.label}</span>
                  <small>{marker.rpm.toLocaleString("en-US")}{marker.rpm === 4000 ? " · planing" : ""}</small>
                </button>
              );
            })}
          </div>
          </div>
          <p id="performance-slider-help" className="perf-slider-help">
            Full tested range: 1,000–5,950 RPM. Select a marked point or move the
            slider. Between test rows, speed and fuel burn are interpolated.
            The 4,000 RPM point is the most efficient planing cruise in this test.
          </p>
          <div
            className="perf-profiles"
            aria-label="Quick performance profiles"
          >
            {performanceProfiles.filter(item => item.id === "standard-cruise" || item.id === "fast-cruise").map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={profile === item.id}
                onClick={() => selectProfile(item)}
              >
                <span>{item.label}</span>
                <small>
                  {item.rpm.toLocaleString("en-US")} RPM · Yamaha test
                </small>
              </button>
            ))}
          </div>
          {point && range ? (
            <>
              <div
                className="perf-metrics"
              >
                <div>
                  <span className="perf-metric-label">Speed</span>
                  <p>
                    <strong>{point.speedMph.toFixed(1)}</strong>{" "}
                    <span>MPH</span>
                  </p>
                  <small>{mphToKnots(point.speedMph).toFixed(1)} knots</small>
                </div>
                <div>
                  <span className="perf-metric-label">Fuel economy</span>
                  <p>
                    <strong>{(point.publishedMpg ?? point.mpg).toFixed(2)}</strong> <span>MPG</span>
                  </p>
                  <small>statute miles per gallon</small>
                </div>
                <div>
                  <span className="perf-metric-label">Total fuel burn</span>
                  <p>
                    <strong>
                      {point.gph.toFixed(1)}
                    </strong>{" "}
                    <span>GPH</span>
                  </p>
                  <small>
                    combined · both engines
                  </small>
                </div>
              </div>
              <div
                className="perf-range-panel"
              >
                <div className="perf-range-heading">
                  <span className="perf-eyebrow">
                    {reserve === 0
                      ? "Theoretical range · no reserve"
                      : `Estimated range with ${Math.round(reserve * 100)}% reserve`}
                  </span>
                  <span aria-hidden="true">↗</span>
                </div>
                <dl className="perf-range-metrics">
                  <div>
                    <dd>{Math.round(range.statuteMiles)}</dd>
                    <dt>Statute miles</dt>
                  </div>
                  <div>
                    <dd>{Math.round(range.nauticalMiles)}</dd>
                    <dt>Nautical miles</dt>
                  </div>
                  <div>
                    <dd>{hours.toFixed(1)}</dd>
                    <dt>Running hours</dt>
                  </div>
                </dl>
                <p>
                  Based on {boat.fuelCapacityGallons} gallons total fuel and{" "}
                  the selected Yamaha test speed and fuel burn.
                </p>
              </div>
              <div className="perf-reserve-control">
                <label htmlFor="performance-reserve">Fuel reserve</label>
                <select
                  id="performance-reserve"
                  value={reserve}
                  onChange={(event) => {
                    const nextReserve = Number(event.target.value);
                    interaction();
                    setReserve(nextReserve);
                    announcePerformance(point, nextReserve);
                    trackEvent("range_calculator_reserve_change", {
                      performance_profile: profile,
                      reserve_percent: Math.round(nextReserve * 100),
                      data_source: point.sourceType,
                    });
                  }}
                >
                  {reserveOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small>
                  {range.usableFuelGallons.toFixed(1)} gal usable ·{" "}
                  {(boat.fuelCapacityGallons - range.usableFuelGallons).toFixed(
                    1,
                  )}{" "}
                  gal held in reserve
                </small>
              </div>
            </>
          ) : (
            <p role="status">Reference data unavailable.</p>
          )}
        </div>
        {point && (
          <TripPlanner
            performance={point}
            fuelCapacityGallons={boat.fuelCapacityGallons}
            reservePercent={reserve}
            profileId={profile}
            onInteraction={interaction}
          />
        )}
      </div>
      <p className="perf-sr-only" role="status">{announcement}</p>
      <details
        className="perf-disclosure"
        onToggle={(event) => {
          if (event.currentTarget.open) interaction();
        }}
      >
        <summary>
          About these numbers <span aria-hidden="true">+</span>
        </summary>
        <div className="perf-disclosure-content">
          <p>
            <strong>Official Yamaha test.</strong> The slider uses all 11 rows of the{" "}
            <a
              href={performanceSources.modelReference.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Yamaha NC 895 / twin F200XCA bulletin, tested September 18, 2016
            </a>
            . Yamaha tested a boat weighing 8,964 lb with two people aboard and
            Reliance 14½ × 15 propellers. Intermediate RPM values linearly interpolate speed and burn and are
            labeled “Interpolated estimate.” Calculator economy uses speed
            divided by burn to avoid inconsistencies from rounded published MPG.
            The displayed test MPG retains Yamaha’s published rounding. These
            figures are model reference measurements, not measurements of EZ Livin.
          </p>
          <p>
            <strong>Operating points.</strong> Trolling labels identify the
            1,000 and 1,500 RPM low-speed test rows. They are selectable examples,
            rather than a Yamaha trolling recommendation. The 4,000 RPM row has
            the best measured economy among the planing-speed rows; the highest
            overall MPG occurs at 1,000 RPM. The test ends at 5,950 RPM, with no
            extrapolation beyond it.
          </p>
          <p>
            <strong>Estimates, with reserves.</strong> Loading, fuel level,
            bottom condition, propellers, wind, sea state, current and no-wake
            time all affect real results. Calculations assume a full tank,
            steady operation and the selected reserve; they exclude additional
            generator use. Prudent boating requires appropriate fuel reserves.
            This is a comparison tool, not navigation software or professional
            voyage planning.
          </p>
        </div>
        <div className="perf-reference-table">
          <table>
            <caption>
              Official Yamaha NC 895 / twin F200XCA test · September 18, 2016
            </caption>
            <thead>
              <tr>
                <th scope="col">RPM</th>
                <th scope="col">MPH</th>
                <th scope="col">GPH</th>
                <th scope="col">Published MPG</th>
              </tr>
            </thead>
            <tbody>
              {referencePerformance.map((reference) => (
                <tr key={reference.rpm}>
                  <th scope="row">{reference.rpm.toLocaleString("en-US")}</th>
                  <td>{reference.speedMph.toFixed(1)}</td>
                  <td>{reference.gph.toFixed(1)}</td>
                  <td>{reference.publishedMpg?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export default PerformanceCalculator;
