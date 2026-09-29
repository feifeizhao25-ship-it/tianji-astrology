/**
 * ChartScreen — natal chart + live transits, fully offline.
 * No login required: this is the reviewer demo path ("Free Chart").
 */
import React, { useMemo, useState } from 'react';
import {
  Dimensions, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AspectType, calculateNatalChart, getSkyNow, NatalChart, PLANET_META,
  transitHits, SIGNS,
} from '../lib/astrology';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_SIZE = Math.min(SCREEN_W - 48, 340);
const CENTER = CHART_SIZE / 2;
const R_TRANSIT = CHART_SIZE / 2 - 6;
const R_NATAL = CHART_SIZE / 2 - 44;

const CITIES = [
  { label: 'New York, USA', lat: 40.7128, lon: -74.006 },
  { label: 'London, UK', lat: 51.5074, lon: -0.1278 },
  { label: 'Beijing, China', lat: 39.9042, lon: 116.4074 },
  { label: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
  { label: 'Sydney, Australia', lat: -33.8688, lon: 151.2093 },
  { label: 'Los Angeles, USA', lat: 34.0522, lon: -118.2437 },
];

const ASPECT_SYMBOL: Record<AspectType, string> = {
  conjunction: '\u260C', opposition: '\u260D', trine: '\u25B3',
  square: '\u25A1', sextile: '\u2B58',
};

// ── Built-in interpretation templates (offline, no API) ──

const SUN_TEXT: Record<string, string> = {
  Aries: 'You move first and think fast. Your core self ignites when there is a challenge to meet head-on, and your courage is contagious.',
  Taurus: 'You build steadily and savor deeply. Security, beauty and tangible results anchor your sense of self.',
  Gemini: 'You are wired for curiosity. Ideas, conversation and quick learning are how your core identity expresses itself.',
  Cancer: 'You lead with care. Your emotional intelligence and protective instincts define who you are at heart.',
  Leo: 'You shine when you create. Warmth, generosity and a natural flair for the dramatic fuel your core self.',
  Virgo: 'You perfect what others overlook. Analysis, craft and helpfulness are the signature of your identity.',
  Libra: 'You seek harmony and fair balance. Relationship and refined aesthetics shape your essential self.',
  Scorpio: 'You go where others will not. Depth, loyalty and quiet intensity define your core identity.',
  Sagittarius: 'You expand by exploring. Truth-seeking, optimism and freedom are your elemental fuel.',
  Capricorn: 'You climb with patience and purpose. Ambition, discipline and long-horizon thinking define you.',
  Aquarius: 'You see the future before others do. Originality and humanitarian instinct anchor your identity.',
  Pisces: 'You feel the invisible. Imagination, compassion and spiritual sensitivity define your core self.',
};

const MOON_TEXT: Record<string, string> = {
  Aries: 'Emotionally you need action: feelings flare fast, run hot, and clear just as quickly.',
  Taurus: 'Emotionally you need stability: comfort, routine and physical calm soothe you fastest.',
  Gemini: 'Emotionally you need to talk it out: naming a feeling is half the healing for you.',
  Cancer: 'Emotionally you need sanctuary: home and trusted people are your recharge stations.',
  Leo: 'Emotionally you need to be seen: appreciation and creative outlets steady your mood.',
  Virgo: 'Emotionally you need order: a solved problem calms you more than a pep talk.',
  Libra: 'Emotionally you need peace: conflict unsettles you, beauty restores you.',
  Scorpio: 'Emotionally you need depth: small talk starves you; real intimacy feeds you.',
  Sagittarius: 'Emotionally you need room: perspective, travel and humor are your medicine.',
  Capricorn: 'Emotionally you need purpose: being useful steadies you more than being comforted.',
  Aquarius: 'Emotionally you need space: you process feelings intellectually before you feel safe sharing them.',
  Pisces: 'Emotionally you need solitude and art: your inner tide needs quiet shores.',
};

const RISING_TEXT: Record<string, string> = {
  fire: 'With a fire-sign ascendant, you come across as direct, energetic and confident — people expect momentum from you.',
  earth: 'With an earth-sign ascendant, you come across as grounded, reliable and composed — people trust your steadiness.',
  air: 'With an air-sign ascendant, you come across as articulate, observant and easy to talk to — ideas are your handshake.',
  water: 'With a water-sign ascendant, you come across as receptive, warm and quietly perceptive — people open up to you.',
};

function elementOf(sign: string): 'fire' | 'earth' | 'air' | 'water' {
  const i = SIGNS.indexOf(sign);
  return (['fire', 'earth', 'air', 'water'] as const)[((i % 4) + 4) % 4];
}

function buildInterpretation(chart: NatalChart): string[] {
  const sun = chart.planets.find((p) => p.id === 'sun')!;
  const moon = chart.planets.find((p) => p.id === 'moon')!;
  const rising = chart.houses.ascendant.sign;
  const paras = [
    `Your Sun in ${sun.sign} (${sun.formatted}) is the engine of your identity. ${SUN_TEXT[sun.sign]}`,
    `Your Moon in ${moon.sign} (${moon.formatted}) describes your inner emotional world. ${MOON_TEXT[moon.sign]}`,
    `Your rising sign is ${rising} (${chart.houses.ascendant.formatted}, computed with an approximate equal-house model). ${RISING_TEXT[elementOf(rising)]}`,
  ];
  const big = chart.aspects
    .filter((a) => ['trine', 'conjunction'].includes(a.type) && a.orb < 4
      && ['sun', 'moon', 'jupiter', 'venus'].includes(a.a)
      && ['sun', 'moon', 'jupiter', 'venus', 'saturn', 'mars'].includes(a.b));
  if (big.length) {
    const a = big[0];
    paras.push(
      `A standout feature of your chart: ${PLANET_META[a.a].name} ${a.type} ${PLANET_META[a.b].name} ` +
      `(orb ${a.orb.toFixed(1)}\u00B0). This blends your ${PLANET_META[a.a].name} and ` +
      `${PLANET_META[a.b].name} energies into one of your natural strengths.`,
    );
  }
  return paras;
}

// ── Wheel rendering helpers ──

function polar(r: number, angleDeg: number) {
  const a = (angleDeg - 90) * (Math.PI / 180);
  return { x: CENTER + r * Math.cos(a), y: CENTER + r * Math.sin(a) };
}

const ChartWheel: React.FC<{ chart: NatalChart; transit: ReturnType<typeof getSkyNow> }> =
  ({ chart, transit }) => {
    const asc = chart.houses.ascendant.longitude;
    // Classic wheel orientation: ASC at the left (9 o'clock), zodiac increasing counterclockwise.
    const disp = (lon: number) => -(((lon - asc + 360) % 360));

    return (
      <View style={[styles.wheel, { width: CHART_SIZE, height: CHART_SIZE }]}>
        {/* rings */}
        <View style={[styles.ring, {
          width: R_TRANSIT * 2, height: R_TRANSIT * 2,
          borderRadius: R_TRANSIT, left: CENTER - R_TRANSIT, top: CENTER - R_TRANSIT,
        }]} />
        <View style={[styles.ring, {
          width: R_NATAL * 2, height: R_NATAL * 2,
          borderRadius: R_NATAL, left: CENTER - R_NATAL, top: CENTER - R_NATAL,
        }]} />
        <View style={[styles.innerDisc, {
          width: R_NATAL * 2 - 56, height: R_NATAL * 2 - 56,
          borderRadius: R_NATAL - 28, left: CENTER - (R_NATAL - 28), top: CENTER - (R_NATAL - 28),
        }]} />

        {/* sign boundary ticks */}
        {SIGNS.map((_, i) => {
          const ang = disp(i * 30);
          const p = polar(R_NATAL, ang);
          return (
            <View key={`tick-${i}`} style={{
              position: 'absolute', left: p.x - 0.75, top: p.y - 0.75,
              width: 1.5, height: R_TRANSIT - R_NATAL,
              backgroundColor: '#c9b8a3',
              transform: [{ rotate: `${90 - ang}deg` }],
              transformOrigin: 'center',
            }} />
          );
        })}

        {/* ASC/MC labels */}
        <Text style={[styles.axisLabel, { left: 4, top: CENTER - 10 }]}>ASC</Text>

        {/* natal planets */}
        {chart.planets.map((p) => {
          const pos = polar(R_NATAL - 14, disp(p.longitude));
          return (
            <Text key={p.id} style={[styles.natalGlyph, { left: pos.x - 11, top: pos.y - 11 }]}>
              {p.symbol}
            </Text>
          );
        })}

        {/* transiting planets (highlighted ring) */}
        {transit.planets.map((p) => {
          if (p.id === 'northNode') return null;
          const pos = polar(R_TRANSIT - 12, disp(p.longitude));
          return (
            <Text key={`t-${p.id}`} style={[styles.transitGlyph, { left: pos.x - 11, top: pos.y - 11 }]}>
              {p.symbol}
            </Text>
          );
        })}

        <Text style={styles.centerLabel}>Natal{'\n'}+ Live Transits</Text>
      </View>
    );
  };

// ── Screen ──

export const ChartScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [birthDate, setBirthDate] = useState('1990-06-15');
  const [birthTime, setBirthTime] = useState('14:30');
  const [cityIdx, setCityIdx] = useState(0);
  const [latText, setLatText] = useState('');
  const [lonText, setLonText] = useState('');
  const [custom, setCustom] = useState(false);
  const [generated, setGenerated] = useState<{ chart: NatalChart; transit: ReturnType<typeof getSkyNow>; paras: string[] } | null>(null);

  const lat = custom ? parseFloat(latText) || 0 : CITIES[cityIdx].lat;
  const lon = custom ? parseFloat(lonText) || 0 : CITIES[cityIdx].lon;

  const generate = () => {
    const chart = calculateNatalChart(birthDate, birthTime, lat, lon);
    const transit = getSkyNow();
    setGenerated({ chart, transit, paras: buildInterpretation(chart) });
  };

  const hits = useMemo(() => (generated ? transitHits(generated.transit.planets, generated.chart.planets) : []), [generated]);

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.backLink}>&#8592; Back</Text></TouchableOpacity>
        <Text style={styles.title}>Free Chart</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {!generated ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Birth Details</Text>
            <Text style={styles.hint}>No account needed. All math runs offline on your device.</Text>

            <Text style={styles.label}>Birth date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={birthDate} onChangeText={setBirthDate}
              placeholder="1990-06-15" placeholderTextColor="#b7a894" autoCapitalize="none" />

            <Text style={styles.label}>Birth time (HH:MM, 24h)</Text>
            <TextInput style={styles.input} value={birthTime} onChangeText={setBirthTime}
              placeholder="14:30" placeholderTextColor="#b7a894" autoCapitalize="none" />

            <Text style={styles.label}>Birthplace</Text>
            <View style={styles.cityRow}>
              {CITIES.map((c, i) => (
                <TouchableOpacity key={c.label}
                  style={[styles.chip, !custom && cityIdx === i && styles.chipOn]}
                  onPress={() => { setCityIdx(i); setCustom(false); }}>
                  <Text style={[styles.chipText, !custom && cityIdx === i && styles.chipTextOn]}>
                    {c.label.split(',')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.chip, custom && styles.chipOn]}
                onPress={() => setCustom(true)}>
                <Text style={[styles.chipText, custom && styles.chipTextOn]}>Custom</Text>
              </TouchableOpacity>
            </View>

            {custom ? (
              <View style={styles.cityRow}>
                <TextInput style={[styles.input, styles.halfInput]} value={latText}
                  onChangeText={setLatText} placeholder="Latitude" placeholderTextColor="#b7a894"
                  inputMode="decimal" autoCapitalize="none" />
                <TextInput style={[styles.input, styles.halfInput]} value={lonText}
                  onChangeText={setLonText} placeholder="Longitude" placeholderTextColor="#b7a894"
                  inputMode="decimal" autoCapitalize="none" />
              </View>
            ) : null}

            <TouchableOpacity style={styles.primary} onPress={generate}>
              <Text style={styles.primaryText}>Generate My Chart</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Natal Chart</Text>
              <View style={{ alignItems: 'center' }}><ChartWheel chart={generated.chart} transit={generated.transit} /></View>
              <Text style={styles.legend}>
                Inner ring: natal placements. Outer ring (teal): live transits right now.
              </Text>

              <Text style={styles.subTitle}>Placements</Text>
              {generated.chart.planets.map((p) => (
                <View key={p.id} style={styles.row}>
                  <Text style={styles.glyph}>{p.symbol}</Text>
                  <Text style={styles.rowName}>{p.name}</Text>
                  <Text style={styles.rowValue}>{p.formatted}{p.retrograde ? ' R' : ''}</Text>
                </View>
              ))}
              <View style={styles.row}>
                <Text style={styles.glyph}>ASC</Text>
                <Text style={styles.rowName}>Ascendant</Text>
                <Text style={styles.rowValue}>{generated.chart.houses.ascendant.formatted}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Reading</Text>
              {generated.paras.map((p, i) => (
                <Text key={i} style={styles.para}>{p}</Text>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Live Transits Now</Text>
              <Text style={styles.hint}>Snapshot: {generated.transit.when.replace('T', ' ').slice(0, 16)} UTC</Text>
              {generated.transit.planets.filter((p) => p.id !== 'northNode').map((p) => (
                <View key={p.id} style={styles.row}>
                  <Text style={styles.transitGlyphSmall}>{p.symbol}</Text>
                  <Text style={styles.rowName}>{p.name}</Text>
                  <Text style={styles.rowValue}>{p.formatted}{p.retrograde ? ' R' : ''}</Text>
                </View>
              ))}
              {hits.length ? (
                <View>
                  <Text style={styles.subTitle}>Activating your chart</Text>
                  {hits.slice(0, 6).map((h, i) => (
                    <Text key={i} style={styles.para}>
                      {ASPECT_SYMBOL[h.type]} Transiting {PLANET_META[h.transit].name} {h.type}{' '}
                      your natal {PLANET_META[h.natal].name} (orb {h.orb.toFixed(1)}{'\u00B0'})
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.para}>No tight transit contacts to your natal chart at this moment.</Text>
              )}
            </View>

            <TouchableOpacity style={styles.secondary} onPress={() => setGenerated(null)}>
              <Text style={styles.secondaryText}>Enter different birth data</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#faf6f0' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eadfd5',
  },
  backLink: { color: '#a66f43', fontSize: 15, fontWeight: '600', paddingVertical: 8 },
  title: { color: '#2c1810', fontSize: 18, fontWeight: '800' },
  body: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    marginBottom: 14, gap: 6,
  },
  cardTitle: { color: '#2c1810', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subTitle: { color: '#8b5d39', fontSize: 14, fontWeight: '700', marginTop: 10, marginBottom: 4 },
  hint: { color: '#8b7355', fontSize: 12, lineHeight: 18 },
  label: { color: '#2c1810', fontSize: 13, fontWeight: '600', marginTop: 8 },
  input: {
    height: 46, borderWidth: 1, borderColor: '#e5d7ca', borderRadius: 12,
    paddingHorizontal: 12, color: '#2c1810', backgroundColor: '#fff',
  },
  halfInput: { flex: 1 },
  cityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
    backgroundColor: '#f5eadf', borderWidth: 1, borderColor: '#e5d7ca',
  },
  chipOn: { backgroundColor: '#a66f43', borderColor: '#a66f43' },
  chipText: { color: '#8b5d39', fontSize: 12, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  primary: {
    height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#a66f43', marginTop: 16,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondary: {
    height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f5eadf', marginBottom: 20,
  },
  secondaryText: { color: '#8b5d39', fontWeight: '600' },
  wheel: { position: 'relative', marginVertical: 8 },
  ring: { position: 'absolute', borderWidth: 1, borderColor: '#c9b8a3', borderRadius: 999 },
  innerDisc: {
    position: 'absolute', borderWidth: 1, borderColor: '#eadfd5',
    backgroundColor: '#f8f1e7', borderRadius: 999,
  },
  natalGlyph: { position: 'absolute', fontSize: 17, color: '#2c1810', width: 22, textAlign: 'center' },
  transitGlyph: {
    position: 'absolute', fontSize: 15, color: '#0f766e', width: 22, textAlign: 'center',
    fontWeight: '700',
  },
  transitGlyphSmall: { color: '#0f766e', fontSize: 15, width: 26, fontWeight: '700' },
  axisLabel: { position: 'absolute', fontSize: 10, color: '#8b7355', fontWeight: '700' },
  centerLabel: {
    position: 'absolute', left: CENTER - 60, top: CENTER - 20, width: 120,
    textAlign: 'center', color: '#8b7355', fontSize: 11, lineHeight: 16,
  },
  legend: { color: '#8b7355', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  glyph: { color: '#a66f43', fontSize: 15, width: 26 },
  rowName: { color: '#715b4b', flex: 1, fontSize: 14 },
  rowValue: { color: '#2c1810', fontSize: 14, fontWeight: '600' },
  para: { color: '#4a3a2c', fontSize: 14, lineHeight: 22, marginTop: 6 },
});

export default ChartScreen;
