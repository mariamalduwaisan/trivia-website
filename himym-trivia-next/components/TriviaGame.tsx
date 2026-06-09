'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { QUESTIONS } from '@/lib/questions';
import { DIFFICULTIES, type Difficulty } from '@/lib/constants';
import { lsGet, lsSet } from '@/lib/storage';
import { speakBarney } from '@/lib/voice';

import WelcomeScreen    from './WelcomeScreen';
import DifficultyScreen from './DifficultyScreen';
import QuizScreen       from './QuizScreen';
import ResultsScreen    from './ResultsScreen';

export type Screen = 'welcome' | 'difficulty' | 'quiz' | 'results';
export interface Answer { selected: number; correct: boolean }

export default function TriviaGame() {
  const [screen,    setScreen]    = useState<Screen>('welcome');
  const [qi,        setQi]        = useState(0);
  const [score,     setScore]     = useState(0);
  const [diff,      setDiff]      = useState<Difficulty>('easy');
  const [timeLeft,  setTimeLeft]  = useState(0);
  const [answers,   setAnswers]   = useState<Record<number, Answer>>({});
  const [scoreBump, setScoreBump] = useState(false);
  const [isNew,     setIsNew]     = useState(false);

  // Refs for use in closures/intervals without stale state
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const qiRef     = useRef(qi);
  const answersRef = useRef(answers);
  const diffRef   = useRef(diff);
  const scoreRef  = useRef(score);

  useEffect(() => { qiRef.current     = qi;      }, [qi]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { diffRef.current   = diff;     }, [diff]);
  useEffect(() => { scoreRef.current  = score;    }, [score]);

  // Pre-warm browser TTS
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.getVoices();
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const handleTimeout = useCallback(() => {
    const currentQi = qiRef.current;
    if (answersRef.current[currentQi] !== undefined) return;
    const newAnswers = { ...answersRef.current, [currentQi]: { selected: -1, correct: false } };
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
    speakBarney(false);
    setTimeLeft(0);
  }, []);

  const startTimer = useCallback((difficulty: Difficulty) => {
    stopTimer();
    const total = DIFFICULTIES[difficulty].secs;
    setTimeLeft(total);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          stopTimer();
          handleTimeout();
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [stopTimer, handleTimeout]);

  // Start/stop timer when quiz question changes
  useEffect(() => {
    if (screen !== 'quiz') { stopTimer(); return; }
    if (answers[qi] !== undefined) { stopTimer(); return; } // already answered
    startTimer(diff);
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, qi]);

  // Cleanup on unmount
  useEffect(() => () => stopTimer(), [stopTimer]);

  /* ── Actions ── */
  function showDifficulty() { stopTimer(); setScreen('difficulty'); }
  function goHome()          { stopTimer(); setScreen('welcome'); }

  function selectDifficulty(d: Difficulty) {
    setDiff(d);
    diffRef.current = d;
    setQi(0);
    setScore(0);
    setAnswers({});
    answersRef.current = {};
    setScreen('quiz');
  }

  function pick(idx: number) {
    const currentQi = qiRef.current;
    if (answersRef.current[currentQi] !== undefined) return;
    stopTimer();

    const q       = QUESTIONS[currentQi];
    const correct = idx === q.a;
    const newAnswers = { ...answersRef.current, [currentQi]: { selected: idx, correct } };
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
    speakBarney(correct);

    if (correct) {
      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
      setScoreBump(true);
      setTimeout(() => setScoreBump(false), 500);
    }
  }

  function goBack() {
    stopTimer();
    if (qi === 0) { goHome(); return; }
    setQi(prev => prev - 1);
  }

  function goForward() {
    if (answersRef.current[qiRef.current] === undefined) return;
    stopTimer();
    if (qi === QUESTIONS.length - 1) {
      const newRecord = saveScore(score);
      setIsNew(newRecord);
      setScreen('results');
    } else {
      setQi(prev => prev + 1);
    }
  }

  function saveScore(s: number): boolean {
    const total  = QUESTIONS.length;
    const d      = diffRef.current;
    const hsKey  = `himym_hs_${d}`;
    const prev   = parseInt(lsGet(hsKey) || '-1', 10);
    const isNewR = s > prev;
    const history = JSON.parse(lsGet('himym_scores') || '[]');
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    history.unshift({ score: s, total, date: dateStr, diff: d });
    if (history.length > 10) history.length = 10;
    lsSet('himym_scores', JSON.stringify(history));
    if (isNewR) lsSet(hsKey, String(s));
    return isNewR;
  }

  /* ── Render one screen at a time ── */
  return (
    <div id="card">
      {screen === 'welcome' && (
        <WelcomeScreen onStart={showDifficulty} />
      )}
      {screen === 'difficulty' && (
        <DifficultyScreen onSelect={selectDifficulty} onBack={goHome} />
      )}
      {screen === 'quiz' && (
        <QuizScreen
          qi={qi}
          score={score}
          diff={diff}
          timeLeft={timeLeft}
          answers={answers}
          scoreBump={scoreBump}
          onPick={pick}
          onBack={goBack}
          onForward={goForward}
        />
      )}
      {screen === 'results' && (
        <ResultsScreen
          score={score}
          diff={diff}
          answers={answers}
          isNewRecord={isNew}
          onPlayAgain={showDifficulty}
          onHome={goHome}
        />
      )}
      <div id="card-foot">MacLaren&apos;s Pub · New York City · Est. 2005</div>
    </div>
  );
}
