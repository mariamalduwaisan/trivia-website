import type { Question } from './questions';

interface OpenTDBResult {
  type: string;
  difficulty: string;
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface OpenTDBResponse {
  response_code: number;
  results: OpenTDBResult[];
}

/** Decode HTML entities returned by OpenTDB (e.g. &amp; &#039; &quot;) */
function decodeHTML(str: string): string {
  if (typeof document !== 'undefined') {
    const el = document.createElement('textarea');
    el.innerHTML = str;
    return el.value;
  }
  // SSR fallback
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”');
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function transform(r: OpenTDBResult): Question {
  const correct = decodeHTML(r.correct_answer);
  const opts    = shuffle([correct, ...r.incorrect_answers.map(decodeHTML)]);
  return {
    q:   decodeHTML(r.question),
    opts,
    a:   opts.indexOf(correct),
    exp: `📂 ${decodeHTML(r.category)}`,
  };
}

/**
 * Fetch trivia questions from Open Trivia Database.
 * https://opentdb.com/api.php?amount=10&difficulty=easy&type=multiple
 */
export async function fetchQuestions(
  difficulty: string,
  amount = 10,
): Promise<Question[]> {
  const url = `https://opentdb.com/api.php?amount=${amount}&difficulty=${difficulty}&type=multiple`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`OpenTDB responded with ${res.status}`);

  const data: OpenTDBResponse = await res.json();

  if (data.response_code !== 0) {
    // response_code 5 = rate limited; others = no results for params
    const hints: Record<number, string> = {
      1: 'Not enough questions available.',
      2: 'Invalid parameter.',
      5: 'Rate limited — please wait a few seconds and try again.',
    };
    throw new Error(hints[data.response_code] ?? `OpenTDB error code ${data.response_code}`);
  }

  return data.results.map(transform);
}
