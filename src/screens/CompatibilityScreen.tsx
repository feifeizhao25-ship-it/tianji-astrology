/**
 * 关系沟通分析页面
 * CN版: 关系沟通风格（非算姻缘）
 * GL版: Compatibility Reading
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IS_CN, useTheme } from './ThemeContext';

const { width: W } = Dimensions.get('window');

export const CompatibilityScreen: React.FC = () => {
  const theme = useTheme();
  const [person1, setPerson1] = useState({ name: '', dob: '' });
  const [person2, setPerson2] = useState({ name: '', dob: '' });
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!person1.name || !person1.dob || !person2.name || !person2.dob) return;
    setLoading(true);

    // 模拟结果（实际应调用API）
    setTimeout(() => {
      setResult(IS_CN
        ? `## 💕 ${person1.name} & ${person2.name} 的关系沟通风格分析

### 🧩 性格互补度
你们的性格组合呈现出有趣的互补特质。${person1.name}可能更偏理性直接的表达方式，而${person2.name}可能更注重情感交流。这种差异不是问题，反而可以让你们学到不同的视角。

### 💬 沟通建议
- **${person1.name}**：试着在表达时多一些感受性词汇，让对方更容易接收到你的温度
- **${person2.name}**：当你需要空间时，可以直接表达"我需要一些时间思考"，这能减少误解

### 🌱 共同成长方向
你们都重视成长。建议每月做一次"关系check-in"：各自分享最近的感受和对关系的期待。

### ⚠️ 温馨提示
这段分析旨在帮助你们更好地理解彼此的沟通风格，而非预测关系的成败。好的关系靠两个人的共同努力。

---
*以上分析仅供关系探索参考。*`
        : `## 💕 ${person1.name} & ${person2.name}'s Compatibility Reading

### 🧩 Personality Match
Your combination reveals fascinating complementary traits. ${person1.name} may lean toward direct, analytical expression, while ${person2.name} may focus more on emotional connection. This difference is an opportunity, not an obstacle.

### 💬 Communication Tips
- **${person1.name}**: Add more feeling words to your expressions. This helps your partner receive your warmth.
- **${person2.name}**: When you need space, say "I need time to process" directly. This reduces misunderstanding.

### 🌱 Growth Together
You both value growth. Try a monthly "relationship check-in" where each shares recent feelings and hopes.

### ⚠️ Note
This analysis explores your communication styles — it does not predict relationship outcomes. Great relationships are built by both people, every day.

---
*For entertainment and self-reflection purposes only.*`);
      setLoading(false);
    }, 1500);
  };

  return (
    <SafeAreaView style={[compStyles.container, { backgroundColor: theme.bg }]}>
      <ScrollView style={{ flex: 1 }}>
        <Text style={[compStyles.title, { color: theme.accent }]}>
          {IS_CN ? '💕 关系沟通分析' : '💕 Compatibility Reading'}
        </Text>
        <Text style={[compStyles.subtitle, { color: theme.textDim }]}>
          {IS_CN ? '了解你们两人的性格沟通风格（非姻缘预测）' : 'Understand your communication styles'}
        </Text>

        {/* 人物1 */}
        <View style={[compStyles.personCard, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}>
          <Text style={[compStyles.personLabel, { color: theme.accent }]}>
            {IS_CN ? '👤 人物一' : '👤 Person 1'}
          </Text>
          <TextInput
            style={[compStyles.input, { backgroundColor: theme.bg, color: theme.text }]}
            value={person1.name}
            onChangeText={(v) => setPerson1(prev => ({ ...prev, name: v }))}
            placeholder={IS_CN ? '姓名' : 'Name'}
            placeholderTextColor={theme.textDim}
          />
          <TextInput
            style={[compStyles.input, { backgroundColor: theme.bg, color: theme.text }]}
            value={person1.dob}
            onChangeText={(v) => setPerson1(prev => ({ ...prev, dob: v }))}
            placeholder={IS_CN ? '出生日期 (YYYY-MM-DD)' : 'Birth date (YYYY-MM-DD)'}
            placeholderTextColor={theme.textDim}
          />
        </View>

        {/* 人物2 */}
        <View style={[compStyles.personCard, { backgroundColor: theme.cardBg, borderColor: theme.textDim }]}>
          <Text style={[compStyles.personLabel, { color: theme.textDim }]}>
            {IS_CN ? '👤 人物二' : '👤 Person 2'}
          </Text>
          <TextInput
            style={[compStyles.input, { backgroundColor: theme.bg, color: theme.text }]}
            value={person2.name}
            onChangeText={(v) => setPerson2(prev => ({ ...prev, name: v }))}
            placeholder={IS_CN ? '姓名' : 'Name'}
            placeholderTextColor={theme.textDim}
          />
          <TextInput
            style={[compStyles.input, { backgroundColor: theme.bg, color: theme.text }]}
            value={person2.dob}
            onChangeText={(v) => setPerson2(prev => ({ ...prev, dob: v }))}
            placeholder={IS_CN ? '出生日期 (YYYY-MM-DD)' : 'Birth date (YYYY-MM-DD)'}
            placeholderTextColor={theme.textDim}
          />
        </View>

        <TouchableOpacity
          style={[compStyles.analyzeBtn, { backgroundColor: theme.accent, opacity: loading ? 0.6 : 1 }]}
          onPress={analyze}
          disabled={loading || !person1.name || !person2.name}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={compStyles.analyzeText}>{IS_CN ? '🔍 开始分析' : '🔍 Analyze'}</Text>}
        </TouchableOpacity>

        {/* 结果 */}
        {result ? (
          <View style={[compStyles.resultCard, { backgroundColor: theme.cardBg }]}>
            {result.split('\n').map((line, i) => (
              <Text
                key={i}
                style={[
                  compStyles.resultText,
                  {
                    color: line.startsWith('#') ? theme.accent : line.startsWith('-') || line.startsWith('  -') ? theme.textDim : theme.text,
                    fontWeight: line.startsWith('#') || line.includes('**') ? 'bold' : 'normal',
                    fontSize: line.startsWith('# ') ? 20 : line.startsWith('### ') ? 16 : 14,
                  },
                ]}
              >
                {line.replace(/[#*]/g, '').trim() || ' '}
              </Text>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const compStyles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  personCard: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16, borderWidth: 1.5 },
  personLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  input: { height: 44, borderRadius: 10, paddingHorizontal: 12, fontSize: 15, marginBottom: 8 },
  analyzeBtn: { marginHorizontal: 40, paddingVertical: 14, borderRadius: 25, alignItems: 'center', marginBottom: 20 },
  analyzeText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultCard: { margin: 16, padding: 20, borderRadius: 16 },
  resultText: { lineHeight: 22, marginBottom: 4 },
});
