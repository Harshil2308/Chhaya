import { useState, useRef } from 'react';
import API from '../services/api';
import { useLanguage } from '../context/LanguageContext';

/**
 * ListenButton
 * -----------
 * Renders a small 🔊 button that speaks `text` in the current language via
 * POST /api/speak (Sarvam bulbul:v3). Falls back to browser speechSynthesis
 * if the backend returns an error.
 *
 * Props:
 *   text   {string}  – The text to speak (already in the correct language)
 *   size   {'sm'|'md'} – Button size (default 'sm')
 */
export default function ListenButton({ text, size = 'sm' }) {
  const { lang, tr } = useLanguage();
  const [state, setState] = useState('idle'); // idle | loading | playing | error
  const audioRef = useRef(null);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setState('idle');
  };

  const browserFallback = () => {
    if (!window.speechSynthesis) { setState('error'); return; }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'hi' ? 'hi-IN' : lang === 'gu' ? 'gu-IN' : 'en-IN';
    utter.onend = () => setState('idle');
    utter.onerror = () => setState('error');
    setState('playing');
    window.speechSynthesis.speak(utter);
  };

  const handleClick = async () => {
    // If currently playing, stop
    if (state === 'playing') { stop(); return; }

    if (!text) return;
    setState('loading');

    try {
      const { data } = await API.post('/speak', { text, lang });
      const audioBase64 = data.audio;

      if (!audioBase64) throw new Error('empty audio');

      // Decode base64 WAV → ArrayBuffer
      const binaryStr = atob(audioBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const blob = new Blob([bytes.buffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setState('idle'); URL.revokeObjectURL(url); };
      audio.onerror = () => { setState('error'); URL.revokeObjectURL(url); };
      audio.play();
      setState('playing');
    } catch {
      // Try browser TTS fallback
      browserFallback();
    }
  };

  const label =
    state === 'loading' ? tr('listen.loading') :
    state === 'playing' ? '⏹ Stop' :
    state === 'error'   ? tr('listen.error') :
    tr('listen.listen');

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === 'loading'}
      title={label}
      className={`inline-flex items-center gap-1.5 font-semibold rounded-xl border transition-all duration-150 cursor-pointer
        ${isSmall ? 'text-[11px] px-2.5 py-1' : 'text-xs px-3 py-1.5'}`}
      style={
        state === 'playing'
          ? { background: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5' }
          : state === 'error'
          ? { background: '#fef9c3', color: '#854d0e', borderColor: '#fde68a' }
          : { background: '#fff7ed', color: '#c2410c', borderColor: '#fdba74' }
      }
    >
      {state === 'loading' && (
        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
}
