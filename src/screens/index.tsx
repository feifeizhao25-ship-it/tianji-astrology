/**
 * 见己×TianJi 核心页面
 * HomeScreen — 首页（CN/GL自适应）
 * EngineResultScreen — 引擎结果展示页
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  api,
  ENGINES,
  IS_CN,
  MEMBERSHIP,
  EngineType,
  UserProfile,
  EngineResult,
} from '../services/api';

const { width: SCREEN_W } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════
// 🏠 首页
// ═══════════════════════════════════════════════════════════

interface HomeScreenProps {
  user: UserProfile;
  onEngineSelect: (engine: EngineType) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ user, onEngineSelect }) => {
  const [dailyInsight, setDailyInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const theme = IS_CN ? cnTheme : glTheme;

  const loadDaily = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getDailyInsight(user.id);
      setDailyInsight(result.insight);
    } catch {
      setDailyInsight(
        IS_CN
          ? '今日内容暂时无法读取，未生成替代结论。下拉可重试。'
          : "Today's insight is unavailable. No substitute reading was generated. Pull to retry."
      );
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  React.useEffect(() => {
    loadDaily();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadDaily} tintColor={theme.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.appName, { color: theme.accent }]}>{IS_CN ? '见己' : 'TianJi'}</Text>
          <Text style={[styles.tagline, { color: theme.textDim }]}>
            {IS_CN ? '认识自己，是改变的开始' : 'Know thyself, change thy stars'}
          </Text>
        </View>

        {/* 每日卡片 */}
        <View
          style={[styles.dailyCard, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}
        >
          <Text style={[styles.dailyLabel, { color: theme.accent }]}>
            {IS_CN ? '🔮 今日能量提示' : '🔮 Daily Guidance'}
          </Text>
          <Text style={[styles.dailyText, { color: theme.text }]}>{dailyInsight || '...'}</Text>
        </View>

        {/* 引擎选择 */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {IS_CN ? '✨ 性格探索' : '✨ Cosmic Tools'}
        </Text>
        <View style={styles.engineGrid}>
          {ENGINES.map((engine) => {
            const memberInfo = MEMBERSHIP[user.memberLevel];
            const isLocked = user.memberLevel === 'free' && ENGINES.indexOf(engine) >= 3;
            return (
              <TouchableOpacity
                key={engine.id}
                style={[
                  styles.engineCard,
                  { backgroundColor: theme.cardBg, opacity: isLocked ? 0.6 : 1 },
                ]}
                onPress={() =>
                  !isLocked
                    ? onEngineSelect(engine.id)
                    : Alert.alert(
                        IS_CN ? '升级解锁' : 'Upgrade to Unlock',
                        IS_CN
                          ? `升级高级版解锁${engine.name}`
                          : `Upgrade to Premium for ${engine.name}`
                      )
                }
              >
                <Text style={styles.engineIcon}>{engine.icon}</Text>
                <Text style={[styles.engineName, { color: theme.text }]}>{engine.name}</Text>
                <Text style={[styles.engineDesc, { color: theme.textDim }]} numberOfLines={2}>
                  {engine.description}
                </Text>
                {isLocked && <Text style={styles.lockBadge}>🔒</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 会员卡片 */}
        <View style={[styles.memberCard, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.memberTitle, { color: MEMBERSHIP[user.memberLevel].color }]}>
            {MEMBERSHIP[user.memberLevel].name}
          </Text>
          <Text style={[styles.memberDaily, { color: theme.textDim }]}>
            {IS_CN
              ? `今日剩余: ${MEMBERSHIP[user.memberLevel].daily === Infinity ? '无限' : MEMBERSHIP[user.memberLevel].daily + '次'}`
              : `Today: ${MEMBERSHIP[user.memberLevel].daily === Infinity ? 'Unlimited' : MEMBERSHIP[user.memberLevel].daily + ' left'}`}
          </Text>
          {user.memberLevel !== 'vip' && (
            <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: theme.accent }]}>
              <Text style={styles.upgradeText}>
                {IS_CN
                  ? `升级VIP ¥${user.memberLevel === 'free' ? '98' : '98'}/月`
                  : 'Go VIP $14.99/mo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ═══════════════════════════════════════════════════════════
// 📊 引擎结果页
// ═══════════════════════════════════════════════════════════

interface EngineResultScreenProps {
  engine: EngineType;
  user: UserProfile;
  onBack: () => void;
}

export const EngineResultScreen: React.FC<EngineResultScreenProps> = ({ engine, user, onBack }) => {
  const [result, setResult] = useState<EngineResult | null>(null);
  const [interpretation, setInterpretation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const theme = IS_CN ? cnTheme : glTheme;
  const engineInfo = ENGINES.find((e) => e.id === engine);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.compute(engine, user);
        setResult(res);
        // AI解读
        const ai = await api.interpret(engine, res.data, user, user.questions?.[0]);
        setInterpretation(ai.interpretation);
      } catch (e) {
        setInterpretation(
          IS_CN ? '暂时无法获取解读，请稍后重试。' : 'Unable to get reading now. Please try later.'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [engine, user]);

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={{ fontSize: 40, marginBottom: 20 }}>{engineInfo?.icon}</Text>
        <Text style={[styles.tagline, { color: theme.textDim }]}>
          {IS_CN ? `${engineInfo?.name}分析中...` : `Analyzing your ${engineInfo?.name}...`}
        </Text>
        <Text style={[styles.tagline, { color: theme.accent, marginTop: 10 }]}>
          {IS_CN ? '✨ 正在生成你的专属解读' : '✨ Crafting your personalized reading'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.resultHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={[styles.backBtn, { color: theme.accent }]}>
            {IS_CN ? '← 返回' : '← Back'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.resultTitle, { color: theme.text }]}>
          {engineInfo?.icon} {engineInfo?.name}
        </Text>
      </View>

      <ScrollView style={styles.resultScroll}>
        {/* 引擎数据（可折叠） */}
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <View style={[styles.dataCard, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.cardLabel, { color: theme.accent }]}>
              {IS_CN ? '📊 引擎计算结果' : '📊 Engine Data'} {expanded ? '▾' : '▸'}
            </Text>
            {expanded && result && (
              <Text style={[styles.monoText, { color: theme.textDim }]}>{result.data}</Text>
            )}
            {!expanded && (
              <Text style={[styles.tagline, { color: theme.textDim }]} numberOfLines={2}>
                {result?.data.substring(0, 100)}...
              </Text>
            )}
            {/* 关键指标 */}
            {result &&
              Object.entries(result.raw)
                .slice(0, 5)
                .map(([k, v]) => (
                  <View key={k} style={styles.metricRow}>
                    <Text style={[styles.metricKey, { color: theme.textDim }]}>{k}</Text>
                    <Text style={[styles.metricVal, { color: theme.text }]}>{String(v)}</Text>
                  </View>
                ))}
          </View>
        </TouchableOpacity>

        {/* AI解读 */}
        <View style={[styles.interpretationCard, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.cardLabel, { color: theme.accent }]}>
            {IS_CN ? '🤖 AI深度解读' : '🤖 AI Deep Reading'}
          </Text>
          <Text style={[styles.interpretationText, { color: theme.text }]}>{interpretation}</Text>
        </View>

        {/* 免责声明 */}
        <Text style={[styles.disclaimer, { color: theme.textDim }]}>
          {IS_CN
            ? '⚠️ 以上分析仅供自我探索参考，不构成任何专业建议。'
            : '⚠️ This reading is for entertainment purposes only.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ═══════════════════════════════════════════════════════════
// 主题
// ═══════════════════════════════════════════════════════════

const cnTheme = {
  bg: '#faf6f0',
  cardBg: '#ffffff',
  text: '#2c1810',
  textDim: '#8b7355',
  accent: '#c4956a',
};

const glTheme = {
  bg: '#0d1b2a',
  cardBg: '#1b2838',
  text: '#e0e0e0',
  textDim: '#8899aa',
  accent: '#7b2cbf',
};

// ═══════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 10 },
  appName: { fontSize: 32, fontWeight: 'bold' },
  tagline: { fontSize: 14, marginTop: 4 },
  dailyCard: { margin: 16, padding: 20, borderRadius: 16, borderWidth: 1.5 },
  dailyLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  dailyText: { fontSize: 16, lineHeight: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 16, marginVertical: 12 },
  engineGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  engineCard: {
    width: (SCREEN_W - 48) / 2,
    margin: 8,
    padding: 16,
    borderRadius: 16,
    minHeight: 120,
  },
  engineIcon: { fontSize: 32, marginBottom: 8 },
  engineName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  engineDesc: { fontSize: 12, lineHeight: 16 },
  lockBadge: { position: 'absolute', top: 12, right: 12, fontSize: 16 },
  memberCard: { margin: 16, padding: 16, borderRadius: 16 },
  memberTitle: { fontSize: 18, fontWeight: 'bold' },
  memberDaily: { fontSize: 14, marginTop: 4 },
  upgradeBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 12 },
  upgradeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { fontSize: 16 },
  resultTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 16 },
  resultScroll: { flex: 1 },
  dataCard: { margin: 16, padding: 16, borderRadius: 16 },
  cardLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  monoText: { fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  metricKey: { fontSize: 13 },
  metricVal: { fontSize: 13, fontWeight: '500' },
  interpretationCard: { margin: 16, padding: 16, borderRadius: 16 },
  interpretationText: { fontSize: 15, lineHeight: 24 },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    fontStyle: 'italic',
  },
});

export default { HomeScreen, EngineResultScreen };
