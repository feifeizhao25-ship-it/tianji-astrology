/**
 * Offline astrology ephemeris engine (pure TypeScript, no external deps).
 *
 * Accuracy targets: ~±0.1 deg for Sun/Moon, better than 0.5 deg for planets
 * (simplified VSOP87 / Keplerian elements with secular rates, JPL-style).
 * Good enough for sign/degree/house/aspect work, not for eclipse prediction.
 *
 * References: Meeus, "Astronomical Algorithms" 2nd ed. (ch. 22, 25, 47);
 * E.M. Standish, JPL approximate Keplerian elements (1800-2050).
 */

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export const PLANET_IDS = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'northNode',
] as const;
export type PlanetId = (typeof PLANET_IDS)[number];

export interface PlanetPosition {
  id: PlanetId;
  name: string;
  symbol: string;
  /** Apparent geocentric ecliptic longitude, degrees 0-360 tropical. */
  longitude: number;
  /** Sidereal-ish speed: change of longitude per day (deg/day), sign shows retrograde. */
  speed: number;
  retrograde: boolean;
  sign: string;
  /** Degree within sign, 0-29.99 */
  degreeInSign: number;
  formatted: string; // e.g. "Scorpio 12°34'"
}

export interface NatalChart {
  planets: PlanetPosition[];
  houses: {
    system: 'Equal (approximate)';
    ascendant: { longitude: number; sign: string; formatted: string };
    midheaven: { longitude: number; sign: string; formatted: string };
    cusps: number[]; // 12 equal houses from ASC
  };
  aspects: Aspect[];
}

export interface Aspect {
  a: PlanetId;
  b: PlanetId;
  type: AspectType;
  /** Actual angular separation. */
  angle: number;
  orb: number;
}

export type AspectType = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';

export const ASPECT_DEFS: Record<AspectType, number> = {
  conjunction: 0, opposition: 180, trine: 120, square: 90, sextile: 60,
};

export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];
const SIGN_SYMBOLS = ['\u2648', '\u2649', '\u264A', '\u264B', '\u264C', '\u264D',
  '\u264E', '\u264F', '\u2650', '\u2651', '\u2652', '\u2653'];

export const PLANET_META: Record<PlanetId, { name: string; symbol: string }> = {
  sun: { name: 'Sun', symbol: '\u2609' },
  moon: { name: 'Moon', symbol: '\u263D' },
  mercury: { name: 'Mercury', symbol: '\u263F' },
  venus: { name: 'Venus', symbol: '\u2640' },
  mars: { name: 'Mars', symbol: '\u2642' },
  jupiter: { name: 'Jupiter', symbol: '\u2643' },
  saturn: { name: 'Saturn', symbol: '\u2644' },
  uranus: { name: 'Uranus', symbol: '\u2645' },
  neptune: { name: 'Neptune', symbol: '\u2646' },
  pluto: { name: 'Pluto', symbol: '\u2647' },
  northNode: { name: 'North Node', symbol: '\u260A' },
};

// ────────────────────────────────────────────────────────────
// Time
// ────────────────────────────────────────────────────────────

const DEG = Math.PI / 180;

/** Julian Date from a UTC calendar date/time. Accepts fractional seconds. */
export function julianDay(
  year: number, month: number, day: number,
  hour = 0, minute = 0, second = 0,
): number {
  let y = year, m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day + b - 1524.5 +
    (hour + minute / 60 + second / 3600) / 24
  );
}

/** Julian Date from a JS Date (UTC instant). */
export function julianDayFromDate(d: Date): number {
  return julianDay(
    d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(),
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds() + d.getUTCMilliseconds() / 1000,
  );
}

/** Centuries since J2000.0 */
function t(jd: number): number { return (jd - 2451545.0) / 36525; }

/** Normalize to [0, 360) */
function norm360(x: number): number { return ((x % 360) + 360) % 360; }

// ────────────────────────────────────────────────────────────
// Sun (Meeus ch. 25; geocentric, apparent ~0.01 deg)
// ────────────────────────────────────────────────────────────

function sunLongitude(T: number): number {
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mr = M * DEG;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
    0.000289 * Math.sin(3 * Mr);
  return norm360(L0 + C);
}

// ────────────────────────────────────────────────────────────
// Moon (truncated ELP2000-82, Meeus ch. 47 abridged; ~±0.05 deg)
// ────────────────────────────────────────────────────────────

