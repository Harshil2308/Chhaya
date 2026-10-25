import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import MapView from '../components/MapView';
import SafeShiftPlanner from '../components/SafeShiftPlanner';
import { LanguageSwitcher } from '../components/Navbar';
import { calculateHaversineDistance, getCityCoordinates } from '../utils/geoDistance';

// ── Design tokens (match Chhaya orange theme) ──────────────────────────────
const RISK_CONFIG = {
  Low:        { bg: '#f0fdf4', border: '#86efac', textColor: '#15803d', badgeBg: '#dcfce7', badgeText: '#166534', accent: '#22c55e' },
  Moderate:   { bg: '#fefce8', border: '#fde68a', textColor: '#854d0e', badgeBg: '#fef9c3', badgeText: '#713f12', accent: '#eab308' },
  High:       { bg: '#fff7ed', border: '#fdba74', textColor: '#c2410c', badgeBg: '#ffedd5', badgeText: '#9a3412', accent: '#e06010' },
  'Very High':{ bg: '#fff1f2', border: '#fca5a5', textColor: '#b91c1c', badgeBg: '#fee2e2', badgeText: '#991b1b', accent: '#dc2626' },
  Extreme:    { bg: '#fff1f2', border: '#f87171', textColor: '#991b1b', badgeBg: '#fecaca', badgeText: '#7f1d1d', accent: '#dc2626' },
};

const RISK_EMOJI = {
  Low: '🟢', Moderate: '🟡', High: '🟠', 'Very High': '🔴', Extreme: '🚨',
};

// ── Inline SunIcon (no external dep) ───────────────────────────────────────
const SunIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="4.5" fill="white" />
    {[0,45,90,135,180,225,270,315].map((deg, i) => (
      <line key={i} x1="12" y1="2.5" x2="12" y2="4.5"
        stroke="white" strokeWidth="2" strokeLinecap="round"
        transform={`rotate(${deg} 12 12)`} />
    ))}
  </svg>
);

// ── Loading spinner ─────────────────────────────────────────────────────────
const Spinner = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center gap-3 py-10">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 border-4 border-orange-100 rounded-full" />
      <div className="absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin" />
    </div>
    <p className="text-sm font-semibold" style={{ color: '#e06010' }}>{label}</p>
  </div>
);

// ── Section heading ─────────────────────────────────────────────────────────
const SectionHeading = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
      style={{ background: 'linear-gradient(135deg,#fff7ed,#ffedd5)', border: '1.5px solid #fdba74' }}>
      {icon}
    </div>
    <div>
      <h2 className="text-base font-extrabold text-gray-900 leading-tight">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ── Heat wave decorations (reused from AdminDashboard) ──────────────────────
const hwStripes = [
  { pos: 8,  delay: '0s',    h: 110, dur: '2.6s' },
  { pos: 20, delay: '0.7s',  h: 90,  dur: '2.2s' },
  { pos: 32, delay: '1.4s',  h: 130, dur: '3.0s' },
  { pos: 44, delay: '0.3s',  h: 80,  dur: '2.4s' },
  { pos: 56, delay: '1.1s',  h: 100, dur: '2.8s' },
  { pos: 68, delay: '1.8s',  h: 70,  dur: '2.0s' },
];
const hwGlows = [
  { pos: 5,  delay: '0.5s',  h: 150, dur: '3.4s' },
  { pos: 28, delay: '1.3s',  h: 120, dur: '3.0s' },
  { pos: 52, delay: '0.9s',  h: 170, dur: '3.8s' },
];
const SideHeatWaves = ({ side }) => (
  <div aria-hidden="true" className={`side-heat-waves side-heat-waves-${side}`}>
    <div className="side-heat-gradient" />
    {hwGlows.map((g, i) => (
      <div key={i} className="hw-glow"
        style={{ [side === 'left' ? 'left' : 'right']: `${g.pos}px`, '--hw-delay': g.delay, '--hw-h': `${g.h}px`, '--hw-dur': g.dur }} />
    ))}
    {hwStripes.map((s, i) => (
      <div key={i} className="hw-stripe"
        style={{ [side === 'left' ? 'left' : 'right']: `${s.pos}px`, '--hw-delay': s.delay, '--hw-h': `${s.h}px`, '--hw-dur': s.dur }} />
    ))}
  </div>
);

