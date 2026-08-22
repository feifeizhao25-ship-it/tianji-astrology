import React from 'react';
import { createRoot } from 'react-dom/client';
import WebApp from './WebApp';

// 渲染React Native Web
const root = createRoot(document.getElementById('app')!);
root.render(React.createElement(WebApp));