function moonLongitude(T: number): number {
  const Lp = 218.3164477 + 481267.88123421 * T
    - 0.0015786 * T * T + T * T * T / 538841 - T ** 4 / 65194000;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T
    + T * T * T / 545868 - T ** 4 / 113065000;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T
    + T * T * T / 24490000;
  const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T
    - T * T * T / 3526000 + T ** 4 / 863310000;

  // Main periodic terms (deg): [coeff, D, M, M', F]
  const terms: [number, number, number, number, number][] = [
    [6.288774, 0, 0, 1, 0], [1.274027, 2, 0, -1, 0], [0.658314, 2, 0, 0, 0],
    [0.213618, 0, 0, 2, 0], [-0.185116, 0, 1, 0, 0], [-0.114332, 0, 0, 0, 2],
    [0.058793, 2, 0, -2, 0], [0.057066, 2, -1, -1, 0], [0.053322, 2, 0, 1, 0],
    [0.045758, 2, -1, 0, 0], [-0.040923, 0, 1, -1, 0], [-0.034720, 1, 0, 0, 0],
    [-0.030383, 0, 1, 1, 0], [0.015327, 2, 0, 0, -2], [-0.012528, 0, 0, 1, 2],
    [0.010980, 0, 0, 1, -2], [0.010675, 4, 0, -1, 0], [0.010034, 0, 0, 3, 0],
    [0.008548, 4, 0, -2, 0], [-0.007888, 2, 1, -1, 0],
  ];
  // Moon's mean anomaly M'
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T
    + T * T * T / 69699 - T ** 4 / 14712000;
  let sigma = 0;
  for (const [c, dD, dM, dMp_, dF] of terms) {
    sigma += c * Math.sin((D * dD + M * dM + Mp * dMp_ + F * dF) * DEG);
  }
  return norm360(Lp + sigma);
}

// ────────────────────────────────────────────────────────────
// Planets via heliocentric Keplerian elements (Standish, valid 1800-2050)
// a[au], e, I[deg], L[deg], long.peri., long.node. + rates per century.
// ────────────────────────────────────────────────────────────

interface KeplerElements {
  a: [number, number]; e: [number, number]; I: [number, number];
  L: [number, number]; w: [number, number]; O: [number, number];
}

const ELEMENTS: Record<string, KeplerElements> = {
  mercury: {
    a: [0.38709927, 0.00000037], e: [0.20563593, 0.00001906], I: [7.00497902, -0.00594749],
    L: [252.25032350, 149472.67411175], w: [77.45779628, 0.16047689], O: [48.33076593, -0.12534081],
  },
  venus: {
    a: [0.72333566, 0.00000390], e: [0.00677672, -0.00004107], I: [3.39467605, -0.00078890],
    L: [181.97909950, 58517.81538729], w: [131.60246718, 0.00268329], O: [76.67984255, -0.27769418],
  },
  earth: {
    a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], I: [-0.00001531, -0.01294668],
    L: [100.46457166, 35999.37244981], w: [102.93768193, 0.32327364], O: [0.0, 0.0],
  },
  mars: {
    a: [1.52371034, 0.00001847], e: [0.09339410, 0.00007882], I: [1.84969142, -0.00813131],
    L: [-4.55343205, 19140.30268499], w: [-23.94362959, 0.44441088], O: [49.55953891, -0.29257343],
  },
  jupiter: {
    a: [5.20288700, -0.00011607], e: [0.04838624, -0.00013253], I: [1.30439695, -0.00183714],
    L: [34.39644051, 3034.74612775], w: [14.72847983, 0.21252668], O: [100.47390909, 0.20469106],
  },
  saturn: {
    a: [9.53667594, -0.00125060], e: [0.05386179, -0.00050991], I: [2.48599187, 0.00193609],
    L: [49.95424423, 1222.49362201], w: [92.59887831, -0.41897216], O: [113.66242448, -0.28867794],
  },
  uranus: {
    a: [19.18916464, -0.00196176], e: [0.04725744, -0.00004397], I: [0.77263783, -0.00242939],
    L: [313.23810451, 428.48202785], w: [170.95427630, 0.40805281], O: [74.01692503, 0.04240589],
  },
  neptune: {
    a: [30.06992276, 0.00026291], e: [0.00859048, 0.00005105], I: [1.77004347, 0.00035372],
    L: [-55.12002969, 218.45945325], w: [44.96476227, -0.32241464], O: [131.78422574, -0.00508664],
  },
};

