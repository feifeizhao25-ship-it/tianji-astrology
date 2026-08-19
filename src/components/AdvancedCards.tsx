/**
 * 见己×TianJi 复合组件
 * PersonalizedRecommendations — 个性化推荐
 * CrossValidationCard — 交叉验证展示
 * L3SkillCard — L3技能结果
 * ThemeProvider — 主题自适应
 */
import React, { createContext, useContext, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width: W } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════
// 🎨 主题系统 — 每用户个性化
// ═══════════════════════════════════════════════════════════

export type PersonalityTag =
  | '理性分析型' | '感性创意型' | '果断决策型' | '温和关怀型'
  | '探索成长型' | '精算务实型' | '技术理性型' | '专业智慧型'
  | 'Empathic Explorer' | 'Analytical Seeker' | 'Strategic Planner'
  | 'Creative Philosopher' | 'Modern Mystic' | 'Passionate Creator' | 'Wise Scholar';

interface Theme {
  bg: string; cardBg: string; text: string; textDim: string;
  accent: string; accentLight: string; gradient: string[];
}

const CN_THEMES: Record<string, Theme> = {
  '理性分析型': { bg: '#f0f4f8', cardBg: '#fff', text: '#1a365d', textDim: '#4a7ba8', accent: '#3182ce', accentLight: '#bee3f8', gradient: ['#3182ce', '#2c5282'] },
  '感性创意型': { bg: '#fef5f0', cardBg: '#fff', text: '#742a2a', textDim: '#c05621', accent: '#dd6b20', accentLight: '#feebc8', gradient: ['#ed8936', '#c05621'] },
  '果断决策型': { bg: '#f8f0f4', cardBg: '#fff', text: '#553c6b', textDim: '#805ad5', accent: '#6b46c1', accentLight: '#e9d8fd', gradient: ['#805ad5', '#553c6b'] },
  '温和关怀型': { bg: '#f0f8f5', cardBg: '#fff', text: '#1c4532', textDim: '#38a169', accent: '#2f855a', accentLight: '#c6f6d5', gradient: ['#48bb78', '#2f855a'] },
  '探索成长型': { bg: '#fefcf5', cardBg: '#fff', text: '#4a3014', textDim: '#b7791f', accent: '#d69e2e', accentLight: '#fefcbf', gradient: ['#ecc94b', '#d69e2e'] },
  '精算务实型': { bg: '#f5f5f5', cardBg: '#fff', text: '#1a202c', textDim: '#4a5568', accent: '#2d3748', accentLight: '#cbd5e0', gradient: ['#4a5568', '#2d3748'] },
  '技术理性型': { bg: '#f0f8ff', cardBg: '#fff', text: '#0d1b2a', textDim: '#3d5a80', accent: '#2980b9', accentLight: '#ebf8ff', gradient: ['#3d5a80', '#2980b9'] },
  '专业智慧型': { bg: '#faf8f5', cardBg: '#fff', text: '#2d2416', textDim: '#8b6f3f', accent: '#a07840', accentLight: '#f5edd6', gradient: ['#a07840', '#6b5320'] },
};

const GL_THEMES: Record<string, Theme> = {
  'default': { bg: '#0d1b2a', cardBg: '#1b2838', text: '#e0e0e0', textDim: '#8899aa', accent: '#7b2cbf', accentLight: '#3c1361', gradient: ['#7b2cbf', '#0d1b2a'] },
  'Analytical Seeker': { bg: '#0a1628', cardBg: '#132238', text: '#c8e6ff', textDim: '#6b9bc8', accent: '#2980b9', accentLight: '#1a3a5c', gradient: ['#2980b9', '#0a1628'] },
  'Empathic Explorer': { bg: '#1a0a2e', cardBg: '#251440', text: '#f3e5ff', textDim: '#a06bcc', accent: '#9b30c4', accentLight: '#4a1a6b', gradient: ['#9b30c4', '#1a0a2e'] },
  'Passionate Creator': { bg: '#2e0a1a', cardBg: '#3d1428', text: '#ffe0e6', textDim: '#cc6080', accent: '#e63946', accentLight: '#6b1a28', gradient: ['#e63946', '#2e0a1a'] },
};

export function getTheme(tag: string, isCN: boolean): Theme {
  if (isCN) return CN_THEMES[tag] || CN_THEMES['理性分析型'];
  return GL_THEMES[tag] || GL_THEMES['default'];
}