// ── Safety checklist items ──────────────────────────────────────────────────
const CHECKLIST_ITEMS = [
  { id: 'water',   icon: '💧', text: 'Ensure drinking water is available for all workers' },
  { id: 'shade',   icon: '🌿', text: 'Provide shade & enforce regular rest breaks (5–10 min/hour)' },
  { id: 'rotate',  icon: '🔄', text: 'Rotate heavy physical work to cooler morning/evening hours' },
  { id: 'watch',   icon: '👁️',  text: 'Watch for dizziness, nausea, confusion — act immediately' },
  { id: 'cooling', icon: '🏢', text: 'Know your nearest cooling center — move workers if needed' },
  { id: 'ors',     icon: '🧂', text: 'Keep ORS / electrolyte sachets stocked at the worksite' },
];

// ── Status badge helper ─────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    Pending:  { bg: '#fef9c3', color: '#854d0e', border: '#fde68a', label: '⏳ Pending'  },
    Verified: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', label: '✅ Verified' },
    Resolved: { bg: '#dcfce7', color: '#166534', border: '#86efac', label: '✔ Resolved' },
  }[status] || { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb', label: status };
  return (
    <span className="badge" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      {cfg.label}
    </span>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  ManagerDashboard
// ══════════════════════════════════════════════════════════════════════════════
function ManagerDashboard() {
  const [user,      setUser]      = useState(null);
  const [heatData,  setHeatData]  = useState(null);
  const [heatLoading, setHeatLoading] = useState(true);
  const [centers,   setCenters]   = useState([]);
  const [hotspots,  setHotspots]  = useState([]);
  const [userCoords, setUserCoords] = useState(null);

  // Manager-only: local checklist state (persisted per session)
  const [checkedItems, setCheckedItems] = useState({});

  const navigate = useNavigate();

  // ── Auth + Role guard ────────────────────────────────────────────────────
  useEffect(() => {
    const storedUser  = localStorage.getItem('user');
    const token       = localStorage.getItem('token');
    if (!token || !storedUser) { navigate('/login'); return; }

    const parsed = JSON.parse(storedUser);
    if (parsed.role === 'admin')  { navigate('/admin');     return; }
    if (parsed.role === 'worker') { navigate('/dashboard'); return; }
    if (parsed.role !== 'manager') { navigate('/login');   return; }

    setUser(parsed);
    const city = parsed.location || 'Ahmedabad';
    fetchHeatData(city);
    fetchCoolingCenters(city);
    fetchHotspots(city);

    // Geolocation with city fallback
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          const fb = getCityCoordinates(city);
          setUserCoords({ lat: fb.lat, lng: fb.lng });
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    } else {
      const fb = getCityCoordinates(city);
      setUserCoords({ lat: fb.lat, lng: fb.lng });
    }
  }, [navigate]);

  // ── Data fetchers ────────────────────────────────────────────────────────
  const fetchHeatData = async (city) => {
    try {
      const r = await API.get(`/alerts?city=${encodeURIComponent(city)}`);
      setHeatData(r.data);
    } catch { setHeatData(null); }
    finally { setHeatLoading(false); }
  };

  const fetchCoolingCenters = async (city) => {
    try {
      const r = await API.get(`/cooling-centers?city=${encodeURIComponent(city)}`);
      setCenters(r.data);
    } catch { setCenters([]); }
  };

  const fetchHotspots = async (city) => {
    try {
      const r = await API.get(`/hotspots?city=${encodeURIComponent(city)}`);
      setHotspots(r.data);
    } catch { setHotspots([]); }
  };

  // ── Sorted centers by distance ───────────────────────────────────────────
  const sortedCenters = useMemo(() => {
    if (!centers.length) return [];
    if (!userCoords)     return centers.map(c => ({ ...c, distanceKm: null }));
    return centers
      .map(c => {
        let distanceKm = null;
        if (c.latitude != null && c.longitude != null && !isNaN(c.latitude) && !isNaN(c.longitude)) {
          distanceKm = calculateHaversineDistance(userCoords.lat, userCoords.lng, c.latitude, c.longitude);
        }
        return { ...c, distanceKm };
      })
      .sort((a, b) => {
        if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm != null) return -1;
        if (b.distanceKm != null) return 1;
        return 0;
      });
  }, [centers, userCoords]);

  // ── Checklist toggle ─────────────────────────────────────────────────────
  const toggleCheck = (id) => setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner label="Loading manager panel…" />
    </div>
  );

  const city       = user.location || 'Ahmedabad';
  const riskLevel  = heatData?.riskLevel || 'Low';
  const riskCfg    = RISK_CONFIG[riskLevel] || RISK_CONFIG['Low'];
  const pendingCount  = hotspots.filter(h => h.status === 'Pending').length;

  return (
    <div className="min-h-screen" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* ── Side Heat Waves ── */}
      <SideHeatWaves side="left" />
      <SideHeatWaves side="right" />

      {/* ══════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white border-b border-orange-100"
        style={{ boxShadow: '0 1px 8px rgba(249,115,22,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}>
              <SunIcon size={18} />
            </div>
            <div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">Chhaya</span>
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Manager</span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="hidden sm:flex items-center gap-2.5 bg-orange-50 border border-orange-100 rounded-2xl px-3.5 py-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}>
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-amber-600 font-semibold capitalize">{city}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7" style={{ position: 'relative', zIndex: 1 }}>

        {/* ══ ROW 1: Welcome + Quick Stats ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

          {/* A. Welcome card */}
          <div className="lg:col-span-2 chhaya-card card-lift p-6 sm:p-7 dash-slide-left">
            <p className="section-label">Manager Dashboard</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              Good to see you, <span style={{ color: '#e06010' }}>{user.name}</span> 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1.5">
              Keep your outdoor teams safe today — monitor heat, plan shifts, act fast.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="badge" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' }}>
                🧑‍💼 Manager
              </span>
              <span className="badge" style={{ background: '#ffedd5', color: '#9a3412', borderColor: '#fdba74' }}>
                📍 {city}
              </span>
              {heatData && (
                <span className="badge" style={{ background: riskCfg.badgeBg, color: riskCfg.badgeText, borderColor: riskCfg.border }}>
                  {RISK_EMOJI[riskLevel]} {riskLevel} Risk Today
                </span>
              )}
            </div>
          </div>

          {/* Quick stats col */}
          <div className="flex flex-col gap-4">
            <div className="chhaya-card card-lift p-5 flex items-center gap-4 dash-slide-right delay-100">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: '#fff7ed', border: '1.5px solid #fdba74' }}>🌿</div>
              <div>
                <p className="text-2xl font-extrabold" style={{ color: '#e06010' }}>{centers.length}</p>
                <p className="text-xs text-gray-500 font-semibold">Cooling Centers</p>
                <p className="text-xs text-gray-400">{city}</p>
              </div>
            </div>
            <div className="chhaya-card card-lift p-5 flex items-center gap-4 dash-slide-right delay-200">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: '#fef9c3', border: '1.5px solid #fde68a' }}>⚠️</div>
              <div>
                <p className="text-2xl font-extrabold" style={{ color: '#d97706' }}>{pendingCount}</p>
                <p className="text-xs text-gray-500 font-semibold">Pending Reports</p>
                <p className="text-xs text-gray-400">Needs attention</p>
              </div>
            </div>
          </div>
        </div>

        {/* ══ ROW 2: Live Heat Risk ══ */}
        <div className="chhaya-card p-6 sm:p-7 mb-6 dash-fade-up delay-100">
          <SectionHeading icon="🌡️" title="Live Heat Risk" subtitle={`Current conditions for ${city}`} />

          {heatLoading ? (
            <Spinner label="Fetching live weather data…" />
          ) : heatData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Risk Level tile */}
              <div className="rounded-2xl p-5 col-span-1 sm:col-span-2 lg:col-span-1 flex flex-col justify-between"
                style={{ background: riskCfg.bg, border: `1.5px solid ${riskCfg.border}` }}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Risk Level</p>
                <p className="text-3xl font-extrabold leading-none mb-1" style={{ color: riskCfg.textColor }}>
                  {RISK_EMOJI[riskLevel]} {riskLevel}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed mt-2">{heatData.advice}</p>
              </div>

              {/* Metric tiles */}
              {[
                { label: 'Temperature', value: `${heatData.temperature}°C`, icon: '🌡️', sub: 'Ambient (shade)' },
                { label: 'Humidity',    value: `${heatData.humidity}%`,     icon: '💧', sub: 'Relative humidity' },
                { label: 'Heat Index',  value: `${heatData.heatIndex}°C`,   icon: '🔥', sub: 'Feels-like temperature' },
              ].map(m => (
                <div key={m.label} className="chhaya-card p-5 flex flex-col justify-between"
                  style={{ border: '1px solid #fde8d0' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{m.label}</p>
                    <span className="text-xl">{m.icon}</span>
                  </div>
                  <p className="text-3xl font-extrabold" style={{ color: '#e06010' }}>{m.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{m.sub}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="text-4xl">📡</span>
              <p className="text-gray-400 text-sm mt-3">Weather data unavailable. Check your connection.</p>
            </div>
          )}
        </div>

        {/* ══ ROW 3: Safe Work Hours + Safety Checklist ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* C. Safe Work Hours / Shift Planner */}
          <div className="chhaya-card p-6 sm:p-7 dash-fade-up delay-150">
            <SectionHeading icon="⏰" title="Safe Work Hours" subtitle="Recommended windows for outdoor teams" />
            <SafeShiftPlanner city={city} />
          </div>

          {/* D. Manager Safety Checklist */}
          <div className="chhaya-card p-6 sm:p-7 dash-fade-up delay-200">
            <SectionHeading icon="✅" title="Manager Safety Checklist"
              subtitle={`${checkedCount}/${CHECKLIST_ITEMS.length} completed today`} />

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-gray-500 font-semibold mb-1.5">
                <span>Daily checklist progress</span>
                <span style={{ color: '#e06010' }}>{Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-orange-50 rounded-full overflow-hidden border border-orange-100">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(checkedCount / CHECKLIST_ITEMS.length) * 100}%`,
                    background: 'linear-gradient(90deg,#e06010,#c97d08)',
                  }} />
              </div>
            </div>

            <div className="space-y-3">
              {CHECKLIST_ITEMS.map(item => (
                <button
                  key={item.id}
                  id={`checklist-${item.id}`}
                  onClick={() => toggleCheck(item.id)}
                  className="w-full flex items-center gap-3.5 p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left"
                  style={checkedItems[item.id]
                    ? { background: '#f0fdf4', borderColor: '#86efac' }
                    : { background: '#fffbf7', borderColor: '#fde8d0' }
                  }
                >
                  {/* Checkbox */}
                  <div className="w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                    style={checkedItems[item.id]
                      ? { background: '#16a34a', borderColor: '#16a34a' }
                      : { background: 'white',   borderColor: '#d1d5db' }
                    }>
                    {checkedItems[item.id] && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-medium leading-snug"
                    style={{ color: checkedItems[item.id] ? '#166534' : '#374151',
                             textDecoration: checkedItems[item.id] ? 'line-through' : 'none' }}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>

            {checkedCount === CHECKLIST_ITEMS.length && (
              <div className="mt-4 p-4 rounded-2xl text-center"
                style={{ background: '#f0fdf4', border: '1.5px solid #86efac' }}>
                <p className="text-sm font-bold text-green-700">🎉 All safety checks complete! Great work.</p>
              </div>
            )}
          </div>
        </div>

        {/* ══ ROW 4: Area Hotspots ══ */}
        <div className="chhaya-card p-6 sm:p-7 mb-6 dash-fade-up delay-200">
          <div className="flex items-start justify-between gap-4 mb-5">
            <SectionHeading icon="🚨" title="Area Hotspots"
              subtitle={`Heat-risk locations reported in ${city}`} />
            <span className="badge shrink-0" style={{ background: '#fef9c3', color: '#854d0e', borderColor: '#fde68a', marginTop: 4 }}>
              {pendingCount} pending
            </span>
          </div>

          {hotspots.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-5xl">📭</span>
              <p className="text-gray-400 text-sm mt-3">No hotspots reported in {city} yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {hotspots.map((spot, i) => (
                <div key={spot._id}
                  className="border rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:shadow-md tip-item"
                  style={{ borderColor: '#f3f4f6', animationDelay: `${i * 0.05}s` }}>
                  {/* Status stripe */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ background: spot.status === 'Pending' ? '#eab308' : spot.status === 'Verified' ? '#2563eb' : '#16a34a' }} />
                  <div className="pl-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-gray-800 text-sm leading-snug">📍 {spot.location}</h4>
                      <StatusBadge status={spot.status} />
                    </div>
                    <p className="text-xs text-gray-500">🏙️ {spot.city}</p>
                    {spot.description && (
                      <p className="text-xs text-gray-400 mt-1.5 italic">"{spot.description}"</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      By <span className="font-semibold">{spot.reportedBy?.name || 'Worker'}</span>
                      {' · '}{new Date(spot.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4 italic">
            ℹ️ Status updates and verification are handled by your Admin. You can view reports to plan around affected areas.
          </p>
        </div>

        {/* ══ ROW 5: Cooling Centers + Map ══ */}
        <div className="chhaya-card p-6 sm:p-7 mb-6 dash-fade-up delay-250">
          <SectionHeading icon="🌿" title="Cooling Centers Near You"
            subtitle={`Nearby safe shelters for your team in ${city}`} />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Map */}
            <div className="lg:col-span-3 rounded-2xl overflow-hidden" style={{ minHeight: 280 }}>
              <MapView centers={sortedCenters} city={city} userCoords={userCoords} />
            </div>

            {/* Center list */}
            <div className="lg:col-span-2 flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
              {sortedCenters.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl">🏢</span>
                  <p className="text-gray-400 text-sm mt-2">No cooling centers in {city} yet.</p>
                </div>
              ) : sortedCenters.map((c, i) => (
                <div key={c._id || i}
                  className="flex flex-col gap-1.5 p-4 rounded-2xl border transition-all hover:border-orange-200 hover:bg-orange-50/40"
                  style={{ borderColor: '#f3f4f6' }}>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-gray-800 text-sm leading-snug">{c.name}</h4>
                    <span className="badge shrink-0" style={{ background: '#ffedd5', color: '#9a3412', borderColor: '#fdba74' }}>
                      {c.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.address}</p>
                  <p className="text-xs text-gray-400">🏷️ {c.facilities}</p>
                  {c.distanceKm != null && (
                    <p className="text-xs font-bold" style={{ color: '#16a34a' }}>📍 {c.distanceKm} km away</p>
                  )}
                  {(c.latitude != null && c.longitude != null) && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold mt-0.5 hover:underline"
                      style={{ color: '#2563eb' }}>
                      🧭 Get Directions →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ ROW 6: Emergency Quick Actions ══ */}
        <div className="chhaya-card p-6 sm:p-7 mb-6 dash-fade-up delay-300">
          <SectionHeading icon="🆘" title="Emergency Quick Actions"
            subtitle="Act immediately if a worker shows heat stroke signs" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Call 108 */}
            <a href="tel:108" id="mgr-call-108"
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl text-white font-extrabold transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 4px 16px rgba(220,38,38,0.4)' }}>
              <span className="text-3xl">🚑</span>
              <span className="text-base tracking-wide">Call 108</span>
              <span className="text-xs text-red-200 font-medium">National Ambulance</span>
            </a>

            {/* Heat Helpline */}
            <a href="tel:18001801104" id="mgr-heat-helpline"
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl font-extrabold border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ background: '#fff7ed', color: '#c2410c', borderColor: '#fdba74' }}>
              <span className="text-3xl">🌡️</span>
              <span className="text-base">Heat Helpline</span>
              <span className="text-xs font-medium" style={{ color: '#9a3412' }}>1800-180-1104</span>
            </a>

            {/* First Aid Guide */}
            <Link to="/first-aid" id="mgr-first-aid"
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl font-extrabold border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ background: '#f0fdf4', color: '#166534', borderColor: '#86efac' }}>
              <span className="text-3xl">🩺</span>
              <span className="text-base">First Aid Guide</span>
              <span className="text-xs font-medium" style={{ color: '#15803d' }}>Heat Stroke Steps</span>
            </Link>
          </div>

          {/* Heat stroke quick guidance */}
          <div className="rounded-2xl p-5" style={{ background: '#fff7ed', border: '1.5px solid #fdba74' }}>
            <p className="text-sm font-extrabold text-gray-800 mb-3">⚡ If a worker collapses or shows confusion:</p>
            <ol className="space-y-2">
              {[
                'Move them to shade or a cool, ventilated space immediately',
                'Loosen clothing — remove heavy protective gear',
                'Cool them with wet cloth on neck, armpits, and groin',
                'Give small sips of ORS / water if they are conscious',
                'Call 108 — do NOT leave them alone',
                'Fan them and monitor until help arrives',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-xs text-gray-700 leading-relaxed">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Chhaya Manager Dashboard · Data updates on each page load · Stay safe, protect your team 🌿
        </p>
      </div>
    </div>
  );
}

export default ManagerDashboard;
