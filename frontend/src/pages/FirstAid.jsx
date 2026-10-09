import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const FIRST_AID_STEPS = [
  {
    step: 1,
    icon: '🚨',
    title: 'Call Emergency Services',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
    text: '#991b1b',
    actions: [
      'Call 108 (National Ambulance) immediately',
      'Call 1800-180-1104 (National Heat Helpline)',
      'Send your GPS location via WhatsApp to emergency contact',
    ],
    critical: true,
  },
  {
    step: 2,
    icon: '🌡️',
    title: 'Recognize Heat Stroke vs Heat Exhaustion',
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fdba74',
    text: '#9a3412',
    subItems: [
      {
        label: '🚨 Heat Stroke (EMERGENCY)',
        items: ['Body temp > 40°C', 'Dry hot skin — NO sweating', 'Confusion, seizures, unconsciousness', 'THIS IS LIFE-THREATENING — call 108 NOW'],
        danger: true,
      },
      {
        label: '⚠️ Heat Exhaustion (Serious)',
        items: ['Heavy sweating', 'Cool, pale, clammy skin', 'Dizziness, nausea, headache', 'Weakness — must stop work immediately'],
        danger: false,
      },
    ],
  },
  {
    step: 3,
    icon: '❄️',
    title: 'Cool the Person Down FAST',
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#7dd3fc',
    text: '#0c4a6e',
    actions: [
      'Move to shade or indoors IMMEDIATELY',
      'Remove heavy/dark clothing — loosen everything',
      'Pour cool water over head, neck, armpits, groin',
      'Fan continuously to speed evaporation',
      'Apply ice packs to neck, armpits, groin if available',
      'Use wet cloth/towel to wrap around body',
    ],
    critical: false,
  },
  {
    step: 4,
    icon: '💧',
    title: 'Rehydration Protocol',
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
    text: '#164e63',
    actions: [
      'If CONSCIOUS: give ORS (Oral Rehydration Solution)',
      'Give small sips — not large gulps — every 5 minutes',
      'Add 1/2 tsp salt + 6 tsp sugar in 1 litre water as ORS substitute',
      'Lemon-salt water or coconut water also helps',
      'If UNCONSCIOUS: DO NOT give liquids — wait for ambulance',
    ],
    warning: 'Never give water to unconscious person — they may choke.',
    critical: false,
  },
  {
    step: 5,
    icon: '🛌',
    title: 'Positioning and Monitoring',
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#c4b5fd',
    text: '#4c1d95',
    actions: [
      'Lay person flat — legs slightly elevated',
      'If vomiting: turn to side (recovery position)',
      'Keep fanning and cooling until help arrives',
      'Monitor breathing and pulse every 2 minutes',
      'DO NOT leave the person alone',
    ],
    critical: false,
  },
  {
    step: 6,
    icon: '⛔',
    title: 'What NOT to Do',
    color: '#b91c1c',
    bg: '#fff1f2',
    border: '#f87171',
    text: '#7f1d1d',
    actions: [
      'Do NOT give aspirin or paracetamol — can worsen condition',
      'Do NOT give alcohol for cooling',
      'Do NOT use ice-cold water internally — causes shock',
      'Do NOT leave and wait for it to pass',
      'Do NOT continue working after heat exhaustion',
    ],
    critical: false,
  },
];

const PREVENTION_TIPS = [
  { icon: '💧', tip: 'Drink 250ml water every 20-30 min. Do not wait until thirsty.' },
  { icon: '🧂', tip: 'Carry ORS sachets. Mix in water bottle before starting work.' },
  { icon: '⏰', tip: 'Do heaviest work before 11 AM and after 4 PM only.' },
  { icon: '🌿', tip: 'Rest 10-15 min in shade every hour. Non-negotiable.' },
  { icon: '👕', tip: 'Light-colored, loose cotton clothes. Cover head with wet cloth.' },
  { icon: '🤝', tip: 'Work in pairs. Watch each other for signs of heat illness.' },
];

const EMERGENCY_NUMBERS = [
  { name: 'National Ambulance', number: '108', icon: '🚑', color: '#dc2626' },
  { name: 'Heat Helpline', number: '1800-180-1104', icon: '🌡️', color: '#ea580c' },
  { name: 'NDMA Disaster', number: '1078', icon: '🏥', color: '#7c3aed' },
  { name: 'Police / Emergency', number: '112', icon: '👮', color: '#1d4ed8' },
];

