import { STATUTE_MILES_PER_NAUTICAL_MILE } from '../lib/performance';

export const cruisePlaces = [
  {
    id: 'carolina-beach', name: 'Carolina Beach',
    endpoint: 'Carolina Beach harbor / mooring-field approach',
    accessNote: 'Uses ICW Mile 295 plus a modeled 1.5 NM harbor leg; your actual berth may differ.',
  },
  {
    id: 'masonboro-island', name: 'Masonboro Island',
    endpoint: 'Southern sound-side beach approach near Carolina Beach Inlet',
    accessNote: 'Uses a modeled southern access point and 0.8 NM access leg. The north end is a different trip; no ocean-inlet passage or landing clearance is implied.',
  },
  {
    id: 'figure-eight-island', name: 'Figure Eight Island',
    endpoint: 'ICW approach at the Figure Eight Island bridge',
    accessNote: 'Ends on the ICW at Mile 278.1; no private dock, island access or bridge-opening availability is assumed.',
  },
  {
    id: 'southport', name: 'Southport',
    endpoint: 'Southport waterfront / Cape Fear approach',
    accessNote: 'Uses ICW Mile 308.9 plus a modeled 0.5 NM waterfront approach.',
  },
  {
    id: 'bald-head-island', name: 'Bald Head Island',
    endpoint: 'Bald Head Island marina approach',
    accessNote: 'Uses a modeled 3 NM Cape Fear / marina leg from the Southport waterfront approach; not a berth reservation or confirmed channel clearance.',
  },
  {
    id: 'beaufort', name: 'Beaufort, NC',
    endpoint: 'Beaufort waterfront / Taylor Creek approach',
    accessNote: 'Connected using NOAA rounded port distances. Harbor and dock movements depend on your chosen berth.',
  },
  {
    id: 'ocracoke', name: 'Ocracoke',
    endpoint: 'Silver Lake harbor approach',
    accessNote: 'Uses an inside route via Oriental, Neuse River and Pamlico Sound, then the marked Silver Lake approach; not an offshore shortcut.',
  },
] as const;

export type CruisePlaceId = typeof cruisePlaces[number]['id'];
export type CruisePlace = typeof cruisePlaces[number];

export const cruiseRouteSources = [
  { id: 'noaa-icw', label: 'NOAA Coast Pilot 4, Chapter 12 — ICW', url: 'https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp4/CPB4_C12_WEB.pdf', checkedDate: '2026-10-04' },
  { id: 'noaa-ports', label: 'NOAA Distances Between U.S. Ports — Table 13', url: 'https://nauticalcharts.noaa.gov/publications/docs/distances.pdf', checkedDate: '2026-10-04' },
  { id: 'noaa-coast', label: 'NOAA Coast Pilot 4, Chapter 5 — Cape Lookout to Cape Fear', url: 'https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp4/CPB4_C05_WEB.pdf', checkedDate: '2026-10-04' },
  { id: 'noaa-pamlico', label: 'NOAA Coast Pilot 4, Chapter 4 — Pamlico and Ocracoke approaches', url: 'https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp4/CPB4_C04_WEB.pdf', checkedDate: '2026-10-04' },
  { id: 'carolina-harbor', label: 'Town of Carolina Beach — Municipal Marina and Mooring Field', url: 'https://www.carolinabeach.gov/306/Municipal-Marina-Mooring-Field', checkedDate: '2026-10-04' },
  { id: 'masonboro-reserve', label: 'NC DEQ — Masonboro Island Reserve', url: 'https://www.deq.nc.gov/about/divisions/nc-coastal-reserve/reserve-sites/masonboro-island-reserve', checkedDate: '2026-10-04' },
  { id: 'figure-eight-geography', label: 'USACE — Figure Eight Island waterway context', url: 'https://www.saw.usace.army.mil/Missions/Regulatory-Permit-Program/Public-Notices/article-view-display/Article/814793/saw-2006-41158/', checkedDate: '2026-10-04' },
  { id: 'silver-lake', label: 'National Park Service — Silver Lake Harbor', url: 'https://www.nps.gov/places/000/silver-lake-harbor.htm', checkedDate: '2026-10-04' },
  { id: 'bald-head-marina', label: 'Bald Head Island — Marina operator location description', url: 'https://www.baldheadisland.com/see-do/marinas/bald-head-island-marina', checkedDate: '2026-10-04' },
] as const;

