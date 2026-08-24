import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (mode === 'production' && !env.VITE_API_BASE_URL) {
    throw new Error('生产构建必须配置 VITE_API_BASE_URL');
  }
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 3000,
    },
    resolve: {
      alias: {
        'react-native': 'react-native-web',
      },
    },
    optimizeDeps: {
      exclude: ['react-native'],
      include: ['react-native-web'],
    },
  };
});
