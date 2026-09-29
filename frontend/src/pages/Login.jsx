import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

const Spinner = () => <span className="spinner" />;

/* ── Animated Sun Panel ── */
function SunPanel() {
  const heatWaves = [
    { left: '30%', height: 28, delay: '0s'   },
    { left: '40%', height: 38, delay: '0.4s' },
    { left: '50%', height: 24, delay: '0.8s' },
    { left: '60%', height: 34, delay: '0.3s' },
    { left: '70%', height: 20, delay: '1.1s' },
    { left: '35%', height: 30, delay: '1.5s' },
    { left: '55%', height: 26, delay: '0.6s' },
    { left: '65%', height: 32, delay: '1.8s' },
  ];

  const particles = [
    { width: 8,  height: 8,  top: '55%', left: '25%', dur: '3.2s', delay: '0s'   },
    { width: 5,  height: 5,  top: '60%', left: '72%', dur: '2.8s', delay: '0.7s' },
    { width: 10, height: 10, top: '58%', left: '48%', dur: '3.8s', delay: '1.2s' },
    { width: 6,  height: 6,  top: '62%', left: '60%', dur: '2.5s', delay: '0.4s' },
    { width: 7,  height: 7,  top: '53%', left: '38%', dur: '3.5s', delay: '1.8s' },
    { width: 4,  height: 4,  top: '57%', left: '80%', dur: '2.9s', delay: '0.9s' },
  ];

  return (
    <div className="sun-panel hidden lg:flex flex-1">
      {/* Heat wave bars */}
      {heatWaves.map((w, i) => (
        <div
          key={i}
          className="heat-wave"
          style={{
            left: w.left,
            height: w.height,
            animationDelay: w.delay,
            animationDuration: '2.2s',
          }}
        />
      ))}

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="sun-particle"
          style={{
            width: p.width,
            height: p.height,
            top: p.top,
            left: p.left,
            animationDuration: p.dur,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* Sun + text */}
      <div className="sun-float flex flex-col items-center gap-8 px-10 z-10">

        {/* SVG Sun */}
        <div style={{ position: 'relative', width: 220, height: 220 }}>

          {/* Glow rings */}
          <svg width="220" height="220" viewBox="0 0 220 220" style={{ position: 'absolute', inset: 0 }}>
            <circle className="sun-glow-1" cx="110" cy="110" r="105" fill="rgba(255,200,60,0.12)" />
            <circle className="sun-glow-2" cx="110" cy="110" r="90"  fill="rgba(255,180,40,0.14)" />
            <circle className="sun-glow-3" cx="110" cy="110" r="75"  fill="rgba(255,160,20,0.16)" />
          </svg>

          {/* Outer rotating rays */}
          <svg
            className="sun-rays-outer"
            width="220" height="220" viewBox="0 0 220 220"
            style={{ position: 'absolute', inset: 0 }}
          >
            {[0,22.5,45,67.5,90,112.5,135,157.5,180,202.5,225,247.5,270,292.5,315,337.5].map((deg, i) => (
              <line
                key={i}
                x1="110" y1="18"
                x2="110" y2="36"
                stroke="rgba(255,230,100,0.7)"
                strokeWidth={i % 2 === 0 ? 3 : 1.5}
                strokeLinecap="round"
                transform={`rotate(${deg} 110 110)`}
              />
            ))}
          </svg>

          {/* Inner counter-rotating rays */}
          <svg
            className="sun-rays-inner"
            width="220" height="220" viewBox="0 0 220 220"
            style={{ position: 'absolute', inset: 0 }}
          >
            {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => (
              <line
                key={i}
                x1="110" y1="44"
                x2="110" y2="58"
                stroke="rgba(255,210,80,0.55)"
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${deg} 110 110)`}
              />
            ))}
          </svg>

          {/* Sun core */}
          <svg
            className="sun-core"
            width="220" height="220" viewBox="0 0 220 220"
            style={{ position: 'absolute', inset: 0 }}
          >
            {/* Core glow */}
            <circle cx="110" cy="110" r="62" fill="rgba(255,220,80,0.25)" />
            {/* Core body */}
            <circle cx="110" cy="110" r="52" fill="url(#sunGrad)" />
            {/* Highlight */}
            <circle cx="95" cy="96" r="14" fill="rgba(255,255,255,0.18)" />
            <defs>
              <radialGradient id="sunGrad" cx="40%" cy="35%" r="65%">
                <stop offset="0%"   stopColor="#ffe566" />
                <stop offset="50%"  stopColor="#ffaa20" />
                <stop offset="100%" stopColor="#e06010" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Text content */}
        <div className="sun-tagline text-center text-white">
          <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-lg">
            Chhaya
          </h2>
          <p className="text-white/80 mt-2 text-sm font-medium leading-relaxed max-w-xs">
            Heatwave Early Warning System<br />
            <span className="text-yellow-200 font-semibold">Protecting outdoor workers</span><br />
            from extreme heat across India
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {['🌡️ Live Heat Risk','💧 Safety Tips','📍 Cooling Centers'].map(tag => (
              <span key={tag}
                className="text-xs bg-white/15 border border-white/25 text-white px-3 py-1.5 rounded-full backdrop-blur-sm font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Login Page ── */
function Login() {
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
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
    <div className="min-h-screen flex" style={{ background: '#fff7f0' }}>

      {/* ── LEFT: Form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-14">
        <div className="w-full max-w-sm">

          {/* Logo mark */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4.5" fill="white" />
                {[0,60,120,180,240,300].map((deg, i) => (
                  <line key={i} x1="12" y1="2.5" x2="12" y2="5"
                    stroke="white" strokeWidth="2" strokeLinecap="round"
                    transform={`rotate(${deg} 12 12)`} />
                ))}
              </svg>
            </div>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">Chhaya</span>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome back 👋</h1>
          <p className="text-sm text-gray-400 mb-7">Sign in to your account to continue</p>

          {error && <div className="alert alert-error mb-5">⚠️ {error}</div>}

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
              className="chhaya-btn-primary w-full py-3.5 mt-1"
            >
              {loading ? <><Spinner /> Signing in...</> : 'Sign in to Chhaya'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold hover:underline"
              style={{ color: '#e06010' }}>
              Create account
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-8">
            Protecting outdoor workers from extreme heat
          </p>
        </div>
      </div>

      {/* ── RIGHT: Animated Sun ── */}
      <SunPanel />
    </div>
  );
}

export default Login;
