'use client';
import { useEffect, useState } from 'react';
import { type Difficulty } from '@/lib/constants';
import { lsGet } from '@/lib/storage';

interface Props {
  onSelect: (diff: Difficulty) => void;
  onBack:   () => void;
  error?:   string | null;
}

export default function DifficultyScreen({ onSelect, onBack, error }: Props) {
  const [bests, setBests] = useState({ easy: '', medium: '', hard: '' });

  useEffect(() => {
    const get = (d: string) => {
      const v = lsGet(`himym_hs_${d}`);
      return v !== null ? `🏆 Best: ${v}` : '';
    };
    setBests({ easy: get('easy'), medium: get('medium'), hard: get('hard') });
  }, []);

  return (
    <div id="difficulty" className="screen active">
      <div className="diff-header">
        <div className="umbrella" style={{ fontSize: '3rem' }}>☂️</div>
        <h2 style={{ fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif", fontSize: '1.5rem', color: 'var(--gold)', marginTop: '.4rem' }}>
          Choose Difficulty
        </h2>
        <p className="diff-subtitle">How legendary are you feeling?</p>
      </div>

      {/* API error banner */}
      {error && (
        <div style={{
          width: '100%',
          padding: '.7rem 1rem',
          background: 'rgba(192,57,43,.1)',
          border: '1px solid rgba(192,57,43,.35)',
          borderRadius: 10,
          color: '#ffc2bb',
          fontSize: '.82rem',
          textAlign: 'center',
        }}>
          ⚠️ Couldn&apos;t load live questions — using built-in HIMYM questions instead.<br />
          <span style={{ opacity: .7 }}>{error}</span>
        </div>
      )}

      <div className="diff-cards">
        <button className="diff-card diff-easy" onClick={() => onSelect('easy')}>
          <span className="diff-icon">🍺</span>
          <span className="diff-name">Easy</span>
          <span className="diff-secs">30 sec</span>
          <span className="diff-desc">Casual fan</span>
          <span className="diff-best">{bests.easy}</span>
        </button>
        <button className="diff-card diff-med" onClick={() => onSelect('medium')}>
          <span className="diff-icon">🎩</span>
          <span className="diff-name">Medium</span>
          <span className="diff-secs">20 sec</span>
          <span className="diff-desc">MacLaren&apos;s regular</span>
          <span className="diff-best">{bests.medium}</span>
        </button>
        <button className="diff-card diff-hard" onClick={() => onSelect('hard')}>
          <span className="diff-icon">🔥</span>
          <span className="diff-name">Hard</span>
          <span className="diff-secs">10 sec</span>
          <span className="diff-desc">Legen-dary</span>
          <span className="diff-best">{bests.hard}</span>
        </button>
      </div>

      <button className="btn btn-ghost" onClick={onBack}>← Back to Welcome</button>
    </div>
  );
}
