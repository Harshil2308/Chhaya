import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { GUJARAT_CITIES, getAreasForCity } from '../utils/gujaratData';

// ── Icons ─────────────────────────────────────────────────────────────────────
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

const CameraIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const GalleryIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const TrashIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const LockIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

const ChevronIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// ── Resize image to max width ─────────────────────────────────────────────────
function resizeImage(dataUrl, maxWidth = 400) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = dataUrl;
  });
}

// ── Camera modal ──────────────────────────────────────────────────────────────
function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setCameraError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setReady(true);
        }
      })
      .catch((err) => {
        if (!active) return;
        if (err.name === 'NotAllowedError') {
          setCameraError('Camera permission denied. Please allow camera access in your browser settings and try again.');
        } else {
          setCameraError('Unable to open camera: ' + err.message);
        }
      });

    return () => {
      active = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  };

  const handleClose = () => { stopStream(); onClose(); };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const raw = canvas.toDataURL('image/jpeg', 0.9);
    const resized = await resizeImage(raw, 400);
    stopStream();
    onCapture(resized);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CameraIcon size={18} />
            <span className="font-bold text-gray-900">Take Photo</span>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold cursor-pointer">✕</button>
        </div>

        {/* Video or error */}
        <div className="relative bg-black flex items-center justify-center" style={{ minHeight: 260 }}>
          {error ? (
            <div className="p-6 text-center">
              <span className="text-4xl block mb-3">📵</span>
              <p className="text-white text-sm leading-relaxed">{error}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full max-h-72 object-cover"
                style={{ display: ready ? 'block' : 'none' }}
              />
              {!ready && (
                <div className="text-white text-sm py-16 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Starting camera…</span>
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCapture}
            disabled={!ready || !!error}
            className="flex-1 py-2.5 rounded-2xl text-white font-bold text-sm transition-all cursor-pointer disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}
          >
            📸 Capture
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3200);
    return () => clearTimeout(timer);
  }, [onDone]);

  const cfg = {
    success: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', icon: '✓' },
    error:   { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', icon: '✕' },
  }[type] || { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: 'ℹ' };

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 px-5 py-3.5 rounded-2xl shadow-lg border flex items-center gap-2.5 font-semibold text-sm"
      style={{
        transform: 'translateX(-50%)',
        background: cfg.bg,
        borderColor: cfg.border,
        color: cfg.text,
        minWidth: 240,
        animation: 'fadeInUp 0.25s ease'
      }}
    >
      <span className="text-base">{cfg.icon}</span>
      <span>{message}</span>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-7 mb-5">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm shadow-sm"
          style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}>
          {icon}
        </div>
        <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Label + Input combo ───────────────────────────────────────────────────────
