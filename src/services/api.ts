/**
 * 见己×TianJi API服务层
 * 统一管理所有后端API调用
 */

import Constants from 'expo-constants';

// 环境配置
const IS_CN = Constants.expoConfig?.extra?.bffMode === 'cn';
const configuredApiBase = String(Constants.expoConfig?.extra?.apiBaseUrl || '').replace(/\/$/, '');
const API_BASE = configuredApiBase || (__DEV__ ? 'http://localhost:3000' : '');

if (!API_BASE) {
  throw new Error('生产版未配置 API 服务地址');
}

// 引擎类型
export type EngineType =
  | 'bazi'
  | 'ziwei'
  | 'qimen'
  | 'liuyao'
  | 'meihua'
  | 'tarot'
  | 'name' // CN
  | 'western_astro'
  | 'vedic'
  | 'tarot_celtic'
  | 'numerology'
  | 'rune'
  | 'palmistry'
  | 'blood_type'; // GL

export interface UserProfile {
  id: string;
  name: string;
  gender: 'male' | 'female';
  dob: string; // ISO 8601
  city?: string;
  job?: string;
  lat?: number;
  lng?: number;
  tz?: string;
  memberLevel: 'free' | 'premium' | 'vip';
  questions?: string[];
}

export interface EngineResult {
  engine: string;
  data: string;
  raw: Record<string, any>;
  aiInterpretation?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

// ═══════════════════════════════════════════════════════════
// API客户端
// ═══════════════════════════════════════════════════════════

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const resp = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
    const payload = await resp.json().catch(() => null);
    if (!resp.ok) {
      const message =
        payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : `服务请求失败（${resp.status}）`;
      throw new Error(message);
    }
    if (payload === null) throw new Error('服务返回了无效数据');
    return payload as T;
  }

  // ─── 引擎计算 ───
  async compute(engine: EngineType, user: Partial<UserProfile>): Promise<EngineResult> {
    const svcMap: Record<string, string> = {
      bazi: '/v1/bazi/compute',
      ziwei: '/v1/ziwei/compute',
      qimen: '/v1/qimen/compute',
      liuyao: '/v1/liuyao/compute',
      meihua: '/v1/meihua/compute',
      tarot: '/v1/tarot/compute',
      name: '/v1/name/analyze',
      western_astro: '/v1/western-astro/compute',
      vedic: '/v1/vedic/compute',
      numerology: '/v1/numerology/compute',
      rune: '/v1/rune/compute',
      palmistry: '/v1/palmistry/analyze',
    };
    return this.request(svcMap[engine] || `/v1/${engine}/compute`, {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  // ─── AI解读 ───
  async interpret(
    engine: string,
    engineData: string,
    user: Partial<UserProfile>,
    question?: string
  ): Promise<{ interpretation: string }> {
    return this.request('/v1/agent/interpret', {
      method: 'POST',
      body: JSON.stringify({ engine, engineData, user, question }),
    });
  }

  // ─── 交叉验证 ───
  async crossValidate(
    engine1: string,
    data1: string,
    engine2: string,
    data2: string
  ): Promise<{ result: string }> {
    return this.request('/v1/agent/cross-validate', {
      method: 'POST',
      body: JSON.stringify({ engine1, data1, engine2, data2 }),
    });
  }

  // ─── 对话（AI自我探索伙伴）───
  async chat(
    sessionId: string,
    messages: ChatMessage[]
  ): Promise<{ reply: string; sessionId: string }> {
    return this.request('/v1/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, messages }),
    });
  }

  // ─── 记忆服务 ───
  async saveMemory(sessionId: string, messages: ChatMessage[]): Promise<void> {
    await this.request('/v1/memory/save', {
      method: 'POST',
      body: JSON.stringify({ sessionId, messages }),
    });
  }

  async loadMemory(sessionId: string): Promise<{ sessions: any[] }> {
    return this.request(`/v1/memory/${sessionId}`);
  }

  // ─── 每日提醒 ───
  async getDailyInsight(
    userId: string
  ): Promise<{ insight: string; mood: string; rating: number }> {
    return this.request(`/v1/daily/${userId}`);
  }

  // ─── L3 Skills ───
  async invokeSkill(
    skillId: string,
    user: Partial<UserProfile>,
    question: string
  ): Promise<{ result: string }> {
    return this.request('/v1/skill/invoke', {
      method: 'POST',
      body: JSON.stringify({ skillId, user, question }),
    });
  }

  // ─── 用户认证 ───
  async sendCode(phone: string): Promise<void> {
    await this.request('/v1/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone, countryCode: '+86' }),
    });
  }

  async verifyCode(phone: string, code: string): Promise<{ jwt: string; user: UserProfile }> {
    const response = await this.request<Record<string, unknown>>('/v1/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone, code, countryCode: '+86' }),
    });
    const jwt = String(response.jwt || response.access_token || response.accessToken || '');
    const user = response.user as UserProfile | undefined;
    if (!jwt || !user?.id) throw new Error('登录响应缺少用户身份或访问凭证');
    this.setToken(jwt);
    return { jwt, user };
  }

  async login(provider: string, token: string): Promise<{ jwt: string; user: UserProfile }> {
    const result = await this.request<{ jwt: string; user: UserProfile }>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ provider, token }),
    });
    this.setToken(result.jwt);
    return result;
  }
}

