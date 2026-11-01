import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Spinner = () => <span className="spinner mr-2" />;

// Helper to resize image using canvas to keep base64 payload ~50-80KB
function resizeImage(source, maxWidth = 400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}

function Settings() {
  const navigate = useNavigate();
  const { user, token, updateUser, login: authLogin } = useAuth();
  const { tr, setLang } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    language: 'en',
    emergencyContactName: '',
    emergencyContactPhone: '',
    occupation: 'other',
    profilePhoto: '',
    role: 'worker'
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Camera modal state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraStream, setCameraStream] = useState(null);

  // Password modal / expansion
  const [showPasswordNotice, setShowPasswordNotice] = useState(false);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Authenticate & load current profile data
  useEffect(() => {
    const storedToken = token || localStorage.getItem('token');
    const storedUserStr = localStorage.getItem('user');

    if (!storedToken || !storedUserStr) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = user || JSON.parse(storedUserStr);
      setFormData({
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        phone: parsedUser.phone || '',
        location: parsedUser.location || '',
        language: parsedUser.language || 'en',
        emergencyContactName: parsedUser.emergencyContactName || '',
        emergencyContactPhone: parsedUser.emergencyContactPhone || '',
        occupation: parsedUser.occupation || 'other',
        profilePhoto: parsedUser.profilePhoto || '',
        role: parsedUser.role || 'worker'
      });
    } catch (e) {
      navigate('/login');
      return;
    }

    // Fetch fresh profile from backend
    API.get('/auth/me')
      .then((res) => {
        if (res.data) {
          const u = res.data;
          setFormData({
            name: u.name || '',
            email: u.email || '',
            phone: u.phone || '',
            location: u.location || '',
            language: u.language || 'en',
            emergencyContactName: u.emergencyContactName || '',
            emergencyContactPhone: u.emergencyContactPhone || '',
            occupation: u.occupation || 'other',
            profilePhoto: u.profilePhoto || '',
            role: u.role || 'worker'
          });
          if (updateUser) {
            updateUser(u);
          } else {
            localStorage.setItem('user', JSON.stringify(u));
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch latest user data:', err.message);
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, [navigate, token, user, updateUser]);

  // Clean up camera stream when cameraActive turns false or component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle live device camera start
  const handleStartCamera = async () => {
    setCameraError('');
    setCameraActive(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported on this device/browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(
        tr('settings.cameraError') ||
          'Could not access device camera. Please check camera permissions.'
      );
    }
  };

  // Re-attach stream if video element mounts after stream is set
  useEffect(() => {
    if (cameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive, cameraStream]);

  // Stop camera tracks cleanly
  const handleStopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
    setCameraError('');
  };

  // Capture frame from video stream
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 400, video.videoHeight || 400);

    // Square crop for avatar
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    const startX = ((video.videoWidth || 400) - size) / 2;
    const startY = ((video.videoHeight || 400) - size) / 2;

    ctx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setFormData((prev) => ({ ...prev, profilePhoto: photoDataUrl }));
    handleStopCamera();
  };

  // Choose from Gallery (file input)
  const handleGallerySelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resized = await resizeImage(file, 400, 0.85);
      setFormData((prev) => ({ ...prev, profilePhoto: resized }));
    } catch (err) {
      console.error('Failed to process selected image:', err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to process selected image. Please try another file.'
      });
    } finally {
      e.target.value = '';
    }
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, profilePhoto: '' }));
  };

  // Generic form field handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Phone number digits-only handler (max 10)
  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: digitsOnly }));
  };

  // Emergency phone digits-only handler (max 10)
  const handleEmergencyPhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, emergencyContactPhone: digitsOnly }));
  };

  // Form submit handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    // 1. Name validation
    if (!formData.name.trim()) {
      setStatusMessage({
        type: 'error',
        text: tr('settings.nameRequired') || 'Full Name cannot be empty'
      });
      return;
    }

    // 2. Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      setStatusMessage({
        type: 'error',
        text:
          tr('settings.phoneInvalid') ||
          'Phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'
      });
      return;
    }

    // 3. Email validation (if provided)
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setStatusMessage({
          type: 'error',
          text: tr('settings.emailInvalid') || 'Please enter a valid email address'
        });
        return;
      }
    }

    // 4. Emergency phone validation (if provided)
    if (formData.emergencyContactPhone.trim()) {
      if (!phoneRegex.test(formData.emergencyContactPhone.trim())) {
        setStatusMessage({
          type: 'error',
          text:
            tr('settings.emergencyPhoneInvalid') ||
            'Emergency contact phone must be a valid 10-digit Indian mobile number'
        });
        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        language: formData.language,
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactPhone: formData.emergencyContactPhone.trim(),
        profilePhoto: formData.profilePhoto,
        // Send occupation only for worker role
        ...(formData.role === 'worker' ? { occupation: formData.occupation } : {})
      };

      const res = await API.put('/auth/me', payload);
      const updatedUser = res.data.user;

      // Update state and persistent stores
      if (updateUser) {
        updateUser(updatedUser);
      } else if (authLogin) {
        authLogin(updatedUser, token || localStorage.getItem('token'));
      } else {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      // Sync language context
      if (updatedUser.language) {
        setLang(updatedUser.language);
      }
      window.dispatchEvent(new Event('chhaya-user-loaded'));

      setStatusMessage({
        type: 'success',
        text: tr('settings.savedSuccess') || 'Profile updated successfully!'
      });

      // Scroll to top to ensure toast is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to update profile:', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const phoneStarted = formData.phone.length > 0;
  const phoneInvalidStart = phoneStarted && !/^[6-9]/.test(formData.phone);
  const phoneComplete = formData.phone.length === 10 && /^[6-9]\d{9}$/.test(formData.phone);

  const backDestination =
    formData.role === 'admin'
      ? '/admin'
      : formData.role === 'manager'
      ? '/manager'
      : '/dashboard';

  return (
    <div
      className="min-h-screen pb-16 relative"
      style={{
        background: 'linear-gradient(145deg, #fdf0e0 0%, #fef6ec 45%, #fff8f2 100%)'
      }}
    >
      {/* Top Navbar */}
      <Navbar user={formData} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Header Breadcrumb / Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => navigate(backDestination)}
                className="text-xs font-semibold text-orange-600 hover:text-orange-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>←</span>
                <span>{tr('common.back')}</span>
              </button>
              <span className="text-gray-300">/</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {formData.role === 'admin'
                  ? 'Admin Settings'
                  : formData.role === 'manager'
                  ? 'Manager Settings'
                  : 'Worker Settings'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {tr('settings.title')}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{tr('settings.subtitle')}</p>
          </div>

          <span
            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs"
            style={{
              background:
                formData.role === 'admin'
                  ? '#fee2e2'
                  : formData.role === 'manager'
                  ? '#fef3c7'
                  : '#ffedd5',
              color:
                formData.role === 'admin'
                  ? '#b91c1c'
                  : formData.role === 'manager'
                  ? '#b45309'
                  : '#c2410c',
              borderColor:
                formData.role === 'admin'
                  ? '#fca5a5'
                  : formData.role === 'manager'
                  ? '#fde68a'
                  : '#fdba74'
            }}
          >
            {formData.role}
          </span>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div
            className={`alert mb-6 shadow-sm flex items-center gap-2 ${
              statusMessage.type === 'success' ? 'alert-success' : 'alert-error'
            }`}
          >
            <span className="text-lg">{statusMessage.type === 'success' ? '✅' : '⚠️'}</span>
            <span className="text-sm font-semibold">{statusMessage.text}</span>
          </div>
        )}

        {initialLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-orange-100 shadow-sm">
            <span className="spinner mb-2 inline-block" />
            <p className="text-sm text-gray-500 font-medium">{tr('common.loading')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SECTION A: Profile Information                                 */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm">
              <div className="border-b border-orange-100/70 pb-4 mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                  <span>{tr('settings.profileInfoTitle')}</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {tr('settings.profileInfoSubtitle')}
                </p>
              </div>

              {/* Profile Photo Avatar & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 p-5 rounded-2xl bg-orange-50/50 border border-orange-100/60">
                <div className="relative group shrink-0">
                  {formData.profilePhoto ? (
                    <img
                      src={formData.profilePhoto}
                      alt={formData.name || 'User'}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-md border-3 border-orange-300"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-md border-3 border-orange-300 select-none"
                      style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}
                    >
                      {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {formData.name || 'Your Profile Picture'}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3.5">
                    Take a live camera photo or upload an image file from your device.
                  </p>

                  {/* Photo Actions */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    {/* Take Photo button (Live Camera) */}
                    <button
                      type="button"
                      id="settings-take-photo-btn"
                      onClick={handleStartCamera}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-orange-700 border border-orange-300 hover:bg-orange-50 hover:border-orange-400 transition-all shadow-2xs cursor-pointer active:scale-95"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                        <circle cx="12" cy="13" r="3"/>
                      </svg>
                      <span>{tr('settings.takePhoto')}</span>
                    </button>

                    {/* Choose from Gallery button */}
                    <button
                      type="button"
                      id="settings-gallery-btn"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-2xs cursor-pointer active:scale-95"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span>{tr('settings.chooseGallery')}</span>
                    </button>

                    {/* Hidden file input */}
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleGallerySelect}
                    />

                    {/* Remove Photo button */}
                    {formData.profilePhoto && (
                      <button
                        type="button"
                        id="settings-remove-photo-btn"
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50/80 border border-red-200 hover:bg-red-100 transition-all cursor-pointer active:scale-95"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        <span>{tr('settings.removePhoto')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <form onSubmit={handleSaveProfile} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="settings-name"
                      className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5"
                    >
                      {tr('settings.fullName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="settings-name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={tr('settings.fullNamePlaceholder')}
                      className="chhaya-input bg-white"
                    />
                  </div>

                  {/* Email (Optional) */}
                  <div>
                    <label
                      htmlFor="settings-email"
                      className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5"
                    >
                      {tr('settings.email')}
                    </label>
                    <input
                      id="settings-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={tr('settings.emailPlaceholder')}
                      className="chhaya-input bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone Number (Editable with 10-digit validation) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="settings-phone"
                        className="block text-xs font-bold text-gray-700 uppercase tracking-wide"
                      >
                        {tr('settings.phone')} <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] font-semibold text-gray-400">
                        {formData.phone.length}/10
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        id="settings-phone"
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        required
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder={tr('settings.phonePlaceholder')}
                        className={`chhaya-input bg-white ${
                          phoneInvalidStart
                            ? 'border-red-400 bg-red-50/60'
                            : phoneComplete
                            ? 'border-emerald-400'
                            : ''
                        }`}
                      />
                    </div>
                    {phoneInvalidStart && (
                      <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>{tr('settings.phoneInvalid')}</span>
                      </p>
                    )}
                  </div>

                  {/* Location / City */}
                  <div>
                    <label
                      htmlFor="settings-location"
                      className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5"
                    >
                      {tr('settings.location')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="settings-location"
                      name="location"
                      type="text"
                      list="settings-city-options"
                      required
                      value={formData.location}
                      onChange={handleChange}
                      placeholder={tr('settings.locationPlaceholder')}
                      className="chhaya-input bg-white"
                    />
                    <datalist id="settings-city-options">
                      <option value="Ahmedabad" />
                      <option value="Surat" />
                      <option value="Vadodara" />
                      <option value="Rajkot" />
                      <option value="Bhavnagar" />
                      <option value="Jamnagar" />
                      <option value="Gandhinagar" />
                      <option value="Junagadh" />
                      <option value="Anand" />
                      <option value="Navsari" />
                      <option value="Morbi" />
                      <option value="Bharuch" />
                      <option value="Mehsana" />
                      <option value="Bhuj" />
                      <option value="Porbandar" />
                      <option value="Vapi" />
                      <option value="Mumbai" />
                      <option value="Delhi" />
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Preferred Language */}
                  <div>
                    <label
                      htmlFor="settings-language"
                      className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5"
                    >
                      {tr('settings.language')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="settings-language"
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className="chhaya-input bg-white cursor-pointer"
                    >
                      <option value="en">English (EN)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="gu">ગુજરાતી (Gujarati)</option>
                    </select>
                  </div>

                  {/* Occupation / Work Sector: VISIBLE ONLY FOR WORKER ROLE */}
                  {formData.role === 'worker' ? (
                    <div>
                      <label
                        htmlFor="settings-occupation"
                        className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5"
                      >
                        {tr('settings.occupation')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="settings-occupation"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        className="chhaya-input bg-white cursor-pointer"
                      >
                        <option value="construction">
                          {tr('register.occupations.construction') || 'Construction Worker'}
                        </option>
                        <option value="farmer">
                          {tr('register.occupations.farmer') || 'Farmer'}
                        </option>
                        <option value="delivery">
                          {tr('register.occupations.delivery') || 'Delivery Person'}
                        </option>
                        <option value="vendor">
                          {tr('register.occupations.vendor') || 'Street Vendor'}
                        </option>
                        <option value="other">
                          {tr('register.occupations.other') || 'Outdoor Worker'}
                        </option>
                      </select>
                    </div>
                  ) : (
                    /* Show role badge card for non-workers */
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Account Role
                      </label>
                      <div className="chhaya-input bg-gray-50 border-gray-200 text-gray-700 font-semibold capitalize flex items-center justify-between">
                        <span>{formData.role}</span>
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full uppercase">
                          System Role
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Emergency Contact Information */}
                <div className="pt-2 border-t border-orange-100/60 mt-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-900 mb-3">
                    Emergency Contact Details (for SOS & alerts)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="settings-emergency-name"
                        className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5"
                      >
                        {tr('settings.emergencyName')}
                      </label>
                      <input
                        id="settings-emergency-name"
                        name="emergencyContactName"
                        type="text"
                        value={formData.emergencyContactName}
                        onChange={handleChange}
                        placeholder={tr('settings.emergencyNamePlaceholder')}
                        className="chhaya-input bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="settings-emergency-phone"
                          className="block text-xs font-bold text-gray-700 uppercase tracking-wide"
                        >
                          {tr('settings.emergencyPhone')}
                        </label>
                        {formData.emergencyContactPhone && (
                          <span className="text-[11px] font-semibold text-gray-400">
                            {formData.emergencyContactPhone.length}/10
                          </span>
                        )}
                      </div>
                      <input
                        id="settings-emergency-phone"
                        name="emergencyContactPhone"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={formData.emergencyContactPhone}
                        onChange={handleEmergencyPhoneChange}
                        placeholder={tr('settings.emergencyPhonePlaceholder')}
                        className="chhaya-input bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 flex items-center justify-end">
                  <button
                    type="submit"
                    id="settings-save-profile-btn"
                    disabled={saving}
                    className="chhaya-btn-primary px-8 py-3.5 text-sm font-bold flex items-center justify-center cursor-pointer disabled:opacity-60 shadow-md active:scale-98"
                  >
                    {saving ? (
                      <>
                        <Spinner />
                        <span>{tr('settings.saving')}</span>
                      </>
                    ) : (
                      <span>{tr('settings.saveChanges')}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SECTION B: Security & Password                                 */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm">
              <div className="border-b border-orange-100/70 pb-4 mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>{tr('settings.securityTitle')}</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {tr('settings.securitySubtitle')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-orange-50/50 border border-orange-100/60">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-0.5">Password</h3>
                  <p className="text-xs text-gray-500">
                    Keep your account secure by using a strong password.
                  </p>
                </div>

                <button
                  type="button"
                  id="settings-change-password-btn"
                  onClick={() => setShowPasswordNotice(!showPasswordNotice)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-orange-200 bg-white text-orange-800 hover:bg-orange-50 hover:border-orange-300 transition-all shadow-2xs cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-1.5 1.5L4 19l-2 3 3-2 13.5-13.5M16 5l3 3"/>
                  </svg>
                  <span>{tr('settings.changePassword')}</span>
                </button>
              </div>

              {/* Notice modal / expandable alert */}
              {showPasswordNotice && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <span>ℹ️</span>
                    <span>{tr('settings.changePassword')}</span>
                  </div>
                  <p>{tr('settings.changePasswordNotice')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Live Device Camera Modal                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-orange-200 animate-scaleUp">
            {/* Modal header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  📷
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {tr('settings.cameraModalTitle')}
                  </h3>
                  <p className="text-[11px] text-gray-500">Center your face and tap capture</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStopCamera}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
                aria-label="Close Camera"
              >
                ✕
              </button>
            </div>

            {/* Video preview / error */}
            <div className="p-4 sm:p-5 flex flex-col items-center">
              {cameraError ? (
                <div className="w-full py-12 px-4 rounded-2xl bg-red-50 border border-red-200 text-center">
                  <p className="text-2xl mb-2">⚠️</p>
                  <p className="text-sm font-bold text-red-700 mb-1">Camera Permission Required</p>
                  <p className="text-xs text-red-600">{cameraError}</p>
                </div>
              ) : (
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-orange-400 shadow-inner bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  {/* Subtle target circle */}
                  <div className="absolute inset-4 rounded-full border-2 border-white/40 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Modal footer action buttons */}
            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleStopCamera}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                {tr('settings.cancelCamera')}
              </button>

              {!cameraError && (
                <button
                  type="button"
                  id="camera-capture-btn"
                  onClick={handleCapturePhoto}
                  className="chhaya-btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>📸</span>
                  <span>{tr('settings.capture')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;

