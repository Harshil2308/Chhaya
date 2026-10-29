import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import SunPanel from '../components/SunPanel';
import { LanguageSwitcher } from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

const Spinner = () => <span className="spinner" />;

// ── Criteria evaluator for secure password ──
const evaluatePassword = (pwd) => {
  return {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd),
  };
};

function Register() {
  const { lang, setLang, tr } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'worker',
    occupation: 'other',
    location: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    language: lang || 'en'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [loading,      setLoading]      = useState(false);
  const navigate = useNavigate();

  // Evaluate password live
  const criteria = useMemo(() => evaluatePassword(formData.password), [formData.password]);
  const isPasswordSecure = useMemo(() => {
    return criteria.length && criteria.upper && criteria.lower && criteria.number && criteria.special;
  }, [criteria]);

  // Compute password strength score (0 to 5)
  const strength = useMemo(() => {
    if (!formData.password) {
      return { score: 0, label: '', color: '#e5e7eb', width: '0%' };
    }
    const metCount = Object.values(criteria).filter(Boolean).length;
    if (metCount <= 2) {
      return {
        score: 1,
        label: tr('register.passwordStrength.weak') || 'Weak',
        color: '#ef4444',
        width: '33%'
      };
    }
    if (metCount <= 4) {
      return {
        score: 2,
        label: tr('register.passwordStrength.medium') || 'Medium',
        color: '#f59e0b',
        width: '66%'
      };
    }
    return {
      score: 3,
      label: tr('register.passwordStrength.strong') || 'Strong',
      color: '#10b981',
      width: '100%'
    };
  }, [formData.password, criteria, tr]);

  // Phone validation status
  const phoneStarted = formData.phone.length > 0;
  const phoneInvalidStart = phoneStarted && !/^[6-9]/.test(formData.phone);
  const phoneComplete = formData.phone.length === 10 && /^[6-9]\d{9}$/.test(formData.phone);

  // Emergency contact phone validation status
  const emPhoneStarted = formData.emergencyContactPhone.length > 0;
  const emPhoneInvalidStart = emPhoneStarted && !/^[6-9]/.test(formData.emergencyContactPhone);
  const emPhoneComplete = formData.emergencyContactPhone.length === 10 && /^[6-9]\d{9}$/.test(formData.emergencyContactPhone);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'language') {
      setLang(value);
    }
  };

  // Sanitized phone input handler (digits only, max 10)
  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, phone: digitsOnly }));
  };

  // Sanitized emergency contact phone input handler (digits only, max 10)
  const handleEmergencyPhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, emergencyContactPhone: digitsOnly }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Validate required fields
    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.password ||
      !formData.role ||
      !formData.occupation ||
      !formData.location.trim() ||
      !formData.emergencyContactName.trim() ||
      !formData.emergencyContactPhone.trim() ||
      !formData.language
    ) {
      if (!formData.emergencyContactName.trim()) {
        setError(tr('register.emergencyContactNameRequired') || 'Emergency Contact Name is required');
        return;
      }
      if (!formData.emergencyContactPhone.trim()) {
        setError(tr('register.emergencyContactPhoneRequired') || 'Emergency Contact Phone is required');
        return;
      }
      setError(tr('register.allFieldsRequired') || 'All fields are required. Please fill in every section.');
      return;
    }

    // 2. Validate Indian phone number (10 digits starting with 6-9)
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      setError(tr('register.phoneInvalid') || 'Phone number must be a 10-digit number starting with 6, 7, 8, or 9');
      return;
    }

    // 3. Validate Emergency Contact Indian phone number (10 digits starting with 6-9)
    if (!/^[6-9]\d{9}$/.test(formData.emergencyContactPhone)) {
      setError(
        tr('register.emergencyContactPhoneInvalid') ||
        'Emergency contact phone must be a valid 10-digit Indian mobile number'
      );
      return;
    }

    // 4. Validate secure password
    if (!isPasswordSecure) {
      setError(
        tr('register.passwordInvalid') ||
        'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.'
      );
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await API.post('/auth/register', {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'worker',
        occupation: formData.occupation,
        location: formData.location.trim(),
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactPhone: formData.emergencyContactPhone.trim(),
        language: formData.language
      });
      setSuccess(tr('register.registerSuccess'));
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || tr('register.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.name.trim().length > 0 &&
    phoneComplete &&
    isPasswordSecure &&
    formData.location.trim().length > 0 &&
    formData.emergencyContactName.trim().length > 0 &&
    emPhoneComplete;

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT: Form ── */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-10 lg:px-14 overflow-y-auto relative"
        style={{ background: 'linear-gradient(145deg, #fdf0e0 0%, #fef6ec 45%, #fff8f2 100%)' }}
      >
        {/* Language switcher top right */}
        <div className="absolute top-5 right-5 sm:top-6 sm:right-6">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-md my-4">

          {/* Brand mark */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4.5" fill="white" />
                {[0,60,120,180,240,300].map((deg, i) => (
                  <line key={i} x1="12" y1="2.5" x2="12" y2="5"
                    stroke="white" strokeWidth="2.2" strokeLinecap="round"
                    transform={`rotate(${deg} 12 12)`} />
                ))}
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight" style={{ color: '#3d1a00' }}>Chhaya</span>
          </div>

          <h1 className="text-[1.7rem] font-extrabold leading-tight mb-1" style={{ color: '#2a1200' }}>
            {tr('register.title')}
          </h1>
          <p className="text-sm mb-5" style={{ color: '#a0674a' }}>
            {tr('register.subtitle')}
          </p>

          {error   && <div className="alert alert-error mb-4">⚠️ {error}</div>}
          {success && <div className="alert alert-success mb-4">✅ {success}</div>}

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Section: Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>
                  {tr('register.fullName')} <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder={tr('register.fullNamePlaceholder')}
                  className="chhaya-input"
                />
              </div>

              {/* Phone Number with 6-9 constraint */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>
                  {tr('register.phone')} <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    required
                    placeholder={tr('register.phonePlaceholder')}
                    className={`chhaya-input pr-14 ${
                      phoneInvalidStart
                        ? 'border-red-400 bg-red-50/60'
                        : phoneComplete
                        ? 'border-emerald-400'
                        : ''
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 select-none">
                    {formData.phone.length}/10
                  </span>
                </div>
                {/* Real-time hint / validation message */}
                {phoneInvalidStart ? (
                  <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{tr('register.phoneInvalid')}</span>
                  </p>
                ) : phoneStarted && formData.phone.length < 10 ? (
                  <p className="text-[11px] text-gray-500 mt-1">
                    {tr('register.phoneStartHint')}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Section: Secure Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold" style={{ color: '#5c2a0a' }}>
                  {tr('register.password')} <span className="text-red-500 font-bold">*</span>
                </label>
                {formData.password && (
                  <span className="text-xs font-bold" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder={tr('register.passwordPlaceholder')}
                  className="chhaya-input pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors p-1"
                  aria-label={showPassword ? tr('register.hidePassword') : tr('register.showPassword')}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength bar & criteria checklist */}
              {formData.password && (
                <div className="mt-2 space-y-2">
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{ width: strength.width, backgroundColor: strength.color }}
                    />
                  </div>

                  <div className="bg-white/80 border border-orange-200/70 rounded-xl p-3 text-xs space-y-1.5 shadow-xs">
                    <p className="font-semibold text-gray-700 mb-1">
                      {tr('register.passwordRequirementsTitle')}
                    </p>
                    {[
                      { key: 'length',  label: tr('register.passwordCriteria.length'),  met: criteria.length },
                      { key: 'upper',   label: tr('register.passwordCriteria.upper'),   met: criteria.upper },
                      { key: 'lower',   label: tr('register.passwordCriteria.lower'),   met: criteria.lower },
                      { key: 'number',  label: tr('register.passwordCriteria.number'),  met: criteria.number },
                      { key: 'special', label: tr('register.passwordCriteria.special'), met: criteria.special },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        {item.met ? (
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-[10px]">
                            •
                          </span>
                        )}
                        <span className={item.met ? 'text-emerald-700 font-medium' : 'text-gray-500'}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section: Role & Occupation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>
                  {tr('register.role')} <span className="text-red-500 font-bold">*</span>
                </label>
                <select name="role" value={formData.role} onChange={handleChange} required className="chhaya-input">
                  <option value="worker">{tr('register.roleWorker')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>
                  {tr('register.occupation')} <span className="text-red-500 font-bold">*</span>
                </label>
                <select name="occupation" value={formData.occupation} onChange={handleChange} required className="chhaya-input">
                  <option value="construction">{tr('register.occupations.construction')}</option>
                  <option value="farmer">{tr('register.occupations.farmer')}</option>
                  <option value="delivery">{tr('register.occupations.delivery')}</option>
                  <option value="vendor">{tr('register.occupations.vendor')}</option>
                  <option value="other">{tr('register.occupations.other')}</option>
                </select>
              </div>
            </div>

            {/* Section: Location / City */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>
                {tr('register.location')} <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                name="location"
                type="text"
                list="city-options"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder={tr('register.locationPlaceholder')}
                className="chhaya-input"
              />
              <datalist id="city-options">
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

            {/* Section: Emergency Contact */}
            <div className="rounded-2xl p-4 space-y-3.5" style={{ background: '#fff7ed', border: '1.5px solid #fdba74' }}>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                  <span>🆘</span>
                  <span>{tr('register.emergencyContactSectionTitle') || 'Emergency Contact'}</span>
                </h3>
                <p className="text-[11px] text-orange-700 mt-0.5">
                  {tr('register.emergencyContactSubtitle') || 'Required family or emergency contact for SOS assistance'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Emergency Contact Name */}
                <div>
                  <label htmlFor="emergencyContactName" className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>
                    {tr('register.emergencyContactName') || 'Emergency Contact Name'} <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    id="emergencyContactName"
                    name="emergencyContactName"
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    required
                    placeholder={tr('register.emergencyContactNamePlaceholder') || 'Mother / Father / Family Member'}
                    className="chhaya-input bg-white"
                  />
                  {error && !formData.emergencyContactName.trim() && (
                    <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>{tr('register.emergencyContactNameRequired') || 'Emergency Contact Name is required'}</span>
                    </p>
                  )}
                </div>

                {/* Emergency Contact Phone */}
                <div>
                  <label htmlFor="emergencyContactPhone" className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>
                    {tr('register.emergencyContactPhone') || 'Emergency Contact Phone'} <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="emergencyContactPhone"
                      name="emergencyContactPhone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.emergencyContactPhone}
                      onChange={handleEmergencyPhoneChange}
                      required
                      placeholder={tr('register.emergencyContactPhonePlaceholder') || '10-digit mobile number'}
                      className={`chhaya-input bg-white pr-14 ${
                        emPhoneInvalidStart
                          ? 'border-red-400 bg-red-50/60'
                          : emPhoneComplete
                          ? 'border-emerald-400'
                          : ''
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 select-none">
                      {formData.emergencyContactPhone.length}/10
                    </span>
                  </div>
                  {/* Real-time hint / validation message */}
                  {emPhoneInvalidStart ? (
                    <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>{tr('register.emergencyContactPhoneInvalid') || 'Emergency contact phone must be a valid 10-digit Indian mobile number'}</span>
                    </p>
                  ) : emPhoneStarted && formData.emergencyContactPhone.length < 10 ? (
                    <p className="text-[11px] text-gray-500 mt-1">
                      {tr('register.phoneStartHint') || 'Must be 10 digits starting with 6, 7, 8, or 9'}
                    </p>
                  ) : error && !formData.emergencyContactPhone.trim() ? (
                    <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>{tr('register.emergencyContactPhoneRequired') || 'Emergency Contact Phone is required'}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Section: Preferred Language */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>
                {tr('register.preferredLanguage')} <span className="text-red-500 font-bold">*</span>
              </label>
              <select name="language" value={formData.language} onChange={handleChange} required className="chhaya-input">
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`chhaya-btn-primary w-full py-3.5 mt-2 ${
                !isFormValid && !loading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {loading ? <><Spinner /> {tr('register.creatingAccount')}</> : tr('register.createAccount')}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#8a5a3a' }}>
            {tr('register.alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#c05000' }}>
              {tr('register.signIn')}
            </Link>
          </p>

          <p className="text-center text-xs mt-6" style={{ color: '#c08060' }}>
            {tr('register.footer')}
          </p>
        </div>
      </div>

      {/* ── RIGHT: Animated Sun ── */}
      <SunPanel
        title="Join Chhaya"
        subtitle={
          <>
            Create your account and stay safe<br />
            <span style={{ color: '#fde68a', fontWeight: 700 }}>Live alerts · Cooling centers</span><br />
            Safety tips for outdoor workers
          </>
        }
      />
    </div>
  );
}

export default Register;
