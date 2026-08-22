/**
 * 见己×TianJi App — 简化版（可编译运行）
 * 底部Tab: 首页 | 对话 | 日记 | 关系 | 我的
 */
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Constants } from 'expo-constants';

const IS_CN = true; // CN版"见己"
const { width: W } = Dimensions.get('window');

// 主题
const T = {
  bg: '#faf6f0',
  card: '#ffffff',
  text: '#2c1810',
  dim: '#8b7355',
  accent: '#c4956a',
  accentL: '#f5edd6',
};

const DEMO_USER = {
  id: 'cn_demo',
  name: '探索者',
  gender: 'female' as const,
  dob: '1998-06-15T10:00:00+08:00',
  city: '北京',
  job: '设计师',
  memberLevel: 'premium' as const,
};

// 引擎数据
const ENGINES = [
  { id: 'bazi', name: '性格画像', icon: '🎋', desc: '基于出生时间的核心性格分析', locked: false },
  { id: 'ziwei', name: '性格特质', icon: '⭐', desc: '十二宫位深度性格探索', locked: false },
  { id: 'qimen', name: '决策风格', icon: '🧭', desc: '了解你的决策模式', locked: false },
  { id: 'liuyao', name: '问题反思', icon: '🔮', desc: '针对具体问题的深度反思', locked: false },
  { id: 'meihua', name: '性格倾向', icon: '🌸', desc: '快速了解你的性格倾向', locked: false },
  { id: 'tarot', name: '情绪卡片', icon: '🃏', desc: '抽卡反思当下的情绪状态', locked: false },
  { id: 'name', name: '姓名特质', icon: '✍️', desc: '名字中蕴含的性格线索', locked: true },
];

// ─── 首页 ───
function HomeScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={s.header}>
        <Text style={s.appName}>见己</Text>
        <Text style={s.tagline}>认识自己，是改变的开始</Text>
      </View>

      {/* 每日卡片 */}
      <View style={[s.card, { borderColor: T.accent }]}>
        <Text style={s.cardLabel}>🔮 今日能量提示</Text>
        <Text style={s.cardText}>
          探索者，今天给自己一点耐心。你追求完美的性格让你容易给自己压力，但有时候接受"足够好"反而是更大的智慧。
        </Text>
        <View style={s.dailyTags}>
          <Text style={s.tag}>💡 适合放慢脚步</Text>
          <Text style={s.tag}>🧘 关注内心感受</Text>
        </View>
      </View>

      {/* 引擎网格 */}
      <Text style={s.sectionTitle}>✨ 性格探索</Text>
      <View style={s.engineGrid}>
        {ENGINES.map((eng) => (
          <TouchableOpacity
            key={eng.id}
            style={[s.engineCard, { opacity: eng.locked ? 0.5 : 1 }]}
            onPress={() => {}}
          >
            <Text style={s.engineIcon}>{eng.icon}</Text>
            <Text style={s.engineName}>{eng.name}</Text>
            <Text style={s.engineDesc} numberOfLines={2}>
              {eng.desc}
            </Text>
            {eng.locked && <Text style={s.lock}>🔒</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* 会员卡 */}
      <View style={s.card}>
        <Text style={[s.cardLabel, { color: '#3b82f6' }]}>💎 高级版</Text>
        <Text style={s.cardText}>今日剩余: 18次</Text>
        <Text style={s.memberFeature}>✅ 全部7引擎 + AI深度解读</Text>
        <Text style={s.memberFeature}>✅ 每日推送 + 历史云同步</Text>
        <TouchableOpacity style={s.upgradeBtn}>
          <Text style={s.upgradeText}>升级VIP ¥98/月</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── 对话页 ───
function ChatScreen() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: '你好，我是你的自我探索伙伴 🌿\n在这里你可以聊任何话题。我不预测未来，但会帮你更好地认识自己。',
    },
  ]);
  const [input, setInput] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <FlatList
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={[s.msgBubble, item.role === 'ai' ? s.msgAI : s.msgUser]}>
            <Text
              style={{ color: item.role === 'ai' ? T.text : '#fff', fontSize: 15, lineHeight: 22 }}
            >
              {item.text}
            </Text>
          </View>
        )}
      />
      <View style={s.suggestRow}>
        {['我是什么样的人？', '我今天很烦', '怎么改善沟通？'].map((q) => (
          <TouchableOpacity
            key={q}
            style={s.suggestChip}
            onPress={() =>
              setMessages((m) => [
                ...m,
                { role: 'user', text: q },
                { role: 'ai', text: '我理解你的感受。让我们一起探索这个问题——能具体说说吗？' },
              ])
            }
          >
            <Text style={s.suggestText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.inputBar}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="说说你的想法..."
          placeholderTextColor={T.dim}
          multiline
        />
        <TouchableOpacity
          style={s.sendBtn}
          onPress={() => {
            if (input.trim()) {
              setMessages((m) => [
                ...m,
                { role: 'user', text: input },
                { role: 'ai', text: '谢谢你的分享。这确实值得深入探讨。' },
              ]);
              setInput('');
            }
          }}
        >
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── 日记页 ───
function JournalScreen() {
  const moods = ['😄 开心', '😌 平静', '😐 一般', '😔 低落', '😢 难过', '😰 焦虑'];
  const [selected, setSelected] = useState('');
  const [entry, setEntry] = useState('');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg, padding: 16 }}>
      <View style={s.card}>
        <Text style={s.cardLabel}>2026年6月19日 星期五</Text>
        <Text style={[s.cardLabel, { marginTop: 16 }]}>今天的心情</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {moods.map((m) => (
            <TouchableOpacity
              key={m}
              style={[s.moodBtn, selected === m && { backgroundColor: T.accent }]}
              onPress={() => setSelected(m)}
            >
              <Text style={{ color: selected === m ? '#fff' : T.dim, fontSize: 13 }}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[s.cardLabel, { marginTop: 16 }]}>记录</Text>
        <TextInput
          style={s.textArea}
          value={entry}
          onChangeText={setEntry}
          placeholder="今天发生了什么？你的感受是什么？"
          placeholderTextColor={T.dim}
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity style={s.saveBtn}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>保存记录</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── 关系分析页 ───
function CompatScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg, padding: 16 }}>
      <Text style={s.sectionTitle}>💕 关系沟通分析</Text>
      <Text style={s.tagline}>了解你们两人的性格沟通风格（非姻缘预测）</Text>
      <View style={s.card}>
        <Text style={s.cardLabel}>👤 人物一</Text>
        <TextInput style={s.compatInput} placeholder="姓名" placeholderTextColor={T.dim} />
        <TextInput
          style={s.compatInput}
          placeholder="出生日期 (YYYY-MM-DD)"
          placeholderTextColor={T.dim}
        />
      </View>
      <View style={s.card}>
        <Text style={s.cardLabel}>👤 人物二</Text>
        <TextInput style={s.compatInput} placeholder="姓名" placeholderTextColor={T.dim} />
        <TextInput
          style={s.compatInput}
          placeholder="出生日期 (YYYY-MM-DD)"
          placeholderTextColor={T.dim}
        />
      </View>
      <TouchableOpacity style={[s.saveBtn, { marginHorizontal: 40 }]}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>🔍 开始分析</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── 我的 ───
function ProfileScreen() {
  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg }}
    >
      <Text style={{ fontSize: 60, marginBottom: 16 }}>🧘</Text>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: T.text, marginBottom: 8 }}>
        探索者
      </Text>
      <Text style={{ fontSize: 14, color: T.dim, marginBottom: 24 }}>会员等级: Premium</Text>
      <Text style={{ fontSize: 14, color: T.dim, textAlign: 'center' }}>
        见己 V4.1{'\n'}认识自己，是改变的开始
      </Text>
    </View>
  );
}

