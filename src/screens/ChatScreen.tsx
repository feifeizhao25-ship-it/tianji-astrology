/**
 * AI自我探索伙伴 — 对话页面
 * CN版: 情绪树洞+性格探索（不预测命运）
 * GL版: Cosmic Advisor对话
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, IS_CN, useTheme, ChatMessage, UserProfile, Theme } from './ThemeContext';

interface ChatScreenProps {
  user: UserProfile;
  sessionId: string;
}

const SUGGESTED_QUESTIONS_CN = [
  '我是什么样的人？',
  '我今天很烦，想聊聊',
  '我怎么改善和同事的关系？',
  '我的性格适合什么职业？',
  '如何面对选择困难？',
];

const SUGGESTED_QUESTIONS_GL = [
  'What does my chart say about me?',
  'I am feeling anxious today',
  'How can I improve my relationships?',
  'What career fits my personality?',
  'How do I handle difficult decisions?',
];

export const ChatScreen: React.FC<ChatScreenProps> = ({ user, sessionId }) => {
  const theme = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: ChatMessage = {
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
        const allMsgs = [...messages, userMsg];
        const result = await api.chat(sessionId, allMsgs);
        const aiMsg: ChatMessage = {
          role: 'assistant',
          content: result.reply,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        // 保存到记忆
        await api.saveMemory(sessionId, [...allMsgs, aiMsg]);
      } catch {
        const failure = IS_CN
          ? '暂时无法连接分析服务，本次没有生成解读。请检查网络后重试。'
          : 'The analysis service is unavailable. No reading was generated. Check your connection and try again.';
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: failure, timestamp: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, sessionId]
  );

  const suggestions = IS_CN ? SUGGESTED_QUESTIONS_CN : SUGGESTED_QUESTIONS_GL;

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[msgStyles.row, { flexDirection: isUser ? 'row-reverse' : 'row' }]}>
        {!isUser && <Text style={msgStyles.avatar}>{IS_CN ? '🧘' : '🔮'}</Text>}
        <View
          style={[
            msgStyles.bubble,
            {
              backgroundColor: isUser ? theme.accent : theme.cardBg,
              marginRight: isUser ? 8 : 0,
              marginLeft: isUser ? 0 : 8,
            },
          ]}
        >
          <Text style={[msgStyles.text, { color: isUser ? '#fff' : theme.text }]}>
            {item.content}
          </Text>
        </View>
        {isUser && <Text style={msgStyles.avatar}>😊</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={[msgStyles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* 消息列表 */}
        <FlatList
          ref={flatRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={msgStyles.empty}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>{IS_CN ? '🌿' : '✨'}</Text>
              <Text style={[msgStyles.emptyTitle, { color: theme.text }]}>
                {IS_CN ? '你好，我是你的自我探索伙伴' : 'Hi, I am your cosmic advisor'}
              </Text>
              <Text style={[msgStyles.emptyDesc, { color: theme.textDim }]}>
                {IS_CN
                  ? '在这里你可以聊任何话题。我不预测未来，但会帮你更好地认识自己。'
                  : 'Ask me anything. I do not predict the future, but I will help you understand yourself better.'}
              </Text>
            </View>
          }
        />

        {/* 建议问题 */}
        {messages.length === 0 && (
          <View style={msgStyles.suggestions}>
            {suggestions.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={[msgStyles.suggestionChip, { borderColor: theme.accent }]}
                onPress={() => sendMessage(q)}
              >
                <Text style={[msgStyles.suggestionText, { color: theme.accent }]}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 输入栏 */}
        <View
          style={[msgStyles.inputBar, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}
        >
          <TextInput
            style={[msgStyles.input, { color: theme.text }]}
            value={input}
            onChangeText={setInput}
            placeholder={IS_CN ? '说说你的想法...' : 'Share your thoughts...'}
            placeholderTextColor={theme.textDim}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              msgStyles.sendBtn,
              { backgroundColor: theme.accent, opacity: loading ? 0.5 : 1 },
            ]}
            onPress={() => sendMessage(input)}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={msgStyles.sendIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const msgStyles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  avatar: { fontSize: 28 },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  text: { fontSize: 15, lineHeight: 22 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  suggestions: { paddingHorizontal: 16, paddingBottom: 8 },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  suggestionText: { fontSize: 13 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 80, paddingHorizontal: 12, paddingVertical: 8 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});
