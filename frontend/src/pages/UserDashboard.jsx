import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';

/* ── Risk level config ── */
const RISK_CONFIG = {
  Low:      { bg: '#f0fdf4', border: '#86efac', textColor: '#15803d', badgeBg: '#dcfce7', badgeText: '#166534', dot: '#16a34a', label: 'Low Risk'      },
  Moderate: { bg: '#fefce8', border: '#fde68a', textColor: '#854d0e', badgeBg: '#fef9c3', badgeText: '#713f12', dot: '#eab308', label: 'Moderate Risk' },
  High:     { bg: '#fff7ed', border: '#fdba74', textColor: '#c2410c', badgeBg: '#ffedd5', badgeText: '#9a3412', dot: '#e06010', label: 'High Risk'     },
  'Very High': { bg: '#fff1f2', border: '#fca5a5', textColor: '#b91c1c', badgeBg: '#fee2e2', badgeText: '#991b1b', dot: '#dc2626', label: 'Very High Risk' },
  Extreme:  { bg: '#fff1f2', border: '#f87171', textColor: '#991b1b', badgeBg: '#fecaca', badgeText: '#7f1d1d', dot: '#dc2626', label: 'Extreme Risk'  },
};

const SAFETY_TIPS = [
  { icon: '💧', tip: 'Drink water every 20–30 minutes, even if not thirsty' },
  { icon: '🌿', tip: 'Rest in shade whenever possible during your shift' },
  { icon: '⏰', tip: 'Avoid heavy physical work between 12 PM and 4 PM' },
  { icon: '👕', tip: 'Wear light-colored, loose-fitting clothing' },
  { icon: '🩺', tip: 'Watch for heat exhaustion signs — dizziness, nausea, cramps' },
  { icon: '📞', tip: 'Report heat emergencies to your supervisor immediately' },
];