function Field({ label, children, hint, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 font-medium focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-gray-400 placeholder:font-normal bg-white";

// ── Main Settings component ───────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }
  const [showCamera, setShowCamera] = useState(false);

  const galleryInputRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    city: '',
    areaName: '',
    occupation: 'other',
    emergencyContactName: '',
    emergencyContactPhone: '',
    language: 'en',
    profilePhoto: '',
  });

  const [errors, setErrors] = useState({});

  // ── Load user on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { navigate('/login'); return; }

    const parsedUser = JSON.parse(stored);
    setUser(parsedUser);
    populateForm(parsedUser);

    // Refresh from backend
    API.get('/auth/me')
      .then((res) => {
        if (res.data) {
          const merged = { ...parsedUser, ...res.data };
          setUser(merged);
          localStorage.setItem('user', JSON.stringify(merged));
          populateForm(merged);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  const populateForm = (u) => {
    setForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      location: u.location || '',
      city: u.city || '',
      areaName: u.areaName || '',
      occupation: u.occupation || 'other',
      emergencyContactName: u.emergencyContactName || '',
      emergencyContactPhone: u.emergencyContactPhone || '',
      language: u.language || 'en',
      profilePhoto: u.profilePhoto || '',
    });
  };

  // Available areas for selected city
  const areaOptions = useMemo(() => getAreasForCity(form.city), [form.city]);

  // ── Form change handlers ──────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCityChange = (e) => {
    const newCity = e.target.value;
    setForm((prev) => ({ ...prev, city: newCity, areaName: '' }));
    setErrors((prev) => ({ ...prev, city: '' }));
  };

  // ── Photo handlers ────────────────────────────────────────────────────────
  const handleGalleryChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const resized = await resizeImage(ev.target.result, 400);
      setForm((prev) => ({ ...prev, profilePhoto: resized }));
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset so same file can be picked again
  };

  const handleCameraCapture = (dataUrl) => {
    setShowCamera(false);
    setForm((prev) => ({ ...prev, profilePhoto: dataUrl }));
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, profilePhoto: '' }));
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    const phoneRx = /^[6-9]\d{9}$/;
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!phoneRx.test(form.phone.trim())) {
      errs.phone = 'Enter a valid 10-digit Indian mobile number (starting with 6–9)';
    }
    if (form.email.trim() && !emailRx.test(form.email.trim())) {
      errs.email = 'Enter a valid email address';
    }
    if (form.emergencyContactPhone.trim() && !phoneRx.test(form.emergencyContactPhone.trim())) {
      errs.emergencyContactPhone = 'Enter a valid 10-digit Indian mobile number';
    }
    if (!['en', 'hi', 'gu'].includes(form.language)) {
      errs.language = 'Select a valid language';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
        language: form.language,
        profilePhoto: form.profilePhoto,
      };

      // Only send occupation for workers
      if (user?.role === 'worker') {
        payload.occupation = form.occupation;
      }

      // Gujarat city + area (if changed)
      if (form.city && form.areaName) {
        payload.city = form.city;
        payload.areaName = form.areaName;
      }

      const res = await API.put('/auth/me', payload);
      const updated = res.data.user;

      // Update localStorage user
      const newUser = { ...user, ...updated };
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      populateForm(newUser);

      // Sync language if changed
      if (updated.language && updated.language !== lang) {
        setLang(updated.language);
      }

      // Dispatch event so dashboards refresh name/avatar
      window.dispatchEvent(new Event('chhaya-user-loaded'));

      setToast({ message: 'Profile saved successfully! ✓', type: 'success' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save profile. Please try again.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ── Loading spinner ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-orange-600">Loading profile…</p>
        </div>
      </div>
    );
  }

  const initials = form.name?.charAt(0)?.toUpperCase() || 'U';
  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'manager' ? '/manager' : '/dashboard';

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#fff7ed 0%,#fafaf9 100%)' }}>
      {/* Camera modal */}
      {showCamera && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-orange-100"
        style={{ boxShadow: '0 1px 8px rgba(249,115,22,0.08)' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link to={dashboardPath} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}>
                <SunIcon size={18} />
              </div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">Chhaya</span>
            </Link>
            <span className="text-gray-300 text-lg">›</span>
            <span className="text-sm font-semibold text-orange-600">Settings</span>
          </div>

          <Link
            to={dashboardPath}
            className="text-xs font-bold px-3.5 py-2 rounded-xl border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      {/* ── Page content ──────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Profile Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account details, photo, and preferences.</p>
        </div>

        <form onSubmit={handleSave} noValidate>

          {/* ──── A) Profile Information ──────────────────────────────────── */}
          <Section title="Profile Photo" icon={<CameraIcon size={15} />}>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar preview */}
              <div className="shrink-0">
                <div
                  className="w-24 h-24 rounded-full border-4 border-orange-200 shadow-md overflow-hidden flex items-center justify-center bg-orange-100 text-white text-3xl font-extrabold select-none"
                  style={form.profilePhoto ? {} : { background: 'linear-gradient(135deg,#e06010,#c97d08)' }}
                >
                  {form.profilePhoto ? (
                    <img src={form.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : initials}
                </div>
              </div>

              {/* Photo action buttons */}
              <div className="flex flex-col gap-2.5 w-full sm:w-auto">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Photo Options</p>

                <button
                  type="button"
                  id="take-photo-btn"
                  onClick={() => setShowCamera(true)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-orange-200 bg-orange-50 text-orange-700 font-semibold text-sm hover:bg-orange-100 transition-colors cursor-pointer"
                >
                  <CameraIcon size={16} />
                  <span>Take Photo (Live Camera)</span>
                </button>

                <button
                  type="button"
                  id="gallery-btn"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <GalleryIcon size={16} />
                  <span>Choose from Gallery</span>
                </button>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleGalleryChange}
                />

                {form.profilePhoto && (
                  <button
                    type="button"
                    id="remove-photo-btn"
                    onClick={handleRemovePhoto}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-red-200 bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <TrashIcon size={14} />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          </Section>

          {/* ──── Profile fields ─────────────────────────────────────────── */}
          <Section title="Personal Information" icon="👤">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="sm:col-span-2">
                <Field label="Full Name" required>
                  <input
                    id="settings-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className={inputCls}
                    style={errors.name ? { borderColor: '#f87171' } : {}}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </Field>
              </div>

              {/* Email */}
              <div className="sm:col-span-2">
                <Field label="Email Address" hint="Optional — used for account recovery.">
                  <input
                    id="settings-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="yourname@example.com"
                    className={inputCls}
                    style={errors.email ? { borderColor: '#f87171' } : {}}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </Field>
              </div>

              {/* Phone */}
              <Field label="Mobile Number" required hint="10-digit Indian number (starts with 6–9).">
                <input
                  id="settings-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="98765XXXXX"
                  maxLength={10}
                  className={inputCls}
                  style={errors.phone ? { borderColor: '#f87171' } : {}}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </Field>

              {/* Language */}
              <Field label="Preferred Language">
                <select
                  id="settings-language"
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  className={inputCls}
                  style={errors.language ? { borderColor: '#f87171' } : {}}
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="gu">ગુજરાતી (Gujarati)</option>
                </select>
                {errors.language && <p className="text-red-500 text-xs mt-1">{errors.language}</p>}
              </Field>

              {/* Occupation — workers only */}
              {user?.role === 'worker' && (
                <div className="sm:col-span-2">
                  <Field label="Occupation / Work Sector">
                    <select
                      id="settings-occupation"
                      name="occupation"
                      value={form.occupation}
                      onChange={handleChange}
                      className={inputCls}
                    >
                      <option value="construction">Construction Worker</option>
                      <option value="farmer">Farmer</option>
                      <option value="delivery">Delivery Person</option>
                      <option value="vendor">Street Vendor</option>
                      <option value="other">Other Outdoor Worker</option>
                    </select>
                  </Field>
                </div>
              )}
            </div>
          </Section>

          {/* ──── Location section ────────────────────────────────────────── */}
          <Section title="Location" icon="📍">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gujarat City Dropdown */}
              <Field label="Gujarat City">
                <select
                  id="settings-city"
                  name="city"
                  value={form.city}
                  onChange={handleCityChange}
                  className={inputCls}
                >
                  <option value="">-- Select Gujarat City --</option>
                  {GUJARAT_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>

              {/* Dependent Area Dropdown */}
              <Field label="Area / Ward">
                <select
                  id="settings-areaName"
                  name="areaName"
                  value={form.areaName}
                  onChange={handleChange}
                  disabled={!form.city}
                  className={`${inputCls} disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400`}
                >
                  <option value="">
                    {form.city ? `-- Select Area in ${form.city} --` : '-- Select City First --'}
                  </option>
                  {areaOptions.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </Field>

              {/* Legacy location text field */}
              <div className="sm:col-span-2">
                <Field label="City / Location (general)" hint="Free-text location used in heat alerts.">
                  <input
                    id="settings-location"
                    name="location"
                    type="text"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Ahmedabad, Surat…"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ──── Emergency contact ───────────────────────────────────────── */}
          <Section title="Emergency Contact" icon="🆘">
            <div className="mb-3 text-xs text-orange-800 bg-orange-50 p-3 rounded-xl border border-orange-200">
              This person will be contacted in case of a heat emergency. Keep this info up to date.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Contact Name">
                <input
                  id="settings-emergencyContactName"
                  name="emergencyContactName"
                  type="text"
                  value={form.emergencyContactName}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Patel"
                  className={inputCls}
                />
              </Field>

              <Field label="Contact Phone" hint="Valid 10-digit Indian mobile number.">
                <input
                  id="settings-emergencyContactPhone"
                  name="emergencyContactPhone"
                  type="tel"
                  value={form.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="98765XXXXX"
                  maxLength={10}
                  className={inputCls}
                  style={errors.emergencyContactPhone ? { borderColor: '#f87171' } : {}}
                />
                {errors.emergencyContactPhone && (
                  <p className="text-red-500 text-xs mt-1">{errors.emergencyContactPhone}</p>
                )}
              </Field>
            </div>
          </Section>

          {/* ──── Save button ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 mb-5">
            <Link
              to={dashboardPath}
              className="px-5 py-2.5 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              id="save-profile-btn"
              disabled={saving}
              className="px-7 py-2.5 rounded-2xl text-white font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <CheckIcon size={15} />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>

          {/* ──── B) Security section ─────────────────────────────────────── */}
          <Section title="Security" icon={<LockIcon size={15} />}>
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setToast({ message: 'Change Password coming soon — stay tuned!', type: 'info' })}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-600">
                    <LockIcon size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Change Password</p>
                    <p className="text-xs text-gray-500 mt-0.5">Update your account password for security</p>
                  </div>
                </div>
                <ChevronIcon size={16} />
              </div>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-800 font-medium">
                🔐 Your account is protected by JWT authentication. For best security, use a unique strong password and do not share it.
              </p>
            </div>
          </Section>

          {/* ──── Account info pill ───────────────────────────────────────── */}
          <div className="text-center pb-8">
            <span className="inline-flex items-center gap-2 text-[11px] text-gray-400 bg-white border border-gray-100 px-3.5 py-1.5 rounded-full shadow-sm">
              <span>Signed in as</span>
              <strong className="text-gray-600">{user?.phone}</strong>
              <span className="capitalize font-semibold px-1.5 py-0.5 rounded-md text-[10px]"
                style={{ background: '#fff7ed', color: '#c2410c' }}>
                {user?.role}
              </span>
            </span>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
