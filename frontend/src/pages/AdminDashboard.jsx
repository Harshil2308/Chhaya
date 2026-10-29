import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { LanguageSwitcher } from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="4.5" fill="white" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
      <line
        key={i}
        x1="12"
        y1="2.5"
        x2="12"
        y2="4.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        transform={`rotate(${deg} 12 12)`}
      />
    ))}
  </svg>
);

const RefreshIcon = ({ spinning }) => (
  <svg
    className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [centers, setCenters] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('centers');
  const [hotspotFilter, setHotspotFilter] = useState('ALL');
  const [centerSearch, setCenterSearch] = useState('');

  // Form state for adding cooling center
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: 'Ahmedabad',
    type: 'Park',
    facilities: 'Shade, Drinking Water',
    contact: '',
    latitude: '',
    longitude: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submittingCenter, setSubmittingCenter] = useState(false);

  // Action status indicators
  const [deletingCenterId, setDeletingCenterId] = useState(null);
  const [updatingHotspotId, setUpdatingHotspotId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const navigate = useNavigate();
  const { tr } = useLanguage();

  const fetchCenters = useCallback(async () => {
    try {
      const res = await API.get('/cooling-centers');
      setCenters(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch cooling centers:', err);
    }
  }, []);

  const fetchHotspots = useCallback(async () => {
    try {
      const res = await API.get('/hotspots');
      setHotspots(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch hotspots:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchCenters(), fetchHotspots()]);
    setRefreshing(false);
  }, [fetchCenters, fetchHotspots]);

  // Auth & Role check
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !storedUser) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'admin') {
        if (parsedUser.role === 'manager') {
          navigate('/manager');
        } else {
          navigate('/dashboard');
        }
        return;
      }
      setUser(parsedUser);
    } catch {
      navigate('/login');
      return;
    }

    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchCenters(), fetchHotspots()]);
      setLoading(false);
    };

    initData();
  }, [navigate, fetchCenters, fetchHotspots]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCenter = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim()) {
      setFormError('Center Name, Address, and City are required.');
      return;
    }

    setSubmittingCenter(true);
    try {
      await API.post('/cooling-centers', {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        type: formData.type || 'Other',
        facilities: formData.facilities.trim() || 'Shade, Water',
        contact: formData.contact.trim(),
        latitude: formData.latitude !== '' ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude !== '' ? parseFloat(formData.longitude) : null
      });

      setFormSuccess('Cooling center added successfully!');
      setFormData({
        name: '',
        address: '',
        city: formData.city,
        type: 'Park',
        facilities: 'Shade, Drinking Water',
        contact: '',
        latitude: '',
        longitude: ''
      });
      await fetchCenters();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add cooling center');
    } finally {
      setSubmittingCenter(false);
    }
  };

  const handleDeleteCenter = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete cooling center "${name}"?`)) {
      return;
    }

    setDeletingCenterId(id);
    try {
      await API.delete(`/cooling-centers/${id}`);
      setStatusMessage({ type: 'success', text: `Center "${name}" deleted.` });
      await fetchCenters();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete cooling center'
      });
    } finally {
      setDeletingCenterId(null);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleStatusChange = async (hotspotId, newStatus) => {
    setUpdatingHotspotId(hotspotId);
    try {
      await API.put(`/hotspots/${hotspotId}`, { status: newStatus });
      setStatusMessage({
        type: 'success',
        text: `Hotspot status updated to "${newStatus}".`
      });
      await fetchHotspots();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update hotspot status'
      });
    } finally {
      setUpdatingHotspotId(null);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Metrics
  const pendingCount = useMemo(
    () => hotspots.filter((h) => h.status === 'Pending').length,
    [hotspots]
  );
  const verifiedCount = useMemo(
    () => hotspots.filter((h) => h.status === 'Verified').length,
    [hotspots]
  );
  const resolvedCount = useMemo(
    () => hotspots.filter((h) => h.status === 'Resolved').length,
    [hotspots]
  );

  // Filtered centers
  const filteredCenters = useMemo(() => {
    if (!centerSearch.trim()) return centers;
    const q = centerSearch.toLowerCase().trim();
    return centers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.type?.toLowerCase().includes(q)
    );
  }, [centers, centerSearch]);

  // Filtered hotspots
  const filteredHotspots = useMemo(() => {
    if (hotspotFilter === 'ALL') return hotspots;
    return hotspots.filter((h) => h.status === hotspotFilter);
  }, [hotspots, hotspotFilter]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50/50">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl shadow-lg border border-orange-100">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-orange-100 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin" />
          </div>
          <p className="text-sm font-bold text-orange-950">Loading Admin Control Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 relative">
      {/* ── Top Admin Navbar ── */}
      <nav
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100"
        style={{ boxShadow: '0 2px 12px rgba(249, 115, 22, 0.08)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}
            >
              <SunIcon />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-gray-900 tracking-tight">Chhaya</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide border border-red-200">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium leading-none hidden sm:block">
                Operations & Safety Infrastructure Control
              </p>
            </div>
          </div>

          {/* User & Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={refreshAll}
              disabled={refreshing}
              title="Refresh live data"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 transition-colors disabled:opacity-50"
            >
              <RefreshIcon spinning={refreshing} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <LanguageSwitcher />

            <div className="hidden sm:flex items-center gap-2 bg-orange-50/80 border border-orange-200/60 rounded-xl px-3 py-1.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-xs"
                style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}
              >
                {user.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span className="text-xs font-bold text-gray-800">{user.name}</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-red-200 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all shadow-xs"
            >
              {tr('common.logout')}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main Container ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Floating status alert */}
        {statusMessage && (
          <div
            className={`alert mb-5 shadow-md ${
              statusMessage.type === 'success' ? 'alert-success' : 'alert-error'
            }`}
          >
            <span>{statusMessage.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* ══ ROW 1: Summary Statistics ══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Cooling Centers
              </p>
              <p className="text-3xl font-extrabold text-orange-600">{centers.length}</p>
              <p className="text-[11px] text-gray-400 mt-1">Verified shelter facilities</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-2xl">
              🌿
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Total Hotspots
              </p>
              <p className="text-3xl font-extrabold text-red-600">{hotspots.length}</p>
              <p className="text-[11px] text-gray-400 mt-1">Crowdsourced heat reports</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-2xl">
              🚨
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Pending Review
              </p>
              <p className="text-3xl font-extrabold text-amber-600">{pendingCount}</p>
              <p className="text-[11px] text-gray-400 mt-1">Awaiting verification</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl">
              ⏳
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Resolved Spots
              </p>
              <p className="text-3xl font-extrabold text-emerald-600">{resolvedCount}</p>
              <p className="text-[11px] text-gray-400 mt-1">Water / shade addressed</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl">
              ✅
            </div>
          </div>
        </div>

        {/* ══ ROW 2: Header & Tab Controls ══ */}
        <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
              Administration & Infrastructure Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Control verified shelter points and verify high-temperature heat reports from the field.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 bg-orange-50/70 p-1.5 rounded-xl border border-orange-200/60 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('centers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
                activeTab === 'centers'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-orange-100/60'
              }`}
            >
              <span>🌿 Cooling Centers</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  activeTab === 'centers' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
                }`}
              >
                {centers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('hotspots')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
                activeTab === 'hotspots'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-orange-100/60'
              }`}
            >
              <span>🚨 Hotspot Reports</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  activeTab === 'hotspots' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
                }`}
              >
                {hotspots.length}
              </span>
            </button>
          </div>
        </div>

        {/* ══ TAB 1: COOLING CENTERS MANAGEMENT ══ */}
        {activeTab === 'centers' && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Left 2 Cols: Add Cooling Center Form */}
            <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-orange-100 shadow-xs self-start">
              <div className="border-b border-orange-100 pb-3 mb-4">
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <span>➕</span>
                  <span>Register Cooling Center</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Add verified shelter or drinking water points for workers
                </p>
              </div>

              {formError && (
                <div className="alert alert-error mb-4 text-xs">
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="alert alert-success mb-4 text-xs">
                  <span>✅</span>
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAddCenter} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Center Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. Sabarmati Shaded Rest Pavillion"
                    className="chhaya-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleFormChange}
                      required
                      placeholder="e.g. Ahmedabad"
                      className="chhaya-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Center Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleFormChange}
                      className="chhaya-input"
                    >
                      <option value="Park">Park / Public Garden</option>
                      <option value="Community Hall">Community Hall</option>
                      <option value="School">School / College</option>
                      <option value="Hospital">Hospital / Clinic</option>
                      <option value="Drinking Water Point">Drinking Water Point</option>
                      <option value="Other">Other Facility</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Full Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. Near Riverfront Gate 3, Ashram Road"
                    className="chhaya-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Available Facilities
                  </label>
                  <input
                    type="text"
                    name="facilities"
                    value={formData.facilities}
                    onChange={handleFormChange}
                    placeholder="e.g. Cold Drinking Water, Misting Fan, Shade"
                    className="chhaya-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Contact Information
                  </label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleFormChange}
                    placeholder="e.g. +91 79 2658 0000 or Site Helpdesk"
                    className="chhaya-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleFormChange}
                      placeholder="e.g. 23.0225"
                      className="chhaya-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleFormChange}
                      placeholder="e.g. 72.5714"
                      className="chhaya-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingCenter}
                  className="chhaya-btn-primary w-full py-3 mt-2"
                >
                  {submittingCenter ? (
                    <>
                      <span className="spinner" />
                      <span>Saving Center...</span>
                    </>
                  ) : (
                    <span>+ Add Cooling Center</span>
                  )}
                </button>
              </form>
            </div>

            {/* Right 3 Cols: Cooling Centers Directory */}
            <div className="xl:col-span-3 bg-white rounded-2xl p-6 border border-orange-100 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-100 pb-4 mb-4">
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">
                    Active Cooling Centers ({filteredCenters.length})
                  </h2>
                  <p className="text-xs text-gray-500">
                    Published for workers to navigate on the live map
                  </p>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={centerSearch}
                    onChange={(e) => setCenterSearch(e.target.value)}
                    placeholder="Search name or city..."
                    className="chhaya-input py-1.5 text-xs pr-8"
                  />
                  {centerSearch && (
                    <button
                      onClick={() => setCenterSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {filteredCenters.length === 0 ? (
                <div className="text-center py-16 px-4 bg-orange-50/40 rounded-2xl border border-dashed border-orange-200">
                  <span className="text-4xl">🏢</span>
                  <p className="text-sm font-bold text-gray-800 mt-2">
                    {centerSearch ? 'No matching centers found' : 'No cooling centers registered yet'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    {centerSearch
                      ? `Try clearing your search term "${centerSearch}"`
                      : 'Use the registration form on the left to add verified water points and shade centers.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[620px] overflow-y-auto pr-1">
                  {filteredCenters.map((center) => (
                    <div
                      key={center._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all bg-white shadow-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-extrabold text-gray-900 text-sm">{center.name}</h3>
                          <span className="badge bg-orange-100 text-orange-800 border-orange-200 text-[10px]">
                            {center.type}
                          </span>
                          {center.city && (
                            <span className="badge bg-amber-50 text-amber-800 border-amber-200 text-[10px]">
                              📍 {center.city}
                            </span>
                          )}
                          {center.latitude != null && center.longitude != null && (
                            <span className="badge bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">
                              🌐 {Number(center.latitude).toFixed(3)}, {Number(center.longitude).toFixed(3)}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 truncate">{center.address}</p>

                        <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500 flex-wrap">
                          <span>🏷️ {center.facilities || 'Shade, Water'}</span>
                          {center.contact && <span>📞 {center.contact}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {center.latitude != null && center.longitude != null && (
                          <a
                            href={`https://maps.google.com/?q=${center.latitude},${center.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            Map ↗
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteCenter(center._id, center.name)}
                          disabled={deletingCenterId === center._id}
                          className="chhaya-btn-danger text-xs px-3 py-1.5"
                        >
                          {deletingCenterId === center._id ? 'Deleting...' : '🗑 Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ TAB 2: HOTSPOT REPORTS MANAGEMENT ══ */}
        {activeTab === 'hotspots' && (
          <div className="bg-white rounded-2xl p-6 border border-orange-100 shadow-xs">
            {/* Header & Filter Chips */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-orange-100 pb-4 mb-6">
              <div>
                <h2 className="text-base font-extrabold text-gray-900">
                  Crowdsourced Heat Hotspot Reports
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verify reports from outdoor workers and mark as resolved once water or shade is dispatched.
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'ALL', label: 'All', count: hotspots.length, bg: 'bg-gray-100 text-gray-800' },
                  { key: 'Pending', label: 'Pending', count: pendingCount, bg: 'bg-amber-100 text-amber-900' },
                  { key: 'Verified', label: 'Verified', count: verifiedCount, bg: 'bg-blue-100 text-blue-900' },
                  { key: 'Resolved', label: 'Resolved', count: resolvedCount, bg: 'bg-emerald-100 text-emerald-900' }
                ].map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => setHotspotFilter(chip.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      hotspotFilter === chip.key
                        ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-orange-50'
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                        hotspotFilter === chip.key ? 'bg-white/25 text-white' : chip.bg
                      }`}
                    >
                      {chip.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hotspots Grid */}
            {filteredHotspots.length === 0 ? (
              <div className="text-center py-16 px-4 bg-orange-50/40 rounded-2xl border border-dashed border-orange-200">
                <span className="text-4xl">📭</span>
                <p className="text-sm font-bold text-gray-800 mt-2">
                  No {hotspotFilter !== 'ALL' ? hotspotFilter.toLowerCase() : ''} hotspots to display
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  When workers submit heat distress alerts or unshaded worksite reports, they appear here for verification.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHotspots.map((spot) => {
                  const isUpdating = updatingHotspotId === spot._id;
                  const statusColors = {
                    Pending: { border: 'border-l-amber-500', badge: 'badge-pending' },
                    Verified: { border: 'border-l-blue-500', badge: 'badge-verified' },
                    Resolved: { border: 'border-l-emerald-500', badge: 'badge-resolved' }
                  };
                  const cfg = statusColors[spot.status] || statusColors.Pending;

                  return (
                    <div
                      key={spot._id}
                      className={`border border-gray-100 rounded-2xl p-4 bg-white shadow-xs hover:shadow-md transition-all border-l-4 ${cfg.border} flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-extrabold text-gray-900 text-sm leading-snug">
                            📍 {spot.location}
                          </h3>
                          <span className={`badge shrink-0 text-[10px] ${cfg.badge}`}>
                            {spot.status}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-gray-500 mb-1.5">
                          🏙️ {spot.city || 'Ahmedabad'}
                        </p>

                        {spot.description ? (
                          <p className="text-xs text-gray-700 bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/60 italic mb-3">
                            "{spot.description}"
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic mb-3">No additional notes provided</p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2.5">
                          <span>
                            By{' '}
                            <strong className="text-gray-600 font-bold">
                              {spot.reportedBy?.name || 'Worker'}
                            </strong>
                            {spot.reportedBy?.phone && (
                              <span className="text-gray-400"> ({spot.reportedBy.phone})</span>
                            )}
                          </span>
                          <span>
                            {spot.createdAt
                              ? new Date(spot.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short'
                                })
                              : 'Recent'}
                          </span>
                        </div>

                        {/* Status selector */}
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-gray-600">Status:</label>
                          <select
                            value={spot.status}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(spot._id, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50/80 focus:border-orange-500 outline-none cursor-pointer font-bold flex-1 transition-colors disabled:opacity-50"
                          >
                            <option value="Pending">⏳ Pending</option>
                            <option value="Verified">🔍 Verified</option>
                            <option value="Resolved">✅ Resolved</option>
                          </select>
                          {isUpdating && <span className="spinner" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