function UserDashboard() {
  const [user,           setUser]           = useState(null);
  const [heatData,       setHeatData]       = useState(null);
  const [centers,        setCenters]        = useState([]);
  const [hotspots,       setHotspots]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportData,     setReportData]     = useState({ location: '', city: '', description: '' });
  const [reportMessage,  setReportMessage]  = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token      = localStorage.getItem('token');
    if (!token || !storedUser) { navigate('/login'); return; }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    const city = parsedUser.location || 'Ahmedabad';
    setReportData(prev => ({ ...prev, city }));

    fetchHeatData(city);
    fetchCoolingCenters(city);
    fetchHotspots(city);
  }, [navigate]);

  const fetchHeatData = async (city) => {
    try   { const res = await API.get(`/alerts?city=${city}`); setHeatData(res.data); }
    catch { setHeatData(null); }
    finally { setLoading(false); }
  };
  const fetchCoolingCenters = async (city) => {
    try   { const res = await API.get(`/cooling-centers?city=${city}`); setCenters(res.data); }
    catch { setCenters([]); }
  };
  const fetchHotspots = async (city) => {
    try   { const res = await API.get(`/hotspots?city=${city}`); setHotspots(res.data); }
    catch { setHotspots([]); }
  };

  const handleReportChange = e => setReportData({ ...reportData, [e.target.name]: e.target.value });

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReportMessage('');
    try {
      await API.post('/hotspots', reportData);
      setReportMessage('success');
      setReportData({ location: '', city: user.location || 'Ahmedabad', description: '' });
      setShowReportForm(false);
      fetchHotspots(user.location || 'Ahmedabad');
    } catch (error) {
      setReportMessage(error.response?.data?.message || 'Failed to report hotspot');
    }
  };

  const inputClass = 'chhaya-input';

  /* ── Loading screen ── */
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-orange-600 font-medium text-sm">Loading your dashboard...</p>
      </div>
    </div>
  );

  const riskCfg = heatData ? (RISK_CONFIG[heatData.riskLevel] || RISK_CONFIG['Low']) : null;

  return (
    <div className="min-h-screen">
      <Navbar user={user} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7 space-y-5">

        {/* ── Welcome card ── */}
        <div className="chhaya-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="section-label">Dashboard</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                Welcome back, <span style={{ color: '#e06010' }}>{user.name}</span> 👋
              </h2>
              <p className="text-gray-500 text-sm mt-1">Stay safe and hydrated today.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="badge" style={{ background: '#ffedd5', color: '#9a3412', borderColor: '#fdba74' }}>
                👤 {user.role}
              </span>
              {user.occupation && (
                <span className="badge" style={{ background: '#fef9c3', color: '#713f12', borderColor: '#fde68a' }}>
                  🛠️ {user.occupation}
                </span>
              )}
              {user.location && (
                <span className="badge" style={{ background: '#fff7ed', color: '#c2410c', borderColor: '#fdba74' }}>
                  📍 {user.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Live Heat Risk card ── */}
        {loading ? (
          <div className="chhaya-card p-8 text-center">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">Fetching live heat data...</p>
          </div>
        ) : heatData && riskCfg ? (
          <div className="rounded-3xl p-6 sm:p-8 transition-all duration-300 border-2"
            style={{ background: riskCfg.bg, borderColor: riskCfg.border, boxShadow: `0 4px 20px 0 ${riskCfg.dot}22` }}>
            <div className="flex flex-col sm:flex-row items-start justify-between gap-5">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="section-label" style={{ color: riskCfg.textColor, opacity: 0.7 }}>Live Heat Risk</span>
                  <span className="badge" style={{ background: riskCfg.badgeBg, color: riskCfg.badgeText, borderColor: riskCfg.border }}>
                    {heatData.city}
                  </span>
                </div>
                <h3 className="text-4xl sm:text-5xl font-extrabold leading-none mb-3" style={{ color: riskCfg.textColor }}>
                  {heatData.riskLevel}
                </h3>
                <p className="text-sm leading-relaxed max-w-sm" style={{ color: riskCfg.textColor, opacity: 0.9 }}>
                  {heatData.advice}
                </p>

                {/* Stats pills */}
                <div className="mt-5 flex flex-wrap gap-3">
                  {[
                    { icon: '🌡️', label: 'Temperature', value: `${heatData.temperature}°C` },
                    { icon: '💧', label: 'Humidity',    value: `${heatData.humidity}%`     },
                    { icon: '🔥', label: 'Heat Index',  value: `${heatData.heatIndex}°C`   },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center gap-2 bg-white/70 rounded-2xl px-4 py-2 backdrop-blur-sm">
                      <span className="text-xl">{stat.icon}</span>
                      <div>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                        <p className="text-sm font-bold text-gray-800">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Big dot indicator */}
              <div className="flex items-center justify-center w-20 h-20 rounded-full shadow-lg shrink-0"
                style={{ background: riskCfg.dot, opacity: 0.18 }}>
                <div className="w-12 h-12 rounded-full" style={{ background: riskCfg.dot }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="chhaya-card p-6 text-center">
            <span className="text-4xl">🌐</span>
            <p className="text-gray-400 mt-3 text-sm">Unable to fetch heat data. Please check your location settings.</p>
          </div>
        )}

        {/* ── Report Hotspot card ── */}
        <div className="chhaya-card p-6 sm:p-7">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">🚨 Report Extreme Heat</h3>
              <p className="text-xs text-gray-400 mt-0.5">Alert others about nearby heat hotspots</p>
            </div>
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-all duration-200 ${
                showReportForm
                  ? 'border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100'
                  : 'text-white border-transparent hover:opacity-90'
              }`}
              style={!showReportForm ? { background: 'linear-gradient(135deg,#e06010,#c97d08)' } : {}}
            >
              {showReportForm ? '✕ Cancel' : '+ Report Hotspot'}
            </button>
          </div>

          {reportMessage && (
            <div className={`alert mb-4 ${reportMessage === 'success' ? 'alert-success' : 'alert-error'}`}>
              {reportMessage === 'success' ? '✅ Hotspot reported successfully!' : `⚠️ ${reportMessage}`}
            </div>
          )}

          {showReportForm && (
            <form onSubmit={handleReportSubmit} className="space-y-3 mb-5 bg-orange-50 p-5 rounded-2xl border border-orange-100">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Area / Locality *</label>
                <input type="text" name="location" value={reportData.location} onChange={handleReportChange}
                  required placeholder="e.g. Makarpura, Manjalpur" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">City *</label>
                <input type="text" name="city" value={reportData.city} onChange={handleReportChange}
                  required placeholder="e.g. Vadodara" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description (optional)</label>
                <textarea name="description" value={reportData.description} onChange={handleReportChange}
                  rows="2" placeholder="e.g. No shade near factory gate, very high heat"
                  className={`${inputClass} resize-none`} />
              </div>
              <button type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm
                           bg-red-500 hover:bg-red-600 transition-colors duration-200 border-0 cursor-pointer">
                🚨 Submit Report
              </button>
            </form>
          )}

          {/* Recent hotspots */}
          <div>
            <p className="section-label">Recent Reports</p>
            {hotspots.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-3xl">📭</span>
                <p className="text-gray-400 text-sm mt-2">No hotspots reported in your area yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {hotspots.slice(0, 4).map(spot => (
                  <div key={spot._id} className="flex justify-between items-center bg-red-50 border border-red-100 rounded-2xl p-4 hover:bg-red-100/60 transition-colors duration-200">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">📍 {spot.location}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{spot.city}</p>
                    </div>
                    <span className={`badge ${
                      spot.status === 'Pending'  ? 'badge-pending'  :
                      spot.status === 'Verified' ? 'badge-verified' : 'badge-resolved'
                    }`}>{spot.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Cooling Centers card ── */}
        <div className="chhaya-card p-6 sm:p-7">
          <h3 className="text-lg font-bold text-gray-900 mb-5">🌳 Nearby Cooling Centers</h3>
          {centers.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">🏢</span>
              <p className="text-gray-400 text-sm mt-3">No cooling centers found for your city yet.</p>
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-2xl overflow-hidden border border-orange-100">
                <MapView centers={centers} city={user.location} />
              </div>
              <div className="space-y-3">
                {centers.map(center => (
                  <div key={center._id}
                    className="flex justify-between items-start border border-gray-100 rounded-2xl p-4
                               hover:bg-orange-50/60 hover:border-orange-200 hover:shadow-sm transition-all duration-200">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm">{center.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{center.address}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{center.type} · {center.facilities}</p>
                    </div>
                    <span className="ml-3 shrink-0 badge badge-resolved">{center.city}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Safety Tips card ── */}
        <div className="rounded-3xl p-6 sm:p-7 border border-blue-100"
          style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)', boxShadow: '0 4px 18px 0 #2563eb14' }}>
          <h3 className="text-lg font-bold text-blue-900 mb-4">🛡️ Safety Tips for Outdoor Workers</h3>
          <ul className="grid sm:grid-cols-2 gap-3">
            {SAFETY_TIPS.map(item => (
              <li key={item.tip} className="flex items-start gap-3 bg-white/70 rounded-2xl px-4 py-3 text-sm text-blue-900 font-medium backdrop-blur-sm">
                <span className="text-lg mt-0.5">{item.icon}</span>
                {item.tip}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Manager Tools (role-gated) ── */}
        {user.role === 'manager' && (
          <div className="rounded-3xl p-6 sm:p-7 border border-purple-100"
            style={{ background: 'linear-gradient(135deg,#faf5ff 0%,#ede9fe 100%)' }}>
            <h3 className="text-lg font-bold text-purple-900 mb-3">👷 Manager Tools</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white/70 rounded-2xl p-4">
                <p className="text-xs text-purple-500 font-semibold uppercase tracking-wider mb-1">Suggested Safe Hours</p>
                <p className="text-purple-900 font-bold">6 AM – 11 AM &amp; 4 PM – 7 PM</p>
              </div>
              <div className="bg-white/70 rounded-2xl p-4">
                <p className="text-xs text-purple-500 font-semibold uppercase tracking-wider mb-1">Reminder</p>
                <p className="text-purple-900 text-sm">Ensure workers have water and shade throughout the day.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
