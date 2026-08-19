/**
 * 情绪日记页面
 * 每日记录+AI反馈+成长追踪（合规核心功能）
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  FlatList, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IS_CN, useTheme } from './ThemeContext';

const { width: W } = Dimensions.get('window');

const MOODS_CN = [
  { emoji: '😄', label: '开心', value: 5, color: '#48bb78' },
  { emoji: '😌', label: '平静', value: 4, color: '#38b2ac' },
  { emoji: '😐', label: '一般', value: 3, color: '#a0aec0' },
  { emoji: '😔', label: '低落', value: 2, color: '#63b3ed' },
  { emoji: '😢', label: '难过', value: 1, color: '#4299e1' },
  { emoji: '😰', label: '焦虑', value: 1, color: '#9f7aea' },
  { emoji: '😡', label: '愤怒', value: 1, color: '#e53e3e' },
  { emoji: '🥰', label: '感恩', value: 5, color: '#ed8936' },
];

const MOODS_GL = [
  { emoji: '😄', label: 'Happy', value: 5, color: '#48bb78' },
  { emoji: '😌', label: 'Calm', value: 4, color: '#38b2ac' },
  { emoji: '😐', label: 'Neutral', value: 3, color: '#a0aec0' },
  { emoji: '😔', label: 'Down', value: 2, color: '#63b3ed' },
  { emoji: '😢', label: 'Sad', value: 1, color: '#4299e1' },
  { emoji: '😰', label: 'Anxious', value: 1, color: '#9f7aea' },
  { emoji: '😡', label: 'Angry', value: 1, color: '#e53e3e' },
  { emoji: '🥰', label: 'Grateful', value: 5, color: '#ed8936' },
];

interface JournalEntry {
  date: string;
  mood: typeof MOODS_CN[0];
  content: string;
  aiFeedback?: string;
}

export const JournalScreen: React.FC = () => {
  const theme = useTheme();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<typeof MOODS_CN[0] | null>(null);
  const [content, setContent] = useState('');
  const moods = IS_CN ? MOODS_CN : MOODS_GL;

  const today = new Date().toLocaleDateString(IS_CN ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const saveEntry = useCallback(() => {
    if (!selectedMood || !content.trim()) return;
    const entry: JournalEntry = {
      date: today,
      mood: selectedMood,
      content: content.trim(),
      aiFeedback: IS_CN
        ? `感谢你的记录。你今天感到${selectedMood.label}，这是完全正常的。${selectedMood.value >= 4 ? '保持这种积极的状态！' : '记住，每一种情绪都是合理的，明天的你会更好。'}`
        : `Thank you for journaling. You feel ${selectedMood.label.toLowerCase()} today, and that is completely okay. ${selectedMood.value >= 4 ? 'Keep nurturing this positive energy!' : 'Remember, every emotion is valid. Tomorrow is a new beginning.'}`,
    };
    setEntries(prev => [entry, ...prev]);
    setContent('');
    setSelectedMood(null);
  }, [selectedMood, content, today]);

  // 情绪趋势（最近7天简版）
  const weekData = entries.slice(0, 7).reverse();
  const avgMood = entries.length > 0
    ? (entries.reduce((s, e) => s + e.mood.value, 0) / entries.length).toFixed(1)
    : '—';

  return (
    <SafeAreaView style={[journalStyles.container, { backgroundColor: theme.bg }]}>
      <ScrollView>
        {/* 今日记录 */}
        <View style={[journalStyles.todayCard, { backgroundColor: theme.cardBg }]}>
          <Text style={[journalStyles.dateText, { color: theme.accent }]}>{today}</Text>

          <Text style={[journalStyles.label, { color: theme.text }]}>
            {IS_CN ? '今天的心情' : "Today's Mood"}
          </Text>
          <View style={journalStyles.moodRow}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.label}
                onPress={() => setSelectedMood(mood)}
                style={[
                  journalStyles.moodBtn,
                  {
                    backgroundColor: selectedMood?.label === mood.label ? mood.color : 'transparent',
                    borderColor: mood.color,
                  },
                ]}
              >
                <Text style={journalStyles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[journalStyles.moodLabel, { color: selectedMood?.label === mood.label ? '#fff' : theme.textDim }]}>
                  {IS_CN ? mood.label : mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[journalStyles.label, { color: theme.text, marginTop: 16 }]}>
            {IS_CN ? '记录' : 'Journal Entry'}
          </Text>
          <TextInput
            style={[journalStyles.textArea, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.accent }]}
            value={content}
            onChangeText={setContent}
            placeholder={IS_CN ? '今天发生了什么？你的感受是什么？' : 'What happened today? How do you feel?'}
            placeholderTextColor={theme.textDim}
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />

          <TouchableOpacity
            style={[journalStyles.saveBtn, { backgroundColor: theme.accent, opacity: (!selectedMood || !content.trim()) ? 0.4 : 1 }]}
            onPress={saveEntry}
            disabled={!selectedMood || !content.trim()}
          >
            <Text style={journalStyles.saveText}>{IS_CN ? '保存记录' : 'Save Entry'}</Text>
          </TouchableOpacity>
        </View>

        {/* 情绪统计 */}
        {entries.length > 0 && (
          <View style={[journalStyles.statsCard, { backgroundColor: theme.cardBg }]}>
            <Text style={[journalStyles.label, { color: theme.accent }]}>
              {IS_CN ? '📊 情绪趋势' : '📊 Mood Trend'}
            </Text>
            <Text style={[journalStyles.avgText, { color: theme.text }]}>
              {IS_CN ? `平均情绪指数: ${avgMood}/5` : `Average mood: ${avgMood}/5`}
            </Text>
            <View style={journalStyles.chartRow}>
              {weekData.map((entry, i) => (
                <View key={i} style={journalStyles.chartBar}>
                  <View style={[journalStyles.bar, { height: entry.mood.value * 20, backgroundColor: entry.mood.color }]} />
                  <Text style={[journalStyles.barDay, { color: theme.textDim }]}>{entry.mood.emoji}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 历史记录 */}
        {entries.length > 0 && (
          <Text style={[journalStyles.label, { color: theme.text, marginHorizontal: 16, marginTop: 16 }]}>
            {IS_CN ? '📝 历史记录' : '📝 Past Entries'}
          </Text>
        )}
        {entries.map((entry, i) => (
          <View key={i} style={[journalStyles.entryCard, { backgroundColor: theme.cardBg }]}>
            <View style={journalStyles.entryHeader}>
              <Text style={[journalStyles.entryDate, { color: theme.textDim }]}>{entry.date}</Text>
              <Text style={journalStyles.entryMood}>{entry.mood.emoji} {entry.mood.label}</Text>
            </View>
            <Text style={[journalStyles.entryContent, { color: theme.text }]}>{entry.content}</Text>
            {entry.aiFeedback && (
              <View style={[journalStyles.feedbackBox, { backgroundColor: theme.accentLight || theme.bg }]}>
                <Text style={[journalStyles.feedbackLabel, { color: theme.accent }]}>
                  {IS_CN ? '🌿 AI反馈' : '🌿 AI Reflection'}
                </Text>
                <Text style={[journalStyles.feedbackText, { color: theme.text }]}>{entry.aiFeedback}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const journalStyles = StyleSheet.create({
  container: { flex: 1 },
  todayCard: { margin: 16, padding: 20, borderRadius: 16 },
  dateText: { fontSize: 14, marginBottom: 16, fontWeight: '600' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodBtn: { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, minWidth: 60 },
  moodEmoji: { fontSize: 24 },
  moodLabel: { fontSize: 10, marginTop: 4 },
  textArea: { minHeight: 100, borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 15, marginTop: 4 },
  saveBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, alignSelf: 'center', marginTop: 16 },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  statsCard: { marginHorizontal: 16, padding: 16, borderRadius: 16 },
  avgText: { fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 8, marginTop: 8 },
  chartBar: { alignItems: 'center', flex: 1 },
  bar: { width: 24, borderRadius: 4 },
  barDay: { fontSize: 10, marginTop: 4 },
  entryCard: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 16 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  entryDate: { fontSize: 12 },
  entryMood: { fontSize: 13, fontWeight: '600' },
  entryContent: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  feedbackBox: { borderRadius: 12, padding: 12, marginTop: 8 },
  feedbackLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  feedbackText: { fontSize: 13, lineHeight: 20 },
});
