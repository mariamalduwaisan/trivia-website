export const DIFFICULTIES = {
  easy:   { label: 'Easy',   secs: 30, color: '#5dbb7a' },
  medium: { label: 'Medium', secs: 20, color: '#f5c842' },
  hard:   { label: 'Hard',   secs: 10, color: '#e74c3c' },
} as const;

export type Difficulty = keyof typeof DIFFICULTIES;

// ─── ElevenLabs AI Voice ───────────────────────────────
// 1. Sign up free at elevenlabs.io
// 2. Paste your API key into ELEVENLABS_KEY below
// 3. Go to elevenlabs.io/voice-library → search "Barney Stinson"
//    → copy the Voice ID → paste into BARNEY_VOICE_ID
// 4. Restart the dev server — done!
// Falls back to browser TTS if key is empty.
export const ELEVENLABS_KEY  = '';
export const BARNEY_VOICE_ID = 'ErXwobaYiN019PkySvjV'; // Antoni (confident US male)

export const BARNEY_CORRECT = [
  "Legen... wait for it... dary! Legendary!",
  "Challenge accepted, and totally crushed! You are so awesome!",
  "Suit up! That is what I am talking about! Nailed it!"
];

export const BARNEY_WRONG = [
  "That is so not awesome. Come on!",
  "Oh please. Even Marshall knows that one. Not cool.",
  "Have you even met the gang? Not legendary at all."
];
