import React, { FormEvent, useMemo, useState } from 'react';
import './web.css';

type ApiResult = Record<string, unknown>;

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

async function post(path: string, body: Record<string, string>): Promise<ApiResult> {
  if (!apiBaseUrl) throw new Error('网站尚未配置服务地址');
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as ApiResult;
  if (!response.ok) {
    throw new Error(String(payload.message || '服务暂时不可用，请稍后重试'));
  }
  return payload;
}

const benefits = [
  ['每日自我觉察', '根据你的记录整理重点，不虚构你的经历'],
  ['多角度分析', '将复杂结果拆成结论、依据与行动建议'],
  ['连续成长档案', '保留历史记录，观察一周与长期变化'],
  ['专业报告', '会员可导出结构清晰的 PDF 报告'],
];

export default function WebApp() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const phoneValid = useMemo(() => /^1\d{10}$/.test(phone), [phone]);

  async function sendCode() {
    if (!phoneValid) return setNotice('请输入正确的中国大陆手机号');
    setBusy(true);
    try {
      await post('/v1/auth/send-code', { phone, countryCode: '+86' });
      setNotice('验证码已发送，请查看短信');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '发送失败，请稍后重试');
    } finally {
      setBusy(false);
    }
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!phoneValid || !/^\d{4,6}$/.test(code)) return setNotice('请填写手机号和 4—6 位验证码');
    setBusy(true);
    try {
      const result = await post('/v1/auth/verify-code', { phone, code, countryCode: '+86' });
      const token = String(result.access_token || result.accessToken || '');
      if (!token) throw new Error('登录响应缺少访问凭证，请联系支持');
      sessionStorage.setItem('jianji_access_token', token);
      setNotice('登录成功，正在进入见己');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '登录失败，请稍后重试');
    } finally {
      setBusy(false);
    }
  }

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
          <p className="fine">继续即表示你已阅读并同意《用户协议》和《隐私政策》。</p>
        </form>
      </section>
      <footer>© {new Date().getFullYear()} 见己 · 数据来源与更新时间会在分析结果中明确展示</footer>
    </main>
  );
}
