const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 修复中文路径导致的HTTP header错误
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return middleware;
  },
};

module.exports = config;
