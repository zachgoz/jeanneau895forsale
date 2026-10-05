# Curated cruise-distance model

Research checked **2026-10-04**. All seven choices support any distinct pair, reverse direction and round trip. These are **approximate waterway planning estimates**, editable by the user. They are not charted tracks, navigational instructions, confirmed depths, landing permissions or a live routing service. No coordinate straight-line distances, paid API or external request is used at runtime.

## Endpoint definitions and explicit assumptions

| Place | Defined endpoint | Modeled local allowance |
| --- | --- | --- |
| Carolina Beach | Harbor / mooring-field approach | 1.5 NM from the Mile 295 anchor; not the owner's exact berth |
| Masonboro Island | Southern sound-side beach approach near Carolina Beach Inlet | Assigned approximate ICW station 293.5 plus 0.8 NM; north-end landing would be a different trip |
| Figure Eight Island | Bridge approach on the ICW | Mile 278.1; no private dock access or clearance assumption |
| Southport | Waterfront / Cape Fear approach | 0.5 NM from Mile 308.9 |
| Bald Head Island | Marina approach | Rounded 3 NM river/access leg from the defined Southport endpoint |
| Beaufort, NC | Waterfront / Taylor Creek approach | NOAA rounded port-distance links; berth movement varies |
| Ocracoke | Silver Lake approach | Inside connection via Oriental / Pamlico Sound; no ocean shortcut |

The allowance values and Masonboro station are **implementation assumptions**, not official surveyed distances. Their sources establish geography and access context. Users should replace a displayed estimate with their chosen charted distance. No island-wide point can identify every anchorage; endpoint text stays visible in the planner.

## Primary evidence

- [NOAA Coast Pilot 4, Chapter 12](https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp4/CPB4_C12_WEB.pdf), issue dated September 27, 2026: ICW uses statute mileage; Morehead City 204.3, Figure Eight bridge 278.1 and Southport 308.9. Stations form the ICW backbone; deltas are divided by 1.15078. It identifies the inland waterway connections used by the model.
- [Town of Carolina Beach marina/mooring field](https://www.carolinabeach.gov/306/Municipal-Marina-Mooring-Field) locates the harbor at ICW Mile 295. The town does not publish this model's 1.5 NM access allowance.
- [NC DEQ Masonboro Island Reserve](https://www.deq.nc.gov/about/divisions/nc-coastal-reserve/reserve-sites/masonboro-island-reserve) describes the island between Masonboro and Carolina Beach Inlets, west of the ocean/east of the ICW, with sound-side access. The southern endpoint is chosen deliberately; station 293.5/0.8 NM are modeled.
- [USACE Figure Eight waterway context](https://www.saw.usace.army.mil/Missions/Regulatory-Permit-Program/Public-Notices/article-view-display/Article/814793/saw-2006-41158/) places the island beside the ICW. A bridge approach does not grant dock/island access.
- [NOAA Distances Between United States Ports](https://nauticalcharts.noaa.gov/publications/docs/distances.pdf), Table 13, printed page 22/PDF page 22: lower-left triangle is nautical miles; the opposite triangle is statute miles. Morehead City–Beaufort 3 NM, Morehead City–Oriental 22 NM, Beaufort–Oriental 22 NM and Oriental–Ocracoke 41 NM are retained as rounded inside-port legs. The graph chooses among these waterway links, not across land.
- [NOAA Coast Pilot Chapter 5](https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp4/CPB4_C05_WEB.pdf) supports harbor, river and Beaufort access geography. [Chapter 4](https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp4/CPB4_C04_WEB.pdf) describes Pamlico/Silver Lake channels, including Big Foot Slough. Neither establishes this model's local allowances as exact distances or current navigability.
- [National Park Service Silver Lake Harbor](https://www.nps.gov/places/000/silver-lake-harbor.htm) confirms the Ocracoke harbor endpoint on the sound side.
- [Bald Head Island marina operator](https://www.baldheadisland.com/see-do/marinas/bald-head-island-marina) describes its location two miles off Southport. That geographic description is not a measured route from our selected Southport waterfront endpoint; the 3 NM allowance is explicitly modeled.

Beaufort–Ocracoke is **63 NM via Oriental**, the sum 22 + 41. NOAA separately lists a 59 NM inside-port Beaufort–Ocracoke distance; it is not silently substituted for this deliberately chosen via-Oriental itinerary. Port-table values are rounded and not vessel-specific tracks.

## Calculation and implementation boundaries

`src/data/cruise-routes.ts` holds places, waterway graph legs, explicit basis/evidence and source IDs. `src/lib/cruise-routes.ts` finds the shortest path **within that curated graph**, not the shortest navigable route in the real world. Each reverse estimate reuses the same undirected legs; direction-specific currents/travel time remain outside the distance model. Round trip doubles one-way distance and returns outward/return legs. All 42 directed pairs are connected; longest round trip is below the planner's 500 NM input maximum.

Example local visit: Carolina Beach–southern Masonboro ≈3.6 NM, including two allowances. Carolina Beach–Southport ≈14.1 NM via Snows Cut/Cape Fear. Displaying one decimal expresses an editable model, not measured precision.

Tests cover all pairs, reversal, round trip, invalid/same IDs, connected leg continuity, documented route choices, source consistency, and returned-data mutation isolation. Distances intentionally exclude slow-zone delays, weather diversions, reserve/operating policy and fuel stops. Performance assumptions are applied separately by the trip calculator. Maintain the source/date/assumption fields when changing endpoints or adding destinations.
