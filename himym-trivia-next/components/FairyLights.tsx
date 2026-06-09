'use client';
import { useEffect, useRef } from 'react';

const COLORS = ['#ffc844', '#ff8c33', '#4fb3ff', '#ff6eb4', '#7aff7a'];

export default function FairyLights() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const count = Math.max(20, Math.floor(window.innerWidth / 26));
    for (let i = 0; i < count; i++) {
      const l = document.createElement('span');
      l.className = 'light';
      const c = COLORS[i % COLORS.length];
      l.style.cssText = `background:${c};box-shadow:0 0 5px ${c},0 0 10px ${c}`;
      l.style.setProperty('--d',  (1.5 + (i * 137.5 % 1.5)).toFixed(2) + 's');
      l.style.setProperty('--dl', (i * 137.5 % 2).toFixed(2) + 's');
      el.appendChild(l);
    }
    return () => { el.innerHTML = ''; };
  }, []);

  return <div id="lights" ref={ref} />;
}