/** Heliocentric ecliptic rectangular coords (au) of planet at centuries T. */
function helioXYZ(el: KeplerElements, T: number): [number, number, number] {
  const a = el.a[0] + el.a[1] * T;
  const e = el.e[0] + el.e[1] * T;
  const I = (el.I[0] + el.I[1] * T) * DEG;
  const L = el.L[0] + el.L[1] * T;
  const w = (el.w[0] + el.w[1] * T) * DEG; // longitude of perihelion
  const O = (el.O[0] + el.O[1] * T) * DEG; // longitude of ascending node

  const argPeri = w - O;
  let M = L - (el.w[0] + el.w[1] * T); // mean anomaly
  M = norm360(M);
  if (M > 180) M -= 360;

  // Kepler equation (Newton, radians)
  let E = M * DEG + e * Math.sin(M * DEG);
  for (let i = 0; i < 12; i++) {
    const dE = (E - e * Math.sin(E) - M * DEG) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);

  const cosO = Math.cos(O), sinO = Math.sin(O);
  const cosw = Math.cos(argPeri), sinw = Math.sin(argPeri);
  const cosI = Math.cos(I), sinI = Math.sin(I);

  // Rotate perifocal -> ecliptic
  const x = (cosw * cosO - sinw * sinO * cosI) * xv + (-sinw * cosO - cosw * sinO * cosI) * yv;
  const y = (cosw * sinO + sinw * cosO * cosI) * xv + (-sinw * sinO + cosw * cosO * cosI) * yv;
  const z = (sinw * sinI) * xv + (cosw * sinI) * yv;
  return [x, y, z];
}

/** Geocentric apparent ecliptic longitude of a planet (deg). */
function planetLongitude(id: string, T: number): number {
  const p = helioXYZ(ELEMENTS[id], T);
  const e = helioXYZ(ELEMENTS.earth, T);
  const x = p[0] - e[0], y = p[1] - e[1];
  return norm360(Math.atan2(y, x) / DEG);
}

// Pluto: simple fitted elements for 1800-2050 (Standish appendix, good ~<1 deg).
function plutoLongitude(T: number): number {
  // Standish appendix Keplerian elements for Pluto (1800-2050, ~<1 deg).
  const el: KeplerElements = {
    a: [39.48211675, -0.00031596], e: [0.24882730, 0.00005170], I: [17.14001206, 0.00004818],
    L: [238.92903833, 145.20780515], w: [224.06891629, -0.04062942], O: [110.30393684, -0.01183482],
  };
  return planetLongitudeFromEl(el, T);
}
function planetLongitudeFromEl(el: KeplerElements, T: number): number {
  const p = helioXYZ(el, T);
  const e = helioXYZ(ELEMENTS.earth, T);
  return norm360(Math.atan2(p[1] - e[1], p[0] - e[0]) / DEG);
}

/** Mean lunar north node (deg). */
function meanNodeLongitude(T: number): number {
  return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T
    + T * T * T / 467441 - T ** 4 / 60616000);
}

// ────────────────────────────────────────────────────────────
// Public position API
// ────────────────────────────────────────────────────────────

export function eclipticLongitude(id: PlanetId, jd: number): number {
  const T = t(jd);
  switch (id) {
    case 'sun': return sunLongitude(T);
    case 'moon': return moonLongitude(T);
    case 'pluto': return plutoLongitude(T);
    case 'northNode': return meanNodeLongitude(T);
    default: return planetLongitude(id, T);
  }
}

export function longitudeSpeed(id: PlanetId, jd: number): number {
  const dt = 0.5; // days
  const a = eclipticLongitude(id, jd - dt);
  const b = eclipticLongitude(id, jd + dt);
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d / (2 * dt);
}

function formatDegree(lon: number): string {
  const signIdx = Math.floor(norm360(lon) / 30);
  const deg = norm360(lon) - signIdx * 30;
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${SIGNS[signIdx]} ${d}\u00B0${String(m).padStart(2, '0')}'`;
}

export function toPlanetPosition(id: PlanetId, jd: number): PlanetPosition {
  const longitude = eclipticLongitude(id, jd);
  const speed = id === 'northNode' ? -0.053 : longitudeSpeed(id, jd);
  const signIdx = Math.floor(longitude / 30);
  return {
    id, ...PLANET_META[id],
    longitude,
    speed,
    retrograde: speed < 0,
    sign: SIGNS[signIdx],
    degreeInSign: longitude - signIdx * 30,
    formatted: formatDegree(longitude),
  };
}

// ────────────────────────────────────────────────────────────
// Houses (Equal House, approximate ascendant via conventional formula)
// ────────────────────────────────────────────────────────────

/** Approximate local sidereal time in hours. */
function localSiderealTime(jd: number, lonEast: number): number {
  const T = t(jd);
  const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0)
    + 0.000387933 * T * T - T * T * T / 38710000;
  return ((norm360(gmst + lonEast) / 15) + 24) % 24;
}

/**
 * Approximate ascendant (Oblique Ascension method, mid-latitude accuracy
 * ~<1 deg; degrades near polar latitudes). MARKED APPROXIMATE.
 */
