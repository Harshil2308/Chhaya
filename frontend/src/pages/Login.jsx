import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import SunPanel from '../components/SunPanel';
import { LanguageSwitcher } from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

const Spinner = () => <span className="spinner" />;

function Login() {
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();
  const { tr } = useLanguage();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError(tr('login.phoneInvalid'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { phone, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate(res.data.user.role === 'admin' ? '/admin' : res.data.user.role === 'manager' ? '/manager' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || tr('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT: Form ── */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-14 relative"
        style={{ background: 'linear-gradient(145deg, #fdf0e0 0%, #fef6ec 45%, #fff8f2 100%)' }}
      >
        {/* Language switcher top right */}
        <div className="absolute top-5 right-5 sm:top-6 sm:right-6">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-sm">

          {/* Brand mark */}
          <div className="flex items-center gap-2.5 mb-8">
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
            {tr('login.welcome')}
          </h1>
          <p className="text-sm mb-7" style={{ color: '#a0674a' }}>{tr('login.subtitle')}</p>

          {error && <div className="alert alert-error mb-5">⚠️ {error}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" htmlFor="login-phone"
                style={{ color: '#5c2a0a' }}>
                {tr('login.phone')}
              </label>
              <input
                id="login-phone"
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                placeholder={tr('login.phonePlaceholder')}
                className="chhaya-input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" htmlFor="login-password"
                style={{ color: '#5c2a0a' }}>
                {tr('login.password')}
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder={tr('login.passwordPlaceholder')}
                className="chhaya-input"
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="chhaya-btn-primary w-full py-3.5 mt-1"
            >
              {loading ? <><Spinner /> {tr('login.signingIn')}</> : tr('login.signInBtn')}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#8a5a3a' }}>
            {tr('login.dontHaveAccount')}{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: '#c05000' }}>
              {tr('login.createAccount')}
            </Link>
          </p>

          <p className="text-center text-xs mt-8" style={{ color: '#c08060' }}>
            {tr('login.footer')}
          </p>
        </div>
      </div>

      {/* ── RIGHT: Animated Sun ── */}
      <SunPanel />
    </div>
  );
}

export default Login;
