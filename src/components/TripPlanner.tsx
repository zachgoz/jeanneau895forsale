"use client";

import { useRef, useState } from "react";
import type { PerformancePoint } from "../data/performance";
import { cruisePlaces } from "../data/cruise-routes";
import { getCruiseRoute } from "../lib/cruise-routes";
import { calculateTrip, tripDistanceBand } from "../lib/performance";
import { trackEvent } from "../lib/analytics";

interface TripPlannerProps {
  performance: PerformancePoint;
  fuelCapacityGallons: number;
  reservePercent: number;
  profileId: string;
  onInteraction: () => void;
}

const statusLabels = {
  comfortable: "Comfortably fits selected range",
  fits: "Fits selected range",
  "near-reserve": "Near selected reserve limit",
  "exceeds-reserve": "Exceeds selected reserve range",
};

function runningTime(hours: number) {
  const minutes = Math.max(1, Math.round(hours * 60));
  return minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

export function TripPlanner({
  performance,
  fuelCapacityGallons,
  reservePercent,
  profileId,
  onInteraction,
}: TripPlannerProps) {
  const [planningMode, setPlanningMode] = useState<"places" | "manual">("places");
  const [manualDistance, setManualDistance] = useState("50");
  const [fromId, setFromId] = useState("carolina-beach");
  const [toId, setToId] = useState("masonboro-island");
  const [roundTrip, setRoundTrip] = useState(false);
  const [customDistance, setCustomDistance] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const lastTracked = useRef<string | null>(null);
  const route = getCruiseRoute(fromId, toId, roundTrip);
  const from = cruisePlaces.find(place => place.id === fromId);
  const to = cruisePlaces.find(place => place.id === toId);
  const distanceInput = planningMode === "manual"
    ? manualDistance
    : customDistance ?? route?.distanceNm.toFixed(1) ?? "";
  const distanceNm = Number(distanceInput);
  const valid = (planningMode === "manual" || route !== null) && distanceInput.trim() !== "" &&
    Number.isFinite(distanceNm) && distanceNm >= 0.1 && distanceNm <= 500;
  const trip = valid
    ? calculateTrip(distanceNm, performance, fuelCapacityGallons, reservePercent)
    : null;

  function settleDistance(value: string, routeKey = planningMode === "manual" ? "manual" : `${fromId}:${toId}:${roundTrip}`) {
    const numeric = Number(value);
    if (value.trim() === "" || !Number.isFinite(numeric) || numeric < 0.1 || numeric > 500) return;
    const signature = `${numeric}:${routeKey}:${performance.rpm}:${performance.sourceType}:${profileId}:${reservePercent}`;
    if (lastTracked.current === signature) return;
    lastTracked.current = signature;
    onInteraction();
    const nextTrip = calculateTrip(numeric, performance, fuelCapacityGallons, reservePercent);
    setAnnouncement(`Cruise estimate updated. ${numeric.toFixed(1)} nautical miles, ${runningTime(nextTrip.tripHours)}, ${nextTrip.fuelRequired.toFixed(1)} gallons. ${statusLabels[nextTrip.status]}.`);
    trackEvent("trip_planner_use", {
      performance_profile: profileId,
      reserve_percent: Math.round(reservePercent * 100),
      data_source: performance.sourceType,
      distance_band: tripDistanceBand(numeric),
    });
  }

  function selectPlanningMode(mode: "places" | "manual") {
    if (mode === planningMode) return;
    setPlanningMode(mode);
    lastTracked.current = null;
    const nextDistance = mode === "manual"
      ? manualDistance
      : customDistance ?? route?.distanceNm.toFixed(1) ?? "";
    settleDistance(nextDistance, mode === "manual" ? "manual" : `${fromId}:${toId}:${roundTrip}`);
  }

  function selectRoute(nextFrom: string, nextTo: string, nextRoundTrip = roundTrip) {
    setFromId(nextFrom);
    setToId(nextTo);
    setRoundTrip(nextRoundTrip);
    setCustomDistance(null);
    const nextRoute = getCruiseRoute(nextFrom, nextTo, nextRoundTrip);
    if (nextRoute) settleDistance(nextRoute.distanceNm.toFixed(1), `${nextFrom}:${nextTo}:${nextRoundTrip}`);
  }

  return (
    <div className="perf-trip">
      <div className="perf-trip-heading">
        <span className="perf-eyebrow">A little farther from ordinary</span>
        <h3>Plan a cruise.</h3>
        <p>Pick two places or enter your distance in NM.</p>
      </div>
      <div className="perf-trip-mode" role="group" aria-label="Cruise planning method">
        <button type="button" aria-pressed={planningMode === "places"} onClick={() => selectPlanningMode("places")}>Between places</button>
        <button type="button" aria-pressed={planningMode === "manual"} onClick={() => selectPlanningMode("manual")}>Manual distance</button>
      </div>
      {planningMode === "places" && <>
      <div className="perf-route-fields">
        <div>
          <label htmlFor="trip-from">From</label>
          <select id="trip-from" value={fromId} onChange={event => selectRoute(event.target.value, toId)}>
            {cruisePlaces.map(place => <option key={place.id} value={place.id} disabled={place.id === toId}>{place.name}</option>)}
          </select>
        </div>
        <button className="perf-route-swap" type="button" aria-label="Swap departure and destination" onClick={() => selectRoute(toId, fromId)}>⇄</button>
        <div>
          <label htmlFor="trip-to">To</label>
          <select id="trip-to" value={toId} onChange={event => selectRoute(fromId, event.target.value)}>
            {cruisePlaces.map(place => <option key={place.id} value={place.id} disabled={place.id === fromId}>{place.name}</option>)}
          </select>
        </div>
      </div>
      <div className="perf-trip-type" role="group" aria-label="Cruise type">
        <button type="button" aria-pressed={!roundTrip} onClick={() => selectRoute(fromId, toId, false)}>One way</button>
        <button type="button" aria-pressed={roundTrip} onClick={() => selectRoute(fromId, toId, true)}>Round trip</button>
      </div>
      {route && (
        <div className="perf-route-summary">
          <span className="perf-eyebrow">Approximate water-route distance</span>
          <p><strong>~{route.distanceNm.toFixed(1)}</strong> <span>NM {roundTrip ? "round trip" : "one way"}</span></p>
          <small>{route.routeLabel}</small>
        </div>
      )}
      </>}
      <label className="perf-distance-label" htmlFor="trip-distance">Total planned distance</label>
      <div className="perf-distance-field">
        <input
          id="trip-distance" type="number" min="0.1" max="500" step="0.1" inputMode="decimal"
          value={distanceInput} aria-describedby="trip-distance-hint" aria-invalid={!valid}
          onChange={event => planningMode === "manual" ? setManualDistance(event.target.value) : setCustomDistance(event.target.value)}
          onBlur={() => settleDistance(distanceInput)}
          onKeyDown={event => { if (event.key === "Enter") settleDistance(distanceInput); }}
        />
        <span>Nautical miles</span>
      </div>
      <p id="trip-distance-hint" className={valid ? "perf-input-hint" : "perf-input-hint perf-input-error"}>
        {planningMode === "manual"
          ? valid
            ? "Enter 0.1–500 NM for your whole trip, including any return leg."
            : "Enter a total distance between 0.1 and 500 nautical miles."
          : valid
            ? `Adjust for your actual departure point, anchorage and detours.${roundTrip ? " Include both legs in this total." : " This total is for one way."}`
            : "Choose two different places and enter 0.1–500 nautical miles."}
      </p>
      {planningMode === "places" && customDistance !== null && route && (
        <button className="perf-route-reset" type="button" onClick={() => { setCustomDistance(null); settleDistance(route.distanceNm.toFixed(1)); }}>Use route estimate</button>
      )}
      {planningMode === "places" && route && from && to && (
        <details className="perf-route-details">
          <summary>Route assumptions & sources</summary>
          <p><strong>{from.name}:</strong> {from.endpoint}. {from.accessNote}</p>
          <p><strong>{to.name}:</strong> {to.endpoint}. {to.accessNote}</p>
          <p>{route.via.join(" → ")}</p>
          <p>{route.estimateNote}</p>
          <ul className="perf-route-legs">
            {(roundTrip ? route.legs.slice(0, route.legs.length / 2) : route.legs).map(leg => (
              <li key={leg.id}><strong>~{leg.distanceNm.toFixed(1)} NM:</strong> {leg.evidenceNote}</li>
            ))}
          </ul>
          <ul>{route.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul>
        </details>
      )}
      {trip ? (
        <div className="perf-trip-results">
          <p className={`perf-trip-status perf-trip-status--${trip.status}`}>
            <span aria-hidden="true">{trip.status === "exceeds-reserve" ? "↗" : "✓"}</span>{" "}{statusLabels[trip.status]}
          </p>
          <dl>
            <div><dt>Steady-speed running time</dt><dd>{runningTime(trip.tripHours)}</dd></div>
            <div><dt>Estimated fuel required</dt><dd>{trip.fuelRequired.toFixed(1)} <span>gal</span></dd></div>
            <div><dt>{trip.exceedsAvailableFuel ? "Estimated fuel shortfall" : "Estimated total fuel remaining"}</dt><dd>{Math.abs(trip.remainingFuelTotal).toFixed(1)} <span>gal</span></dd></div>
            <div><dt>Selected reserve ({Math.round(reservePercent * 100)}%)</dt><dd>{trip.reserveGallons.toFixed(1)} <span>gal</span></dd></div>
            <div className="perf-trip-remainder"><dt>{reservePercent === 0 ? "Estimated theoretical range remaining" : "Estimated reserve-protected range remaining"}</dt><dd>{trip.remainingReserveProtectedRangeNm.toFixed(1)} <span>NM</span></dd></div>
          </dl>
          {trip.exceedsAvailableFuel && <p className="perf-input-error">This distance exceeds the full-tank estimate by {trip.fuelShortfallGallons.toFixed(1)} gallons.</p>}
        </div>
      ) : (
        <div className="perf-trip-empty" role="status">Your estimate will appear when you enter a valid distance.</div>
      )}
      <p className="perf-sr-only" role="status">{announcement}</p>
      <p className="perf-trip-disclaimer">
        Distances are approximate planning estimates, not navigational routes.
        Running time assumes the selected speed for the whole trip; allow extra
        time and fuel for no-wake areas, current, weather, detours and stops.
        Check current charts, depths and conditions, and plan fuel conservatively.
      </p>
    </div>
  );
}
