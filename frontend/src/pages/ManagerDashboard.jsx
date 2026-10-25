import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import MapView from '../components/MapView';
import SafeShiftPlanner from '../components/SafeShiftPlanner';
import { LanguageSwitcher } from '../components/Navbar';
import { calculateHaversineDistance, getCityCoordinates } from '../utils/geoDistance';

// ── Risk config (same palette as UserDashboard) ─────────────────────────────
const RISK_CONFIG = {
  Low:          { bg: '#f0fdf4', border: '#86efac', textColor: '#15803d', badgeBg: '#dcfce7', badgeText: '#166534', dot: '#16a34a' },
  Moderate:     { bg: '#fefce8', border: '#fde68a', textColor: '#854d0e', badgeBg: '#fef9c3', badgeText: '#713f12', dot: '#ca8a04' },
  High:         { bg: '#fff7ed', border: '#fdba74', textColor: '#c2410c', badgeBg: '#ffedd5', badgeText: '#9a3412', dot: '#ea580c' },
  'Very High':  { bg: '#fff1f2', border: '#fca5a5', textColor: '#b91c1c', badgeBg: '#fee2e2', badgeText: '#991b1b', dot: '#dc2626' },
  Extreme:      { bg: '#fff1f2', border: '#f87171', textColor: '#991b1b', badgeBg: '#fecaca', badgeText: '#7f1d1d', dot: '#dc2626' },
};

// ── Safety checklist ─────────────────────────────────────────────────────────
const CHECKLIST_ITEMS = [
  { id: 'water',   label: 'Drinking water available for all workers' },
  { id: 'shade',   label: 'Shade provided; 5–10 min rest breaks enforced each hour' },
  { id: 'rotate',  label: 'Heavy tasks rescheduled to before 11 AM or after 4 PM' },
  { id: 'watch',   label: 'Workers monitored for dizziness, nausea, or confusion' },
  { id: 'cooling', label: 'Nearest cooling center location confirmed and communicated' },
  { id: 'ors',     label: 'ORS / electrolyte sachets stocked at worksite' },
];

const HEAT_STROKE_STEPS = [
  'Move them to shade or a cool, ventilated space immediately',
  'Loosen clothing — remove heavy protective gear',
  'Cool with wet cloth on neck, armpits, and groin',
  'Give small sips of ORS or water if conscious',
  'Call 108 — do not leave them alone',
  'Fan and monitor until help arrives',
];

// ── Minimal SVG icons ────────────────────────────────────────────────────────
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

const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor">
    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
  </svg>
);

// ── Side heat wave decorations ───────────────────────────────────────────────
const hwStripes = [
  { pos: 8,  delay: '0s',    h: 110, dur: '2.6s' },
  { pos: 20, delay: '0.7s',  h: 90,  dur: '2.2s' },
  { pos: 32, delay: '1.4s',  h: 130, dur: '3.0s' },
  { pos: 44, delay: '0.3s',  h: 80,  dur: '2.4s' },
  { pos: 56, delay: '1.1s',  h: 100, dur: '2.8s' },
  { pos: 68, delay: '1.8s',  h: 70,  dur: '2.0s' },
];
const hwGlows = [
  { pos: 5,  delay: '0.5s', h: 150, dur: '3.4s' },
  { pos: 28, delay: '1.3s', h: 120, dur: '3.0s' },
  { pos: 52, delay: '0.9s', h: 170, dur: '3.8s' },
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

// ── Loading spinner ──────────────────────────────────────────────────────────
const Spinner = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center gap-3 py-10">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 border-[3px] border-orange-100 rounded-full" />
      <div className="absolute inset-0 border-[3px] border-t-orange-500 rounded-full animate-spin" />
    </div>
    <p className="text-sm text-gray-400 font-medium">{label}</p>
  </div>
);

// ── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ message }) => (
  <div className="py-10 text-center">
    <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-3">
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className="text-orange-300">
        <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2H2V6zm0 4h16v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6z" />
      </svg>
    </div>
    <p className="text-sm text-gray-400">{message}</p>
  </div>
);

// ── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-3 mb-5">
    <div>
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    Pending:  'bg-amber-50  text-amber-800  border-amber-200',
    Verified: 'bg-blue-50   text-blue-700   border-blue-200',
    Resolved: 'bg-green-50  text-green-700  border-green-200',
  };
  const labels = { Pending: 'Pending', Verified: 'Verified', Resolved: 'Resolved' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {labels[status] || status}
    </span>
  );
};

