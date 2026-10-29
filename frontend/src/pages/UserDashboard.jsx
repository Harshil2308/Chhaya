import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';
import PersonalizedRiskCard from '../components/PersonalizedRiskCard';
import SafeShiftPlanner from '../components/SafeShiftPlanner';
import { calculateHaversineDistance, getCityCoordinates } from '../utils/geoDistance';
import { useLanguage } from '../context/LanguageContext';
import HeatHelper from '../components/HeatHelper';
import ListenButton from '../components/ListenButton';

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
function SOSModal({ user, onClose, userCoords, tr, JOB_LABELS_T }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [mapsLink, setMapsLink] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [gpsStatus, setGpsStatus] = useState('idle');

  // Fallback coordinates helper based on city
  const getCityFallbackCoords = () => getCityCoordinates(user?.location);

  // Synchronise location: always ensure a valid Google Maps link exists
  useEffect(() => {
    if (
      userCoords &&
      typeof userCoords.lat === 'number' &&
      typeof userCoords.lng === 'number' &&
      !isNaN(userCoords.lat) &&
      !isNaN(userCoords.lng)
    ) {
      setMapsLink(`https://maps.google.com/?q=${userCoords.lat},${userCoords.lng}`);
      setLocationText(`${userCoords.lat.toFixed(5)}, ${userCoords.lng.toFixed(5)}`);
    } else {
      const fallback = getCityFallbackCoords();
      setMapsLink(`https://maps.google.com/?q=${fallback.lat},${fallback.lng}`);
      setLocationText(`${user?.location || 'Live Location'} (${fallback.lat.toFixed(4)}, ${fallback.lng.toFixed(4)})`);
    }
  }, [userCoords, user]);

  const savedPhone = user?.emergencyContactPhone;
  const savedName = user?.emergencyContactName || tr('sos.savedContact');

  // Extract clean 10-digit Indian phone number
  const get10DigitPhone = (raw) => {
    if (!raw) return '';
    let digits = raw.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    return digits.slice(0, 10);
  };

  const rawActivePhone = (savedPhone || manualPhone || '').trim();
  const normalizedPhone = get10DigitPhone(rawActivePhone);
  const isPhoneValid = normalizedPhone.length === 10;

  // Build formatted WhatsApp message with guaranteed Google Maps live location link
  const buildWhatsAppMessage = (resolvedLink) => {
    const jobName =
      JOB_LABELS_T?.[user?.occupation] ||
      JOB_LABELS[user?.occupation] ||
      tr('jobLabels.other') ||
      'Outdoor Worker';
    const headline = tr('sos.messageHeadline') || '🚨 HEAT EMERGENCY — Chhaya Heat Safety App';
    const distress =
      tr('sos.distressWarning') ||
      '⚠️ I am in heat distress. Please send help or call 108 (ambulance) immediately.';
    const workerLabel = tr('sos.workerLabel') || '👤 Worker';
    const jobLabel = tr('sos.jobLabel') || '🛠️ Job';

    // Live location link is always included
    const locationLine = `📍 My location: ${resolvedLink}`;

    const lines = [
      `${headline}`,
      'I need help. Heat emergency.',
      '',
      `${workerLabel}: ${user?.name || 'Unknown'}`,
      `${jobLabel}: ${jobName}`,
      locationLine,
      '',
      distress,
      '',
      'First Aid: https://www.mohfw.gov.in/heatwave.html'
    ];

    return encodeURIComponent(lines.join('\n'));
  };

  const callNumber = (num) => {
    window.open(`tel:${num}`, '_self');
  };

  // Handle WhatsApp SOS with multi-tier reliable location acquisition
  const handleWhatsApp = async () => {
    if (!isPhoneValid || sending) return;

    setSending(true);
    setSent(false);
    setGpsStatus('locating');

    // Acquire best possible live coordinates
    const acquireLiveCoordinates = async () => {
      // 1. Try browser live GPS (with fast fallback to standard accuracy)
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        try {
          const pos = await new Promise((resolve, reject) => {
            let settled = false;
            const timer = setTimeout(() => {
              if (!settled) {
                settled = true;
                reject(new Error('GPS timeout'));
              }
            }, 5000);

            navigator.geolocation.getCurrentPosition(
              (p) => {
                if (!settled) {
                  settled = true;
                  clearTimeout(timer);
                  resolve(p);
                }
              },
              () => {
                // Low accuracy/network fallback (succeeds via WiFi on laptops without GPS hardware)
                navigator.geolocation.getCurrentPosition(
                  (p2) => {
                    if (!settled) {
                      settled = true;
                      clearTimeout(timer);
                      resolve(p2);
                    }
                  },
                  (err2) => {
                    if (!settled) {
                      settled = true;
                      clearTimeout(timer);
                      reject(err2);
                    }
                  },
                  { enableHighAccuracy: false, timeout: 3500, maximumAge: 300000 }
                );
              },
              { enableHighAccuracy: true, timeout: 3000, maximumAge: 60000 }
            );
          });

          const lat = pos?.coords?.latitude;
          const lng = pos?.coords?.longitude;
          if (typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng)) {
            return { lat, lng };
          }
        } catch (e) {
          console.warn('Live browser GPS unavailable:', e?.message || e);
        }
      }

      // 2. Check existing userCoords from dashboard
      if (
        userCoords &&
        typeof userCoords.lat === 'number' &&
        typeof userCoords.lng === 'number' &&
        !isNaN(userCoords.lat) &&
        !isNaN(userCoords.lng)
      ) {
        return { lat: userCoords.lat, lng: userCoords.lng };
      }

      // 3. Fallback to city coordinates so Maps link is ALWAYS present
      return getCityFallbackCoords();
    };

    try {
      const coords = await acquireLiveCoordinates();
      const freshLink = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;

      setMapsLink(freshLink);
      setLocationText(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
      setGpsStatus('found');

      const url = `https://wa.me/91${normalizedPhone}?text=${buildWhatsAppMessage(freshLink)}`;

      setTimeout(() => {
        setSending(false);
        setSent(true);
        window.open(url, '_blank');
      }, 400);
    } catch (err) {
      console.error('WhatsApp SOS handler fallback:', err);
      const fallback = getCityFallbackCoords();
      const fallbackLink = `https://maps.google.com/?q=${fallback.lat},${fallback.lng}`;
      const url = `https://wa.me/91${normalizedPhone}?text=${buildWhatsAppMessage(fallbackLink)}`;
      setSending(false);
      setSent(true);
      window.open(url, '_blank');
    }
  };

  return (
    <div
      id="sos-modal-overlay"
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: '#fff',
          border: '3px solid #dc2626',
          maxHeight: '95vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div
          className="p-5 text-center"
          style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}
        >
          <div className="text-4xl mb-2">🚨</div>
          <h2 className="text-xl font-extrabold text-white">{tr('sos.title')}</h2>
          <p className="text-red-100 text-xs mt-1">{tr('sos.subtitle')}</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Location Info with live Google Maps link */}
          <div
            className="rounded-2xl p-3.5"
            style={{ background: '#f0fdf4', border: '1px solid #86efac' }}
          >
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">
              {tr('sos.yourLocation')}
            </p>
            <p className="text-sm font-semibold text-green-900">
              {tr('sos.gps')}: {locationText}
            </p>
            {mapsLink && (
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-700 underline mt-1 flex items-center gap-1 font-semibold hover:text-green-800"
              >
                <span>📍 View on Google Maps</span>
                <span>→</span>
              </a>
            )}
          </div>

          {/* Emergency Contact */}
          {savedPhone ? (
            <div
              className="rounded-2xl p-3.5"
              style={{ background: '#fff7ed', border: '1px solid #fdba74' }}
            >
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">
                {tr('sos.savedContact')}
              </p>
              <p className="text-sm font-extrabold text-gray-900">{savedName}</p>
              <p className="text-sm text-gray-600">+91 {normalizedPhone || savedPhone}</p>
            </div>
          ) : (
            <div
              className="rounded-2xl p-3.5"
              style={{ background: '#fef9c3', border: '1px solid #fde68a' }}
            >
              <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-2">
                {tr('sos.enterContactLabel')}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-600 bg-gray-100 px-2.5 py-2 rounded-xl">
                  +91
                </span>
                <input
                  id="sos-manual-phone-input"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={manualPhone}
                  onChange={(e) =>
                    setManualPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  placeholder={tr('sos.contactPlaceholder')}
                  className="chhaya-input text-sm flex-1"
                  style={{ background: '#ffffff' }}
                />
              </div>
              <p className="text-[11px] text-yellow-600 mt-1">{tr('sos.enterContactHint')}</p>
            </div>
          )}

          {/* Status feedback alerts */}
          {sending && gpsStatus === 'locating' && (
            <div
              className="rounded-2xl p-3.5 text-center"
              style={{ background: '#eff6ff', border: '1px solid #93c5fd' }}
            >
              <div
                className="spinner mx-auto mb-1.5"
                style={{ borderTopColor: '#2563eb' }}
              />
              <p className="text-sm font-bold text-blue-800">📡 Getting your location...</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Acquiring live GPS coordinates for WhatsApp...
              </p>
            </div>
          )}

          {gpsStatus === 'found' && !sent && (
            <div
              className="rounded-2xl p-3 text-center"
              style={{ background: '#f0fdf4', border: '1px solid #86efac' }}
            >
              <p className="text-sm font-bold text-green-800">📍 Live location ready!</p>
              <p className="text-xs text-green-700 mt-0.5">
                Opening WhatsApp with your Google Maps link...
              </p>
            </div>
          )}

          {sent && (
            <div
              className="rounded-2xl p-3 text-center"
              style={{ background: '#f0fdf4', border: '1px solid #86efac' }}
            >
              <span className="text-2xl">✅</span>
              <p className="text-sm font-bold text-green-800 mt-1">
                {tr('sos.whatsappOpened')}
              </p>
              <p className="text-xs text-green-700 mt-0.5 font-medium">
                📍 Live Google Maps link included in message
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {/* ── Call 108 — primary CTA ── */}
            <button
              id="sos-call-108"
              type="button"
              onClick={() => callNumber('108')}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-extrabold text-white text-base transition-all cursor-pointer border-0 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                boxShadow: '0 4px 16px rgba(220,38,38,0.4)'
              }}
            >
              <span className="text-xl">🚑</span>
              <span>{tr('sos.call108')}</span>
            </button>

            {/* ── WhatsApp SOS — guaranteed to include live maps link ── */}
            <button
              id="sos-whatsapp-btn"
              type="button"
              onClick={handleWhatsApp}
              disabled={!isPhoneValid || sending}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-extrabold text-white text-base transition-all cursor-pointer border-0 active:scale-[0.98]"
              style={
                isPhoneValid && !sending
                  ? {
                      background: 'linear-gradient(135deg,#16a34a,#15803d)',
                      boxShadow: '0 4px 16px rgba(22,163,74,0.35)'
                    }
                  : { background: '#d1fae5', color: '#6b7280', cursor: 'not-allowed' }
              }
            >
              {sending ? (
                <>
                  <div className="spinner" />
                  <span>
                    {gpsStatus === 'locating'
                      ? 'Getting your location...'
                      : tr('sos.openingWhatsApp')}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl">📲</span>
                  <span>
                    {isPhoneValid
                      ? `${tr('sos.sendSOS')} ${savedName || ('+91 ' + normalizedPhone)}`
                      : tr('sos.enterNumber')}
                  </span>
                </>
              )}
            </button>

            {/* ── Heat Helpline ── */}
            <button
              id="sos-heat-helpline-btn"
              type="button"
              onClick={() => callNumber('18001801104')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl font-bold text-sm transition-all border cursor-pointer hover:bg-orange-50 active:scale-[0.98]"
              style={{
                background: '#fff7ed',
                color: '#c2410c',
                borderColor: '#fdba74'
              }}
            >
              <span className="text-lg">🌡️</span>
              <span>{tr('sos.heatHelpline')}</span>
            </button>
          </div>

          {/* Close */}
          <button
            id="sos-modal-close"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
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
    if (parsedUser.role === 'admin')   { navigate('/admin');   return; }
    if (parsedUser.role === 'manager') { navigate('/manager'); return; }
    setUser(parsedUser);
    // Tell LanguageContext a user was loaded (re-syncs language from user.language)
    window.dispatchEvent(new Event('chhaya-user-loaded'));
    const city = parsedUser.location || 'Ahmedabad';
    const job = parsedUser.occupation || 'other';
    setReportData(prev => ({ ...prev, city }));
    fetchHeatData(city, job);
    fetchCoolingCenters(city);
    fetchHotspots(city);

    // Browser geolocation with automatic fallback
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn('Geolocation denied or unavailable on mount:', err?.message);
          const fallback = getCityCoordinates(city);
          setUserCoords({ lat: fallback.lat, lng: fallback.lng });
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    } else {
      const fallback = getCityCoordinates(city);
      setUserCoords({ lat: fallback.lat, lng: fallback.lng });
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
        <SOSModal user={user} onClose={() => setShowSOS(false)} userCoords={userCoords} tr={tr} JOB_LABELS_T={JOB_LABELS_T} />
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
                    👤 {user.role === 'admin' ? 'Admin' : tr('register.roleWorker')}
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
                <span className="text-[10px] font-medium text-red-100">{tr('dashboard.heatEmergency')}</span>
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
              {tr('dashboard.standardAmbientShade')}
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
                      {tr('dashboard.personalizedFor')} {JOB_LABELS_T[user.occupation] || JOB_LABELS[user.occupation] || user.occupation || tr('jobLabels.other')}
                    </p>
                  </div>
                </div>
                {heatData?.jobPoints != null && (
                  <span className="badge" style={{ background: riskCfg.badgeBg, color: riskCfg.badgeText, borderColor: riskCfg.border }}>
                    {heatData.jobPoints > 0 ? `+${heatData.jobPoints}°C ${tr('dashboard.workLoad')}` : tr('dashboard.baseline')}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="py-8 text-center text-gray-400 text-xs">{tr('dashboard.computingPersonal')}</div>
              ) : heatData ? (
                <>
                  <div className="flex items-baseline gap-3 my-3">
                    <span className="text-4xl sm:text-5xl font-extrabold leading-none" style={{ color: riskCfg.textColor }}>
                      {tr(`riskLevel.${displayRiskLevel}`) || displayRiskLevel}
                    </span>
                    <span className="text-sm font-bold" style={{ color: riskCfg.textColor }}>
                      ({heatData.personalHeatIndex != null ? `${heatData.personalHeatIndex}°C ${tr('dashboard.personalHI')}` : `${heatData.heatIndex}°C`})
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex justify-between text-[11px] mb-1 font-semibold opacity-75" style={{ color: riskCfg.textColor }}>
                      <span>{tr('riskLevel.Low')}</span>
                      <span>{tr('riskLevel.Moderate')}</span>
                      <span>{tr('riskLevel.High')}</span>
                      <span>{tr('riskLevel.Extreme')}</span>
                    </div>
                    <div className="h-2.5 bg-black/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: riskBarPct, background: riskCfg.barColor }} />
                    </div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2.5 my-2.5 border border-white/80 text-xs text-gray-800">
                    <span className="font-bold text-gray-900">{tr('dashboard.whyItChanged')} </span>
                    <span>{tr('jobDescriptions.' + (user.occupation || 'other')) || heatData.reason}</span>
                  </div>
                  {(() => {
                    const fallbackTr = tr('riskAdvice.' + displayRiskLevel);
                    const safeTrAdvice = fallbackTr && !fallbackTr.startsWith('riskAdvice.') ? fallbackTr : null;
                    const guidanceText = translations?.jobAdvice?.[displayRiskLevel]?.[user.occupation] || translations?.jobAdvice?.[displayRiskLevel]?.default || safeTrAdvice || heatData.personalAdvice || heatData.advice;
                    return (
                      <div className="mt-2 text-xs leading-relaxed font-medium" style={{ color: riskCfg.textColor }}>
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <span className="font-bold uppercase tracking-wide">{tr('dashboard.practicalShiftGuidance')}</span>
                          {guidanceText && <ListenButton text={guidanceText} size="sm" />}
                        </div>
                        <span>{guidanceText}</span>
                      </div>
                    );
                  })()}
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
              {tr('dashboard.hotspotNearby')} <strong className="text-red-500">{hotspots.length}</strong>
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
              <h3 className="font-bold text-gray-900">{tr('dashboard.recentHotspots')}</h3>
              <span className="badge badge-pending">{hotspots.length} {tr('dashboard.reports')}</span>
            </div>
            {hotspots.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl">📭</span>
                <p className="text-gray-400 text-sm mt-2">{tr('dashboard.noReports')}</p>
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
                      {tr('hotspot.status.' + spot.status) || spot.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Practical Safety Tips */}
          <div className="rounded-3xl p-6 card-lift dash-fade-up border border-blue-100"
            style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)', boxShadow: '0 4px 18px #2563eb12' }}>
            <h3 className="font-bold text-blue-900 mb-4">{tr('dashboard.workerHeatSafety')}</h3>
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
                <h3 className="font-bold text-gray-900 text-lg">{tr('dashboard.nearestCooling')}</h3>
                <span className="badge badge-resolved">{sortedCenters.length} {tr('dashboard.available')}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {userCoords
                  ? tr('dashboard.gpsRealDistances')
                  : tr('dashboard.gpsOff')}
              </p>
            </div>
            {userCoords && (
              <span className="badge" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                {tr('dashboard.gpsActive')}
              </span>
            )}
          </div>

          {sortedCenters.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">🏢</span>
              <p className="text-gray-400 text-sm mt-3">{tr('dashboard.noCoolingCenters')}</p>
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
                            📍 {center.distanceKm} {tr('dashboard.kmAway')}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">{center.type}</span>
                        )}
                        <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline">
                          <span>🧭 {tr('dashboard.getDirections')}</span>
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

      {/* ── Heat Safety Assistant (floating) ── */}
      <HeatHelper lang={lang} onOpenSOS={() => setShowSOS(true)} />

    </div>
  );
}

export default UserDashboard;
