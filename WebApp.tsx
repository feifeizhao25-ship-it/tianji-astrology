import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import './web.css';

type ApiResult = Record<string, unknown>;
type Session = { token: string; userId: string };
type DashboardData = {
  profile?: ApiResult;
  tier?: ApiResult;
  entitlements?: ApiResult;
  daily?: ApiResult;
  reports?: unknown[];
  errors: string[];
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');
const SESSION_KEY = 'jianji_web_session';

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function readSession(): Session | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') as Partial<Session>;
    return value?.token && value?.userId ? { token: value.token, userId: value.userId } : null;
  } catch {
    return null;
  }
}

async function request(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: ApiResult; token?: string } = {}
): Promise<ApiResult> {
  if (!apiBaseUrl) throw new Error('网站尚未配置服务地址');
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const payload = (await response.json().catch(() => ({}))) as ApiResult;
  if (!response.ok) {
    const detail = payload.message || payload.detail;
    throw new Error(typeof detail === 'string' ? detail : `服务请求失败（${response.status}）`);
  }
  return payload;
}

function arrayFrom(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const record = value as ApiResult;
    for (const key of ['items', 'reports', 'data', 'results']) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
  }
  return [];
}

const entitlementLabels: Record<string, string> = {
  name: '方案名称',
  dailyAnalyses: '每日分析次数',
  reportExports: '报告导出格式',
  historyDays: '历史记录保留',
  daily_limit: '每日使用次数',
  report_export: '报告导出',
};
const tierLabels: Record<string, string> = {
  free: '免费版',
  basic: '基础版',
  plus: '专业版',
  pro: '专业版',
  premium: '专业版',
  team: '家庭版',
  enterprise: '机构版',
};

function entitlementValue(key: string, value: unknown): string {
  if (Array.isArray(value)) return value.join('、');
  if (typeof value === 'boolean') return value ? '已包含' : '暂未包含';
  if (key.toLowerCase().includes('days') && typeof value === 'number') return `${value} 天`;
  if (value === null || value === undefined) return '未提供';
  return String(value);
}

const benefits = [
  ['每日自我觉察', '根据你的记录整理重点，不虚构你的经历'],
  ['多角度分析', '将复杂结果拆成结论、依据与行动建议'],
  ['连续成长档案', '保留历史记录，观察一周与长期变化'],
  ['专业报告', '会员可导出结构清晰的 PDF 与 Word 报告'],
];

