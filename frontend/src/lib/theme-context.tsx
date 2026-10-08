'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId =
  | 'facebook-light'
  | 'deped-light'
  | 'slate-light'
  | 'facebook-dark'
  | 'obsidian-dark'
  | 'emerald-dark';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  category: 'light' | 'dark';
  badge: string;
  description: string;
  colors: {
    primary: string;
    bg: string;
    surface: string;
    border: string;
    text: string;
    accent: string;
  };
}

export const THEMES: ThemeConfig[] = [
  // 3 Light Modes
  {
    id: 'facebook-light',
    name: 'Facebook Classic Light',
    category: 'light',
    badge: 'Default',
    description: 'Clean Facebook Meta Blue (#1877F2), soft gray canvas (#F0F2F5), and pristine white cards.',
    colors: {
      primary: '#1877F2',
      bg: '#F0F2F5',
      surface: '#FFFFFF',
      border: '#E4E6EB',
      text: '#050505',
      accent: '#2D88FF',
    },
  },
  {
    id: 'deped-light',
    name: 'DepEd Emerald Light',
    category: 'light',
    badge: 'Official DepEd',
    description: 'Philippine Department of Education signature emerald green with crisp academic white.',
    colors: {
      primary: '#059669',
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      border: '#E2E8F0',
      text: '#0F172A',
      accent: '#10B981',
    },
  },
  {
    id: 'slate-light',
    name: 'Corporate Indigo Light',
    category: 'light',
    badge: 'Modern Tech',
    description: 'Contemporary institutional indigo (#4F46E5) with cool slate accents and porcelain canvas.',
    colors: {
      primary: '#4F46E5',
      bg: '#F1F5F9',
      surface: '#FFFFFF',
      border: '#CBD5E1',
      text: '#1E293B',
      accent: '#6366F1',
    },
  },

  // 3 Dark Modes
  {
    id: 'facebook-dark',
    name: 'Facebook Midnight Dark',
    category: 'dark',
    badge: 'Meta Dark',
    description: 'Official Facebook dark aesthetic (#18191A canvas, #242526 elevated cards, #2D88FF).',
    colors: {
      primary: '#2D88FF',
      bg: '#18191A',
      surface: '#242526',
      border: '#3A3B3C',
      text: '#E4E6EB',
      accent: '#4599FF',
    },
  },
  {
    id: 'obsidian-dark',
    name: 'Cyber Obsidian Dark',
    category: 'dark',
    badge: 'Deep Space',
    description: 'Ultra-sleek OLED deep slate (#020617) with radiant neon blue and cyan glow.',
    colors: {
      primary: '#2563EB',
      bg: '#020617',
      surface: '#0F172A',
      border: '#1E293B',
      text: '#F8FAFC',
      accent: '#0EA5E9',
    },
  },
  {
    id: 'emerald-dark',
    name: 'DepEd Forest Nocturne',
    category: 'dark',
    badge: 'Executive Dark',
    description: 'Sophisticated deep pine dark mode (#061412) with vibrant emerald accents.',
    colors: {
      primary: '#059669',
      bg: '#061412',
      surface: '#0B221E',
      border: '#133E37',
      text: '#ECFDF5',
      accent: '#34D399',
    },
  },
];

interface ThemeContextType {
  currentTheme: ThemeId;
  setTheme: (themeId: ThemeId) => void;
  themeConfig: ThemeConfig;
  allThemes: ThemeConfig[];
  isDark: boolean;
  isThemeTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to facebook-light per prompt mandate
  const [currentTheme, setCurrentThemeState] = useState<ThemeId>('facebook-light');
  const [mounted, setMounted] = useState(false);
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('identify_theme_id') as ThemeId;
    if (saved && THEMES.some((t) => t.id === saved)) {
      setCurrentThemeState(saved);
      applyTheme(saved);
    } else {
      // Default: facebook-light
      setCurrentThemeState('facebook-light');
      applyTheme('facebook-light');
    }
  }, []);

  const applyTheme = (themeId: ThemeId) => {
    const root = document.documentElement;
    const body = document.body;
    const config = THEMES.find((t) => t.id === themeId) || THEMES[0];

    // Set data attribute on html & body
    root.setAttribute('data-theme', themeId);
    body.setAttribute('data-theme', themeId);

    // Remove old theme classes and add new ones
    THEMES.forEach((t) => {
      root.classList.remove(`theme-${t.id}`);
      body.classList.remove(`theme-${t.id}`);
    });
    root.classList.add(`theme-${themeId}`);
    body.classList.add(`theme-${themeId}`);

    if (config.category === 'light') {
      root.classList.remove('dark', 'dark-theme');
      body.classList.remove('dark', 'dark-theme');
      root.classList.add('light', 'light-theme');
      body.classList.add('light', 'light-theme');
    } else {
      root.classList.remove('light', 'light-theme');
      body.classList.remove('light', 'light-theme');
      root.classList.add('dark', 'dark-theme');
      body.classList.add('dark', 'dark-theme');
    }
  };

  const setTheme = (themeId: ThemeId) => {
    if (themeId === currentTheme) return;

    const root = document.documentElement;
    const body = document.body;

    // 1. Activate 1-second color crossfade class on document root and body
    root.classList.add('theme-transitioning');
    body.classList.add('theme-transitioning');
    setIsThemeTransitioning(true);

    // 2. Force reflow to commit transition property before changing color rules
    void root.offsetHeight;

    // 3. Apply new theme tokens so browser smoothly crossfades all colors
    setCurrentThemeState(themeId);
    localStorage.setItem('identify_theme_id', themeId);
    applyTheme(themeId);

    // 4. Remove crossfade transition class after exactly 1 second (1000ms)
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
      body.classList.remove('theme-transitioning');
      setIsThemeTransitioning(false);
    }, 1000);
  };

  const themeConfig = THEMES.find((t) => t.id === currentTheme) || THEMES[0];
  const isDark = themeConfig.category === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        themeConfig,
        allThemes: THEMES,
        isDark,
        isThemeTransitioning,
      }}
    >
      <div className="w-full min-h-screen relative">
        {/* Ambient subtle color shift wash during crossfade */}
        {isThemeTransitioning && (
          <div className="fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-1000 opacity-30 bg-gradient-to-tr from-blue-500/10 via-transparent to-cyan-500/10" />
        )}
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