export function ascendantLongitude(jd: number, lat: number, lonEast: number): number {
  const lst = localSiderealTime(jd, lonEast); // hours
  const ramc = lst * 15; // MC right ascension (deg)
  const obliq = 23.4392911 - 0.0130042 * t(jd);
  const asc = Math.atan2(
    -Math.cos(ramc * DEG),
    Math.sin(ramc * DEG) * Math.cos(obliq * DEG)
      + Math.tan(lat * DEG) * Math.sin(obliq * DEG),
  ) / DEG;
  return norm360(asc + 180); // atan2 branch above yields descendant sign convention
}

/** Approximate midheaven ecliptic longitude. */
export function midheavenLongitude(jd: number, lat: number, lonEast: number): number {
  void lat;
  const ramc = localSiderealTime(jd, lonEast) * 15;
  const obliq = 23.4392911 - 0.0130042 * t(jd);
  return norm360(Math.atan2(Math.sin(ramc * DEG), Math.cos(ramc * DEG) * Math.cos(obliq * DEG)) / DEG);
}

// ────────────────────────────────────────────────────────────
// Aspects
// ────────────────────────────────────────────────────────────

export function angularSeparation(a: number, b: number): number {
  let d = Math.abs(norm360(a) - norm360(b));
  if (d > 180) d = 360 - d;
  return d;
}

const MAX_ORB = 6;

export function findAspects(positions: PlanetPosition[]): Aspect[] {
  const out: Aspect[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const sep = angularSeparation(positions[i].longitude, positions[j].longitude);
      for (const [type, exact] of Object.entries(ASPECT_DEFS) as [AspectType, number][]) {
        const orb = Math.abs(sep - exact);
        if (orb <= MAX_ORB) {
          out.push({ a: positions[i].id, b: positions[j].id, type, angle: sep, orb });
          break;
        }
      }
    }
  }
  return out;
}

// ────────────────────────────────────────────────────────────
// High-level API
// ────────────────────────────────────────────────────────────

function parseWhen(birthDateISO: string, birthTimeISO: string): { jd: number; tzOffsetKnown: false } {
  // birthDateISO assumed already in UTC or local-approx; we treat the given
  // time as UTC for a deterministic offline engine (documented limitation).
  const [y, m, d] = birthDateISO.split('-').map(Number);
  const [hh, mm] = (birthTimeISO || '12:00').split(':').map(Number);
  return { jd: julianDay(y, m, d, hh || 0, mm || 0), tzOffsetKnown: false };
}

export function calculateNatalChart(
  birthDateISO: string,
  birthTimeISO: string,
  lat: number,
  lon: number,
): NatalChart {
  const { jd } = parseWhen(birthDateISO, birthTimeISO);
  const planets = PLANET_IDS.map((id) => toPlanetPosition(id, jd));
  const asc = ascendantLongitude(jd, lat, lon);
  const mc = midheavenLongitude(jd, lat, lon);
  const cusps = Array.from({ length: 12 }, (_, i) => norm360(asc + i * 30));
  return {
    planets,
    houses: {
      system: 'Equal (approximate)',
      ascendant: { longitude: asc, sign: SIGNS[Math.floor(asc / 30)], formatted: formatDegree(asc) },
      midheaven: { longitude: mc, sign: SIGNS[Math.floor(mc / 30)], formatted: formatDegree(mc) },
      cusps,
    },
    aspects: findAspects(planets),
  };
}

/** Live sky snapshot for right now (transits). */
export function getSkyNow(): { when: string; planets: PlanetPosition[]; aspects: Aspect[] } {
  const jd = julianDayFromDate(new Date());
  const planets = PLANET_IDS.map((id) => toPlanetPosition(id, jd));
  return {
    when: new Date().toISOString(),
    planets,
    aspects: findAspects(planets),
  };
}

/** Smallest angular separation between a transiting planet and any natal point. */
export function transitHits(
  transit: PlanetPosition[],
  natal: PlanetPosition[],
  orb = 3,
): { transit: PlanetId; natal: PlanetId; type: AspectType; orb: number }[] {
  const hits: { transit: PlanetId; natal: PlanetId; type: AspectType; orb: number }[] = [];
  for (const tr of transit) {
    if (tr.id === 'northNode') continue;
    for (const na of natal) {
      const sep = angularSeparation(tr.longitude, na.longitude);
      for (const [type, exact] of Object.entries(ASPECT_DEFS) as [AspectType, number][]) {
        const o = Math.abs(sep - exact);
        if (o <= orb) { hits.push({ transit: tr.id, natal: na.id, type, orb: o }); break; }
      }
    }
  }
  return hits;
}

export const SIGN_SYMBOL = (sign: string) => SIGN_SYMBOLS[SIGNS.indexOf(sign)] ?? '';