export type CruiseRouteSourceId = typeof cruiseRouteSources[number]['id'];
export type CruiseRouteSource = typeof cruiseRouteSources[number];
export type CruiseRouteNodeId = CruisePlaceId | 'icw-carolina' | 'icw-masonboro-south' | 'icw-southport' | 'morehead-city' | 'oriental';

export type CruiseRouteLeg = {
  id: string;
  fromNode: CruiseRouteNodeId;
  toNode: CruiseRouteNodeId;
  distanceNm: number;
  basis: 'icw-mileage' | 'published-port-distance' | 'modeled-access';
  via: readonly string[];
  sourceIds: readonly CruiseRouteSourceId[];
  evidenceNote: string;
};

export const cruiseRouteModelNote = 'Approximate waterway planning model, not a navigational route. Named approaches and access allowances are assumptions; replace the distance with your charted plan. Conditions, bridge waits, no-wake travel, landing permission and depth are not verified. Round trip doubles distance, not a guarantee of equal travel time.';

// ICW mileposts are STATUTE miles. These are waterway station differences,
// never latitude/longitude straight-line distances. Masonboro's station is a
// deliberately disclosed approximate access assumption, not a published milepost.
export const icwRouteStations = {
  moreheadCity: { statuteMile: 204.3, basis: 'published', sourceId: 'noaa-icw' },
  figureEight: { statuteMile: 278.1, basis: 'published', sourceId: 'noaa-icw' },
  masonboroSouth: { statuteMile: 293.5, basis: 'modeled', sourceId: 'masonboro-reserve' },
  carolinaBeach: { statuteMile: 295, basis: 'published', sourceId: 'carolina-harbor' },
  southport: { statuteMile: 308.9, basis: 'published', sourceId: 'noaa-icw' },
} as const;

const icwDistance = (northStatuteMile: number, southStatuteMile: number) =>
  (southStatuteMile - northStatuteMile) / STATUTE_MILES_PER_NAUTICAL_MILE;

