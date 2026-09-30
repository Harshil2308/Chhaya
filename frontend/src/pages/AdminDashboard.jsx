import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="4.5" fill="white" />
    {[0,45,90,135,180,225,270,315].map((deg, i) => (
      <line key={i} x1="12" y1="2.5" x2="12" y2="4.5"
        stroke="white" strokeWidth="2" strokeLinecap="round"
        transform={`rotate(${deg} 12 12)`} />
    ))}
  </svg>
);

function AdminDashboard() {
  const [user,      setUser]      = useState(null);
  const [centers,   setCenters]   = useState([]);
  const [hotspots,  setHotspots]  = useState([]);
  const [formData,  setFormData]  = useState({
    name: '', address: '', city: '', type: 'Park', facilities: 'Shade, Water', contact: ''
  });
  const [message,   setMessage]   = useState('');
  const [activeTab, setActiveTab] = useState('centers');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token      = localStorage.getItem('token');
    if (!token || !storedUser) { navigate('/login'); return; }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'admin') { navigate('/dashboard'); return; }
    setUser(parsedUser);
    fetchCenters();
    fetchHotspots();
  }, [navigate]);

  const fetchCenters  = async () => { try { const r = await API.get('/cooling-centers'); setCenters(r.data);  } catch {} };
  const fetchHotspots = async () => { try { const r = await API.get('/hotspots');         setHotspots(r.data); } catch {} };
  const handleChange  = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setMessage('');
    try {
      await API.post('/cooling-centers', formData);
      setMessage('success');
      setFormData({ name: '', address: '', city: '', type: 'Park', facilities: 'Shade, Water', contact: '' });
      fetchCenters();
    } catch (err) { setMessage(err.response?.data?.message || 'Failed to add center'); }
  };

  const handleDelete       = async (id) => { if (!window.confirm('Delete this cooling center?')) return; try { await API.delete(`/cooling-centers/${id}`); fetchCenters(); } catch {} };
  const handleStatusChange = async (id, status) => { try { await API.put(`/hotspots/${id}`, { status }); fetchHotspots(); } catch {} };
  const handleLogout       = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 border-4 border-orange-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin" />
        </div>
        <p className="text-sm font-semibold" style={{ color: '#e06010' }}>Loading admin panel...</p>
      </div>
    </div>
  );

  const inp = 'chhaya-input';
  const pendingCount  = hotspots.filter(h => h.status === 'Pending').length;
  const verifiedCount = hotspots.filter(h => h.status === 'Verified').length;
  const resolvedCount = hotspots.filter(h => h.status === 'Resolved').length;

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

      {/* ── Admin Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-orange-100"
        style={{ boxShadow: '0 1px 8px rgba(249,115,22,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}>
              <SunIcon />
            </div>
            <div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">Chhaya</span>
              <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 bg-orange-50 border border-orange-100 rounded-2xl px-3.5 py-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}>
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-gray-800">{user.name}</span>
            </div>
            <button onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7">

        {/* ══ ROW 1: Stats grid ══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Cooling Centers', value: centers.length,  icon: '🌿', color: '#e06010', bg: '#fff7ed', border: '#fdba74' },
            { label: 'Total Reports',   value: hotspots.length, icon: '📋', color: '#dc2626', bg: '#fff1f2', border: '#fca5a5' },
            { label: 'Pending',         value: pendingCount,    icon: '⏳', color: '#d97706', bg: '#fefce8', border: '#fde68a' },
            { label: 'Resolved',        value: resolvedCount,   icon: '✅', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
          ].map((stat, i) => (
            <div key={stat.label}
              className={`rounded-2xl p-5 card-lift border dash-fade-up delay-${(i+1)*100}`}
              style={{ background: stat.bg, borderColor: stat.border }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className={`text-3xl font-extrabold stat-pop delay-${(i+2)*100}`} style={{ color: stat.color }}>{stat.value}</p>
                </div>
                <span className="text-3xl opacity-70">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ══ ROW 2: Welcome banner ══ */}
        <div className="chhaya-card p-6 sm:p-7 mb-6 dash-slide-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="section-label">Admin Panel</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                Manage Chhaya <span style={{ color: '#e06010' }}>⚙️</span>
              </h2>
              <p className="text-gray-500 text-sm mt-1">Cooling Centers &amp; Hotspot Reports</p>
            </div>
            {/* Mini progress bars */}
            <div className="flex flex-col gap-2 min-w-[200px]">
              {hotspots.length > 0 && [
                { label: 'Pending',  count: pendingCount,  color: '#d97706', pct: `${Math.round(pendingCount/hotspots.length*100)}%`  },
                { label: 'Verified', count: verifiedCount, color: '#2563eb', pct: `${Math.round(verifiedCount/hotspots.length*100)}%` },
                { label: 'Resolved', count: resolvedCount, color: '#16a34a', pct: `${Math.round(resolvedCount/hotspots.length*100)}%` },
              ].map(bar => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs font-medium text-gray-500 mb-0.5">
                    <span>{bar.label}</span><span>{bar.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: bar.pct, background: bar.color, animation: 'bar-fill 1s ease 0.3s both', '--fill-pct': bar.pct }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ Tabs ══ */}
        <div className="flex gap-1.5 bg-white p-1.5 rounded-2xl border border-orange-100 w-fit mb-5 dash-fade-up delay-200"
          style={{ boxShadow: '0 2px 8px rgba(249,115,22,0.07)' }}>
          {[
            { key: 'centers',  label: '🌿 Cooling Centers', count: centers.length  },
            { key: 'hotspots', label: '🚨 Reports',         count: hotspots.length },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                activeTab === tab.key ? 'text-white shadow-md' : 'text-gray-600 hover:bg-orange-50'
              }`}
              style={activeTab === tab.key ? { background: 'linear-gradient(135deg,#e06010,#c97d08)' } : {}}>
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ═══ COOLING CENTERS TAB ═══ */}
        {activeTab === 'centers' && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 dash-fade-up delay-250">

            {/* Add form — left 2 cols */}
            <div className="xl:col-span-2 chhaya-card p-6 self-start">
              <h3 className="text-base font-bold text-gray-900 mb-0.5">➕ Add New Center</h3>
              <p className="text-xs text-gray-400 mb-5">Register a cooling center for workers</p>

              {message && (
                <div className={`alert mb-4 ${message === 'success' ? 'alert-success' : 'alert-error'}`}>
                  {message === 'success' ? '✅ Added successfully!' : `⚠️ ${message}`}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Center Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    required placeholder="e.g. Gandhi Park Shelter" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange}
                    required placeholder="e.g. Vadodara" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Full Address *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange}
                    required placeholder="Full address" className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className={inp}>
                      <option>Park</option><option>Community Hall</option>
                      <option>School</option><option>Hospital</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Contact</label>
                    <input type="text" name="contact" value={formData.contact} onChange={handleChange}
                      placeholder="Phone/email" className={inp} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Facilities</label>
                  <input type="text" name="facilities" value={formData.facilities} onChange={handleChange}
                    placeholder="e.g. Shade, Water, AC" className={inp} />
                </div>
                <button type="submit" className="chhaya-btn-primary w-full py-3 mt-1">
                  + Add Cooling Center
                </button>
              </form>
            </div>

            {/* Centers list — right 3 cols */}
            <div className="xl:col-span-3 chhaya-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900">
                  All Cooling Centers
                  <span className="ml-2 text-sm font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{centers.length}</span>
                </h3>
              </div>
              {centers.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-5xl">🏢</span>
                  <p className="text-gray-400 text-sm mt-3">No cooling centers added yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {centers.map((center, i) => (
                    <div key={center._id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-100 rounded-2xl p-4 hover:bg-orange-50/40 hover:border-orange-200 transition-all duration-200 tip-item`}
                      style={{ animationDelay: `${i * 0.06}s` }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-800 text-sm">{center.name}</h4>
                          <span className="badge" style={{ background: '#ffedd5', color: '#9a3412', borderColor: '#fdba74' }}>{center.type}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{center.address}, {center.city}</p>
                        <p className="text-xs text-gray-400 mt-0.5">🏷️ {center.facilities}</p>
                      </div>
                      <button onClick={() => handleDelete(center._id)} className="chhaya-btn-danger shrink-0">
                        🗑 Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ HOTSPOTS TAB ═══ */}
        {activeTab === 'hotspots' && (
          <div className="dash-fade-up delay-250">
            {/* Filter row */}
            <div className="flex flex-wrap gap-3 mb-5">
              {[
                { label: `All (${hotspots.length})`,      filter: null,       bg: '#f3f4f6', color: '#374151' },
                { label: `Pending (${pendingCount})`,     filter: 'Pending',  bg: '#fef9c3', color: '#854d0e' },
                { label: `Verified (${verifiedCount})`,   filter: 'Verified', bg: '#dbeafe', color: '#1e40af' },
                { label: `Resolved (${resolvedCount})`,   filter: 'Resolved', bg: '#dcfce7', color: '#166534' },
              ].map(f => (
                <span key={f.label} className="badge cursor-default" style={{ background: f.bg, color: f.color, borderColor: 'transparent', padding: '0.4rem 1rem', fontSize: '0.78rem' }}>
                  {f.label}
                </span>
              ))}
            </div>

            <div className="chhaya-card p-6">
              <h3 className="font-bold text-gray-900 mb-5">
                Reported Hotspots
                <span className="ml-2 text-sm font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{hotspots.length}</span>
              </h3>
              {hotspots.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-5xl">📭</span>
                  <p className="text-gray-400 text-sm mt-3">No hotspots reported yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotspots.map((spot, i) => (
                    <div key={spot._id}
                      className={`border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-red-100 transition-all duration-200 tip-item relative overflow-hidden`}
                      style={{ animationDelay: `${i * 0.05}s` }}>
                      {/* Status stripe */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                        style={{ background: spot.status === 'Pending' ? '#eab308' : spot.status === 'Verified' ? '#2563eb' : '#16a34a' }} />
                      <div className="pl-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-bold text-gray-800 text-sm">📍 {spot.location}</h4>
                          <span className={`badge shrink-0 ${spot.status === 'Pending' ? 'badge-pending' : spot.status === 'Verified' ? 'badge-verified' : 'badge-resolved'}`}>
                            {spot.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">🏙️ {spot.city}</p>
                        {spot.description && <p className="text-xs text-gray-400 mt-1 italic">"{spot.description}"</p>}
                        <p className="text-xs text-gray-400 mt-2">
                          By <span className="font-medium">{spot.reportedBy?.name || 'Unknown'}</span>
                          {' · '}{new Date(spot.createdAt).toLocaleDateString('en-IN')}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <label className="text-xs font-semibold text-gray-500">Update:</label>
                          <select value={spot.status} onChange={e => handleStatusChange(spot._id, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 focus:border-orange-400 outline-none cursor-pointer transition-all font-semibold flex-1">
                            <option value="Pending">Pending</option>
                            <option value="Verified">Verified</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
