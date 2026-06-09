'use client';
import { useEffect, useState } from 'react';
import { lsGet, lsSet } from '@/lib/storage';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = (lsGet('himym_theme') as 'dark' | 'light') || 'dark';
    applyTheme(saved);
  }, []);

  function applyTheme(t: 'dark' | 'light') {
    document.documentElement.dataset.theme = t;
    lsSet('himym_theme', t);
    setTheme(t);
  }

  return (
    <button
      id="theme-toggle"
      title="Switch light / dark mode"
      onClick={() => applyTheme(theme === 'light' ? 'dark' : 'light')}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
