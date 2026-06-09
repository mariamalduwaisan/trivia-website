import { ELEVENLABS_KEY, BARNEY_VOICE_ID, BARNEY_CORRECT, BARNEY_WRONG } from './constants';

const _audioCache: Record<string, string> = {};

export function speakBarney(isCorrect: boolean): void {
  const pool = isCorrect ? BARNEY_CORRECT : BARNEY_WRONG;
  const text = pool[Math.floor(Math.random() * pool.length)];
  ELEVENLABS_KEY ? _elevenSpeak(text, isCorrect) : _webSpeak(text, isCorrect);
}

async function _elevenSpeak(text: string, isCorrect: boolean): Promise<void> {
  if (_audioCache[text]) {
    new Audio(_audioCache[text]).play().catch(() => _webSpeak(text, isCorrect));
    return;
  }
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${BARNEY_VOICE_ID}/stream`,
      {
        method: 'POST',
        headers: {
          Accept: 'audio/mpeg',
          'xi-api-key': ELEVENLABS_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability:        isCorrect ? 0.18 : 0.55,
            similarity_boost: 0.88,
            style:            isCorrect ? 0.90 : 0.25,
            use_speaker_boost: true,
          },
        }),
      }
    );
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
    const url = URL.createObjectURL(await res.blob());
    _audioCache[text] = url;
    new Audio(url).play();
  } catch (err) {
    console.warn('ElevenLabs TTS failed — falling back to browser voice:', err);
    _webSpeak(text, isCorrect);
  }
}

function _webSpeak(text: string, isCorrect: boolean): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt   = new SpeechSynthesisUtterance(text);
  utt.lang    = 'en-US';
  utt.volume  = 1;
  utt.rate    = isCorrect ? 1.18 : 0.85;
  utt.pitch   = isCorrect ? 1.30 : 0.72;
  const voices = window.speechSynthesis.getVoices();
  const voice  = ['Alex', 'Daniel', 'Tom', 'David', 'James', 'Ryan']
    .reduce<SpeechSynthesisVoice | null>(
      (f, n) => f || voices.find(v => v.name === n) || null,
      null
    ) || voices.find(v => v.lang === 'en-US') || null;
  if (voice) utt.voice = voice;
  window.speechSynthesis.speak(utt);
}