export const api = new ApiClient(API_BASE);

// ═══════════════════════════════════════════════════════════
// 引擎配置
// ═══════════════════════════════════════════════════════════

export const CN_ENGINES: { id: EngineType; name: string; icon: string; description: string }[] = [
  { id: 'bazi', name: '性格画像', icon: '🎋', description: '基于出生时间的核心性格分析' },
  { id: 'ziwei', name: '性格特质', icon: '⭐', description: '十二宫位深度性格探索' },
  { id: 'qimen', name: '决策风格', icon: '🧭', description: '了解你的决策模式' },
  { id: 'liuyao', name: '问题反思', icon: '🔮', description: '针对具体问题的深度反思' },
  { id: 'meihua', name: '性格倾向', icon: '🌸', description: '快速了解你的性格倾向' },
  { id: 'tarot', name: '情绪卡片', icon: '🃏', description: '抽卡反思当下的情绪状态' },
  { id: 'name', name: '姓名特质', icon: '✍️', description: '名字中蕴含的性格线索' },
];

export const GL_ENGINES: { id: EngineType; name: string; icon: string; description: string }[] = [
  { id: 'western_astro', name: 'Birth Chart', icon: '🌟', description: 'Your cosmic blueprint' },
  { id: 'vedic', name: 'Vedic Reading', icon: '🕉️', description: 'Ancient Indian astrology' },
  {
    id: 'tarot_celtic',
    name: 'Tarot Reading',
    icon: '🃏',
    description: 'Celtic Cross 10-card spread',
  },
  { id: 'numerology', name: 'Numerology', icon: '🔢', description: 'Your power numbers' },
  { id: 'rune', name: 'Rune Casting', icon: 'ᚱ', description: 'Elder Futhark wisdom' },
  { id: 'palmistry', name: 'Palmistry', icon: '✋', description: 'Read your palm lines' },
  { id: 'blood_type', name: 'Blood Type', icon: '🩸', description: 'Personality by blood type' },
];

export const ENGINES = IS_CN ? CN_ENGINES : GL_ENGINES;

// ═══════════════════════════════════════════════════════════
// 会员权益
// ═══════════════════════════════════════════════════════════

export const MEMBERSHIP = IS_CN
  ? {
      free: { name: '免费版', daily: 3, price: '¥0', color: '#94a3b8' },
      premium: { name: '高级版', daily: 20, price: '¥29/月', color: '#3b82f6' },
      vip: { name: 'VIP尊享', daily: Infinity, price: '¥98/月', color: '#f59e0b' },
    }
  : {
      free: { name: 'Free', daily: 3, price: '$0', color: '#94a3b8' },
      premium: { name: 'Premium', daily: 20, price: '$4.99/mo', color: '#3b82f6' },
      vip: { name: 'VIP Cosmic', daily: Infinity, price: '$14.99/mo', color: '#f59e0b' },
    };

export { IS_CN, API_BASE };
