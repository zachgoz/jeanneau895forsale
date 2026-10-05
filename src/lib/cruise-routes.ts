import {
  cruisePlaces, cruiseRouteLegs, cruiseRouteModelNote, cruiseRouteSources,
  type CruisePlace, type CruisePlaceId, type CruiseRouteLeg, type CruiseRouteNodeId, type CruiseRouteSource,
} from '../data/cruise-routes';

export type CruiseRouteEstimate = {
  from: CruisePlace;
  to: CruisePlace;
  roundTrip: boolean;
  oneWayDistanceNm: number;
  distanceNm: number;
  routeLabel: string;
  via: string[];
  estimateNote: string;
  sources: CruiseRouteSource[];
  legs: CruiseRouteLeg[];
};

function shortestWaterwayPath(start: CruisePlaceId, finish: CruisePlaceId): CruiseRouteLeg[] | null {
  const distances = new Map<CruiseRouteNodeId, number>([[start, 0]]);
  const paths = new Map<CruiseRouteNodeId, CruiseRouteLeg[]>([[start, []]]);
  const visited = new Set<CruiseRouteNodeId>();
  for (;;) {
    const current = [...distances.entries()].filter(([node]) => !visited.has(node))
      .sort((a, b) => a[1] - b[1])[0];
    if (!current) return null;
    const [node, distance] = current;
    if (node === finish) return paths.get(node) ?? null;
    visited.add(node);
    for (const leg of cruiseRouteLegs) {
      if (leg.fromNode !== node && leg.toNode !== node) continue;
      const forward = leg.fromNode === node;
      const next = forward ? leg.toNode : leg.fromNode;
      if (visited.has(next)) continue;
      const candidate = distance + leg.distanceNm;
      if (candidate >= (distances.get(next) ?? Infinity)) continue;
      const directed: CruiseRouteLeg = {
        ...leg, fromNode: node, toNode: next,
        via: forward ? [...leg.via] : [...leg.via].reverse(), sourceIds: [...leg.sourceIds],
      };
      distances.set(next, candidate);
      paths.set(next, [...(paths.get(node) ?? []), directed]);
    }
  }
}

function flattenVia(legs: readonly CruiseRouteLeg[]): string[] {
  return legs.flatMap((leg) => leg.via).filter((place, index, list) => index === 0 || place !== list[index - 1]);
}

/** Curated waterway estimates only. Unknown/same places fail closed. No network or coordinate math. */
export function getCruiseRoute(fromId: string, toId: string, roundTrip = false): CruiseRouteEstimate | null {
  if (typeof roundTrip !== 'boolean' || fromId === toId) return null;
  const from = cruisePlaces.find((place) => place.id === fromId);
  const to = cruisePlaces.find((place) => place.id === toId);
  if (!from || !to) return null;
  const outbound = shortestWaterwayPath(from.id, to.id);
  if (!outbound) return null;
  const oneWayDistanceNm = outbound.reduce((sum, leg) => sum + leg.distanceNm, 0);
  const inbound = roundTrip ? [...outbound].reverse().map((leg) => ({
    ...leg, fromNode: leg.toNode, toNode: leg.fromNode, via: [...leg.via].reverse(), sourceIds: [...leg.sourceIds],
  })) : [];
  const legs = [...outbound, ...inbound];
  const usedSourceIds = new Set(legs.flatMap((leg) => leg.sourceIds));
  return {
    from: { ...from }, to: { ...to }, roundTrip, oneWayDistanceNm,
    distanceNm: oneWayDistanceNm * (roundTrip ? 2 : 1),
    routeLabel: `${from.name} → ${to.name}${roundTrip ? ` → ${from.name} · round trip` : ' · one way'}`,
    via: flattenVia(legs), estimateNote: cruiseRouteModelNote,
    sources: cruiseRouteSources.filter((source) => usedSourceIds.has(source.id)).map((source) => ({ ...source })),
    legs,
  };
}
