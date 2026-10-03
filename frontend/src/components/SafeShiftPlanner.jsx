import { useEffect, useState, useCallback } from 'react';
import API from '../services/api';

/* ──────────────────────────────────────────────────────────
   Human-crafted colour palette — earthy, warm, considered
   Low       → sage green   (calm, safe)
   Moderate  → golden amber (caution, warmth)
   High      → terracotta   (alert, heat)
   Very High → brick red    (danger)
   Extreme   → deep charcoal on rust (critical)
────────────────────────────────────────────────────────── */
const RISK_BADGES = {
  Low:         { bg: '#eaf4ec', text: '#2d6a35', border: '#9bcfa2', dot: '#3a8c44' },
  Moderate:    { bg: '#fdf4dc', text: '#7a5100', border: '#e8c96a', dot: '#c9900a' },
  High:        { bg: '#faeae4', text: '#8b2d14', border: '#e8a48a', dot: '#c94a28' },
  'Very High': { bg: '#f8e0e0', text: '#7a1515', border: '#d98888', dot: '#b52020' },
  Extreme:     { bg: '#3b1a14', text: '#f5c8b8', border: '#7a3020', dot: '#c03015' },
};

/* Accent bar colour per risk (top strip on each block card) */
const RISK_ACCENT = {
  Low:         '#5a9e62',
  Moderate:    '#d4a020',
  High:        '#c94a28',
  'Very High': '#b52020',
  Extreme:     '#7a2010',
};