// ── Risk dot indicator ────────────────────────────────────────────────────────
const RiskDot = ({ level }) => {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.Low;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.dot }} />
      <span className="text-xs font-semibold" style={{ color: cfg.textColor }}>{level}</span>
    </span>
  );
};

// ── Metric tile ───────────────────────────────────────────────────────────────
const MetricTile = ({ label, value, sub }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4">
    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">{label}</p>
    <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
    {sub && <p className="text-[11px] text-gray-400 mt-1.5">{sub}</p>}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
//  ManagerDashboard
// ══════════════════════════════════════════════════════════════════════════════
function ManagerDashboard() {
  const [user,        setUser]        = useState(null);
  const [heatData,    setHeatData]    = useState(null);
  const [heatLoading, setHeatLoading] = useState(true);
  const [centers,     setCenters]     = useState([]);
  const [hotspots,    setHotspots]    = useState([]);
  const [userCoords,  setUserCoords]  = useState(null);
  const [checkedItems, setCheckedItems] = useState({});

  const navigate = useNavigate();

  // ── Auth + role guard ─────────────────────────────────────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token      = localStorage.getItem('token');
    if (!token || !storedUser) { navigate('/login'); return; }

    const parsed = JSON.parse(storedUser);
    if (parsed.role === 'admin')   { navigate('/admin');     return; }
    if (parsed.role === 'worker')  { navigate('/dashboard'); return; }
    if (parsed.role !== 'manager') { navigate('/login');     return; }

    setUser(parsed);
    const city = parsed.location || 'Ahmedabad';
    fetchHeatData(city);
    fetchCoolingCenters(city);
    fetchHotspots(city);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { const fb = getCityCoordinates(city); setUserCoords({ lat: fb.lat, lng: fb.lng }); },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    } else {
      const fb = getCityCoordinates(city);
      setUserCoords({ lat: fb.lat, lng: fb.lng });
    }
  }, [navigate]);

  // ── Data fetchers ─────────────────────────────────────────────────────────
  const fetchHeatData = async (city) => {
    try {
      const r = await API.get(`/alerts?city=${encodeURIComponent(city)}`);
      setHeatData(r.data);
    } catch { setHeatData(null); }
    finally { setHeatLoading(false); }
  };
  const fetchCoolingCenters = async (city) => {
    try { const r = await API.get(`/cooling-centers?city=${encodeURIComponent(city)}`); setCenters(r.data); }
    catch { setCenters([]); }
  };
  const fetchHotspots = async (city) => {
    try { const r = await API.get(`/hotspots?city=${encodeURIComponent(city)}`); setHotspots(r.data); }
    catch { setHotspots([]); }
  };

  // ── Sorted centers ────────────────────────────────────────────────────────
  const sortedCenters = useMemo(() => {
    if (!centers.length) return [];
    if (!userCoords) return centers.map(c => ({ ...c, distanceKm: null }));
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

  const toggleCheck   = (id) => setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  const checkedCount  = Object.values(checkedItems).filter(Boolean).length;
  const allChecked    = checkedCount === CHECKLIST_ITEMS.length;
  const pendingCount  = hotspots.filter(h => h.status === 'Pending').length;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner label="Loading manager panel…" />
    </div>
  );

  const city     = user.location || 'Ahmedabad';
  const riskLevel = heatData?.riskLevel || 'Low';
  const riskCfg  = RISK_CONFIG[riskLevel] || RISK_CONFIG.Low;

  return (
    <div className="min-h-screen" style={{ position: 'relative', overflow: 'hidden' }}>
      <SideHeatWaves side="left" />
      <SideHeatWaves side="right" />

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 bg-white border-b border-gray-100"
        style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}>
              <SunIcon size={16} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-gray-900 tracking-tight">Chhaya</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Manager
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}>
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors duration-150"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6" style={{ position: 'relative', zIndex: 1 }}>

        {/* ══ Section 1: Welcome header ══════════════════════════════════════ */}
        <div className="chhaya-card p-5 sm:p-6 mb-5 dash-slide-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Manager Dashboard</p>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Hello, <span style={{ color: '#e06010' }}>{user.name}</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Monitor heat conditions, plan safe shifts, and protect your outdoor team.
              </p>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100">
                <span className="text-orange-500"><MapPinIcon /></span>
                <span className="text-xs font-semibold text-orange-700">{city}</span>
              </div>
              {heatData && !heatLoading && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
                  style={{ background: riskCfg.badgeBg, borderColor: riskCfg.border }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: riskCfg.dot }} />
                  <span className="text-xs font-semibold" style={{ color: riskCfg.badgeText }}>
                    {riskLevel} Risk Today
                  </span>
                </div>
              )}
              {pendingCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                  <AlertIcon />
                  <span className="text-xs font-semibold">{pendingCount} Pending</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ Section 2: Live Heat Risk ════════════════════════════════════════ */}
        <div className="chhaya-card p-5 sm:p-6 mb-5 dash-fade-up delay-100">
          <SectionHeader
            title="Live Heat Risk"
            subtitle={`Current conditions for ${city}`}
          />

          {heatLoading ? (
            <Spinner label="Fetching weather data…" />
          ) : heatData ? (
            <div>
              {/* Risk summary bar */}
              <div
                className="rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3"
                style={{ background: riskCfg.bg, border: `1px solid ${riskCfg.border}` }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: riskCfg.dot }} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Risk Level</p>
                    <p className="text-lg font-bold leading-tight" style={{ color: riskCfg.textColor }}>
                      {riskLevel}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 sm:max-w-xs leading-relaxed">{heatData.advice}</p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <MetricTile label="Temperature" value={`${heatData.temperature}°C`} sub="Ambient shade" />
                <MetricTile label="Humidity"    value={`${heatData.humidity}%`}     sub="Relative" />
                <MetricTile label="Heat Index"  value={`${heatData.heatIndex}°C`}   sub="Feels like" />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-gray-50 py-8 text-center">
              <p className="text-sm text-gray-400">Weather data unavailable. Check your connection.</p>
            </div>
          )}
        </div>

        {/* ══ Section 3 + 4: Shift Planner & Safety Checklist (side by side) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

          {/* Safe Work Hours */}
          <div className="chhaya-card p-5 sm:p-6 dash-fade-up delay-150">
            <SectionHeader
              title="Safe Work Hours"
              subtitle="Recommended shift windows for outdoor teams"
            />
            <SafeShiftPlanner city={city} />
          </div>

          {/* Manager Safety Checklist */}
          <div className="chhaya-card p-5 sm:p-6 dash-fade-up delay-200">
            <SectionHeader
              title="Safety Checklist"
              subtitle={`${checkedCount} of ${CHECKLIST_ITEMS.length} completed`}
              action={
                allChecked ? (
                  <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                    All done
                  </span>
                ) : null
              }
            />

            {/* Progress bar */}
            <div className="mb-4">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(checkedCount / CHECKLIST_ITEMS.length) * 100}%`,
                    background: allChecked ? '#16a34a' : 'linear-gradient(90deg,#e06010,#c97d08)',
                  }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                {Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100)}% complete
              </p>
            </div>

            {/* Items */}
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map(item => {
                const done = checkedItems[item.id];
                return (
                  <button
                    key={item.id}
                    id={`checklist-${item.id}`}
                    type="button"
                    onClick={() => toggleCheck(item.id)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer"
                    style={done
                      ? { background: '#f0fdf4', borderColor: '#bbf7d0' }
                      : { background: '#fafafa',  borderColor: '#f3f4f6' }
                    }
                  >
                    {/* Checkbox */}
                    <div
                      className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150"
                      style={done
                        ? { background: '#16a34a', borderColor: '#16a34a' }
                        : { background: 'white', borderColor: '#d1d5db' }
                      }
                    >
                      {done && <CheckIcon />}
                    </div>
                    <span
                      className="text-sm leading-snug"
                      style={{
                        color: done ? '#15803d' : '#374151',
                        textDecoration: done ? 'line-through' : 'none',
                        opacity: done ? 0.8 : 1,
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {allChecked && (
              <div className="mt-4 p-3 rounded-xl text-center bg-green-50 border border-green-200">
                <p className="text-sm font-semibold text-green-700">All safety checks complete for today.</p>
              </div>
            )}
          </div>
        </div>

        {/* ══ Section 5: Area Hotspots ════════════════════════════════════════ */}
        <div className="chhaya-card p-5 sm:p-6 mb-5 dash-fade-up delay-200">
          <SectionHeader
            title="Area Hotspots"
            subtitle={`Heat-risk locations reported in ${city}`}
            action={
              pendingCount > 0 ? (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg shrink-0">
                  <AlertIcon />
                  {pendingCount} unresolved
                </span>
              ) : null
            }
          />

          {hotspots.length === 0 ? (
            <EmptyState message={`No hotspots reported in ${city} yet.`} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {hotspots.map((spot) => {
                const statusColor = {
                  Pending:  '#ca8a04',
                  Verified: '#2563eb',
                  Resolved: '#16a34a',
                }[spot.status] || '#9ca3af';

                return (
                  <div
                    key={spot._id}
                    className="relative border border-gray-100 rounded-xl p-4 hover:border-orange-100 hover:bg-orange-50/20 transition-all duration-150"
                  >
                    {/* Left status stripe */}
                    <div
                      className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full"
                      style={{ background: statusColor }}
                    />

                    <div className="pl-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 leading-snug">{spot.location}</h4>
                        <StatusBadge status={spot.status} />
                      </div>

                      <p className="text-xs text-gray-400 mb-1">{spot.city}</p>

                      {spot.description && (
                        <p className="text-xs text-gray-500 mb-2 italic leading-relaxed">"{spot.description}"</p>
                      )}

                      <p className="text-[11px] text-gray-400">
                        Reported by{' '}
                        <span className="font-medium text-gray-600">{spot.reportedBy?.name || 'Worker'}</span>
                        {' · '}
                        {new Date(spot.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
            Status changes are managed by your Admin. Use this view to plan around affected areas.
          </p>
        </div>

        {/* ══ Section 6: Cooling Centers + Map ════════════════════════════════ */}
        <div className="chhaya-card p-5 sm:p-6 mb-5 dash-fade-up delay-250">
          <SectionHeader
            title="Cooling Centers"
            subtitle={`Safe shelters available for your team in ${city}`}
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Map */}
            <div className="lg:col-span-3 rounded-xl overflow-hidden border border-gray-100" style={{ minHeight: 280 }}>
              <MapView centers={sortedCenters} city={city} userCoords={userCoords} />
            </div>

            {/* List */}
            <div className="lg:col-span-2 flex flex-col gap-2 max-h-80 overflow-y-auto pr-0.5">
              {sortedCenters.length === 0 ? (
                <EmptyState message={`No cooling centers in ${city} yet.`} />
              ) : sortedCenters.map((c, i) => (
                <div
                  key={c._id || i}
                  className="p-3.5 rounded-xl border border-gray-100 hover:border-orange-100 hover:bg-orange-50/20 transition-colors duration-150"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-800 leading-snug">{c.name}</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 shrink-0 whitespace-nowrap">
                      {c.type}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 truncate mb-1">{c.address}</p>
                  {c.facilities && (
                    <p className="text-[11px] text-gray-400 mb-2">{c.facilities}</p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    {c.distanceKm != null && (
                      <span className="text-[11px] font-semibold text-green-700">
                        {c.distanceKm} km away
                      </span>
                    )}
                    {(c.latitude != null && c.longitude != null) && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Directions <ExternalLinkIcon />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ Section 7: Emergency Quick Actions ══════════════════════════════ */}
        <div className="chhaya-card p-5 sm:p-6 mb-5 dash-fade-up delay-300">
          <SectionHeader
            title="Emergency Actions"
            subtitle="Use immediately if a worker shows heat stroke signs"
          />

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <a
              href="tel:108"
              id="mgr-call-108"
              className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl text-white transition-all duration-150 active:scale-[0.98]"
              style={{ background: '#dc2626' }}
            >
              <span className="text-2xl">🚑</span>
              <span className="text-sm font-bold">Call 108</span>
              <span className="text-[11px] text-red-200">National Ambulance</span>
            </a>

            <a
              href="tel:18001801104"
              id="mgr-heat-helpline"
              className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-orange-200 bg-orange-50 transition-all duration-150 active:scale-[0.98] hover:bg-orange-100"
            >
              <span className="text-2xl">📞</span>
              <span className="text-sm font-bold text-orange-700">Heat Helpline</span>
              <span className="text-[11px] text-orange-500">1800-180-1104</span>
            </a>

            <Link
              to="/first-aid"
              id="mgr-first-aid"
              className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-green-200 bg-green-50 transition-all duration-150 active:scale-[0.98] hover:bg-green-100"
            >
              <span className="text-2xl">🩺</span>
              <span className="text-sm font-bold text-green-700">First Aid Guide</span>
              <span className="text-[11px] text-green-600">Heat stroke steps</span>
            </Link>
          </div>

          {/* Heat stroke protocol */}
          <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
            <p className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-3">
              If a worker collapses or shows confusion
            </p>
            <ol className="space-y-2">
              {HEAT_STROKE_STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-snug">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                    style={{ background: '#e06010' }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400 pb-4">
          Chhaya · Manager Dashboard · Data refreshes on each page load
        </p>
      </div>
    </div>
  );
}

export default ManagerDashboard;
