import { describe, expect, it } from 'vitest';
import { cruisePlaces, cruiseRouteLegs, cruiseRouteSources } from '../data/cruise-routes';
import { getCruiseRoute } from './cruise-routes';

describe('curated coastal waterway planning', () => {
  it('supports all seven named places and all 42 directed distinct pairs', () => {
    expect(cruisePlaces.map((place) => place.id)).toEqual([
      'carolina-beach', 'masonboro-island', 'figure-eight-island', 'southport', 'bald-head-island', 'beaufort', 'ocracoke',
    ]);
    let pairCount = 0;
    for (const from of cruisePlaces) for (const to of cruisePlaces) {
      if (from.id === to.id) continue;
      const route = getCruiseRoute(from.id, to.id)!;
      const reverse = getCruiseRoute(to.id, from.id)!;
      const roundTrip = getCruiseRoute(from.id, to.id, true)!;
      expect(route).not.toBeNull();
      expect(route.distanceNm).toBeGreaterThan(0);
      expect(roundTrip.distanceNm).toBeLessThan(500);
      expect(reverse.distanceNm).toBeCloseTo(route.distanceNm, 10);
      expect(roundTrip.distanceNm).toBeCloseTo(route.distanceNm * 2, 10);
      expect(roundTrip.oneWayDistanceNm).toBeCloseTo(route.oneWayDistanceNm, 10);
      expect(route.legs[0].fromNode).toBe(from.id);
      expect(route.legs.at(-1)?.toNode).toBe(to.id);
      expect(roundTrip.legs.at(-1)?.toNode).toBe(from.id);
      expect(roundTrip.legs.reduce((sum, leg) => sum + leg.distanceNm, 0)).toBeCloseTo(roundTrip.distanceNm, 10);
      route.legs.slice(1).forEach((leg, index) => expect(route.legs[index].toNode).toBe(leg.fromNode));
      expect(route.sources.length).toBeGreaterThan(0);
      expect(route.estimateNote).toContain('not a navigational route');
      pairCount++;
    }
    expect(pairCount).toBe(42);
  });

  it('rejects unknown, blank, same and malformed identifiers', () => {
    for (const id of ['missing', '', '__proto__', 'Carolina Beach', 'carolina-beach ']) {
      expect(getCruiseRoute(id, 'ocracoke')).toBeNull();
      expect(getCruiseRoute('ocracoke', id)).toBeNull();
    }
    for (const place of cruisePlaces) expect(getCruiseRoute(place.id, place.id)).toBeNull();
  });

  it('models a local southern Masonboro visit rather than an ocean or north-end shortcut', () => {
    const route = getCruiseRoute('carolina-beach', 'masonboro-island')!;
    expect(route.distanceNm).toBeCloseTo(3.603462, 5);
    expect(route.to.endpoint).toContain('Southern sound-side');
    expect(route.legs.filter((leg) => leg.basis === 'modeled-access')).toHaveLength(2);
    expect(route.via).toContain('Myrtle Grove Sound');
    expect(route.distanceNm).toBeLessThan(10);
  });

  it('routes Carolina Beach to Southport through Snows Cut and the Cape Fear River', () => {
    const route = getCruiseRoute('carolina-beach', 'southport')!;
    expect(route.via).toContain('Snows Cut');
    expect(route.via).toContain('Cape Fear River');
    expect(route.distanceNm).toBeCloseTo(14.078762, 5);
  });

  it('uses separate published inside legs for Beaufort–Ocracoke via Oriental', () => {
    const route = getCruiseRoute('beaufort', 'ocracoke')!;
    expect(route.oneWayDistanceNm).toBe(63);
    expect(route.legs.map((leg) => leg.id)).toEqual(['beaufort-oriental', 'oriental-ocracoke']);
    expect(route.via).toContain('Oriental approach');
    expect(route.via).toContain('Pamlico Sound');
    expect(route.via.some((entry) => entry.includes('Silver Lake'))).toBe(true);
    expect(route.sources.some((source) => source.id === 'noaa-ports')).toBe(true);
  });

  it('all modeled and published legs retain explicit provenance', () => {
    const sourceIds = new Set<string>(cruiseRouteSources.map((source) => source.id));
    for (const leg of cruiseRouteLegs) {
      expect(Number.isFinite(leg.distanceNm)).toBe(true);
      expect(leg.distanceNm).toBeGreaterThan(0);
      expect(leg.evidenceNote.length).toBeGreaterThan(20);
      expect(leg.sourceIds.length).toBeGreaterThan(0);
      leg.sourceIds.forEach((id) => expect(sourceIds.has(id)).toBe(true));
    }
  });

  it('returned arrays and objects cannot alter future estimates', () => {
    const before = getCruiseRoute('beaufort', 'ocracoke')!;
    before.legs[0].distanceNm = 1;
    Object.assign(before.sources[0], { label: 'changed' });
    before.via.length = 0;
    const fresh = getCruiseRoute('beaufort', 'ocracoke')!;
    expect(fresh.distanceNm).toBe(63);
    expect(fresh.legs[0].distanceNm).toBe(22);
    expect(fresh.via.length).toBeGreaterThan(0);
    expect(fresh.sources.map((source) => String(source.label))).not.toContain('changed');
  });
});
