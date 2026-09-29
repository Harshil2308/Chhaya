/* ── Sun Panel ── */
function SunPanel({ title = 'Chhaya', subtitle }) {
  return (
    <div
      className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(170deg, #0e0400 0%, #2e0f00 28%, #7a2e00 58%, #c05000 80%, #e06010 100%)',
      }}
    >
      {/* Atmospheric horizon haze */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(to top, rgba(220,80,0,0.4) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Top dark-to-transparent fade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '35%',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Sun Assembly ── */}
      <div
        className="sun-float z-10"
        style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem' }}
      >
        {/* Diffuse far corona */}
        <div style={{
          position: 'absolute',
          width: 420, height: 420,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,130,0,0.18) 0%, rgba(200,60,0,0.06) 55%, transparent 70%)',
          filter: 'blur(12px)',
          animation: 'glow-breathe 5s ease-in-out infinite',
        }} />

        {/* Mid corona */}
        <div style={{
          position: 'absolute',
          width: 300, height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,190,40,0.28) 0%, rgba(255,100,0,0.10) 55%, transparent 70%)',
          filter: 'blur(6px)',
          animation: 'glow-breathe 4s ease-in-out infinite 1s',
        }} />

        {/* Inner bright corona */}
        <div style={{
          position: 'absolute',
          width: 220, height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,240,120,0.42) 0%, transparent 65%)',
          filter: 'blur(3px)',
          animation: 'glow-breathe 3s ease-in-out infinite 2s',
        }} />

        {/* ── Sun Disk ── */}
        <div
          className="sun-core"
          style={{
            width: 158, height: 158,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 34%, #fffef0 0%, #fff3a0 18%, #ffcc30 38%, #ff8c00 62%, #d95000 80%, #a83200 100%)',
            boxShadow: [
              '0 0 0 6px rgba(255,200,60,0.22)',
              '0 0 28px 14px rgba(255,150,20,0.50)',
              '0 0 60px 30px rgba(255,90,0,0.30)',
              '0 0 110px 55px rgba(200,55,0,0.18)',
              '0 0 180px 90px rgba(150,30,0,0.08)',
            ].join(', '),
            position: 'relative', zIndex: 2,
          }}
        >
          {/* Surface highlight */}
          <div style={{
            position: 'absolute',
            top: '14%', left: '18%',
            width: '38%', height: '32%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%)',
          }} />
        </div>

        {/* Lens flare streak */}
        <div style={{
          position: 'absolute',
          width: 3, height: 260,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(255,230,100,0.14) 40%, rgba(255,200,80,0.22) 50%, rgba(255,230,100,0.14) 60%, transparent 100%)',
          transform: 'rotate(-25deg)',
          filter: 'blur(1.5px)',
          animation: 'glow-breathe 6s ease-in-out infinite 0.5s',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          width: 2, height: 180,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(255,220,120,0.12) 40%, rgba(255,210,90,0.18) 50%, rgba(255,220,120,0.12) 60%, transparent 100%)',
          transform: 'rotate(45deg)',
          filter: 'blur(1px)',
          animation: 'glow-breathe 5s ease-in-out infinite 2s',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── Heat Shimmer Lines ── */}
      <div style={{ position: 'absolute', bottom: '22%', left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: 14, padding: '0 10%' }}>
        {[
          { delay: '0s',    dur: '3.2s', opacity: 0.55, width: '80%', ml: '10%' },
          { delay: '0.6s',  dur: '2.8s', opacity: 0.42, width: '65%', ml: '17%' },
          { delay: '1.2s',  dur: '3.6s', opacity: 0.32, width: '52%', ml: '24%' },
          { delay: '0.3s',  dur: '4s',   opacity: 0.22, width: '40%', ml: '30%' },
        ].map((line, i) => (
          <div key={i} style={{
            height: 1.5,
            width: line.width,
            marginLeft: line.ml,
            borderRadius: 99,
            background: `rgba(255,200,80,${line.opacity})`,
            filter: 'blur(0.8px)',
            animation: `heat-rise ${line.dur} ease-in-out infinite ${line.delay}`,
          }} />
        ))}
      </div>

      {/* ── Text ── */}
      <div
        className="sun-tagline absolute bottom-0 left-0 right-0 pb-10 flex flex-col items-center text-white"
        style={{ animationDelay: '0.4s' }}
      >
        <h2 className="text-3xl font-extrabold tracking-tight" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
          {title}
        </h2>
        <p className="text-white/70 mt-2 text-sm font-medium text-center max-w-xs leading-relaxed">
          {subtitle || (
            <>
              Heatwave Early Warning System<br />
              <span style={{ color: '#fde68a', fontWeight: 700 }}>Protecting outdoor workers</span><br />
              from extreme heat across India
            </>
          )}
        </p>
        <div className="mt-4 flex gap-2 flex-wrap justify-center">
          {['🌡️ Live Risk', '💧 Safety Tips', '📍 Shelters'].map(t => (
            <span key={t} style={{
              fontSize: '0.72rem', fontWeight: 600,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '0.3rem 0.75rem',
              borderRadius: '9999px',
              backdropFilter: 'blur(4px)',
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SunPanel;
