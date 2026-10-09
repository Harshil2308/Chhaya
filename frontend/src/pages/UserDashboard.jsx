import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';
import PersonalizedRiskCard from '../components/PersonalizedRiskCard';
import SafeShiftPlanner from '../components/SafeShiftPlanner';
import { calculateHaversineDistance } from '../utils/geoDistance';
import { useLanguage } from '../context/LanguageContext';

const RISK_CONFIG = {
  Low: { bg: '#f0fdf4', border: '#86efac', textColor: '#15803d', badgeBg: '#dcfce7', badgeText: '#166534', dot: '#16a34a', barColor: '#22c55e' },
  Moderate: { bg: '#fefce8', border: '#fde68a', textColor: '#854d0e', badgeBg: '#fef9c3', badgeText: '#713f12', dot: '#eab308', barColor: '#eab308' },
  High: { bg: '#fff7ed', border: '#fdba74', textColor: '#c2410c', badgeBg: '#ffedd5', badgeText: '#9a3412', dot: '#e06010', barColor: '#e06010' },
  'Very High': { bg: '#fff1f2', border: '#fca5a5', textColor: '#b91c1c', badgeBg: '#fee2e2', badgeText: '#991b1b', dot: '#dc2626', barColor: '#dc2626' },
  Extreme: { bg: '#fff1f2', border: '#f87171', textColor: '#991b1b', badgeBg: '#fecaca', badgeText: '#7f1d1d', dot: '#dc2626', barColor: '#dc2626' },
};

const RISK_BAR_PCT = { Low: '20%', Moderate: '45%', High: '65%', 'Very High': '82%', Extreme: '100%' };

const JOB_LABELS = {
  construction: 'Construction Worker',
  farmer: 'Farmer',
  delivery: 'Delivery Person',
  vendor: 'Street Vendor',
  other: 'Outdoor Worker'
};

const SAFETY_TIPS = [
  { icon: '💧', tip: 'Drink water every 20–30 minutes before feeling thirsty' },
  { icon: '🌿', tip: 'Take 5–10 min rest in shade each hour' },
  { icon: '⏰', tip: 'Perform heaviest tasks before 11 AM or after 4 PM' },
  { icon: '👕', tip: 'Wear light-colored cotton clothes & cover your head' },
  { icon: '🩺', tip: 'Watch for dizziness, headache, vomiting, no sweating' },
  { icon: '🧂', tip: 'Mix ORS or lemon-salt in your water bottle' },
];