export const cruiseRouteLegs: readonly CruiseRouteLeg[] = [
  {
    id: 'carolina-harbor-access', fromNode: 'carolina-beach', toNode: 'icw-carolina', distanceNm: 1.5,
    basis: 'modeled-access', via: ['Carolina Beach harbor', 'Myrtle Grove Sound'],
    sourceIds: ['carolina-harbor', 'noaa-coast'],
    evidenceNote: '1.5 NM is a modeled harbor allowance, not a distance published by the town. ICW anchor: Mile 295.',
  },
  {
    id: 'masonboro-south-access', fromNode: 'masonboro-island', toNode: 'icw-masonboro-south', distanceNm: 0.8,
    basis: 'modeled-access', via: ['Masonboro Island southern sound side', 'Myrtle Grove Sound'],
    sourceIds: ['masonboro-reserve', 'noaa-coast'],
    evidenceNote: 'Both the Mile 293.5 connection and 0.8 NM access allowance are modeled. Island geography and sound-side access are documented; channel suitability is not asserted.',
  },
  {
    id: 'carolina-masonboro-icw', fromNode: 'icw-masonboro-south', toNode: 'icw-carolina',
    distanceNm: icwDistance(293.5, 295), basis: 'icw-mileage', via: ['Myrtle Grove Sound'],
    sourceIds: ['carolina-harbor', 'masonboro-reserve'],
    evidenceNote: '1.5 statute miles divided by 1.15078. The northern endpoint is the modeled Masonboro southern access station.',
  },
  {
    id: 'figure-eight-masonboro-icw', fromNode: 'figure-eight-island', toNode: 'icw-masonboro-south',
    distanceNm: icwDistance(278.1, 293.5), basis: 'icw-mileage', via: ['Figure Eight Island bridge', 'Middle Sound', 'Masonboro Sound', 'Myrtle Grove Sound'],
    sourceIds: ['noaa-icw', 'masonboro-reserve', 'figure-eight-geography'],
    evidenceNote: '15.4 statute miles divided by 1.15078; southern station is modeled.',
  },
  {
    id: 'morehead-figure-eight-icw', fromNode: 'morehead-city', toNode: 'figure-eight-island',
    distanceNm: icwDistance(204.3, 278.1), basis: 'icw-mileage', via: ['Morehead City', 'Bogue Sound', 'ICW through Stump and Topsail Sounds', 'Middle Sound', 'Figure Eight Island bridge'],
    sourceIds: ['noaa-icw', 'noaa-coast'],
    evidenceNote: 'Published ICW stations 204.3 and 278.1; 73.8 statute miles converted to nautical miles.',
  },
  {
    id: 'carolina-southport-icw', fromNode: 'icw-carolina', toNode: 'icw-southport',
    distanceNm: icwDistance(295, 308.9), basis: 'icw-mileage', via: ['Myrtle Grove Sound', "Snows Cut", 'Cape Fear River', 'Southport ICW junction'],
    sourceIds: ['carolina-harbor', 'noaa-icw', 'noaa-coast'],
    evidenceNote: 'Published anchor difference 13.9 statute miles converted to nautical miles; includes the inland Snows Cut / river route.',
  },
  {
    id: 'southport-waterfront-access', fromNode: 'icw-southport', toNode: 'southport', distanceNm: 0.5,
    basis: 'modeled-access', via: ['Southport ICW junction', 'Southport waterfront'],
    sourceIds: ['noaa-icw', 'noaa-coast'],
    evidenceNote: '0.5 NM is a modeled waterfront allowance, not a published marina-specific distance.',
  },
  {
    id: 'southport-bald-head-access', fromNode: 'southport', toNode: 'bald-head-island', distanceNm: 3,
    basis: 'modeled-access', via: ['Southport waterfront', 'Lower Cape Fear River', 'Bald Head Island marina approach'],
    sourceIds: ['noaa-coast', 'bald-head-marina'],
    evidenceNote: '3 NM is a rounded modeled river/marina allowance. The marina operator describes the island as two miles off Southport, not an exact distance from this chosen waterfront endpoint.',
  },
  {
    id: 'morehead-beaufort', fromNode: 'morehead-city', toNode: 'beaufort', distanceNm: 3,
    basis: 'published-port-distance', via: ['Morehead City', 'Beaufort Channel', 'Beaufort waterfront'],
    sourceIds: ['noaa-ports', 'noaa-coast'],
    evidenceNote: 'NOAA Table 13 rounded inside-port distance: 3 NM. Applying a port distance to the modeled Morehead reference station is approximate.',
  },
  {
    id: 'morehead-oriental', fromNode: 'morehead-city', toNode: 'oriental', distanceNm: 22,
    basis: 'published-port-distance', via: ['Morehead City', 'Newport River / Core Creek', 'Adams Creek Canal', 'Neuse River', 'Oriental approach'],
    sourceIds: ['noaa-ports', 'noaa-icw'],
    evidenceNote: 'NOAA Table 13 rounded inside distance: Morehead City–Oriental 22 NM. Port endpoint precision is not assumed.',
  },
  {
    id: 'beaufort-oriental', fromNode: 'beaufort', toNode: 'oriental', distanceNm: 22,
    basis: 'published-port-distance', via: ['Beaufort waterfront', 'Gallants Channel / Newport River', 'Core Creek / Adams Creek Canal', 'Neuse River', 'Oriental approach'],
    sourceIds: ['noaa-ports', 'noaa-icw', 'noaa-coast'],
    evidenceNote: 'NOAA Table 13 rounded inside distance: Beaufort–Oriental 22 NM. This is not an offshore route around Cape Lookout.',
  },
  {
    id: 'oriental-ocracoke', fromNode: 'oriental', toNode: 'ocracoke', distanceNm: 41,
    basis: 'published-port-distance', via: ['Oriental approach', 'Neuse River', 'Pamlico Sound', 'Big Foot Slough / Silver Lake approach', 'Ocracoke Silver Lake'],
    sourceIds: ['noaa-ports', 'noaa-pamlico', 'silver-lake'],
    evidenceNote: 'NOAA Table 13 rounded inside distance: Oriental–Ocracoke 41 NM. Coast Pilot identifies the marked harbor approach; current depths/routing must be checked separately.',
  },
];
