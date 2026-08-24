import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [api, theme, chat, home, app, web, vite, config, appJson] = await Promise.all([
  read('src/services/api.ts'),
  read('src/screens/ThemeContext.ts'),
  read('src/screens/ChatScreen.tsx'),
  read('src/screens/index.tsx'),
  read('App.tsx'),
  read('WebApp.tsx'),
  read('vite.config.mts'),
  read('app.config.js'),
  read('app.json'),
]);

assert.match(vite, /mode === 'production' && !env\.VITE_API_BASE_URL/);
assert.match(config, /NODE_ENV === 'production' && !apiBaseUrl/);
assert.doesNotMatch(appJson, /http:\/\/localhost/);
assert.match(api, /__DEV__ \? 'http:\/\/localhost:3000' : ''/);
assert.match(api, /if \(!API_BASE\)/);
assert.doesNotMatch(theme, /catch\s*\{\s*return\s*\{\s*reply:\s*''/);
assert.doesNotMatch(chat, /离线回退/);
assert.match(chat, /本次没有生成解读/);
assert.match(home, /未生成替代结论/);
assert.doesNotMatch(app, /cn_demo|DEMO_USER|2026年6月19日|onPress=\{\(\) => \{\}\}/);
assert.match(app, /api\.verifyCode/);
assert.match(web, /if \(!token\) throw new Error/);
assert.doesNotMatch(web, /http:\/\/localhost/);

console.log('见己 Expo/Web 生产契约检查通过');