// SOSModal + Dashboard now consume translations via useLanguage.
// SOSModal receives tr + lang as props to avoid hook rules issues inside conditional render.
function SOSModal({ user, onClose, userCoords, tr }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [mapsLink, setMapsLink] = useState('');
  // Allow user to type a number manually if no contact is saved
  const [manualPhone, setManualPhone] = useState('');

  useEffect(() => {
    if (userCoords) {
      setMapsLink(`https://maps.google.com/?q=${userCoords.lat},${userCoords.lng}`);
      setLocationText(`${userCoords.lat.toFixed(5)}, ${userCoords.lng.toFixed(5)}`);
    } else {
      setLocationText(user?.location || 'Location unavailable');
      setMapsLink('');
    }
  }, [userCoords, user]);

  const savedPhone = user?.emergencyContactPhone;
  const savedName  = user?.emergencyContactName || 'Emergency Contact';

  // Use saved contact if available, otherwise use manually typed number
  const activePhone = savedPhone || manualPhone.trim();

  const buildWhatsAppMessage = () => {
    const loc = mapsLink
      ? `My GPS location: ${mapsLink}`
      : `My registered city: ${user?.location || 'unknown'}`;
    return encodeURIComponent(
      `🚨 HEAT EMERGENCY — Chhaya Heat Safety App\n\n` +
      `👤 Worker: ${user?.name || 'Unknown'}\n` +
      `🛠️ Job: ${JOB_LABELS[user?.occupation] || 'Outdoor Worker'}\n` +
      `📍 ${loc}\n\n` +
      `⚠️ I am in heat distress. Please send help or call 108 (ambulance) immediately.\n\n` +
      `First Aid: https://www.mohfw.gov.in/heatwave.html`
    );
  };

  // Use window.open for tel: so desktop OS picks it up; pure href on mobile
  const callNumber = (num) => {
    window.open(`tel:${num}`, '_self');
  };

  const handleWhatsApp = () => {
    if (!activePhone) return;
    setSending(true);
    const digits = activePhone.replace(/\D/g, '');
    const url = `https://wa.me/91${digits}?text=${buildWhatsAppMessage()}`;
    setTimeout(() => {
      setSending(false);
      setSent(true);
      window.open(url, '_blank');
    }, 500);
  };

  return (
      <div
        id="sos-modal-overlay"
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: '#fff', border: '3px solid #dc2626', maxHeight: '95vh', overflowY: 'auto' }}
        >
          {/* Header */}
          <div className="p-5 text-center" style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}>
            <div className="text-4xl mb-2">🚨</div>
            <h2 className="text-xl font-extrabold text-white">{tr('sos.title')}</h2>
            <p className="text-red-100 text-xs mt-1">{tr('sos.subtitle')}</p>
          </div>

          <div className="p-5 space-y-4">

            {/* Location Info */}
            <div className="rounded-2xl p-3.5" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">{tr('sos.yourLocation')}</p>
              <p className="text-sm font-semibold text-green-900">
                {mapsLink ? `${tr('sos.gps')}: ${locationText}` : `${tr('sos.city')}: ${locationText}`}
              </p>
              {mapsLink && (
                <a href={mapsLink} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-green-700 underline mt-0.5 block">
                  {tr('sos.openMaps')}
                </a>
              )}
            </div>

            {/* Emergency Contact — show saved or manual input */}
            {savedPhone ? (
              <div className="rounded-2xl p-3.5" style={{ background: '#fff7ed', border: '1px solid #fdba74' }}>
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">{tr('sos.savedContact')}</p>
                <p className="text-sm font-extrabold text-gray-900">{savedName}</p>
                <p className="text-sm text-gray-600">{savedPhone}</p>
              </div>
            ) : (
              <div className="rounded-2xl p-3.5" style={{ background: '#fef9c3', border: '1px solid #fde68a' }}>
                <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-2">
                  {tr('sos.enterContactLabel')}
                </p>
                <input
                  id="sos-manual-phone-input"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder={tr('sos.contactPlaceholder')}
                  className="chhaya-input text-sm"
                  style={{ background: '#ffffff' }}
                />
                <p className="text-[11px] text-yellow-600 mt-1">{tr('sos.enterContactHint')}</p>
              </div>
            )}

            {/* Sent confirmation */}
            {sent && (
              <div className="rounded-2xl p-3 text-center" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
                <span className="text-2xl">✅</span>
                <p className="text-sm font-bold text-green-800 mt-1">{tr('sos.whatsappOpened')}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5">

              {/* ── Call 108 — primary CTA ── */}
              <button
                id="sos-call-108"
                type="button"
                onClick={() => callNumber('108')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-white text-sm transition-all cursor-pointer border-0"
                style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 4px 16px rgba(220,38,38,0.4)' }}
              >
                <span className="text-lg">🚑</span>
                <span>{tr('sos.call108')}</span>
              </button>

              {/* ── WhatsApp SOS — always active if phone available ── */}
              <button
                id="sos-whatsapp-btn"
                type="button"
                onClick={handleWhatsApp}
                disabled={!activePhone || activePhone.length < 10}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-white text-sm transition-all cursor-pointer border-0"
                style={
                  activePhone && activePhone.length >= 10
                    ? { background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 4px 16px rgba(22,163,74,0.35)' }
                    : { background: '#d1fae5', color: '#6b7280', cursor: 'not-allowed' }
                }
              >
                {sending ? (
                  <><div className="spinner" /><span>{tr('sos.openingWhatsApp')}</span></>
                ) : (
                  <><span className="text-lg">📲</span>
                  <span>
                    {activePhone && activePhone.length >= 10
                      ? `${tr('sos.sendSOS')} ${savedName || activePhone}`
                      : tr('sos.enterNumber')}
                  </span></>
                )}
              </button>

              {/* ── Heat Helpline ── */}
              <button
                id="sos-heat-helpline-btn"
                type="button"
                onClick={() => callNumber('18001801104')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl font-bold text-sm transition-all border cursor-pointer"
                style={{ background: '#fff7ed', color: '#c2410c', borderColor: '#fdba74' }}
              >
                <span className="text-lg">🌡️</span>
                <span>{tr('sos.heatHelpline')}</span>
              </button>

            </div>

            {/* Close */}
            <button
              id="sos-modal-close"
              onClick={onClose}
              className="w-full py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              {tr('sos.close')}
            </button>
          </div>
        </div>
      </div>
  );
}


// ── Main Dashboard ───────────────────────────────────────────────────────────
function UserDashboard() {
  const [user, setUser] = useState(null);
  const [heatData, setHeatData] = useState(null);
  const [centers, setCenters] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportData, setReportData] = useState({ location: '', city: '', description: '' });
  const [reportMessage, setReportMessage] = useState('');

  // Phase 1: Personalized risk widget state
  const [workType, setWorkType] = useState('Moderate');
  const [exposure, setExposure] = useState('Sun');

  // Phase 2: SOS
  const [showSOS, setShowSOS] = useState(false);

  // Geolocation
  const [userCoords, setUserCoords] = useState(null);

  const navigate = useNavigate();
  const { tr, lang, translations } = useLanguage();

  // Derive translated labels for this render
  const JOB_LABELS_T = translations.jobLabels || {};
  const SAFETY_TIPS_T = translations.safetyTips || [];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !storedUser) { navigate('/login'); return; }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    // Tell LanguageContext a user was loaded (re-syncs language from user.language)
    window.dispatchEvent(new Event('chhaya-user-loaded'));
    const city = parsedUser.location || 'Ahmedabad';
    const job = parsedUser.occupation || 'other';
    setReportData(prev => ({ ...prev, city }));
    fetchHeatData(city, job);
    fetchCoolingCenters(city);
    fetchHotspots(city);

    // Browser geolocation
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => { console.warn('Geolocation denied:', err.message); },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [navigate]);

  const fetchHeatData = async (city, job) => {
    try {
      const jobParam = job ? `&job=${encodeURIComponent(job)}` : '';
      const r = await API.get(`/alerts?city=${encodeURIComponent(city)}${jobParam}`);
      setHeatData(r.data);
    } catch {
      setHeatData(null);
    } finally {
      setLoading(false);
    }
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

  const sortedCenters = useMemo(() => {
    if (!centers || centers.length === 0) return [];
    if (!userCoords) return centers.map(c => ({ ...c, distanceKm: null }));
    const mapped = centers.map((center) => {
      let distanceKm = null;
      if (center.latitude != null && center.longitude != null && !isNaN(center.latitude) && !isNaN(center.longitude)) {
        distanceKm = calculateHaversineDistance(userCoords.lat, userCoords.lng, center.latitude, center.longitude);
      }
      return { ...center, distanceKm };
    });
    return mapped.sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      return 0;
    });
  }, [centers, userCoords]);

  const handleReportChange = e => setReportData({ ...reportData, [e.target.name]: e.target.value });
  const handleReportSubmit = async (e) => {
    e.preventDefault(); setReportMessage('');
    try {
      await API.post('/hotspots', reportData);
      setReportMessage('success');
      setReportData({ location: '', city: user?.location || 'Ahmedabad', description: '' });
      setShowReportForm(false);
      fetchHotspots(user?.location || 'Ahmedabad');
    } catch (err) { setReportMessage(err.response?.data?.message || 'Failed to report hotspot'); }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 border-4 border-orange-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin" />
        </div>
        <p className="text-sm font-semibold" style={{ color: '#e06010' }}>{tr('common.loadingDashboard')}</p>
      </div>
    </div>
  );

  const displayRiskLevel = heatData?.personalRiskLevel || heatData?.riskLevel || 'Low';
  const riskCfg = RISK_CONFIG[displayRiskLevel] || RISK_CONFIG['Low'];
  const riskBarPct = RISK_BAR_PCT[displayRiskLevel] || '20%';
  const cityRiskCfg = heatData ? (RISK_CONFIG[heatData.riskLevel] || RISK_CONFIG['Low']) : RISK_CONFIG['Low'];

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

  return (
    <div className="min-h-screen" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Side Heat Waves */}
      <SideHeatWaves side="left" />
      <SideHeatWaves side="right" />

      <Navbar user={user} />

      {/* SOS Modal */}
      {showSOS && (
        <SOSModal user={user} onClose={() => setShowSOS(false)} userCoords={userCoords} tr={tr} />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7" style={{ position: 'relative', zIndex: 1 }}>

        {/* ══ ROW 1: Welcome Banner + Quick Stats ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Welcome card */}
          <div className="lg:col-span-2 chhaya-card card-lift p-6 dash-slide-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="section-label">{tr('dashboard.outdoorWorkerSafety')}</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                  {tr('dashboard.hello')}, <span style={{ color: '#e06010' }}>{user.name}</span> 👋
                </h2>
                <p className="text-gray-500 text-sm mt-1.5">{tr('dashboard.tagline')}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="badge" style={{ background: '#ffedd5', color: '#9a3412', borderColor: '#fdba74' }}>
                    👤 {user.role}
                  </span>
                  <span className="badge" style={{ background: '#fef9c3', color: '#713f12', borderColor: '#fde68a' }}>
                    🛠️ {JOB_LABELS_T[user.occupation] || JOB_LABELS[user.occupation] || user.occupation || tr('jobLabels.other')}
                  </span>
                  {user.location && (
                    <span className="badge" style={{ background: '#fff7ed', color: '#c2410c', borderColor: '#fdba74' }}>
                      📍 {user.location}
                    </span>
                  )}
                </div>
              </div>

              {/* SOS Button */}
              <button
                id="sos-trigger-btn"
                onClick={() => setShowSOS(true)}
                className="flex flex-col items-center gap-1 px-6 py-4 rounded-2xl font-extrabold text-white transition-all duration-200 cursor-pointer shrink-0"
                style={{
                  background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                  boxShadow: '0 4px 20px rgba(220,38,38,0.45)',
                  animation: 'pulse-sos 2s ease-in-out infinite',
                }}
              >
                <span className="text-2xl">🆘</span>
                <span className="text-xs tracking-widest uppercase">SOS</span>
                <span className="text-[10px] font-medium text-red-100">Heat Emergency</span>
              </button>
            </div>
          </div>

          {/* Quick Stat */}
          <div className="chhaya-card card-lift p-6 flex flex-col justify-between dash-slide-right delay-100">
            <div>
              <p className="section-label">{tr('dashboard.coolingCenters')}</p>
              <p className="text-4xl font-extrabold stat-pop delay-300" style={{ color: '#e06010' }}>
                {centers.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">{tr('dashboard.availableIn')} {user.location || tr('dashboard.yourArea')}</p>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs font-semibold px-3 py-2 rounded-xl border w-fit"
              style={userCoords
                ? { background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }
                : { background: '#fef9c3', color: '#854d0e', borderColor: '#fde68a' }}>
              {userCoords ? tr('dashboard.gpsActive') : tr('dashboard.cityFallback')}
            </div>
          </div>
        </div>

        {/* ══ ROW 2: City Risk & Job Risk Cards ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

          {/* City Risk */}
          <div className="chhaya-card p-6 sm:p-7 card-lift dash-fade-up border border-orange-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🏙️</span>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-tight">{tr('dashboard.cityRisk')}</h3>
                    <p className="text-xs text-gray-400">{tr('dashboard.cityRiskSubtitle')}</p>
                  </div>
                </div>
                {heatData && (
                  <span className="badge" style={{ background: cityRiskCfg.badgeBg, color: cityRiskCfg.badgeText, borderColor: cityRiskCfg.border }}>
                    {heatData.city || user.location || 'City'}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="py-8 text-center text-gray-400 text-xs">{tr('dashboard.loadingWeather')}</div>
              ) : heatData ? (
                <>
                  <div className="flex items-baseline gap-3 my-3">
                    <span className="text-4xl sm:text-5xl font-extrabold leading-none" style={{ color: cityRiskCfg.textColor }}>
                      {tr(`riskLevel.${heatData.riskLevel}`) || heatData.riskLevel}
                    </span>
                    <span className="text-sm font-bold text-gray-600">({tr('dashboard.heatIndex')} {heatData.heatIndex}°C)</span>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-600 mb-4">{tr(`riskAdvice.${heatData.riskLevel}`) || heatData.advice}</p>
                  <div className="flex flex-wrap gap-2.5 pt-3 border-t border-gray-100">
                    <div className="bg-gray-50 rounded-xl px-3 py-1.5 text-xs border border-gray-200">
                      <span className="text-gray-400 mr-1.5">{tr('dashboard.temp')}:</span>
                      <strong className="text-gray-800">{heatData.temperature}°C</strong>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-1.5 text-xs border border-gray-200">
                      <span className="text-gray-400 mr-1.5">{tr('dashboard.humidity')}:</span>
                      <strong className="text-gray-800">{heatData.humidity}%</strong>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-1.5 text-xs border border-gray-200">
                      <span className="text-gray-400 mr-1.5">{tr('dashboard.baseHI')}:</span>
                      <strong className="text-gray-800">{heatData.heatIndex}°C</strong>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400 py-4">{tr('dashboard.noWeatherData')}</p>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-4 italic">
              Standard meteorological heat index in shaded ambient conditions.
            </p>
          </div>

          {/* Your Risk (Job-Adjusted) */}
          <div
            className="rounded-3xl p-6 sm:p-7 border-2 card-lift dash-fade-up delay-100 relative overflow-hidden flex flex-col justify-between"
            style={{ background: riskCfg.bg, borderColor: riskCfg.border, boxShadow: `0 6px 28px ${riskCfg.dot}20` }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">👷</span>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 leading-tight">{tr('dashboard.yourRisk')}</h3>
                    <p className="text-xs" style={{ color: riskCfg.textColor, opacity: 0.85 }}>
                      {tr('dashboard.personalizedFor')} {JOB_LABELS_T[user.occupation] || JOB_LABELS[user.occupation] || user.occupation || 'Your Job'}
                    </p>
                  </div>
                </div>
                {heatData?.jobPoints != null && (
                  <span className="badge" style={{ background: riskCfg.badgeBg, color: riskCfg.badgeText, borderColor: riskCfg.border }}>
                    {heatData.jobPoints > 0 ? `+${heatData.jobPoints}°C Work Load` : 'Baseline'}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="py-8 text-center text-gray-400 text-xs">{tr('dashboard.computingPersonal')}</div>
              ) : heatData ? (
                <>
                  <div className="flex items-baseline gap-3 my-3">
                    <span className="text-4xl sm:text-5xl font-extrabold leading-none" style={{ color: riskCfg.textColor }}>
                      {displayRiskLevel}
                    </span>
                    <span className="text-sm font-bold" style={{ color: riskCfg.textColor }}>
                      ({heatData.personalHeatIndex != null ? `${heatData.personalHeatIndex}°C Personal HI` : `${heatData.heatIndex}°C`})
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex justify-between text-[11px] mb-1 font-semibold opacity-75" style={{ color: riskCfg.textColor }}>
                      <span>Low</span><span>Moderate</span><span>High</span><span>Extreme</span>
                    </div>
                    <div className="h-2.5 bg-black/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: riskBarPct, background: riskCfg.barColor }} />
                    </div>
                  </div>
                  {heatData.reason && (
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2.5 my-2.5 border border-white/80 text-xs text-gray-800">
                      <span className="font-bold text-gray-900">{tr('dashboard.whyItChanged')} </span>
                      <span>{heatData.reason}</span>
                    </div>
                  )}
                  <div className="mt-2 text-xs leading-relaxed font-medium" style={{ color: riskCfg.textColor }}>
                    <span className="font-bold uppercase tracking-wide block mb-1">{tr('dashboard.practicalShiftGuidance')}</span>
                    <span>{heatData.personalAdvice || heatData.advice}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400 py-4">{tr('dashboard.noPersonalData')}</p>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between text-[11px] text-gray-500">
              <span>⚠️ {tr('common.guidanceDisclaimer')}</span>
              <span className="font-medium text-gray-600">{tr('common.workSafer')}</span>
            </div>
          </div>
        </div>

        {/* ══ ROW 3: Personalized Thermal Stress Card (Phase 1 — WorkType + Exposure) ══ */}
        {heatData && (
          <PersonalizedRiskCard
            baseHeatData={heatData}
            workType={workType}
            setWorkType={setWorkType}
            exposure={exposure}
            setExposure={setExposure}
          />
        )}

        {/* ══ ROW 4: Safe Shift Planner (Phase 3 — Live Forecast) ══ */}
        <SafeShiftPlanner city={user.location || 'Ahmedabad'} />

        {/* ══ ROW 5: Quick Action Row — First Aid + Emergency Contacts ══ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* First Aid link */}
          <button
            id="first-aid-link-btn"
            onClick={() => navigate('/first-aid')}
            className="rounded-3xl p-5 card-lift dash-fade-up flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 border-2"
            style={{ background: 'linear-gradient(135deg,#fef2f2,#ffe4e6)', borderColor: '#fca5a5' }}
          >
            <span className="text-3xl">🏥</span>
            <p className="font-extrabold text-red-800 text-sm">{tr('quickActions.firstAid')}</p>
            <p className="text-xs text-red-500">{tr('quickActions.firstAidSub')}</p>
          </button>

          {/* Call 108 */}
          <a
            id="call-108-btn"
            href="tel:108"
            className="rounded-3xl p-5 card-lift dash-fade-up flex flex-col items-center gap-2 transition-all duration-200 border-2 text-center"
            style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderColor: '#93c5fd' }}
          >
            <span className="text-3xl">🚑</span>
            <p className="font-extrabold text-blue-800 text-sm">{tr('quickActions.call108')}</p>
            <p className="text-xs text-blue-500">{tr('quickActions.call108Sub')}</p>
          </a>

          {/* Heat Helpline */}
          <a
            id="heat-helpline-btn"
            href="tel:18001801104"
            className="rounded-3xl p-5 card-lift dash-fade-up flex flex-col items-center gap-2 transition-all duration-200 border-2 text-center"
            style={{ background: 'linear-gradient(135deg,#fff7ed,#ffedd5)', borderColor: '#fdba74' }}
          >
            <span className="text-3xl">🌡️</span>
            <p className="font-extrabold text-orange-800 text-sm">{tr('quickActions.heatHelpline')}</p>
            <p className="text-xs text-orange-500">{tr('quickActions.heatHelplineSub')}</p>
          </a>
        </div>

        {/* ══ ROW 6: Hotspot Report Button & Form ══ */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500">
              Reported Hotspots Nearby: <strong className="text-red-500">{hotspots.length}</strong>
            </span>
          </div>
          <button
            id="report-hotspot-btn"
            onClick={() => setShowReportForm(v => !v)}
            className="text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200 border cursor-pointer"
            style={!showReportForm
              ? { background: 'linear-gradient(135deg,#e06010,#c97d08)', color: '#fff', borderColor: 'transparent' }
              : { background: '#f9fafb', color: '#4b5563', borderColor: '#e5e7eb' }}
          >
            {showReportForm ? tr('dashboard.cancelReport') : tr('dashboard.reportHotspot')}
          </button>
        </div>

        {showReportForm && (
          <div className="chhaya-card p-6 sm:p-7 mb-5 dash-fade-up border-l-4" style={{ borderLeftColor: '#e06010' }}>
            <h3 className="text-base font-bold text-gray-900 mb-4">{tr('hotspot.reportTitle')}</h3>
            {reportMessage && (
              <div className={`alert mb-4 ${reportMessage === 'success' ? 'alert-success' : 'alert-error'}`}>
                {reportMessage === 'success' ? tr('hotspot.successMsg') : `⚠️ ${reportMessage}`}
              </div>
            )}
            <form onSubmit={handleReportSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{tr('hotspot.areaLabel')}</label>
                <input type="text" name="location" value={reportData.location} onChange={handleReportChange}
                  required placeholder={tr('hotspot.areaPlaceholder')} className="chhaya-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{tr('hotspot.cityLabel')}</label>
                <input type="text" name="city" value={reportData.city} onChange={handleReportChange}
                  required placeholder={tr('hotspot.cityPlaceholder')} className="chhaya-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{tr('hotspot.descLabel')}</label>
                <textarea name="description" value={reportData.description} onChange={handleReportChange}
                  rows="2" placeholder={tr('hotspot.descPlaceholder')}
                  className="chhaya-input resize-none" />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="px-6 py-2.5 rounded-xl text-white font-bold text-sm bg-red-500 hover:bg-red-600 transition-colors border-0 cursor-pointer">
                  {tr('hotspot.submitBtn')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══ ROW 7: Hotspots + Practical Safety Tips ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Recent Hotspots */}
          <div className="chhaya-card card-lift p-6 dash-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">🔴 Recent Hotspot Reports</h3>
              <span className="badge badge-pending">{hotspots.length} reports</span>
            </div>
            {hotspots.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl">📭</span>
                <p className="text-gray-400 text-sm mt-2">No reports in your area yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {hotspots.slice(0, 5).map((spot) => (
                  <div key={spot._id}
                    className="flex justify-between items-center rounded-2xl p-3.5 border transition-all duration-200 hover:shadow-sm"
                    style={{ background: '#fff5f5', borderColor: '#fecaca' }}>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">📍 {spot.location}</p>
                      <p className="text-xs text-gray-400">{spot.city}</p>
                    </div>
                    <span className={`badge ${spot.status === 'Pending' ? 'badge-pending' : spot.status === 'Verified' ? 'badge-verified' : 'badge-resolved'}`}>
                      {spot.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Practical Safety Tips */}
          <div className="rounded-3xl p-6 card-lift dash-fade-up border border-blue-100"
            style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)', boxShadow: '0 4px 18px #2563eb12' }}>
            <h3 className="font-bold text-blue-900 mb-4">🛡️ Practical Worker Heat Safety</h3>
            <ul className="space-y-2.5">
              {SAFETY_TIPS_T.map((item, i) => (
                <li key={i}
                  className="flex items-center gap-3 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm text-blue-900 font-medium backdrop-blur-sm">
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <span>{item.tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ══ ROW 8: Nearest Cooling Centers & Map (Phase 4) ══ */}
        <div className="chhaya-card card-lift p-6 sm:p-7 mb-5 dash-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-lg">🌳 Nearest Cooling Centers</h3>
                <span className="badge badge-resolved">{sortedCenters.length} available</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {userCoords
                  ? '📍 Real distances calculated via browser geolocation (sorted nearest first).'
                  : '📍 Geolocation off or denied. Showing registered centers for your city.'}
              </p>
            </div>
            {userCoords && (
              <span className="badge" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                📍 GPS Active
              </span>
            )}
          </div>

          {sortedCenters.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">🏢</span>
              <p className="text-gray-400 text-sm mt-3">No cooling centers found for your city yet.</p>
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-2xl overflow-hidden border border-orange-100 shadow-sm">
                <MapView centers={sortedCenters} city={user.location} userCoords={userCoords} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sortedCenters.map((center, i) => {
                  const hasExactCoords = center.latitude != null && center.longitude != null &&
                    !isNaN(center.latitude) && !isNaN(center.longitude);
                  const destParam = hasExactCoords
                    ? `${center.latitude},${center.longitude}`
                    : encodeURIComponent(`${center.name}, ${center.address}, ${center.city}`);
                  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destParam}`;

                  return (
                    <div key={center._id || i}
                      className="border border-gray-100 rounded-2xl p-4 hover:bg-orange-50/60 hover:border-orange-200 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-bold text-gray-800 text-sm">{center.name}</h4>
                          <span className="shrink-0 badge badge-resolved text-[10px]">{center.city}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{center.address}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{center.type} · {center.facilities}</p>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
                        {center.distanceKm != null ? (
                          <span className="text-xs font-extrabold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                            📍 {center.distanceKm} km away
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">{center.type}</span>
                        )}
                        <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline">
                          <span>🧭 Get Directions</span>
                          <span>→</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default UserDashboard;
