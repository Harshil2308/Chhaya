import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';

const RISK_CONFIG = {
  Low: { bg: '#f0fdf4', border: '#86efac', textColor: '#15803d', badgeBg: '#dcfce7', badgeText: '#166534', dot: '#16a34a', barColor: '#22c55e' },
  Moderate: { bg: '#fefce8', border: '#fde68a', textColor: '#854d0e', badgeBg: '#fef9c3', badgeText: '#713f12', dot: '#eab308', barColor: '#eab308' },
  High: { bg: '#fff7ed', border: '#fdba74', textColor: '#c2410c', badgeBg: '#ffedd5', badgeText: '#9a3412', dot: '#e06010', barColor: '#e06010' },
  'Very High': { bg: '#fff1f2', border: '#fca5a5', textColor: '#b91c1c', badgeBg: '#fee2e2', badgeText: '#991b1b', dot: '#dc2626', barColor: '#dc2626' },
  Extreme: { bg: '#fff1f2', border: '#f87171', textColor: '#991b1b', badgeBg: '#fecaca', badgeText: '#7f1d1d', dot: '#dc2626', barColor: '#dc2626' },
};

const RISK_BAR_PCT = { Low: '20%', Moderate: '45%', High: '65%', 'Very High': '82%', Extreme: '100%' };

const SAFETY_TIPS = [
  { icon: '💧', tip: 'Drink water every 20–30 minutes' },
  { icon: '🌿', tip: 'Rest in shade whenever possible' },
  { icon: '⏰', tip: 'Avoid heavy work between 12–4 PM' },
  { icon: '👕', tip: 'Wear light-colored, loose clothing' },
  { icon: '🩺', tip: 'Watch for dizziness, cramps, nausea' },
  { icon: '📞', tip: 'Report emergencies to your supervisor' },
];