function SafeShiftPlanner({ city }) {
  const [forecast, setForecast] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const targetCity = city || 'Ahmedabad';
      const res = await API.get(`/alerts/forecast?city=${encodeURIComponent(targetCity)}`);
      setForecast(res.data);
    } catch (err) {
      console.error('Forecast load error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => { fetchForecast(); }, [fetchForecast]);

  const isFallback = error || forecast?.fallback || !forecast?.blocks?.length;

  /* ── shared hover handlers for block cards ── */
  const onCardEnter = e => {
    e.currentTarget.style.transform  = 'translateY(-2px)';
    e.currentTarget.style.boxShadow  = '0 8px 24px rgba(80,50,20,0.12)';
  };
  const onCardLeave = e => {
    e.currentTarget.style.transform  = 'translateY(0)';
    e.currentTarget.style.boxShadow  = '0 1px 6px rgba(80,50,20,0.07)';
  };

  return (
    <div
      className="dash-fade-up card-lift mb-5"
      style={{
        background:   'linear-gradient(155deg, #fdf8f0 0%, #f5e8ce 100%)',
        border:       '1.5px solid #ddd0b0',
        borderRadius: '1.5rem',
        padding:      '1.6rem 1.75rem',
        boxShadow:    '0 2px 18px rgba(100,65,20,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        transition:   'transform 0.22s ease, box-shadow 0.22s ease',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'flex-start', gap:'0.75rem', marginBottom:'0.5rem' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
            <span style={{ fontSize:'1.2rem' }}>⏱</span>
            <h3 style={{ margin:0, fontSize:'1.05rem', fontWeight:700, color:'#2c2416', letterSpacing:'-0.01em' }}>
              Safe Shift Planner
            </h3>
            <span style={{
              fontSize:'0.64rem', fontWeight:700, letterSpacing:'0.05em',
              color:'#2d6a35', background:'#eaf4ec', border:'1px solid #9bcfa2',
              borderRadius:'9999px', padding:'0.18rem 0.65rem',
            }}>
              ● Live Forecast
            </span>
          </div>
          <p style={{ margin:'0.3rem 0 0', fontSize:'0.775rem', color:'#7a6040', lineHeight:1.5 }}>
            Dynamic shift scheduling based on OpenWeather 3-hour heat-index forecast.
          </p>
        </div>
        <button
          onClick={fetchForecast}
          disabled={loading}
          style={{
            fontSize:'0.75rem', fontWeight:600, padding:'0.45rem 1rem',
            borderRadius:'0.65rem', border:'1.5px solid #ddd0b0',
            background:'#ffffff', color:'#6b5030', cursor:'pointer',
            transition:'background 0.15s, border-color 0.15s',
            fontFamily:'inherit', letterSpacing:'0.01em',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fffbf2'; e.currentTarget.style.borderColor = '#c9900a'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#ddd0b0'; }}
        >
          {loading ? '↻ Refreshing…' : '↻  Refresh'}
        </button>
      </div>

      {/* ── Divider ── */}
      <div style={{ height:'1px', background:'linear-gradient(90deg,transparent,#ddd0b0 30%,#ddd0b0 70%,transparent)', margin:'1rem 0 1.2rem' }} />

      {/* ── Body ── */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'2.5rem 0' }}>
          <div style={{
            display:'inline-block', width:'2rem', height:'2rem',
            border:'2.5px solid #ddd0b0', borderTopColor:'#c9900a',
            borderRadius:'50%', animation:'spin 0.8s linear infinite', marginBottom:'0.75rem',
          }} />
          <p style={{ fontSize:'0.78rem', color:'#8a7050', margin:0 }}>
            Computing 24-hour shift risk timeline…
          </p>
        </div>

      ) : isFallback ? (
        <div>
          {/* Fallback banner */}
          <div style={{
            display:'flex', alignItems:'center', gap:'0.5rem',
            background:'#fef9ec', border:'1px solid #f0d888',
            borderRadius:'0.875rem', padding:'0.7rem 1rem',
            fontSize:'0.78rem', color:'#7a5100', marginBottom:'1rem', fontWeight:500,
          }}>
            <span>ℹ</span>
            <span>Live forecast offline — showing recommended baseline shift windows.</span>
          </div>
          {/* Fallback cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'0.875rem' }}>
            {[
              { emoji:'🌅', label:'Safe Morning',       time:'6:00 AM – 11:00 AM',     note:'Lowest ambient radiant heat' },
              { emoji:'🌇', label:'Safe Evening',       time:'4:00 PM – 7:00 PM',       note:'Solar radiation subsiding'   },
              { emoji:'💧', label:'Hydration Protocol', time:'15 min shade rest / hr',  note:'Cool ORS / water at work site' },
            ].map(({ emoji, label, time, note }) => (
              <div key={label} style={{
                background:'#ffffff', border:'1.5px solid #e8dcc0',
                borderRadius:'1rem', padding:'1rem',
                boxShadow:'0 1px 6px rgba(80,50,20,0.06)',
              }}>
                <span style={{ fontSize:'1.4rem', display:'block', marginBottom:'0.4rem' }}>{emoji}</span>
                <p style={{ margin:'0 0 0.2rem', fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#c9900a' }}>{label}</p>
                <p style={{ margin:'0 0 0.15rem', fontSize:'0.85rem', fontWeight:700, color:'#2c2416' }}>{time}</p>
                <p style={{ margin:0, fontSize:'0.68rem', color:'#8a7050' }}>{note}</p>
              </div>
            ))}
          </div>
        </div>

      ) : (
        <div>
          {/* Safer windows banner */}
          <div style={{
            display:'flex', alignItems:'flex-start', gap:'0.75rem',
            background:'#edf7ee', border:'1.5px solid #9bcfa2',
            borderRadius:'1rem', padding:'0.9rem 1rem', marginBottom:'1.25rem',
          }}>
            <span style={{ fontSize:'1rem', color:'#2d6a35', flexShrink:0, marginTop:'0.05rem' }}>✔</span>
            <div>
              <p style={{ margin:'0 0 0.5rem', fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#1e5225' }}>
                Recommended Safer Shifts — {forecast.city}
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                {forecast.saferWindows?.map((win, idx) => (
                  <span key={idx} style={{
                    fontSize:'0.72rem', fontWeight:700,
                    padding:'0.25rem 0.65rem', borderRadius:'9999px',
                    background:'#c4e8c8', color:'#1e5225', border:'1px solid #8ec494',
                  }}>
                    🌤 {win}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline label */}
          <p style={{ fontSize:'0.66rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.09em', color:'#9a8060', marginBottom:'0.85rem' }}>
            24-Hour Forward Forecast &amp; Work / Rest Protocol
          </p>

          {/* Block grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(168px,1fr))', gap:'0.75rem' }}>
            {forecast.blocks?.map((block, idx) => {
              const badge  = RISK_BADGES[block.riskLevel] || RISK_BADGES.Low;
              const accent = RISK_ACCENT[block.riskLevel] || RISK_ACCENT.Low;
              return (
                <div
                  key={idx}
                  style={{
                    background:'#ffffff', borderRadius:'1rem',
                    border:'1.5px solid #e8dcc0',
                    boxShadow:'0 1px 6px rgba(80,50,20,0.07)',
                    overflow:'hidden',
                    transition:'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={onCardEnter}
                  onMouseLeave={onCardLeave}
                >
                  {/* coloured risk accent bar */}
                  <div style={{ height:'4px', background: accent }} />

                  {/* time + badge */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'0.65rem 0.75rem 0' }}>
                    <div>
                      <p style={{ margin:0, fontSize:'0.78rem', fontWeight:700, color:'#2c2416' }}>{block.timeLabel}</p>
                      <p style={{ margin:0, fontSize:'0.62rem', color:'#a8906a' }}>{block.dayLabel}</p>
                    </div>
                    <span style={{
                      display:'inline-flex', alignItems:'center', gap:'0.28rem',
                      fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.02em',
                      padding:'0.18rem 0.5rem', borderRadius:'9999px',
                      border:'1px solid',
                      background: badge.bg, color: badge.text, borderColor: badge.border,
                      whiteSpace:'nowrap',
                    }}>
                      <span style={{ width:'5px', height:'5px', borderRadius:'50%', background: badge.dot, flexShrink:0 }} />
                      {block.riskLevel}
                    </span>
                  </div>

                  {/* temperature */}
                  <div style={{ display:'flex', alignItems:'baseline', gap:'0.4rem', padding:'0.5rem 0.75rem', borderBottom:'1px solid #f0e8d5' }}>
                    <span style={{ fontSize:'1.15rem', fontWeight:800, color:'#2c2416' }}>{block.temp}°C</span>
                    <span style={{ fontSize:'0.68rem', fontWeight:600, color:'#8a7050' }}>HI {block.heatIndex}°C</span>
                    <span style={{ fontSize:'0.65rem', color:'#a8906a' }}>💧 {block.humidity}%</span>
                  </div>

                  {/* guidance */}
                  <div style={{ background:'#fdf8f0', borderTop:'1px solid #ece0c8', padding:'0.6rem 0.75rem 0.7rem' }}>
                    <p style={{ margin:'0 0 0.2rem', fontSize:'0.59rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#a8906a' }}>
                      Shift Guidance
                    </p>
                    <p style={{ margin:'0 0 0.2rem', fontSize:'0.75rem', fontWeight:700, color:'#2c2416', lineHeight:1.35 }}>
                      {block.workRest}
                    </p>
                    <p style={{ margin:0, fontSize:'0.65rem', color:'#7a6040', lineHeight:1.45 }}>
                      {block.guidance}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SafeShiftPlanner;
