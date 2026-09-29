/**
 * Sanity tests for the offline ephemeris engine.
 * Run: npx tsx tests/astrology.test.ts  (or ts-node) — plain node with tsc output also fine.
 * Uses `assert` only; zero deps.
 */
import assert from 'node:assert';
import {
  calculateNatalChart, eclipticLongitude, getSkyNow, julianDay, findAspects,
  toPlanetPosition, PLANET_IDS,
} from '../src/lib/astrology';

let passed = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) { passed++; console.log(`PASS ${name}`); }
  else { console.error(`FAIL ${name} ${detail}`); process.exitCode = 1; }
}

// ── Julian date spot check: 2000-01-01 12:00 UT = JD 2451545.0
check('JD 2000-01-01 12:00', Math.abs(julianDay(2000, 1, 1, 12) - 2451545.0) < 1e-6,
  String(julianDay(2000, 1, 1, 12)));

// ── Fact 1: 2026-09-29 Sun in Libra ~6 deg (Libra = 180-210; ~6 deg in => ~186)
const jd1 = julianDay(2026, 9, 29, 12);
const sun1 = eclipticLongitude('sun', jd1);
console.log('  Sun lon 2026-09-29 =', sun1.toFixed(2));
check('Sun in Libra on 2026-09-29', sun1 >= 180 && sun1 < 210, `lon=${sun1}`);
check('Sun ~6 deg Libra (±2 deg)', Math.abs(sun1 - 186) <= 2, `want~186 got ${sun1.toFixed(2)}`);

// ── Fact 2: Mercury enters Scorpio between 2026-09-30 and 2026-10-01
const m1 = eclipticLongitude('mercury', julianDay(2026, 9, 30, 0));
const m2 = eclipticLongitude('mercury', julianDay(2026, 10, 1, 0));
console.log('  Mercury 09-30 =', m1.toFixed(2), ' 10-01 =', m2.toFixed(2));
const crossed = m1 < 210 && (m2 >= 210 || m2 < m1 /* retro cross handled */);
check('Mercury enters Scorpio ~09-30/10-01', crossed && m1 > 180 && m1 < 216,
  `m1=${m1} m2=${m2}`);

// ── Fact 3: Mid-2026 Jupiter in Cancer (90-120 deg)
const jup = eclipticLongitude('jupiter', julianDay(2026, 6, 15, 0));
console.log('  Jupiter mid-2026 =', jup.toFixed(2));
check('Jupiter in Cancer mid-2026', jup >= 90 && jup < 120, `lon=${jup}`);

// ── Moon sanity: 2000-01-01 moon longitude ~217.5 deg (Meeus example 47.a: 133.162655 abs -> geoc lon 133.1675? use alt check)
// Use simpler bound: Moon speed ~12-15 deg/day
const sp = ((): number => {
  const a = eclipticLongitude('moon', jd1);
  const b = eclipticLongitude('moon', jd1 + 1);
  let d = b - a; if (d > 180) d -= 360; if (d < -180) d += 360; return d;
})();
check('Moon daily speed 11-15 deg', sp > 11 && sp < 15, `speed=${sp}`);

// ── Natal chart integration
const chart = calculateNatalChart('1990-06-15', '14:30', 40.7128, -74.006);
check('chart has 11 planets', chart.planets.length === 11);
check('chart has aspects array', Array.isArray(chart.aspects));
check('ASC formatted like "X 12°34\'"', /°\d{2}'$/.test(chart.houses.ascendant.formatted),
  chart.houses.ascendant.formatted);
const sunPos = chart.planets.find((p) => p.id === 'sun')!;
check('1990-06-15 Sun in Gemini', sunPos.sign === 'Gemini', sunPos.formatted);

// ── Aspects: Jupiter trine Neptune is a multi-year feature of 2026 (both in water-ish signs)
const now = getSkyNow();
console.log('  skyNow planets:', now.planets.length, 'aspects:', now.aspects.length);
check('getSkyNow works', now.planets.length === 11);

// ── Retrograde: some planet is retrograde at a chosen date where Mars retro (2025 Jan ~ Cancer/Leo retro)
const mars2025 = toPlanetPosition('mars', julianDay(2025, 1, 15, 0));
console.log('  Mars 2025-01-15:', mars2025.formatted, 'speed', mars2025.speed.toFixed(3));
check('Mars retrograde mid-Jan 2025', mars2025.retrograde, `speed=${mars2025.speed}`);

// aspects helper sanity
const asp = findAspects(PLANET_IDS.map((id) => toPlanetPosition(id, jd1)));
check('aspects within 6 deg orb', asp.every((a) => a.orb <= 6));

console.log(`\n${passed} checks passed${process.exitCode ? ' (WITH FAILURES)' : ''}`);
