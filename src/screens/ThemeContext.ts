/**
 * 全局主题Context — 供所有Screen导入
 */
import React, { createContext, useContext } from 'react';
import Constants from 'expo-constants';
import { api, API_BASE } from '../services/api';

export const IS_CN = (Constants.expoConfig?.extra as any)?.bffMode === 'cn';

export interface Theme {
  bg: string;
  cardBg: string;
  text: string;
  textDim: string;
  accent: string;
  accentLight?: string;
  gradient?: string[];
}

export const CN_THEMES: Record<string, Theme> = {
  理性分析型: {
    bg: '#f0f4f8',
    cardBg: '#fff',
    text: '#1a365d',
    textDim: '#4a7ba8',
    accent: '#3182ce',
    accentLight: '#bee3f8',
  },
  感性创意型: {
    bg: '#fef5f0',
    cardBg: '#fff',
    text: '#742a2a',
    textDim: '#c05621',
    accent: '#dd6b20',
    accentLight: '#feebc8',
  },
  默认: {
    bg: '#faf6f0',
    cardBg: '#fff',
    text: '#2c1810',
    textDim: '#8b7355',
    accent: '#c4956a',
    accentLight: '#f5edd6',
  },
};

export const GL_THEMES: Record<string, Theme> = {
  默认: {
    bg: '#0d1b2a',
    cardBg: '#1b2838',
    text: '#e0e0e0',
    textDim: '#8899aa',
    accent: '#7b2cbf',
    accentLight: '#3c1361',
  },
};

const defaultTheme = IS_CN ? CN_THEMES['默认'] : GL_THEMES['默认'];
const ThemeContext = createContext<Theme>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  gender: 'male' | 'female';
  dob: string;
  city?: string;
  job?: string;
  memberLevel: 'free' | 'premium' | 'vip';
}

export { ThemeContext, api, API_BASE };
