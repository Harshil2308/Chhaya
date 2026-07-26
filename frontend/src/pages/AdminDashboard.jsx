import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [centers, setCenters] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    type: 'Park',
    facilities: 'Shade, Water',
    contact: ''
  });
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('centers'); // centers | hotspots
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !storedUser) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchCenters();
    fetchHotspots();
  }, [navigate]);

  const fetchCenters = async () => {
    try {
      const res = await API.get('/cooling-centers');
      setCenters(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchHotspots = async () => {
    try {
      const res = await API.get('/hotspots');
      setHotspots(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await API.post('/cooling-centers', formData);
      setMessage('Cooling center added successfully!');
      setFormData({
        name: '',
        address: '',
        city: '',
        type: 'Park',
        facilities: 'Shade, Water',
        contact: ''
      });
      fetchCenters();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add center');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this center?')) return;

    try {
      await API.delete(`/cooling-centers/${id}`);
      fetchCenters();
    } catch (error) {
      console.log(error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await API.put(`/hotspots/${id}`, { status: newStatus });
      fetchHotspots();
    } catch (error) {
      console.log(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 40%, #fef3c7 100%)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-orange-600 font-medium text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm ' +
    'bg-gray-50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all duration-200';

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Verified: 'bg-blue-100 text-blue-700 border-blue-200',
    Resolved: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #fed7aa 30%, #fef3c7 100%)' }}>

      {/* Admin Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
              <span className="text-lg">☀️</span>
            </div>
            <div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">Chhaya</span>
              <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-2xl px-3 py-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-gray-800">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold
                         border border-red-200 text-red-600 bg-red-50
                         hover:bg-red-500 hover:text-white hover:border-red-500
                         transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Welcome Banner */}
        <div className="bg-white rounded-3xl shadow-md border border-orange-100 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Admin Panel <span className="text-orange-500">⚙️</span>
              </h2>
              <p className="text-gray-500 text-sm mt-1">Manage Cooling Centers &amp; Hotspot Reports</p>
            </div>
            {/* Stats */}
            <div className="flex gap-3">
              <div className="text-center bg-orange-50 border border-orange-100 rounded-2xl px-5 py-3">
                <p className="text-2xl font-extrabold text-orange-600">{centers.length}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Centers</p>
              </div>
              <div className="text-center bg-red-50 border border-red-100 rounded-2xl px-5 py-3">
                <p className="text-2xl font-extrabold text-red-500">{hotspots.length}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Reports</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-orange-100 w-fit">
          <button
            onClick={() => setActiveTab('centers')}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'centers'
                ? 'text-white shadow-md'
                : 'text-gray-600 hover:bg-orange-50'
              }`}
            style={activeTab === 'centers' ? { background: 'linear-gradient(135deg, #f97316, #f59e0b)' } : {}}
          >
            🌿 Cooling Centers
          </button>
          <button
            onClick={() => setActiveTab('hotspots')}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'hotspots'
                ? 'text-white shadow-md'
                : 'text-gray-600 hover:bg-orange-50'
              }`}
            style={activeTab === 'hotspots' ? { background: 'linear-gradient(135deg, #f97316, #f59e0b)' } : {}}
          >
            🚨 Reports ({hotspots.length})
          </button>
        </div>

        {/* ========== COOLING CENTERS TAB ========== */}
        {activeTab === 'centers' && (
          <>
            {/* Add Form */}
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Add New Cooling Center</h3>
              <p className="text-sm text-gray-400 mb-6">Fill in the details to register a new cooling center</p>

              {message && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl mb-5 text-sm border ${message.includes('success')
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                  <span>{message.includes('success') ? '✅' : '⚠️'}</span>
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Center Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required
                    placeholder="e.g. Gandhi Park Shelter" className={inputClass} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} required
                    placeholder="e.g. Ahmedabad" className={inputClass} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} required
                    placeholder="Full address of the center" className={inputClass} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                  <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                    <option value="Park">Park</option>
                    <option value="Community Hall">Community Hall</option>
                    <option value="School">School</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Facilities</label>
                  <input type="text" name="facilities" value={formData.facilities} onChange={handleChange}
                    placeholder="e.g. Shade, Water, AC" className={inputClass} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact (optional)</label>
                  <input type="text" name="contact" value={formData.contact} onChange={handleChange}
                    placeholder="Phone or email" className={inputClass} />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="py-3 px-8 rounded-2xl text-white font-semibold text-sm shadow-md
                               transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}
                  >
                    + Add Cooling Center
                  </button>
                </div>
              </form>
            </div>

            {/* Centers List */}
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-5">
                All Cooling Centers
                <span className="ml-2 text-sm font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{centers.length}</span>
              </h3>

              {centers.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-4xl">🏢</span>
                  <p className="text-gray-400 text-sm mt-3">No cooling centers added yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {centers.map((center) => (
                    <div
                      key={center._id}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3
                                 border border-gray-100 rounded-2xl p-5 hover:bg-orange-50/40 hover:border-orange-200
                                 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-800">{center.name}</h4>
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">{center.type}</span>
                        </div>
                        <p className="text-sm text-gray-500">{center.address}, {center.city}</p>
                        <p className="text-xs text-gray-400 mt-1">🏷️ {center.facilities}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(center._id)}
                        className="shrink-0 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white text-sm font-semibold
                                   px-4 py-2 rounded-xl border border-red-200 hover:border-red-500
                                   transition-all duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ========== HOTSPOTS TAB ========== */}
        {activeTab === 'hotspots' && (
          <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-5">
              Reported Hotspots
              <span className="ml-2 text-sm font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{hotspots.length}</span>
            </h3>

            {hotspots.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-4xl">📭</span>
                <p className="text-gray-400 text-sm mt-3">No hotspots reported yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {hotspots.map((spot) => (
                  <div
                    key={spot._id}
                    className="border border-gray-100 rounded-2xl p-5 hover:bg-red-50/30 hover:border-red-100 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800">📍 {spot.location}</h4>
                        <p className="text-sm text-gray-500 mt-1">{spot.city}</p>
                        {spot.description && (
                          <p className="text-sm text-gray-400 mt-1.5 italic">{spot.description}</p>
                        )}
                        <p className="text-xs text-gray-300 mt-2">
                          Reported by: <span className="text-gray-400 font-medium">{spot.reportedBy?.name || 'Unknown'}</span>
                          {' · '}{new Date(spot.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3">
                        <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${statusColors[spot.status] || 'bg-gray-100 text-gray-600'}`}>
                          {spot.status}
                        </span>
                        <select
                          value={spot.status}
                          onChange={(e) => handleStatusChange(spot._id, e.target.value)}
                          className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none cursor-pointer transition-all duration-200"
                        >
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
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;