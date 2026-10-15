import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import SunPanel from '../components/SunPanel';
import { LanguageSwitcher } from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

const Spinner = () => <span className="spinner" />;

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
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'language') {
      setLang(value);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      setError(tr('register.phoneInvalid'));
      return;
    }
    if (formData.emergencyContactPhone && !/^[6-9]\d{9}$/.test(formData.emergencyContactPhone)) {
      setError(tr('register.emergencyContactPhoneInvalid'));
      return;
    }
    setError(''); setSuccess(''); setLoading(true);
    try {
      await API.post('/auth/register', formData);
      setSuccess(tr('register.registerSuccess'));
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || tr('register.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

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

        <div className="w-full max-w-md">

          {/* Brand mark */}
          <div className="flex items-center gap-2.5 mb-7">
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
          <p className="text-sm mb-6" style={{ color: '#a0674a' }}>
            {tr('register.subtitle')}
          </p>

          {error   && <div className="alert alert-error   mb-4">⚠️ {error}</div>}
          {success && <div className="alert alert-success mb-4">✅ {success}</div>}

          <form onSubmit={handleRegister} className="space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>
                  {tr('register.fullName')}
                </label>
                <input name="name" type="text" value={formData.name} onChange={handleChange}
                  required placeholder={tr('register.fullNamePlaceholder')} className="chhaya-input" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>
                  {tr('register.phone')}
                </label>
                <input name="phone" type="text" value={formData.phone} onChange={handleChange}
                  required placeholder={tr('register.phonePlaceholder')} className="chhaya-input" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>
                {tr('register.password')}
              </label>
              <input name="password" type="password" value={formData.password} onChange={handleChange}
                required placeholder={tr('register.passwordPlaceholder')} className="chhaya-input" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>
                  {tr('register.role')}
                </label>
                <select name="role" value={formData.role} onChange={handleChange} className="chhaya-input">
                  <option value="worker">{tr('register.roleWorker')}</option>
                  <option value="manager">{tr('register.roleManager')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>
                  {tr('register.occupation')}
                </label>
                <select name="occupation" value={formData.occupation} onChange={handleChange} className="chhaya-input">
                  <option value="construction">{tr('register.occupations.construction')}</option>
                  <option value="farmer">{tr('register.occupations.farmer')}</option>
                  <option value="delivery">{tr('register.occupations.delivery')}</option>
                  <option value="vendor">{tr('register.occupations.vendor')}</option>
                  <option value="other">{tr('register.occupations.other')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>
                {tr('register.location')}
              </label>
              <input name="location" type="text" value={formData.location} onChange={handleChange}
                placeholder={tr('register.locationPlaceholder')} className="chhaya-input" />
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>
                {tr('register.preferredLanguage')}
              </label>
              <select name="language" value={formData.language} onChange={handleChange} className="chhaya-input">
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="chhaya-btn-primary w-full py-3.5 mt-1">
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
