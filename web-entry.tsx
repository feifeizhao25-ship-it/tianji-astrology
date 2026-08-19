import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppRegistry } from 'react-native';
import App from './App';

// 渲染React Native Web
const root = createRoot(document.getElementById('app')!);
root.render(React.createElement(App));