function FirstAid() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeStep, setActiveStep] = useState(null);
  const { tr, translations } = useLanguage();

  // Use translated prevention tips when available
  const preventionTips = (translations.firstAid?.preventionTips) || PREVENTION_TIPS;

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return (
    <div className="min-h-screen" style={{ position: 'relative', overflow: 'hidden' }}>
      <Navbar user={user} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-7" style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div className="chhaya-card p-6 sm:p-8 mb-6 dash-slide-left" style={{ borderLeft: '4px solid #dc2626' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🏥</span>
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900">{tr('firstAid.title')}</h1>
                  <p className="text-xs text-gray-500 mt-0.5">{tr('firstAid.subtitle')}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="badge" style={{ background: '#fef2f2', color: '#991b1b', borderColor: '#fca5a5' }}>
                  {tr('firstAid.lifeSavingBadge')}
                </span>
                <span className="badge" style={{ background: '#fef9c3', color: '#713f12', borderColor: '#fde68a' }}>
                  {tr('firstAid.jobsBadge')}
                </span>
              </div>
            </div>
            <button
              id="back-to-dashboard-btn"
              onClick={() => navigate('/dashboard')}
              className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 border cursor-pointer shrink-0"
              style={{ background: '#fff7ed', color: '#c2410c', borderColor: '#fdba74' }}
            >
              {tr('firstAid.backToDashboard')}
            </button>
          </div>
        </div>

        {/* Emergency Numbers */}
        <div className="rounded-3xl p-5 mb-6 dash-fade-up" style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 8px 32px rgba(220,38,38,0.35)' }}>
          <p className="text-white text-xs font-bold uppercase tracking-widest mb-3 opacity-80">{tr('firstAid.saveNumbers')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {EMERGENCY_NUMBERS.map((item) => (
              <a
                key={item.name}
                href={`tel:${item.number}`}
                className="flex flex-col items-center gap-1 rounded-2xl p-3.5 transition-all duration-200 text-center"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-white text-[11px] font-semibold leading-tight">{item.name}</span>
                <span className="text-white text-lg font-extrabold">{item.number}</span>
                <span className="text-white/60 text-[10px]">{tr('firstAid.tapToCall')}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Step-by-step */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-extrabold text-gray-900 text-lg">{tr('firstAid.stepByStep')}</h2>
            <span className="badge" style={{ background: '#fef2f2', color: '#991b1b', borderColor: '#fca5a5' }}>{tr('firstAid.followInOrder')}</span>
          </div>

          <div className="space-y-4">
            {FIRST_AID_STEPS.map((step) => (
              <div
                key={step.step}
                id={`first-aid-step-${step.step}`}
                className="rounded-3xl p-5 border-2 card-lift dash-fade-up cursor-pointer transition-all duration-200"
                style={{
                  background: step.bg,
                  borderColor: activeStep === step.step ? step.color : step.border,
                  boxShadow: activeStep === step.step ? `0 4px 20px ${step.color}30` : 'none',
                }}
                onClick={() => setActiveStep(activeStep === step.step ? null : step.step)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-extrabold shrink-0"
                      style={{ background: step.color }}
                    >
                      {step.step}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{step.icon}</span>
                      <h3 className="font-extrabold text-gray-900 text-sm">{step.title}</h3>
                      {step.critical && (
                        <span className="badge" style={{ background: '#dc2626', color: '#fff', borderColor: 'transparent', fontSize: '0.65rem' }}>
                          CRITICAL
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm font-bold shrink-0">{activeStep === step.step ? '▲' : '▼'}</span>
                </div>

                {activeStep === step.step && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: step.border }}>
                    {step.actions && (
                      <ul className="space-y-2">
                        {step.actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm font-medium" style={{ color: step.text }}>
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold shrink-0 mt-0.5"
                              style={{ background: step.color }}
                            >
                              {i + 1}
                            </span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    )}

                    {step.subItems && (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {step.subItems.map((sub, i) => (
                          <div key={i} className="rounded-2xl p-3.5 border" style={{
                            background: sub.danger ? '#fef2f2' : '#fff7ed',
                            borderColor: sub.danger ? '#fca5a5' : '#fdba74'
                          }}>
                            <p className="font-extrabold text-sm mb-2" style={{ color: sub.danger ? '#991b1b' : '#92400e' }}>
                              {sub.label}
                            </p>
                            <ul className="space-y-1">
                              {sub.items.map((item, j) => (
                                <li key={j} className="text-xs flex items-start gap-1.5" style={{ color: sub.danger ? '#b91c1c' : '#78350f' }}>
                                  <span>•</span><span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {step.warning && (
                      <div className="mt-3 rounded-xl p-3 flex items-start gap-2 text-xs font-semibold"
                        style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
                        <span>⚠️</span>
                        <span>{step.warning}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Prevention */}
        <div className="rounded-3xl p-6 mb-6 dash-fade-up border border-blue-100" style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}>
          <h2 className="font-extrabold text-blue-900 text-lg mb-4">{tr('firstAid.prevention')}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {preventionTips.map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.5)', color: '#1e3a8a' }}>
                <span className="text-xl shrink-0">{item.icon}</span>
                <span>{item.tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-xs text-gray-400">
          <p>{tr('firstAid.footer')}</p>
          <p className="mt-1">{tr('firstAid.footerSub')}</p>
        </div>

      </div>
    </div>
  );
}

export default FirstAid;
