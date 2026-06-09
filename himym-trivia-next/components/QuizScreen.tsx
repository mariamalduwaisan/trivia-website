'use client';
import { type Answer } from '@/components/TriviaGame';
import { QUESTIONS, LABELS } from '@/lib/questions';
import { DIFFICULTIES, type Difficulty } from '@/lib/constants';

interface Props {
  qi:         number;
  score:      number;
  diff:       Difficulty;
  timeLeft:   number;
  answers:    Record<number, Answer>;
  scoreBump:  boolean;
  onPick:     (idx: number) => void;
  onBack:     () => void;
  onForward:  () => void;
}

export default function QuizScreen({
  qi, score, diff, timeLeft, answers, scoreBump,
  onPick, onBack, onForward,
}: Props) {
  const q       = QUESTIONS[qi];
  const total   = QUESTIONS.length;
  const ans     = answers[qi];
  const answered = ans !== undefined;
  const isLast  = qi === total - 1;

  const totalSecs = DIFFICULTIES[diff].secs;
  const pct       = Math.max(0, (timeLeft / totalSecs) * 100);
  const timerColor =
    timeLeft > totalSecs * 0.5 ? '#5dbb7a' :
    timeLeft > totalSecs * 0.25 ? '#f5c842' : '#e74c3c';

  function choiceClass(i: number) {
    if (!answered) return 'choice';
    if (i === q.a)                       return 'choice correct';
    if (ans.selected === i && !ans.correct) return 'choice wrong';
    return 'choice';
  }

  return (
    <div id="quiz" className="screen active">
      {/* Top bar */}
      <div className="quiz-topbar">
        <span className="q-label">Question {qi + 1} of {total}</span>
        <div className="timer-pill">
          ⏱&nbsp;
          <span className="timer-num" style={{ color: answered ? 'var(--muted)' : timerColor }}>
            {answered ? '–' : timeLeft}
          </span>s
        </div>
        <div className="score-pill">
          ☂️&nbsp;
          <span className={`score-num${scoreBump ? ' score-bump' : ''}`}>{score}</span>
          &nbsp;/ {total}
        </div>
      </div>

      {/* Progress bar */}
      <div className="prog-track">
        <div className="prog-fill" style={{ width: `${(qi / total) * 100}%` }} />
      </div>

      {/* Timer bar */}
      <div className="timer-track">
        <div
          className="timer-fill"
          style={{
            width:      answered ? '0%' : `${pct}%`,
            background: timerColor,
          }}
        />
      </div>

      {/* Question */}
      <div className="q-box" key={`q-${qi}`}>
        <p className="q-text">{q.q}</p>
      </div>

      {/* Choices */}
      <div className="choices" key={`c-${qi}`}>
        {q.opts.map((opt, i) => (
          <button
            key={i}
            className={choiceClass(i)}
            disabled={answered}
            onClick={() => onPick(i)}
          >
            <span className="lbl">{LABELS[i]}</span>
            <span>{opt}</span>
          </button>
        ))}
      </div>

      {/* Feedback */}
      {answered && (
        <div className={`feedback ${ans.correct ? 'ok' : 'err'}`}>
          {ans.selected === -1 ? (
            <>
              <strong>⏱ Time&apos;s up!</strong> The answer was{' '}
              <strong>{LABELS[q.a]}: {q.opts[q.a]}.</strong> {q.exp}
            </>
          ) : ans.correct ? (
            <><strong>✓ Correct!</strong> {q.exp}</>
          ) : (
            <>
              <strong>✗ Not quite.</strong> The answer was{' '}
              <strong>{LABELS[q.a]}: {q.opts[q.a]}.</strong> {q.exp}
            </>
          )}
        </div>
      )}

      {/* Nav */}
      <div className="nav-row">
        <button className="btn-nav btn-back" onClick={onBack}>
          {qi === 0 ? '⌂ Welcome' : '← Back'}
        </button>
        <button
          className="btn-nav btn-fwd"
          disabled={!answered}
          onClick={onForward}
        >
          {isLast && answered ? '🍺 See Results' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
