'use client';
import { useEffect, useRef, useState } from 'react';
import { type Answer } from '@/components/TriviaGame';
import { type Question, getEmoji, getMsg, LABELS } from '@/lib/questions';
import { DIFFICULTIES, type Difficulty } from '@/lib/constants';
import { lsGet, lsDel } from '@/lib/storage';

interface ScoreRow {
  score: number;
  total: number;
  date:  string;
  diff:  string;
}

interface Props {
  questions:   Question[];
  score:       number;
  diff:        Difficulty;
  answers:     Record<number, Answer>;
  isNewRecord: boolean;
  onPlayAgain: () => void;
  onHome:      () => void;
}

export default function ResultsScreen({
  questions, score, diff, answers, isNewRecord, onPlayAgain, onHome,
}: Props) {
  const total   = questions.length;
  const [history, setHistory] = useState<ScoreRow[]>([]);
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = JSON.parse(lsGet('himym_scores') || '[]') as ScoreRow[];
    setHistory(h);
  }, []);

  // Animate bar fills after mount
  useEffect(() => {
    if (!barsRef.current) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      barsRef.current?.querySelectorAll<HTMLDivElement>('.sb-bar-fill[data-pct]').forEach(b => {
        b.style.width = b.dataset.pct + '%';
      });
    }));
  }, [history]);

  function clearScores() {
    if (!confirm('Clear all score history?')) return;
    lsDel('himym_scores');
    ['easy', 'medium', 'hard'].forEach(d => lsDel(`himym_hs_${d}`));
    lsDel('himym_highscore');
    setHistory([]);
  }

  const hs        = lsGet(`himym_hs_${diff}`) || '0';
  const medals    = ['🥇', '🥈', '🥉'];
  const diffLabel = DIFFICULTIES[diff].label;

  return (
    <div id="results" className="screen active">
      <div className="result-emoji">{getEmoji(score, total)}</div>

      {/* Stars */}
      <div className="stars-row">
        {Array.from({ length: total }, (_, i) => (
          <StarReveal key={i} earned={i < score} index={i} />
        ))}
      </div>

      {/* Score */}
      <div className="big-score-block">
        <span className="big-score">{score}</span>
        <span className="score-caption">out of {total}</span>
      </div>

      <p className="result-msg">{getMsg(score, total)}</p>
      <div className="divider" />

      {/* Breakdown */}
      <div className="breakdown">
        {questions.map((q, i) => {
          const h = answers[i];
          if (!h) return null;
          const short = q.q.length > 60 ? q.q.slice(0, 60) + '…' : q.q;
          return (
            <div key={i} className="brow">
              <span className="bq">{i + 1}. {short}</span>
              <span className={`br ${h.correct ? 'ok' : 'no'}`}>{h.correct ? '✓' : '✗'}</span>
            </div>
          );
        })}
      </div>

      {/* Scoreboard */}
      {history.length > 0 && (
        <div className="scoreboard-wrap" ref={barsRef}>
          {isNewRecord && (
            <div className="new-record-banner">🏆 New High Score!</div>
          )}
          <div className="scoreboard">
            <div className="sb-header">
              <span className="sb-title">
                📊 Scoreboard
                <span className="sb-best">🏆 {diffLabel}: {hs}/{total}</span>
              </span>
              <button className="sb-clear" onClick={clearScores}>Clear history</button>
            </div>
            {history.map((row, i) => {
              const pct    = Math.round((row.score / row.total) * 100);
              const medal  = medals[i] !== undefined ? medals[i] : `${i + 1}.`;
              const dKey   = row.diff || 'easy';
              const dLabel = (DIFFICULTIES[dKey as Difficulty]?.label) || dKey;
              return (
                <div key={i} className={`sb-row${i === 0 ? ' sb-current' : ''}`}>
                  <span className="sb-rank">{medal}</span>
                  <div className="sb-bar">
                    <div className="sb-bar-fill" data-pct={pct} style={{ width: 0 }} />
                  </div>
                  <span className="sb-pts">{row.score}/{row.total}</span>
                  <span className="sb-date">
                    <span className={`diff-badge ${dKey}`}>{dLabel}</span>
                    {row.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="result-btns">
        <button className="btn btn-gold" onClick={onPlayAgain}>☂️&nbsp;&nbsp;Play Again</button>
        <button className="btn btn-ghost" onClick={onHome}>← Back to Welcome</button>
      </div>
    </div>
  );
}

// Star with delayed reveal animation
function StarReveal({ earned, index }: { earned: boolean; index: number }) {
  const [visible, setVisible] = useState(!earned);
  const [popped,  setPopped]  = useState(false);

  useEffect(() => {
    if (!earned) return;
    const t1 = setTimeout(() => { setVisible(true); setPopped(true); }, 160 + index * 120);
    const t2 = setTimeout(() => setPopped(false), 160 + index * 120 + 350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [earned, index]);

  return (
    <span
      className="star"
      style={{
        opacity:    visible ? 1 : 0,
        filter:     earned ? undefined : 'grayscale(1)',
        transform:  popped ? 'scale(1.25)' : 'scale(1)',
        transition: 'opacity .35s ease, transform .35s ease',
      }}
    >
      ⭐
    </span>
  );
}