const ThemeContext = createContext<Theme>(GL_THEMES['default']);
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ tag: string; isCN: boolean; children: React.ReactNode }> = ({
  tag, isCN, children,
}) => {
  const theme = useMemo(() => getTheme(tag, isCN), [tag, isCN]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

// ═══════════════════════════════════════════════════════════
// 🎯 个性化推荐卡片
// ═══════════════════════════════════════════════════════════

interface RecItem { icon: string; title: string; desc: string; }

export const PersonalizedRecommendations: React.FC<{
  userName: string;
  tag: string;
  testedEngines: string[];
  isCN: boolean;
}> = ({ userName, tag, testedEngines, isCN }) => {
  const theme = useTheme();
  const allEngines = isCN
    ? ['八字画像','紫微特质','奇门决策','六爻反思','梅花倾向','情绪卡片','姓名特质']
    : ['Western Astro','Vedic','Tarot','Numerology','Runes','Palmistry','Blood Type'];
  const untested = allEngines.filter(e => !testedEngines.includes(e)).slice(0, 3);

  const recs: RecItem[] = isCN ? [
    { icon: '🔮', title: `推荐探索: ${untested[0] || '深度报告'}`, desc: '从不同维度更全面地认识自己' },
    { icon: '📱', title: '每日使用建议', desc: '晨间看能量提示 · 午间抽情绪卡 · 晚间写日记' },
    { icon: '🎨', title: `个性主题: ${tag.includes('理性') ? '深邃蓝' : tag.includes('感性') ? '温暖橙' : '雅致金'}`, desc: '已为你自动切换主题色' },
    { icon: '💡', title: '成长路径', desc: '基础性格 → 深度分析 → 关系理解 → 行动计划' },
  ] : [
    { icon: '🔮', title: `Next: ${untested[0] || 'Cosmic Report'}`, desc: 'Explore another dimension of yourself' },
    { icon: '📱', title: 'Daily Practice', desc: 'Morning: Set intentions · Noon: Card draw · Evening: Journal' },
    { icon: '🎨', title: `Theme: ${tag.includes('Analytical') ? 'Deep Indigo' : 'Cosmic Purple'}`, desc: 'Personalized color scheme activated' },
    { icon: '💡', title: 'Growth Path', desc: 'Foundation → Deep dive → Relationships → Action plan' },
  ];

  return (
    <View style={[recsStyles.container, { backgroundColor: theme.cardBg }]}>
      <Text style={[recsStyles.title, { color: theme.accent }]}>
        {isCN ? '🎯 个性化推荐' : '🎯 Personalized for You'}
      </Text>
      {recs.map((rec, i) => (
        <View key={i} style={[recsStyles.recCard, { borderLeftColor: theme.accent }]}>
          <Text style={recsStyles.recIcon}>{rec.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[recsStyles.recTitle, { color: theme.text }]}>{rec.title}</Text>
            <Text style={[recsStyles.recDesc, { color: theme.textDim }]}>{rec.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// 🔄 交叉验证展示
// ═══════════════════════════════════════════════════════════

export const CrossValidationCard: React.FC<{
  engine1Name: string;
  engine1Data: string;
  engine2Name: string;
  engine2Data: string;
  result: string;
  isCN: boolean;
}> = ({ engine1Name, engine1Data, engine2Name, engine2Data, result, isCN }) => {
  const theme = useTheme();

  return (
    <View style={[cvStyles.container, { backgroundColor: theme.cardBg }]}>
      <Text style={[cvStyles.title, { color: theme.accent }]}>
        {isCN ? '🔄 交叉验证' : '🔄 Cross-Validation'}
      </Text>
      <Text style={[cvStyles.subtitle, { color: theme.textDim }]}>
        {isCN ? `${engine1Name} × ${engine2Name}` : `${engine1Name} × ${engine2Name}`}
      </Text>

      <View style={cvStyles.compareRow}>
        <View style={[cvStyles.compareCol, { borderColor: theme.accent }]}>
          <Text style={[cvStyles.colTitle, { color: theme.accent }]}>{engine1Name}</Text>
          <Text style={[cvStyles.colData, { color: theme.textDim }]} numberOfLines={3}>
            {engine1Data.substring(0, 80)}...
          </Text>
        </View>
        <View style={[cvStyles.compareCol, { borderColor: theme.textDim }]}>
          <Text style={[cvStyles.colTitle, { color: theme.textDim }]}>{engine2Name}</Text>
          <Text style={[cvStyles.colData, { color: theme.textDim }]} numberOfLines={3}>
            {engine2Data.substring(0, 80)}...
          </Text>
        </View>
      </View>

      <View style={[cvStyles.resultBox, { backgroundColor: theme.accentLight }]}>
        <Text style={[cvStyles.resultText, { color: theme.text }]}>
          {result}
        </Text>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎓 L3 Skill结果卡片
// ═══════════════════════════════════════════════════════════

export const L3SkillCard: React.FC<{
  skillId: string;
  skillName: string;
  result: string;
  isCN: boolean;
}> = ({ skillId, skillName, result, isCN }) => {
  const theme = useTheme();
  const SKILL_ICONS: Record<string, string> = {
    'career-decision': '💼', 'love-counsel': '💕', 'daily-fortune': '📅',
    'yearly-fortune': '📊', 'marriage-report': '💍', 'auspicious-day': '📅',
    'ai-persona-strategist': '🎭', 'life-yearbook': '📖', 'weekly-fortune': '🗓️',
    'naming': '✍️', 'fengshui-house': '🏠', 'ai-fate-book': '📜',
    'ai-persona-oracle': '🔮', 'ai-persona-celeste': '🌟', 'ai-persona-rishi': '🕉️',
    'ai-persona-cyber-sage': '🤖', 'ai-persona-yue-lao': '🧵', 'life-kline': '📈',
  };
  const icon = SKILL_ICONS[skillId] || '🎓';

  return (
    <View style={[l3Styles.container, { backgroundColor: theme.cardBg }]}>
      <View style={l3Styles.header}>
        <Text style={l3Styles.icon}>{icon}</Text>
        <View>
          <Text style={[l3Styles.skillLabel, { color: theme.textDim }]}>L3 Skill</Text>
          <Text style={[l3Styles.skillName, { color: theme.accent }]}>{skillName}</Text>
        </View>
      </View>
      <Text style={[l3Styles.resultText, { color: theme.text }]}>
        {result}
      </Text>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// 📅 2026流年时间线
// ═══════════════════════════════════════════════════════════

export const Timeline2026: React.FC<{
  userName: string;
  dayMaster?: string;
  isCN: boolean;
}> = ({ userName, dayMaster, isCN }) => {
  const theme = useTheme();

  const quarters = isCN ? [
    { q: 'Q1 (1-3月)', title: '春生', desc: '适合规划目标、学习新技能', color: '#48bb78' },
    { q: 'Q2 (4-6月)', title: '夏长', desc: '丙午火旺，注意情绪管理，把握表现机会', color: '#ed8936' },
    { q: 'Q3 (7-9月)', title: '秋收', desc: '收获成果，适合落地项目', color: '#d69e2e' },
    { q: 'Q4 (10-12月)', title: '冬藏', desc: '总结复盘，为明年蓄力', color: '#3182ce' },
  ] : [
    { q: 'Q1', title: 'Saturn enters Aries', desc: 'Bold new commitments. Leadership tests.', color: '#e63946' },
    { q: 'Q2', title: 'Jupiter enters Cancer', desc: 'Emotional growth, family expansion.', color: '#48bb78' },
    { q: 'Q3', title: 'Pluto in Aquarius', desc: 'Tech transformation, community power.', color: '#9b30c4' },
    { q: 'Q4', title: 'Mercury Retrograde Dec', desc: 'Reflect, review, prepare for 2027.', color: '#3182ce' },
  ];

  return (
    <View style={[tlStyles.container, { backgroundColor: theme.cardBg }]}>
      <Text style={[tlStyles.title, { color: theme.accent }]}>
        {isCN ? `📅 ${userName}的2026丙午年` : `📅 ${userName}'s 2026 Timeline`}
      </Text>
      {dayMaster && (
        <Text style={[tlStyles.subtitle, { color: theme.textDim }]}>
          {isCN ? `日主: ${dayMaster}` : ''}
        </Text>
      )}
      {quarters.map((q, i) => (
        <View key={i} style={[tlStyles.quarterCard, { borderLeftColor: q.color }]}>
          <View style={[tlStyles.quarterBadge, { backgroundColor: q.color }]}>
            <Text style={tlStyles.quarterQ}>{q.q}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[tlStyles.quarterTitle, { color: theme.text }]}>{q.title}</Text>
            <Text style={[tlStyles.quarterDesc, { color: theme.textDim }]}>{q.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════

const recsStyles = StyleSheet.create({
  container: { margin: 16, padding: 16, borderRadius: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  recCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderLeftWidth: 3, marginLeft: 4, paddingLeft: 12 },
  recIcon: { fontSize: 24, marginRight: 12 },
  recTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  recDesc: { fontSize: 13 },
});

const cvStyles = StyleSheet.create({
  container: { margin: 16, padding: 16, borderRadius: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  compareRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  compareCol: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12 },
  colTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  colData: { fontSize: 11 },
  resultBox: { borderRadius: 12, padding: 16 },
  resultText: { fontSize: 14, lineHeight: 22 },
});

const l3Styles = StyleSheet.create({
  container: { margin: 16, padding: 16, borderRadius: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: { fontSize: 32, marginRight: 12 },
  skillLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  skillName: { fontSize: 18, fontWeight: 'bold' },
  resultText: { fontSize: 14, lineHeight: 22 },
});

const tlStyles = StyleSheet.create({
  container: { margin: 16, padding: 16, borderRadius: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  quarterCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderLeftWidth: 4, paddingLeft: 12, paddingVertical: 8 },
  quarterBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 12 },
  quarterQ: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
  quarterTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  quarterDesc: { fontSize: 12 },
});

export default { PersonalizedRecommendations, CrossValidationCard, L3SkillCard, Timeline2026, ThemeProvider, getTheme };