function Dashboard({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [data, setData] = useState<DashboardData>({ errors: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const calls: Array<[keyof Omit<DashboardData, 'errors'>, string]> = [
      ['profile', `/v1/users/${encodeURIComponent(session.userId)}`],
      ['tier', `/v1/users/${encodeURIComponent(session.userId)}/tier`],
      ['entitlements', '/v1/entitlements'],
      ['daily', `/v1/fortune/daily?userId=${encodeURIComponent(session.userId)}`],
      ['reports', `/v1/report?user_id=${encodeURIComponent(session.userId)}&limit=3`],
    ];
    Promise.allSettled(calls.map(([, path]) => request(path, { token: session.token }))).then(
      (results) => {
        if (!active) return;
        const next: DashboardData = { errors: [] };
        results.forEach((result, index) => {
          const [key] = calls[index];
          if (result.status === 'fulfilled') {
            if (key === 'reports') next.reports = arrayFrom(result.value);
            else Object.assign(next, { [key]: result.value });
          } else {
            next.errors.push(`${String(key)}：${text(result.reason?.message, '暂时不可用')}`);
          }
        });
        setData(next);
        setLoading(false);
      }
    );
    return () => {
      active = false;
    };
  }, [session]);

  const nickname = text(data.profile?.nickname || data.profile?.name, '你好');
  const tierName = text(data.tier?.tier || data.profile?.tier, '会员状态读取中');
  const tierDisplayName = tierLabels[tierName] || '会员';
  const dailyTitle = text(
    data.daily?.title || data.daily?.focus || data.daily?.summary,
    '今天的内容尚未生成'
  );
  const dailyDetail = text(
    data.daily?.insight || data.daily?.content || data.daily?.message,
    '完成一次记录后，这里会显示与你相关的分析依据和行动建议。'
  );
  const tierRegistry = data.entitlements?.tiers as ApiResult | undefined;
  const currentBenefits =
    tierRegistry && typeof tierRegistry[tierName] === 'object'
      ? (tierRegistry[tierName] as ApiResult)
      : undefined;
  const focusCard = (
    <article className="focusCard">
      <p className="eyebrow">今日关注</p>
      <h2>{dailyTitle}</h2>
      <p>{dailyDetail}</p>
      <div className="evidenceLine">
        <span>依据</span>
        <b>{data.daily ? '来自今日接口与个人记录' : '等待真实数据'}</b>
      </div>
    </article>
  );
  const actionCard = (
    <article className="actionCard">
      <p className="eyebrow">下一步</p>
      <h2>记录一个正在困扰你的具体事件</h2>
      <p>先写事实，再写感受，最后选择一个今天可以完成的小动作。</p>
      <a className="primary" href="#record">
        开始记录
      </a>
    </article>
  );

  return (
    <main className="dashboard">
      <nav>
        <span className="logo">见己</span>
        <div className="navActions">
          <span className="tierBadge">{tierDisplayName}</span>
          <button className="quietButton" onClick={onLogout}>
            退出登录
          </button>
        </div>
      </nav>
      <section className="dashboardHero">
        <div>
          <p className="eyebrow">{nickname}</p>
          <h1>今天，先看与你最相关的一件事</h1>
          <p>页面按你的资料、会员状态与最近记录动态组合；没有数据时不会伪造结果。</p>
        </div>
        <div className="streak" aria-label="连续使用情况">
          <strong>{text(data.profile?.streak_days, '—')}</strong>
          <span>连续记录天数</span>
        </div>
      </section>
      {loading ? (
        <p className="loading" role="status">
          正在读取你的最新内容…
        </p>
      ) : null}
      {data.errors.length ? (
        <section className="serviceNotice" role="status">
          <strong>部分内容暂时无法读取</strong>
          <p>已保留可用模块，没有用模拟数据补位。请稍后刷新。</p>
        </section>
      ) : null}
      <section className="dashboardGrid">
        {data.reports?.length ? (
          <>
            {focusCard}
            {actionCard}
          </>
        ) : (
          <>
            {actionCard}
            {focusCard}
          </>
        )}
      </section>
      <section className="workspaceSection" id="membership">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">你的会员权益</p>
            <h2>当前方案与可用能力</h2>
          </div>
        </div>
        {currentBenefits ? (
          <div className="entitlementGrid">
            {Object.entries(currentBenefits).map(([key, value]) => (
              <article key={key}>
                <span>{entitlementLabels[key] || '其他权益'}</span>
                <strong>{entitlementValue(key, value)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="emptyState">会员权益接口尚未返回当前档位数据。</p>
        )}
      </section>
      <section className="workspaceSection">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">最近报告</p>
            <h2>继续阅读，而不是重新开始</h2>
          </div>
        </div>
        {data.reports?.length ? (
          <div className="reportGrid">
            {data.reports.map((item, index) => {
              const report = (item || {}) as ApiResult;
              return (
                <article key={text(report.id, String(index))}>
                  <span>{text(report.type || report.format, '个人报告')}</span>
                  <h3>{text(report.title, '未命名报告')}</h3>
                  <p>{text(report.updated_at || report.created_at, '时间未提供')}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="emptyState">还没有报告。完成第一次分析后，可在这里继续阅读和导出。</p>
        )}
      </section>
      <footer>分析结果会标明来源、版本和更新时间；重要决定请咨询相应专业人士。</footer>
    </main>
  );
}

export default function WebApp() {
  const [session, setSession] = useState<Session | null>(() => readSession());
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const phoneValid = useMemo(() => /^1\d{10}$/.test(phone), [phone]);

  async function sendCode() {
    if (!phoneValid) return setNotice('请输入正确的中国大陆手机号');
    if (!accepted) return setNotice('请先阅读并同意用户协议和隐私政策');
    setBusy(true);
    try {
      await request('/v1/auth/send-code', { method: 'POST', body: { phone, countryCode: '+86' } });
      setNotice('验证码已发送，请查看短信');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '发送失败，请稍后重试');
    } finally {
      setBusy(false);
    }
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!accepted) return setNotice('请先阅读并同意用户协议和隐私政策');
    if (!phoneValid || !/^\d{6}$/.test(code)) return setNotice('请填写手机号和 6 位验证码');
    setBusy(true);
    try {
      const result = await request('/v1/auth/verify-code', {
        method: 'POST',
        body: { phone, code, countryCode: '+86' },
      });
      const nextSession = {
        token: text(result.access_token || result.accessToken, ''),
        userId: text(result.user_id || (result.user as ApiResult | undefined)?.id, ''),
      };
      if (!nextSession.token || !nextSession.userId)
        throw new Error('登录响应缺少用户身份或访问凭证，请联系支持');
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '登录失败，请稍后重试');
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setPhone('');
    setCode('');
    setNotice('已安全退出');
  }

  if (session) return <Dashboard session={session} onLogout={logout} />;
  return (
    <main>
      <nav>
        <span className="logo">见己</span>
        <a href="#login">登录</a>
      </nav>
      <section className="hero">
        <div>
          <p className="eyebrow">认识自己，是改变的开始</p>
          <h1>把复杂分析，变成今天能做的一件事</h1>
          <p className="lead">
            见己帮助你整理情绪、关系与决策线索。每条结论都区分事实、分析和建议，不把内容包装成确定预言。
          </p>
          <a className="primary" href="#login">
            开始使用
          </a>
          <p className="fine">仅用于自我探索，不替代医疗、心理、法律或财务专业意见。</p>
        </div>
        <aside className="preview">
          <span>今天的关注点</span>
          <h2>先确认真正困扰你的问题</h2>
          <p>记录事件 → 识别感受 → 查看可能模式 → 选择一个可执行动作</p>
          <div className="steps">
            <b>1 记录</b>
            <b>2 理解</b>
            <b>3 行动</b>
          </div>
        </aside>
      </section>
      <section className="benefits" aria-label="会员权益">
        {benefits.map(([title, detail]) => (
          <article key={title}>
            <h2>{title}</h2>
            <p>{detail}</p>
          </article>
        ))}
      </section>
      <section className="login" id="login">
        <div>
          <p className="eyebrow">安全登录</p>
          <h2>继续你的个人成长记录</h2>
          <p>验证码仅用于登录。敏感信息不会出现在公开页面。</p>
        </div>
        <form onSubmit={login}>
          <label>
            手机号
            <input
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="11 位手机号"
            />
          </label>
          <label>
            验证码
            <span className="codeRow">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="短信验证码"
              />
              <button type="button" onClick={sendCode} disabled={busy}>
                获取验证码
              </button>
            </span>
          </label>
          <button className="primary submit" disabled={busy}>
            {busy ? '请稍候…' : '登录 / 注册'}
          </button>
          <p className="notice" role="status">
            {notice}
          </p>
          <label className="consent">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            <span>
              我已阅读并同意
              <a href="/terms.html" target="_blank" rel="noreferrer">
                《用户协议》
              </a>
              和
              <a href="/privacy.html" target="_blank" rel="noreferrer">
                《隐私政策》
              </a>
              。
            </span>
          </label>
        </form>
      </section>
      <footer>© {new Date().getFullYear()} 见己 · 数据来源与更新时间会在分析结果中明确展示</footer>
    </main>
  );
}
