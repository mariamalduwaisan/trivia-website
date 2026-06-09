export interface Question {
  q: string;
  opts: string[];
  a: number;
  exp: string;
}

export const QUESTIONS: Question[] = [
  {
    q: "What is the name of the bar where the gang always hangs out?",
    opts: ["Central Perk", "MacLaren's Pub", "Paddy's Pub", "The Drunk Tank"],
    a: 1,
    exp: "MacLaren's Pub sits on the ground floor of the gang's apartment building — their true second home for all 9 seasons."
  },
  {
    q: "What is Ted Mosby's career for most of the series?",
    opts: ["Lawyer", "Doctor", "Architect", "Accountant"],
    a: 2,
    exp: "Ted is an architect who dreams of designing a great New York building — he later teaches architecture at Columbia University."
  },
  {
    q: "Which country is Robin Scherbatsky originally from?",
    opts: ["Australia", "United Kingdom", "New Zealand", "Canada"],
    a: 3,
    exp: "Robin is Canadian, and the show never lets her forget it. She was even a teen pop star there, known as 'Robin Sparkles'!"
  },
  {
    q: "What is the real name of Ted's future wife, 'The Mother'?",
    opts: ["Emily McConnell", "Tracy McConnell", "Tracy Marshall", "Amy Williams"],
    a: 1,
    exp: "Tracy McConnell is The Mother. She and Ted meet at Farhampton train station — she's holding the yellow umbrella."
  },
  {
    q: "What colour is the iconic umbrella associated with 'The Mother'?",
    opts: ["Red", "Blue", "Purple", "Yellow"],
    a: 3,
    exp: "The yellow umbrella is one of HIMYM's most recognisable symbols, representing Ted and Tracy's destined meeting."
  }
];

export const EMOJIS = ['😢', '😕', '🤔', '😊', '🍺', '🏆'];

export const MSGS = [
  "Oof… even Barney feels sorry for you. Maybe binge-watch the show one more time?",
  "Not quite, but you'd get kicked out of MacLaren's with that score. Keep watching!",
  "Decent! You know the show, but there's still room to become a true HIMYM legend.",
  "Nice work! You're practically a regular at MacLaren's booth.",
  "Impressive! Barney would say this calls for a celebratory high-five.",
  "LEGEN— wait for it —DARY! You're the ultimate HIMYM fan. Ted would be proud! ☂️"
];

export const LABELS = ['A', 'B', 'C', 'D'];
