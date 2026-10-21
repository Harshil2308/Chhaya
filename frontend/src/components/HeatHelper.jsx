/**
 * HeatHelper.jsx — "Ask Chhaya" floating chat panel
 *
 * Features:
 * - Floating orange button fixed bottom-right
 * - Slide-up chat panel (chhaya-card, orange theme)
 * - Quick-chip shortcuts (localized en/hi/gu)
 * - Emergency banner with Call 108 + SOS link
 * - Loading/typing dots, error, rate-limit states
 * - Chat history in React state only; cleared on unmount/logout
 * - Hides itself entirely if assistant is disabled (no crash)
 * - Disclaimer always visible at bottom
 * - 44px+ tap targets, readable at 360px wide
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { askAssistant, getAssistantStatus } from '../services/api';

// ── Localized quick chips ─────────────────────────────────────────────────────
const CHIPS = {
  en: [
    'How do I stay safe today?',
    'Best time to work?',
    'How much water should I drink?',
    'What are the danger signs?',
  ],
  hi: [
    'आज मैं सुरक्षित कैसे रहूँ?',
    'काम का सबसे अच्छा समय?',
    'कितना पानी पीना चाहिए?',
    'खतरे के संकेत क्या हैं?',
  ],
  gu: [
    'આજે સુરક્ષિત કેવી રીતે રહેવું?',
    'કામ માટે શ્રેષ્ઠ સમય?',
    'કેટલું પાણી પીવું જોઈએ?',
    'ખતરાના સંકેત શું છે?',
  ],
};

// ── Typing dots animation ─────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div
      className="flex items-center gap-1 px-4 py-3 rounded-2xl"
      style={{ background: '#fff7ed', border: '1px solid #fdba74', width: 'fit-content' }}
      aria-label="Chhaya is typing"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#e06010',
            animation: `hh-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg, onSOS }) {
  const isUser = msg.role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 8,
      }}
    >
      {/* Emergency banner */}
      {msg.emergency && (
        <div
          style={{
            background: 'linear-gradient(135deg,#fef2f2,#fee2e2)',
            border: '2px solid #dc2626',
            borderRadius: '1rem',
            padding: '0.75rem 1rem',
            marginBottom: 6,
            maxWidth: '100%',
          }}
        >
          <p style={{ fontWeight: 700, color: '#b91c1c', fontSize: 13, marginBottom: 6 }}>
            🚨 Heat Emergency Detected
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a
              href="tel:108"
              id="hh-call-108"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: '#dc2626',
                color: '#fff',
                borderRadius: '0.6rem',
                padding: '0.45rem 1rem',
                fontWeight: 700,
                fontSize: 13,
                minHeight: 44,
                textDecoration: 'none',
              }}
            >
              🚑 Call 108
            </a>
            <button
              id="hh-sos-link"
              onClick={onSOS}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: '#fff',
                color: '#dc2626',
                border: '2px solid #dc2626',
                borderRadius: '0.6rem',
                padding: '0.45rem 1rem',
                fontWeight: 700,
                fontSize: 13,
                minHeight: 44,
                cursor: 'pointer',
              }}
            >
              🆘 SOS / First Aid
            </button>
          </div>
        </div>
      )}

      {/* Text bubble */}
      <div
        style={{
          maxWidth: '85%',
          padding: '0.65rem 0.9rem',
          borderRadius: isUser ? '1.2rem 1.2rem 0.3rem 1.2rem' : '1.2rem 1.2rem 1.2rem 0.3rem',
          background: isUser
            ? 'linear-gradient(135deg,#e06010,#c97d08)'
            : msg.error
            ? '#fef2f2'
            : '#fff7ed',
          color: isUser ? '#fff' : msg.error ? '#b91c1c' : '#1f2937',
          border: isUser
            ? 'none'
            : msg.error
            ? '1px solid #fca5a5'
            : '1px solid #fdba74',
          fontSize: 14,
          lineHeight: 1.55,
          wordBreak: 'break-word',
          boxShadow: isUser ? '0 2px 10px rgba(224,96,16,0.2)' : '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HeatHelper({ lang = 'en', onOpenSOS }) {
  const [enabled, setEnabled] = useState(null); // null = loading, true/false = known
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [disclaimer, setDisclaimer] = useState('AI guidance, not medical advice. In an emergency call 108.');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const chips = CHIPS[lang] || CHIPS.en;

  // Check if feature is enabled on mount
  useEffect(() => {
    getAssistantStatus()
      .then((data) => setEnabled(data.enabled))
      .catch(() => setEnabled(false));
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    if (trimmed.length > 300) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: trimmed },
        { role: 'assistant', content: '⚠️ Message too long. Please keep it under 300 characters.', error: true },
      ]);
      setInput('');
      return;
    }

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setLoading(true);

    try {
      const data = await askAssistant(trimmed, lang);
      if (data.disclaimer) setDisclaimer(data.disclaimer);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          emergency: data.emergency,
        },
      ]);
    } catch (err) {
      const status = err?.response?.status;
      let msg;
      if (status === 429) {
        msg = '⏳ You\'ve asked 15 questions this hour. Please try again later.';
      } else if (status === 503) {
        msg = 'Heat safety assistant is currently unavailable.';
      } else {
        msg = err?.response?.data?.message || 'Something went wrong. Please try again.';
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: msg, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, lang, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSOS = () => {
    setOpen(false);
    if (typeof onOpenSOS === 'function') onOpenSOS();
  };

  // Hide entirely only when server confirms the feature is disabled
  if (enabled === false) return null;
  // While status check is in-flight (null), show the button — it will handle
  // errors gracefully inside sendMessage if the feature is actually unavailable

  return (
    <>
      {/* ── Keyframe injection ── */}
      <style>{`
        @keyframes hh-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.7; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes hh-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes hh-fab-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(224,96,16,0.45), 0 0 0 0 rgba(224,96,16,0.4); }
          50%       { box-shadow: 0 4px 28px rgba(224,96,16,0.6),  0 0 0 8px rgba(224,96,16,0); }
        }
        #hh-panel { animation: hh-slide-up 0.25s ease both; }
        #hh-fab   { animation: hh-fab-pulse 2.5s ease-in-out infinite; }
        #hh-fab:hover { transform: scale(1.07); }
        #hh-fab { transition: transform 0.15s ease; }
      `}</style>

      {/* ── Floating Action Button ── */}
      {!open && (
        <button
          id="hh-fab"
          aria-label="Ask Chhaya heat safety assistant"
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 20,
            zIndex: 1000,
            width: 62,
            height: 62,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#e06010,#c97d08)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            color: '#fff',
          }}
        >
          <span style={{ fontSize: 24, lineHeight: 1 }}>🌿</span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1 }}>
            ASK
          </span>
        </button>
      )}

      {/* ── Chat Panel ── */}
      {open && (
        <div
          id="hh-panel"
          style={{
            position: 'fixed',
            bottom: 16,
            right: 12,
            left: 12,
            maxWidth: 420,
            marginLeft: 'auto',
            zIndex: 1000,
            borderRadius: '1.5rem',
            background: '#fff',
            boxShadow: '0 8px 40px rgba(224,96,16,0.22), 0 2px 10px rgba(0,0,0,0.08)',
            border: '1.5px solid rgba(224,96,16,0.18)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'min(560px, calc(100dvh - 80px))',
            overflow: 'hidden',
          }}
          role="dialog"
          aria-label="Chhaya heat safety assistant"
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg,#e06010,#c97d08)',
              padding: '0.85rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🌿</span>
              <div>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>
                  Ask Chhaya
                </p>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, lineHeight: 1 }}>
                  Heat safety helper
                </p>
              </div>
            </div>
            <button
              id="hh-close"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: 'none',
                borderRadius: '50%',
                width: 34,
                height: 34,
                cursor: 'pointer',
                color: '#fff',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Message area */}
          <div
            id="hh-messages"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.85rem 0.9rem 0.4rem',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Welcome */}
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: 13,
                  paddingTop: 8,
                  paddingBottom: 6,
                }}
              >
                <div style={{ fontSize: 30, marginBottom: 6 }}>🌿</div>
                <p style={{ fontWeight: 600, color: '#374151', marginBottom: 2 }}>
                  Namaste! I'm Chhaya's heat-safety helper.
                </p>
                <p style={{ fontSize: 12 }}>
                  Ask me anything about staying safe in the heat. Try a quick question below.
                </p>
              </div>
            )}

            {/* Chat bubbles */}
            {messages.map((msg, i) => (
              <Bubble key={i} msg={msg} onSOS={handleSOS} />
            ))}

            {/* Typing indicator */}
            {loading && <TypingDots />}

            <div ref={bottomRef} />
          </div>

          {/* Quick chips */}
          {messages.length === 0 && !loading && (
            <div
              style={{
                padding: '0 0.9rem 0.5rem',
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                flexShrink: 0,
              }}
            >
              {chips.map((chip, i) => (
                <button
                  key={i}
                  id={`hh-chip-${i}`}
                  onClick={() => sendMessage(chip)}
                  style={{
                    background: '#fff7ed',
                    border: '1.5px solid #fdba74',
                    borderRadius: 999,
                    padding: '0.4rem 0.85rem',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#9a3412',
                    cursor: 'pointer',
                    minHeight: 34,
                    transition: 'background 0.15s, border-color 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ffedd5';
                    e.currentTarget.style.borderColor = '#e06010';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff7ed';
                    e.currentTarget.style.borderColor = '#fdba74';
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div
            style={{
              padding: '0.6rem 0.9rem 0.75rem',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
              flexShrink: 0,
            }}
          >
            <textarea
              id="hh-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 300))}
              onKeyDown={handleKeyDown}
              placeholder={
                lang === 'hi'
                  ? 'अपना सवाल लिखें...'
                  : lang === 'gu'
                  ? 'તમારો પ્રશ્ન લખો...'
                  : 'Ask a heat safety question...'
              }
              rows={1}
              disabled={loading}
              style={{
                flex: 1,
                resize: 'none',
                padding: '0.6rem 0.85rem',
                background: '#fde2b8',
                border: '1.5px solid transparent',
                borderRadius: '0.75rem',
                fontSize: 14,
                color: '#111827',
                outline: 'none',
                fontFamily: 'inherit',
                minHeight: 44,
                maxHeight: 100,
                lineHeight: 1.4,
                transition: 'border-color 0.18s, background 0.18s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#e06010';
                e.currentTarget.style.background = '#fff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.background = '#fde2b8';
              }}
            />
            <button
              id="hh-send"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              style={{
                width: 44,
                height: 44,
                borderRadius: '0.75rem',
                background:
                  !input.trim() || loading
                    ? '#e5e7eb'
                    : 'linear-gradient(135deg,#e06010,#c97d08)',
                border: 'none',
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
                transition: 'background 0.18s',
              }}
            >
              {loading ? (
                <span
                  style={{
                    width: 18,
                    height: 18,
                    border: '2.5px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                    display: 'inline-block',
                  }}
                />
              ) : (
                <span style={{ color: !input.trim() ? '#9ca3af' : '#fff' }}>➤</span>
              )}
            </button>
          </div>

          {/* Disclaimer */}
          <div
            id="hh-disclaimer"
            style={{
              padding: '0.4rem 1rem 0.65rem',
              borderTop: '1px solid #f3f4f6',
              textAlign: 'center',
              fontSize: 11,
              color: '#9ca3af',
              flexShrink: 0,
            }}
          >
            ⚠️ {disclaimer}
          </div>
        </div>
      )}
    </>
  );
}
