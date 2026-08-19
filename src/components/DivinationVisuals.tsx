import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity, StyleSheet, Easing } from 'react-native';
import { Svg, Circle, Path, G, Text as SvgText } from 'react-native-svg';

// ═══════════════════════════════════════════════════════════
// 🃏 塔罗抽牌动画组件
// ═══════════════════════════════════════════════════════════

const MAJOR_ARCANA_SYMBOLS: Record<string, string> = {
  '愚者': '🌟', '魔术师': '✨', '女祭司': '🌙', '女皇': '🌻',
  '皇帝': '👑', '教皇': '🔑', '恋人': '💕', '战车': '🏆',
  '力量': '🦁', '隐者': '🏮', '命运之轮': '🎡', '正义': '⚖️',
  '倒吊人': '🙃', '死神': '🦋', '节制': 'angel', '恶魔': '😈',
  '塔': '🗼', '星星': '⭐', '月亮': '🌕', '太阳': '☀️',
  '审判': '📯', '世界': '🌍',
};

interface TarotCard {
  name: string;
  upright: boolean;
  position: string;
  keywords: string[];
  meaning: string;
}

interface TarotDrawAnimationProps {
  cards: TarotCard[];
  onComplete?: () => void;
  theme?: 'cn' | 'gl';
}

