import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';

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

    if (!token || !storedUser) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    const city = parsedUser.location || 'Ahmedabad';
    setReportData(prev => ({ ...prev, city }));

    fetchHeatData(city);
    fetchCoolingCenters(city);
    fetchHotspots(city);
  }, [navigate]);

  const fetchHeatData = async (city) => {
    try {
      const res = await API.get(`/alerts?city=${city}`);
      setHeatData(res.data);
    } catch (error) {
      setHeatData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoolingCenters = async (city) => {
    try {
      const res = await API.get(`/cooling-centers?city=${city}`);
      setCenters(res.data);
    } catch (error) {
      setCenters([]);
    }
  };

  const fetchHotspots = async (city) => {
    try {
      const res = await API.get(`/hotspots?city=${city}`);
      setHotspots(res.data);
    } catch (error) {
      setHotspots([]);
    }
  };

  const handleReportChange = (e) => {
    setReportData({ ...reportData, [e.target.name]: e.target.value });
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReportMessage('');
    try {
      await API.post('/hotspots', reportData);
      setReportMessage('Hotspot reported successfully!');
      setReportData({ location: '', city: user.location || 'Ahmedabad', description: '' });
      setShowReportForm(false);
      fetchHotspots(user.location || 'Ahmedabad');
    } catch (error) {
      setReportMessage(error.response?.data?.message || 'Failed to report hotspot');
    }
  };

  const getRiskStyles = (level) => {
    switch (level) {
      case 'Low': return { bg: 'bg-green-50 border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800', icon: '🟢', gradient: 'from-green-400 to-emerald-500' };
      case 'Moderate': return { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800', icon: '🟡', gradient: 'from-yellow-400 to-amber-500' };
      case 'High': return { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800', icon: '🟠', gradient: 'from-orange-400 to-orange-600' };
      case 'Very High': return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800', icon: '🔴', gradient: 'from-red-400 to-red-600' };
      case 'Extreme': return { bg: 'bg-red-100 border-red-300', text: 'text-red-800', badge: 'bg-red-200 text-red-900', icon: '🔴', gradient: 'from-red-500 to-rose-700' };
      default: return { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800', icon: '⚪', gradient: 'from-gray-400 to-gray-500' };
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 40%, #fef3c7 100%)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-orange-600 font-medium text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const riskStyles = heatData ? getRiskStyles(heatData.riskLevel) : null;

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm ' +
    'bg-gray-50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all duration-200';

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #fed7aa 30%, #fef3c7 100%)' }}>
      <Navbar user={user} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Welcome Banner */}
        <div className="bg-white rounded-3xl shadow-md border border-orange-100 p-6 sm:p-7 hover:shadow-lg transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Welcome back, <span className="text-orange-500">{user.name}</span> 👋
              </h2>
              <p className="text-gray-500 text-sm mt-1">Stay safe from extreme heat today.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-xs font-semibold capitalize">
                👤 {user.role}
              </span>
              {user.occupation && (
                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                  🛠️ {user.occupation}
                </span>
              )}
              {user.location && (
                <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-xs font-semibold">
                  📍 {user.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Heat Risk Card */}
        {loading ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-md border border-orange-100">
            <div className="w-8 h-8 border-4 border-orange-300 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">Fetching live heat data...</p>
          </div>
        ) : heatData ? (
          <div className={`rounded-3xl p-6 sm:p-8 border-2 shadow-md hover:shadow-lg transition-all duration-300 ${riskStyles.bg}`}>
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Heat Risk</span>
                  <span className="text-xs bg-white/70 px-2 py-0.5 rounded-full font-medium text-gray-600">{heatData.city}</span>
                </div>
                <h3 className={`text-4xl sm:text-5xl font-extrabold ${riskStyles.text} mb-3`}>{heatData.riskLevel}</h3>
                <p className={`text-sm leading-relaxed ${riskStyles.text} opacity-90 max-w-sm`}>{heatData.advice}</p>
                <div className="mt-5 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-white/60 rounded-2xl px-4 py-2">
                    <span className="text-xl">🌡️</span>
                    <div>
                      <p className="text-xs text-gray-500">Temperature</p>
                      <p className="text-sm font-bold text-gray-800">{heatData.temperature}°C</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 rounded-2xl px-4 py-2">
                    <span className="text-xl">💧</span>
                    <div>
                      <p className="text-xs text-gray-500">Humidity</p>
                      <p className="text-sm font-bold text-gray-800">{heatData.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 rounded-2xl px-4 py-2">
                    <span className="text-xl">🔥</span>
                    <div>
                      <p className="text-xs text-gray-500">Heat Index</p>
                      <p className="text-sm font-bold text-gray-800">{heatData.heatIndex}°C</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-6xl sm:text-7xl opacity-40 select-none">{riskStyles.icon}</div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 shadow-md border border-orange-100 text-center">
            <span className="text-4xl">🌐</span>
            <p className="text-gray-500 mt-3 text-sm">Unable to fetch heat data. Please check your location settings.</p>
          </div>
        )}

        {/* Report Hotspot */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 sm:p-7 hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">🚨 Report Extreme Heat</h3>
              <p className="text-xs text-gray-400 mt-0.5">Alert others to nearby heat hotspots</p>
            </div>
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className={`text-sm font-semibold px-4 py-2 rounded-2xl border transition-all duration-200 hover:scale-[1.02]
                ${showReportForm
                  ? 'border-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100'
                  : 'border-orange-300 text-white hover:shadow-md'}`}
              style={!showReportForm ? { background: 'linear-gradient(135deg, #f97316, #f59e0b)' } : {}}
            >
              {showReportForm ? '✕ Cancel' : '+ Report Hotspot'}
            </button>
          </div>

          {reportMessage && (
            <div className={`flex items-center gap-2 p-3 rounded-2xl mb-4 text-sm ${reportMessage.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
              <span>{reportMessage.includes('success') ? '✅' : '⚠️'}</span>
              <span>{reportMessage}</span>
            </div>
          )}

          {showReportForm && (
            <form onSubmit={handleReportSubmit} className="space-y-3 mb-6 bg-orange-50/70 p-5 rounded-2xl border border-orange-100">
              <input
                type="text"
                name="location"
                value={reportData.location}
                onChange={handleReportChange}
                required
                placeholder="📍 Location / Area name"
                className={inputClass}
              />
              <input
                type="text"
                name="city"
                value={reportData.city}
                onChange={handleReportChange}
                required
                placeholder="🏙️ City"
                className={inputClass}
              />
              <textarea
                name="description"
                value={reportData.description}
                onChange={handleReportChange}
                rows="2"
                placeholder="📝 Short description (optional)"
                className={inputClass + ' resize-none'}
              />
              <button
                type="submit"
                className="bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-2.5 px-6 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
              >
                🚨 Submit Report
              </button>
            </form>
          )}

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Reports</h4>
            {hotspots.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-3xl">📭</span>
                <p className="text-gray-400 text-sm mt-2">No hotspots reported yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {hotspots.slice(0, 4).map((spot) => (
                  <div key={spot._id} className="flex justify-between items-center bg-red-50 border border-red-100 rounded-2xl p-4 hover:bg-red-100/50 transition-colors duration-200">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">📍 {spot.location}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{spot.city}</p>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${spot.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        spot.status === 'Verified' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                      }`}>
                      {spot.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cooling Centers */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 sm:p-7 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-lg font-bold text-gray-900 mb-5">🌳 Nearby Cooling Centers</h3>

          {centers.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">🏢</span>
              <p className="text-gray-400 text-sm mt-3">No cooling centers found for your city yet.</p>
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-2xl overflow-hidden border border-orange-100">
                <MapView centers={centers} />
              </div>
              <div className="space-y-3">
                {centers.map((center) => (
                  <div
                    key={center._id}
                    className="flex justify-between items-start border border-gray-100 rounded-2xl p-4 hover:bg-orange-50/50 hover:border-orange-200 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm">{center.name}</h4>
                      <p className="text-xs text-gray-500 mt-1 truncate">{center.address}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{center.type} • {center.facilities}</p>
                    </div>
                    <span className="ml-3 shrink-0 bg-green-50 text-green-700 text-xs px-3 py-1.5 rounded-full font-semibold border border-green-100">
                      {center.city}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Safety Tips */}
        <div className="rounded-3xl p-6 sm:p-7 border border-blue-100 shadow-md"
          style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
          <h3 className="text-lg font-bold text-blue-900 mb-4">🛡️ Safety Tips</h3>
          <ul className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: '💧', tip: 'Drink water every 20–30 minutes' },
              { icon: '🌿', tip: 'Work in shade whenever possible' },
              { icon: '⏰', tip: 'Avoid heavy work between 12 PM – 4 PM' },
              { icon: '👕', tip: 'Wear light-colored, loose clothing' },
            ].map((item) => (
              <li key={item.tip} className="flex items-center gap-3 bg-white/70 rounded-2xl px-4 py-3 text-sm text-blue-900 font-medium">
                <span className="text-lg">{item.icon}</span>
                {item.tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Manager Tools */}
        {user.role === 'manager' && (
          <div className="rounded-3xl p-6 sm:p-7 border border-purple-100 shadow-md"
            style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)' }}>
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