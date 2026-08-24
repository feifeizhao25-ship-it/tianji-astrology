const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';

if (process.env.NODE_ENV === 'production' && !apiBaseUrl) {
  throw new Error('生产构建必须配置 EXPO_PUBLIC_API_BASE_URL');
}

export default {
  expo: {
    name: '见己',
    slug: 'jianji-tianji',
    version: '4.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    extra: {
      bffMode: 'cn',
      apiBaseUrl,
    },
    ios: { supportsTablet: true, bundleIdentifier: 'com.tianji.jianji' },
    android: { package: 'com.tianji.jianji' },
  },
};
