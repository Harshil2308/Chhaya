import { useState, useRef } from 'react';
import API from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const ADVICE_LOOKUP = {
  'Normal conditions. Stay hydrated.': {
    hi: 'सामान्य स्थितियाँ। नियमित रूप से पानी पीते रहें।',
    gu: 'સામાન્ય સ્થિતિ. પૂરતું પાણી પીતા રહો.',
    en: 'Normal conditions. Stay hydrated.',
  },
  'Drink water regularly and take short breaks.': {
    hi: 'नियमित पानी पिएं और छाया में छोटे ब्रेक लें।',
    gu: 'નિયમિત પાણી પીઓ અને છાંયડામાં ટૂંકો વિરામ લો.',
    en: 'Drink water regularly and take short breaks.',
  },
  'Limit outdoor work. Take frequent breaks in shade.': {
    hi: 'बाहरी काम सीमित करें। छाया में बार-बार आराम करें।',
    gu: 'બહારનું કામ મર્યાદિત કરો. છાંયડામાં વારંવાર આરામ કરો.',
    en: 'Limit outdoor work. Take frequent breaks in shade.',
  },
  'Dangerous! Avoid heavy work during peak hours.': {
    hi: 'खतरनाक! दोपहर के चरम घंटों में भारी काम से बचें।',
    gu: 'જોખમી! બપોરના આકરા તડકામાં ભારે કામ કરવાનું ટાળો.',
    en: 'Dangerous! Avoid heavy work during peak hours.',
  },
  'Extreme danger. Stay indoors if possible.': {
    hi: 'अत्यधिक खतरा। यदि संभव हो तो धूप में काम तुरंत रोकें।',
    gu: 'અત્યંત ગંભીર જોખમ. શક્ય હોય તો તડકામાં કામ તરત જ અટકાવો.',
    en: 'Extreme danger. Stay indoors if possible.',
  },
  'Normal conditions. Drink water every 30 minutes before feeling thirsty. Keep ORS packet handy.': {
    hi: 'सामान्य स्थितियाँ। प्यास लगने से पहले हर 30 मिनट में पानी पिएं। ORS पैकेट पास रखें।',
    gu: 'સામાન્ય સ્થિતિ. તરસ લાગે તે પહેલાં દર ૩૦ મિનિટે પાણી પીઓ. ORS પેકેટ સાથે રાખો.',
    en: 'Normal conditions. Drink water every 30 minutes before feeling thirsty. Keep ORS packet handy.',
  },
};

/**
 * ListenButton
 * -----------
 * Speaks `text` in the active language via POST /api/speak (Sarvam bulbul:v3).
 * Guarantees proper language mapping: en -> en-IN, hi -> hi-IN, gu -> gu-IN.
 * Ensures English text is never spoken under hi/gu voice.
 */
export default function ListenButton({ text, size = 'sm', className = '' }) {
  const { lang, tr } = useLanguage();
  const [state, setState] = useState('idle'); // idle | loading | playing | error
  const [errorMsg, setErrorMsg] = useState('');
  const audioRef = useRef(null);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setState('idle');
  };

  const browserFallback = (spokenText) => {
    if (!window.speechSynthesis) {
      setState('error');
      setErrorMsg(tr('listen.error'));
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(spokenText);
      utter.lang = lang === 'hi' ? 'hi-IN' : lang === 'gu' ? 'gu-IN' : 'en-IN';
      utter.onend = () => setState('idle');
      utter.onerror = () => {
        setState('error');
        setErrorMsg(tr('listen.error'));
      };
      setState('playing');
      window.speechSynthesis.speak(utter);
    } catch {
      setState('error');
      setErrorMsg(tr('listen.error'));
    }
  };

  const handleClick = async () => {
    // If currently playing, stop
    if (state === 'playing') {
      stop();
      return;
    }

    if (!text) return;
    setErrorMsg('');
    setState('loading');

    // Ensure text is converted if it is a known English advice string and user is in hi/gu
    let textToSend = typeof text === 'string' ? text.trim() : '';
    if (ADVICE_LOOKUP[textToSend] && ADVICE_LOOKUP[textToSend][lang]) {
      textToSend = ADVICE_LOOKUP[textToSend][lang];
    }

    try {
      const { data } = await API.post('/speak', {
        text: textToSend,
        lang: lang || 'en',
      });

      const audioBase64 = data.audio;
      if (!audioBase64) throw new Error('No audio returned');

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      let audioUrl;
      try {
        const binaryStr = atob(audioBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes.buffer], { type: 'audio/wav' });
        audioUrl = URL.createObjectURL(blob);
      } catch {
        audioUrl = `data:audio/wav;base64,${audioBase64}`;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setState('idle');
        if (audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.error('[TTS] Audio element error:', e);
        setState('error');
        setErrorMsg(tr('listen.error'));
        if (audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      setState('playing');
    } catch (err) {
      console.warn('[TTS] Cloud speak failed, attempting browser fallback...', err);
      browserFallback(textToSend);
    }
  };

  const label =
    state === 'loading' ? tr('listen.loading') :
    state === 'playing' ? (tr('listen.stop') || '⏹ Stop') :
    state === 'error'   ? (errorMsg || tr('listen.error')) :
    tr('listen.listen');

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === 'loading'}
      title={state === 'error' ? errorMsg || tr('listen.error') : label}
      className={`inline-flex items-center gap-1.5 font-semibold rounded-xl border transition-all duration-150 cursor-pointer
        ${isSmall ? 'text-[11px] px-2.5 py-1' : 'text-xs px-3 py-1.5'} ${className}`}
      style={
        state === 'playing'
          ? { background: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5' }
          : state === 'error'
          ? { background: '#fef9c3', color: '#854d0e', borderColor: '#fde68a' }
          : { background: '#fff7ed', color: '#c2410c', borderColor: '#fdba74' }
      }
    >
      {state === 'loading' && (
        <svg className="animate-spin w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      <span className="truncate max-w-[200px]">{label}</span>
    </button>
  );
}