// ─── App主框架 ───
type TabKey = 'home' | 'chat' | 'journal' | 'compat' | 'profile';
const TABS: { key: TabKey; icon: string; label: string }[] = [
  { key: 'home', icon: '🏠', label: '首页' },
  { key: 'chat', icon: '💬', label: '对话' },
  { key: 'journal', icon: '📔', label: '日记' },
  { key: 'compat', icon: '💕', label: '关系' },
  { key: 'profile', icon: '👤', label: '我的' },
];

export default function App() {
  const [tab, setTab] = useState<TabKey>('home');

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
        <View style={{ flex: 1 }}>
          {tab === 'home' && <HomeScreen />}
          {tab === 'chat' && <ChatScreen />}
          {tab === 'journal' && <JournalScreen />}
          {tab === 'compat' && <CompatScreen />}
          {tab === 'profile' && <ProfileScreen />}
        </View>
        {/* 底部Tab Bar */}
        <View style={s.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.key} style={s.tabItem} onPress={() => setTab(t.key)}>
              <Text style={{ fontSize: 22, opacity: tab === t.key ? 1 : 0.4 }}>{t.icon}</Text>
              <Text style={[s.tabLabel, { color: tab === t.key ? T.accent : T.dim }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ─── 样式 ───
const s = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 10 },
  appName: { fontSize: 32, fontWeight: 'bold', color: T.accent },
  tagline: { fontSize: 14, color: T.dim, marginTop: 4 },
  card: {
    backgroundColor: T.card,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.accentL,
  },
  cardLabel: { fontSize: 16, fontWeight: '600', color: T.accent, marginBottom: 8 },
  cardText: { fontSize: 15, lineHeight: 24, color: T.text },
  dailyTags: { flexDirection: 'row', marginTop: 12 },
  tag: {
    fontSize: 13,
    color: T.accent,
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: T.accentL,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: T.text,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  engineGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  engineCard: {
    width: (W - 48) / 2,
    margin: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: T.card,
    minHeight: 120,
  },
  engineIcon: { fontSize: 32, marginBottom: 8 },
  engineName: { fontSize: 16, fontWeight: 'bold', color: T.text, marginBottom: 4 },
  engineDesc: { fontSize: 12, color: T.dim, lineHeight: 16 },
  lock: { position: 'absolute', top: 12, right: 12, fontSize: 16 },
  memberFeature: { fontSize: 13, color: T.text, marginTop: 4 },
  upgradeBtn: {
    backgroundColor: T.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'center',
  },
  upgradeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  msgBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 12,
  },
  msgAI: { backgroundColor: T.card, marginRight: '20%' },
  msgUser: { backgroundColor: T.accent, marginLeft: '20%' },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingBottom: 8 },
  suggestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.accent,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  suggestText: { fontSize: 12, color: T.accent },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: T.card,
    borderTopWidth: 1,
    borderColor: T.accentL,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: T.text,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  moodBtn: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: T.accentL,
    marginRight: 8,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.accentL,
    padding: 12,
    fontSize: 15,
    marginTop: 4,
    backgroundColor: T.bg,
    color: T.text,
  },
  saveBtn: {
    backgroundColor: T.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 16,
  },
  compatInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.accentL,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 8,
    color: T.text,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: T.card,
    borderTopWidth: 1,
    borderTopColor: T.accentL,
    paddingBottom: 4,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabLabel: { fontSize: 11, marginTop: 2 },
});