function UserDashboard() {
  const [user, setUser] = useState(null);
  const [heatData, setHeatData] = useState(null);
  const [centers, setCenters] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportData, setReportData] = useState({ location: '', city: '', description: '' });
  const [reportMessage, setReportMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !storedUser) { navigate('/login'); return; }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    const city = parsedUser.location || 'Ahmedabad';
    setReportData(prev => ({ ...prev, city }));
    fetchHeatData(city);
    fetchCoolingCenters(city);
    fetchHotspots(city);
  }, [navigate]);

  const fetchHeatData = async (city) => { try { const r = await API.get(`/alerts?city=${city}`); setHeatData(r.data); } catch { setHeatData(null); } finally { setLoading(false); } };
  const fetchCoolingCenters = async (city) => { try { const r = await API.get(`/cooling-centers?city=${city}`); setCenters(r.data); } catch { setCenters([]); } };
  const fetchHotspots = async (city) => { try { const r = await API.get(`/hotspots?city=${city}`); setHotspots(r.data); } catch { setHotspots([]); } };

  const handleReportChange = e => setReportData({ ...reportData, [e.target.name]: e.target.value });
  const handleReportSubmit = async (e) => {
    e.preventDefault(); setReportMessage('');
    try {
      await API.post('/hotspots', reportData);
      setReportMessage('success');
      setReportData({ location: '', city: user.location || 'Ahmedabad', description: '' });
      setShowReportForm(false);
      fetchHotspots(user.location || 'Ahmedabad');
    } catch (err) { setReportMessage(err.response?.data?.message || 'Failed to report hotspot'); }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 border-4 border-orange-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin" />
        </div>
        <p className="text-sm font-semibold" style={{ color: '#e06010' }}>Loading your dashboard...</p>
      </div>
    </div>
  );

  const riskCfg = heatData ? (RISK_CONFIG[heatData.riskLevel] || RISK_CONFIG['Low']) : null;
  const riskBarPct = heatData ? (RISK_BAR_PCT[heatData.riskLevel] || '20%') : '0%';

  // Heat wave stripe config: [left positions (px from edge), delay, height, duration]
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
    <div
      aria-hidden="true"
      className={`side-heat-waves side-heat-waves-${side}`}
    >
      <div className="side-heat-gradient" />
      {hwGlows.map((g, i) => (
        <div
          key={i}
          className="hw-glow"
          style={{
            [side === 'left' ? 'left' : 'right']: `${g.pos}px`,
            '--hw-delay': g.delay,
            '--hw-h': `${g.h}px`,
            '--hw-dur': g.dur,
          }}
        />
      ))}
      {hwStripes.map((s, i) => (
        <div
          key={i}
          className="hw-stripe"
          style={{
            [side === 'left' ? 'left' : 'right']: `${s.pos}px`,
            '--hw-delay': s.delay,
            '--hw-h': `${s.h}px`,
            '--hw-dur': s.dur,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* ── Side Heat Waves ── */}
      <SideHeatWaves side="left" />
      <SideHeatWaves side="right" />

      <Navbar user={user} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7" style={{ position: 'relative', zIndex: 1 }}>

        {/* ══ ROW 1: Welcome + Quick stats ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

          {/* Welcome card — takes 2 cols */}
          <div className="lg:col-span-2 chhaya-card card-lift p-6 dash-slide-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="section-label">Your Dashboard</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                  Hello, <span style={{ color: '#e06010' }}>{user.name}</span> 👋
                </h2>
                <p className="text-gray-500 text-sm mt-1.5">Stay safe and stay hydrated today.</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="badge" style={{ background: '#ffedd5', color: '#9a3412', borderColor: '#fdba74' }}>👤 {user.role}</span>
                  {user.occupation && <span className="badge" style={{ background: '#fef9c3', color: '#713f12', borderColor: '#fde68a' }}>🛠️ {user.occupation}</span>}
                  {user.location && <span className="badge" style={{ background: '#fff7ed', color: '#c2410c', borderColor: '#fdba74' }}>📍 {user.location}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Quick stat: Centers nearby */}
          <div className="chhaya-card card-lift p-6 flex flex-col justify-between dash-slide-right delay-100">
            <div>
              <p className="section-label">Cooling Centers</p>
              <p className="text-4xl font-extrabold stat-pop delay-300" style={{ color: '#e06010' }}>{centers.length}</p>
              <p className="text-sm text-gray-500 mt-1">Near {user.location || 'your city'}</p>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-xl border border-green-100 w-fit">
              🏢 Available now
            </div>
          </div>
        </div>

        {/* ══ ROW 2: Heat Risk (wide) + Hotspot count ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

          {/* Live Heat Risk — 2 cols */}
          <div className="lg:col-span-2 dash-fade-up delay-150">
            {loading ? (
              <div className="chhaya-card p-8">
                <div className="space-y-3">
                  <div className="shimmer-line h-5 w-1/3" />
                  <div className="shimmer-line h-10 w-1/2" />
                  <div className="shimmer-line h-4 w-2/3" />
                  <div className="flex gap-3 mt-4">
                    {[1, 2, 3].map(i => <div key={i} className="shimmer-line h-12 w-24 rounded-2xl" />)}
                  </div>
                </div>
              </div>
            ) : heatData && riskCfg ? (
              <div className="rounded-3xl p-6 sm:p-8 border-2 overflow-hidden relative card-lift"
                style={{ background: riskCfg.bg, borderColor: riskCfg.border, boxShadow: `0 6px 28px ${riskCfg.dot}28` }}>

                {/* Background watermark */}
                <div className="absolute -right-8 -top-8 text-[120px] opacity-[0.06] select-none pointer-events-none leading-none">
                  {heatData.riskLevel === 'Extreme' ? '🔥' : heatData.riskLevel === 'Low' ? '🌿' : '☀️'}
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="pulse-ring-anim w-3 h-3 rounded-full" style={{ background: riskCfg.dot }} />
                    <span className="section-label" style={{ color: riskCfg.textColor, opacity: 0.7, marginBottom: 0 }}>Live Heat Risk</span>
                    <span className="badge" style={{ background: riskCfg.badgeBg, color: riskCfg.badgeText, borderColor: riskCfg.border }}>{heatData.city}</span>
                  </div>

                  <h3 className="text-4xl sm:text-5xl font-extrabold leading-none mb-2" style={{ color: riskCfg.textColor }}>
                    {heatData.riskLevel}
                  </h3>
                  <p className="text-sm leading-relaxed max-w-md mb-5 opacity-90" style={{ color: riskCfg.textColor }}>
                    {heatData.advice}
                  </p>

                  {/* Risk level bar */}
                  <div className="mb-5">
                    <div className="flex justify-between text-xs mb-1.5 font-semibold opacity-70" style={{ color: riskCfg.textColor }}>
                      <span>Low</span><span>Moderate</span><span>High</span><span>Extreme</span>
                    </div>
                    <div className="h-2.5 bg-white/40 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: riskBarPct,
                        background: riskCfg.barColor,
                        animation: 'bar-fill 1s ease 0.4s both',
                        '--fill-pct': riskBarPct,
                      }} />
                    </div>
                  </div>

                  {/* Stat pills */}
                  <div className="flex flex-wrap gap-3">
                    {[
                      { icon: '🌡️', label: 'Temperature', value: `${heatData.temperature}°C` },
                      { icon: '💧', label: 'Humidity', value: `${heatData.humidity}%` },
                      { icon: '🔥', label: 'Heat Index', value: `${heatData.heatIndex}°C` },
                    ].map((s, i) => (
                      <div key={s.label} className={`flex items-center gap-2.5 bg-white/65 rounded-2xl px-4 py-2.5 backdrop-blur-sm dash-fade-up delay-${(i + 3) * 100}`}>
                        <span className="text-xl">{s.icon}</span>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{s.label}</p>
                          <p className="text-base font-extrabold text-gray-800">{s.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="chhaya-card p-6 text-center">
                <span className="text-4xl">🌐</span>
                <p className="text-gray-400 mt-3 text-sm">Unable to fetch heat data. Check your location settings.</p>
              </div>
            )}
          </div>

          {/* Hotspot count stat */}
          <div className="flex flex-col gap-5 dash-slide-right delay-200">
            <div className="chhaya-card card-lift p-6 flex-1 flex flex-col justify-between">
              <div>
                <p className="section-label">Hotspots Nearby</p>
                <p className="text-4xl font-extrabold stat-pop delay-400 text-red-500">{hotspots.length}</p>
                <p className="text-sm text-gray-500 mt-1">Reported in your area</p>
              </div>
              <button
                onClick={() => setShowReportForm(v => !v)}
                className="mt-4 text-sm font-semibold px-4 py-2.5 rounded-xl w-full transition-all duration-200 border"
                style={!showReportForm
                  ? { background: 'linear-gradient(135deg,#e06010,#c97d08)', color: '#fff', borderColor: 'transparent' }
                  : { background: '#f9fafb', color: '#4b5563', borderColor: '#e5e7eb' }}
              >
                {showReportForm ? '✕ Cancel Report' : '🚨 Report Hotspot'}
              </button>
            </div>

            {/* Current time */}
            <div className="chhaya-card card-lift p-5 text-center">
              <p className="section-label">Local Time</p>
              <p className="text-2xl font-extrabold text-gray-800">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
            </div>
          </div>
        </div>

        {/* ══ ROW 3: Report form (conditional) ══ */}
        {showReportForm && (
          <div className="chhaya-card p-6 sm:p-7 mb-5 dash-fade-up border-l-4" style={{ borderLeftColor: '#e06010' }}>
            <h3 className="text-base font-bold text-gray-900 mb-4">🚨 Report a Heat Hotspot</h3>
            {reportMessage && (
              <div className={`alert mb-4 ${reportMessage === 'success' ? 'alert-success' : 'alert-error'}`}>
                {reportMessage === 'success' ? '✅ Hotspot reported successfully!' : `⚠️ ${reportMessage}`}
              </div>
            )}
            <form onSubmit={handleReportSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Area / Locality *</label>
                <input type="text" name="location" value={reportData.location} onChange={handleReportChange}
                  required placeholder="e.g. Makarpura, Manjalpur" className="chhaya-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">City *</label>
                <input type="text" name="city" value={reportData.city} onChange={handleReportChange}
                  required placeholder="e.g. Vadodara" className="chhaya-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Description (optional)</label>
                <textarea name="description" value={reportData.description} onChange={handleReportChange}
                  rows="2" placeholder="e.g. No shade near factory gate, very high heat"
                  className="chhaya-input resize-none" />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="px-6 py-2.5 rounded-xl text-white font-bold text-sm bg-red-500 hover:bg-red-600 transition-colors border-0 cursor-pointer">
                  🚨 Submit Report
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══ ROW 4: Hotspots list + Safety Tips (side by side) ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

          {/* Recent hotspots */}
          <div className="chhaya-card card-lift p-6 dash-fade-up delay-300">
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
                {hotspots.slice(0, 5).map((spot, i) => (
                  <div key={spot._id}
                    className={`flex justify-between items-center rounded-2xl p-3.5 border transition-all duration-200 hover:shadow-sm tip-item`}
                    style={{ background: '#fff5f5', borderColor: '#fecaca', animationDelay: `${i * 0.08}s` }}>
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

          {/* Safety Tips */}
          <div className="rounded-3xl p-6 card-lift dash-fade-up delay-350 border border-blue-100"
            style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)', boxShadow: '0 4px 18px #2563eb12' }}>
            <h3 className="font-bold text-blue-900 mb-4">🛡️ Safety Tips</h3>
            <ul className="space-y-2.5">
              {SAFETY_TIPS.map((item, i) => (
                <li key={item.tip}
                  className="tip-item flex items-center gap-3 bg-white/65 rounded-xl px-3.5 py-2.5 text-sm text-blue-900 font-medium backdrop-blur-sm"
                  style={{ animationDelay: `${0.35 + i * 0.07}s` }}>
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <span>{item.tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ══ ROW 5: Cooling Centers (full width) ══ */}
        <div className="chhaya-card card-lift p-6 sm:p-7 mb-5 dash-fade-up delay-400">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 text-lg">🌳 Nearby Cooling Centers</h3>
            <span className="badge badge-resolved">{centers.length} available</span>
          </div>
          {centers.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">🏢</span>
              <p className="text-gray-400 text-sm mt-3">No cooling centers found for your city yet.</p>
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-2xl overflow-hidden border border-orange-100 shadow-sm">
                <MapView centers={centers} city={user.location} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {centers.map((center, i) => (
                  <div key={center._id}
                    className={`border border-gray-100 rounded-2xl p-4 hover:bg-orange-50/60 hover:border-orange-200 hover:shadow-sm transition-all duration-200 tip-item`}
                    style={{ animationDelay: `${0.4 + i * 0.06}s` }}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-800 text-sm">{center.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{center.address}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{center.type} · {center.facilities}</p>
                      </div>
                      <span className="shrink-0 badge badge-resolved">{center.city}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ══ Manager Tools (role-gated) ══ */}
        {user.role === 'manager' && (
          <div className="rounded-3xl p-6 sm:p-7 border border-purple-100 dash-fade-up delay-500 card-lift"
            style={{ background: 'linear-gradient(135deg,#faf5ff 0%,#ede9fe 100%)' }}>
            <h3 className="font-bold text-purple-900 text-lg mb-4">👷 Manager Tools</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Safe Morning Hours', value: '6 AM – 11 AM', icon: '🌅' },
                { label: 'Safe Evening Hours', value: '4 PM – 7 PM', icon: '🌇' },
                { label: 'Key Reminder', value: 'Ensure water & shade for all workers', icon: '💡' },
              ].map(item => (
                <div key={item.label} className="bg-white/70 rounded-2xl p-4">
                  <p className="text-2xl mb-1">{item.icon}</p>
                  <p className="text-xs text-purple-500 font-semibold uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-purple-900 font-bold text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
