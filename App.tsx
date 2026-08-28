import React, { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { api, EngineType, UserProfile } from './src/services/api';
import { HomeScreen, EngineResultScreen } from './src/screens';
import { ChatScreen } from './src/screens/ChatScreen';

type Tab = 'home' | 'chat';

function LoginScreen({ onLogin }: { onLogin: (user: UserProfile) => void }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const validPhone = useMemo(() => /^1\d{10}$/.test(phone), [phone]);

  const sendCode = async () => {
    if (!validPhone) return setNotice('请输入正确的中国大陆手机号');
    setBusy(true);
    try {
      await api.sendCode(phone);
      setNotice('验证码已发送，请查看短信');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '发送失败，请稍后重试');
    } finally {
      setBusy(false);
    }
  };

  const login = async () => {
    if (!validPhone || !/^\d{4,6}$/.test(code)) return setNotice('请填写手机号和 4—6 位验证码');
    setBusy(true);
    try {
      const result = await api.verifyCode(phone, code);
      onLogin(result.user);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '登录失败，请稍后重试');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.loginPage}>
      <Text style={styles.brand}>见己</Text>
      <Text style={styles.heading}>认识自己，是改变的开始</Text>
      <Text style={styles.description}>登录后才会读取你的个人档案、会员权益和历史记录。</Text>
      <View style={styles.form}>
        <Text style={styles.label}>手机号</Text>
        <TextInput
          style={styles.input}
          inputMode="numeric"
          value={phone}
          onChangeText={(value) => setPhone(value.replace(/\D/g, '').slice(0, 11))}
          placeholder="11 位手机号"
        />
        <Text style={styles.label}>验证码</Text>
        <View style={styles.codeRow}>
          <TextInput
            style={[styles.input, styles.codeInput]}
            inputMode="numeric"
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
            placeholder="短信验证码"
          />
          <TouchableOpacity style={styles.secondaryButton} disabled={busy} onPress={sendCode}>
            <Text style={styles.secondaryText}>获取验证码</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.primaryButton} disabled={busy} onPress={login}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>登录 / 注册</Text>
          )}
        </TouchableOpacity>
        <Text accessibilityLiveRegion="polite" style={styles.notice}>
          {notice}
        </Text>
        <Text style={styles.disclaimer}>
          继续即表示你同意《用户协议》和《隐私政策》。分析仅用于自我探索，不替代专业意见。
        </Text>
      </View>
    </SafeAreaView>
  );
}

function AuthenticatedApp({ user }: { user: UserProfile }) {
  const [tab, setTab] = useState<Tab>('home');
  const [engine, setEngine] = useState<EngineType | null>(null);
  const sessionId = useMemo(() => `session-${user.id}-${Date.now()}`, [user.id]);
  if (engine)
    return <EngineResultScreen engine={engine} user={user} onBack={() => setEngine(null)} />;
  return (
    <SafeAreaView style={styles.appPage}>
      <View style={styles.content}>
        {tab === 'home' ? (
          <HomeScreen user={user} onEngineSelect={setEngine} />
        ) : (
          <ChatScreen user={user} sessionId={sessionId} />
        )}
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={styles.tab} onPress={() => setTab('home')}>
          <Text style={[styles.tabText, tab === 'home' && styles.tabActive]}>首页</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => setTab('chat')}>
          <Text style={[styles.tabText, tab === 'chat' && styles.tabActive]}>对话</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {user ? <AuthenticatedApp user={user} /> : <LoginScreen onLogin={setUser} />}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loginPage: {
    flex: 1,
    backgroundColor: '#faf6f0',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  appPage: { flex: 1, backgroundColor: '#faf6f0' },
  content: { flex: 1 },
  brand: { color: '#a66f43', fontSize: 38, fontWeight: '800', marginBottom: 10 },
  heading: { color: '#2c1810', fontSize: 24, lineHeight: 34, fontWeight: '700' },
  description: { color: '#715b4b', fontSize: 15, lineHeight: 24, marginTop: 10 },
  form: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginTop: 28 },
  label: { color: '#2c1810', fontSize: 14, fontWeight: '600', marginBottom: 7, marginTop: 10 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e5d7ca',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#2c1810',
    backgroundColor: '#fff',
  },
  codeRow: { flexDirection: 'row', gap: 10 },
  codeInput: { flex: 1 },
  secondaryButton: {
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f5eadf',
  },
  secondaryText: { color: '#8b5d39', fontWeight: '600' },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#a66f43',
    marginTop: 20,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  notice: { minHeight: 22, color: '#a33a2b', marginTop: 12, lineHeight: 20 },
  disclaimer: { color: '#806f62', fontSize: 12, lineHeight: 19, marginTop: 4 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eadfd5',
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { color: '#8b7355', fontSize: 14 },
  tabActive: { color: '#a66f43', fontWeight: '700' },
});
