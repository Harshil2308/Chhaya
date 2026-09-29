import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

/* ── Sun SVG logo ── */
const SunIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="4.5" fill="white" />
    {[0,45,90,135,180,225,270,315].map((deg, i) => (
      <line
        key={i}
        x1="12" y1="2.5" x2="12" y2="4.5"
        stroke="white" strokeWidth="2" strokeLinecap="round"
        transform={`rotate(${deg} 12 12)`}
      />
    ))}
  </svg>
);

/* ── Spinner ── */
const Spinner = () => <span className="spinner" />;

function Login() {
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { phone, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* ── Card ── */}
        <div className="chhaya-card p-8 sm:p-10">

          {/* Logo + heading */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md"
              style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}
            >
              <SunIcon />
            </div>
            <h1 className="text-[1.75rem] font-extrabold text-gray-900 tracking-tight leading-none">Chhaya</h1>
            <p className="text-sm text-gray-400 mt-1.5 font-medium text-center">Heatwave Early Warning System</p>
          </div>

          {/* Error */}
          {error && <div className="alert alert-error mb-5">⚠️ {error}</div>}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="login-phone">
                Phone Number
              </label>
              <input
                id="login-phone"
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                placeholder="9876543210"
                className="chhaya-input"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="chhaya-input"
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="chhaya-btn-primary w-full mt-2 py-3.5"
            >
              {loading ? <><Spinner /> Signing in...</> : 'Sign in to Chhaya'}
            </button>
          </form>

          {/* Footer links */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-orange-500 font-semibold hover:text-orange-600 transition-colors">
              Create account
            </Link>
          </p>
        </div>

        {/* Tagline */}
        <p className="text-center text-xs text-gray-400 mt-5">
          Protecting outdoor workers from extreme heat
        </p>
      </div>
    </div>
  );
}

export default Login;