export const TarotDrawAnimation: React.FC<TarotDrawAnimationProps> = ({
  cards,
  onComplete,
  theme = 'cn',
}) => {
  const [revealedCards, setRevealedCards] = useState<number>(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const flipAnims = useRef(cards.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(cards.map(() => new Animated.Value(-300))).current;

  useEffect(() => {
    if (isDrawing) {
      // 逐张翻牌动画
      cards.forEach((_, index) => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(slideAnims[index], {
              toValue: 0,
              duration: 500,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(flipAnims[index], {
              toValue: 1,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]).start(() => {
            setRevealedCards(prev => prev + 1);
            if (index === cards.length - 1 && onComplete) {
              setTimeout(onComplete, 300);
            }
          });
        }, index * 800);
      });
    }
  }, [isDrawing]);

  const colors = theme === 'cn'
    ? { bg: '#1a1a2e', card: '#e8c275', text: '#fff' }
    : { bg: '#0d1b2a', card: '#7b2cbf', text: '#ffd700' };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {!isDrawing && (
        <TouchableOpacity style={styles.drawButton} onPress={() => setIsDrawing(true)}>
          <Text style={styles.drawButtonText}>
            {theme === 'cn' ? '🎴 抽牌' : '🎴 Draw Cards'}
          </Text>
        </TouchableOpacity>
      )}
      <View style={styles.cardsRow}>
        {cards.map((card, index) => {
          const flipDeg = flipAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: ['180deg', '0deg'],
          });
          const symbol = MAJOR_ARCANA_SYMBOLS[card.name] || '🃏';
          return (
            <Animated.View
              key={index}
              style={[
                styles.card,
                {
                  transform: [
                    { translateX: slideAnims[index] },
                    { rotateY: flipDeg },
                  ],
                },
              ]}
            >
              <View style={[styles.cardFace, { borderColor: colors.card }]}>
                <Text style={styles.cardSymbol}>{symbol}</Text>
                <Text style={[styles.cardName, { color: colors.card }]}>
                  {card.name}
                </Text>
                <Text style={[styles.cardOrientation, { color: card.upright ? '#4ade80' : '#f87171' }]}>
                  {card.upright ? (theme === 'cn' ? '正位' : 'Upright') : (theme === 'cn' ? '逆位' : 'Reversed')}
                </Text>
                <Text style={styles.cardPosition}>{card.position}</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// ᚠ 如尼符文显示组件
// ═══════════════════════════════════════════════════════════

const RUNE_SYMBOLS: Record<string, string> = {
  'Fehu': 'ᚠ', 'Uruz': 'ᚢ', 'Thurisaz': 'ᚦ', 'Ansuz': 'ᚨ',
  'Raidho': 'ᚱ', 'Kenaz': 'ᚲ', 'Gebo': 'ᚷ', 'Wunjo': 'ᚹ',
  'Hagalaz': 'ᚺ', 'Nauthiz': 'ᚾ', 'Isa': 'ᛁ', 'Jera': 'ᛃ',
  'Eihwaz': 'ᛇ', 'Perthro': 'ᛈ', 'Algiz': 'ᛉ', 'Sowilo': 'ᛋ',
  'Tiwaz': 'ᛏ', 'Berkano': 'ᛒ', 'Ehwaz': 'ᛖ', 'Mannaz': 'ᛗ',
  'Laguz': 'ᛚ', 'Ingwaz': 'ᛜ', 'Dagaz': 'ᛞ', 'Othala': 'ᛟ',
};

interface Rune {
  name: string;
  letter: string;
  meaning: string;
  keywords: string[];
  inverted: boolean;
  position: string;
  element: string;
}

interface RuneDisplayProps {
  runes: Rune[];
  theme?: 'mystic' | 'minimal';
}

export const RuneDisplay: React.FC<RuneDisplayProps> = ({ runes, theme = 'mystic' }) => {
  const bgColor = theme === 'mystic' ? '#1a0a2e' : '#fff';
  const runeColor = theme === 'mystic' ? '#c084fc' : '#7b2cbf';
  const textColor = theme === 'mystic' ? '#e9d5ff' : '#333';

  return (
    <View style={[styles.runeContainer, { backgroundColor: bgColor }]}>
      {runes.map((rune, index) => {
        const symbol = RUNE_SYMBOLS[rune.name] || 'ᚱ';
        return (
          <View key={index} style={styles.runeCard}>
            <Text style={[styles.runeSymbol, { color: runeColor, transform: [{ rotate: rune.inverted ? '180deg' : '0deg' }] }]}>
              {symbol}
            </Text>
            <Text style={[styles.runeName, { color: runeColor }]}>
              {rune.name}
            </Text>
            <Text style={[styles.runePosition, { color: textColor }]}>
              {rune.position}
            </Text>
            <Text style={[styles.runeElement, { color: textColor, opacity: 0.7 }]}>
              {rune.element}
            </Text>
            <Text style={[styles.runeMeaning, { color: textColor, opacity: 0.8 }]}>
              {rune.meaning}
            </Text>
            <View style={styles.runeKeywords}>
              {rune.keywords.map((kw, i) => (
                <Text key={i} style={[styles.runeKeyword, { color: runeColor, borderColor: runeColor }]}>
                  {kw}
                </Text>
              ))}
            </View>
            {rune.inverted && (
              <Text style={[styles.runeOrientation, { color: '#f87171' }]}>⚠ Inverted</Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// 📊 Numerology 数字图谱组件
// ═══════════════════════════════════════════════════════════

interface NumerologyProps {
  lifePath: number;
  destiny: number;
  soulUrge: number;
  personality: number;
  birthday: string;
}

export const NumerologyChart: React.FC<NumerologyProps> = ({
  lifePath, destiny, soulUrge, personality, birthday,
}) => {
  const numbers = [
    { label: 'Life Path', value: lifePath, color: '#ff6b6b', angle: -90 },
    { label: 'Destiny', value: destiny, color: '#4ecdc4', angle: 0 },
    { label: 'Soul Urge', value: soulUrge, color: '#ffd700', angle: 90 },
    { label: 'Personality', value: personality, color: '#a78bfa', angle: 180 },
  ];

  return (
    <View style={styles.numContainer}>
      <Svg width={300} height={300} viewBox="0 0 300 300">
        {/* 外圈 */}
        <Circle cx={150} cy={150} r={120} fill="none" stroke="#333" strokeWidth={1} opacity={0.5} />
        {/* 四个数 */}
        {numbers.map((num, i) => {
          const rad = (num.angle * Math.PI) / 180;
          const cx = 150 + 75 * Math.cos(rad);
          const cy = 150 + 75 * Math.sin(rad);
          return (
            <G key={i}>
              <Circle cx={cx} cy={cy} r={32} fill={num.color} opacity={0.2} stroke={num.color} strokeWidth={2} />
              <SvgText x={cx} y={cy + 5} textAnchor="middle" fontSize={22} fill={num.color} fontWeight="bold">
                {num.value}
              </SvgText>
              <SvgText x={cx} y={cy + 48} textAnchor="middle" fontSize={9} fill="#aaa">
                {num.label}
              </SvgText>
            </G>
          );
        })}
        {/* 中心 */}
        <SvgText x={150} y={155} textAnchor="middle" fontSize={36} fill="#ffd700" opacity={0.3}>
          {lifePath}
        </SvgText>
      </Svg>
      <Text style={styles.numFormula}>
        Formula: LP = month + day + year → reduce
      </Text>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  drawButton: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, backgroundColor: 'rgba(255,215,0,0.2)', marginBottom: 20 },
  drawButtonText: { fontSize: 18, color: '#ffd700', fontWeight: 'bold' },
  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
  card: { width: 110, height: 180, margin: 5, backfaceVisibility: 'hidden' },
  cardFace: { flex: 1, borderRadius: 12, borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', padding: 10 },
  cardSymbol: { fontSize: 36, marginBottom: 8 },
  cardName: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  cardOrientation: { fontSize: 11, marginBottom: 2 },
  cardPosition: { fontSize: 10, color: '#888' },
  runeContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 15, gap: 12 },
  runeCard: { width: 130, padding: 15, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', margin: 5 },
  runeSymbol: { fontSize: 48, marginBottom: 8 },
  runeName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  runePosition: { fontSize: 12, marginBottom: 2 },
  runeElement: { fontSize: 11, marginBottom: 4 },
  runeMeaning: { fontSize: 11, textAlign: 'center', marginBottom: 6 },
  runeKeywords: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
  runeKeyword: { fontSize: 9, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, margin: 2 },
  runeOrientation: { fontSize: 10, marginTop: 4 },
  numContainer: { alignItems: 'center', padding: 20 },
  numFormula: { fontSize: 11, color: '#666', marginTop: 10 },
});

export default { TarotDrawAnimation, RuneDisplay, NumerologyChart };
