import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

const Spinner = () => <span className="spinner" />;

/* ── Animated Sun Panel (shared) ── */
function SunPanel() {
  const heatWaves = [
    { left: '28%', height: 30, delay: '0s'   },
    { left: '38%', height: 40, delay: '0.5s' },
    { left: '48%', height: 26, delay: '1s'   },
    { left: '58%', height: 36, delay: '0.3s' },
    { left: '68%', height: 22, delay: '1.3s' },
    { left: '33%', height: 32, delay: '1.6s' },
    { left: '53%', height: 28, delay: '0.7s' },
    { left: '63%', height: 34, delay: '2s'   },
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
      {heatWaves.map((w, i) => (
        <div key={i} className="heat-wave"
          style={{ left: w.left, height: w.height, animationDelay: w.delay }} />
      ))}
      {particles.map((p, i) => (
        <div key={i} className="sun-particle"
          style={{ width: p.width, height: p.height, top: p.top, left: p.left, animationDuration: p.dur, animationDelay: p.delay }} />
      ))}

      <div className="sun-float flex flex-col items-center gap-8 px-10 z-10">
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          <svg width="200" height="200" viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0 }}>
            <circle className="sun-glow-1" cx="100" cy="100" r="96" fill="rgba(255,200,60,0.12)" />
            <circle className="sun-glow-2" cx="100" cy="100" r="82" fill="rgba(255,180,40,0.14)" />
            <circle className="sun-glow-3" cx="100" cy="100" r="68" fill="rgba(255,160,20,0.16)" />
          </svg>
          <svg className="sun-rays-outer" width="200" height="200" viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0 }}>
            {[0,22.5,45,67.5,90,112.5,135,157.5,180,202.5,225,247.5,270,292.5,315,337.5].map((deg, i) => (
              <line key={i} x1="100" y1="14" x2="100" y2="30"
                stroke="rgba(255,230,100,0.7)" strokeWidth={i % 2 === 0 ? 3 : 1.5} strokeLinecap="round"
                transform={`rotate(${deg} 100 100)`} />
            ))}
          </svg>
          <svg className="sun-rays-inner" width="200" height="200" viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0 }}>
            {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => (
              <line key={i} x1="100" y1="36" x2="100" y2="50"
                stroke="rgba(255,210,80,0.55)" strokeWidth="2" strokeLinecap="round"
                transform={`rotate(${deg} 100 100)`} />
            ))}
          </svg>
          <svg className="sun-core" width="200" height="200" viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0 }}>
            <circle cx="100" cy="100" r="56" fill="rgba(255,220,80,0.25)" />
            <circle cx="100" cy="100" r="46" fill="url(#sunGrad2)" />
            <circle cx="86" cy="87" r="12" fill="rgba(255,255,255,0.18)" />
            <defs>
              <radialGradient id="sunGrad2" cx="40%" cy="35%" r="65%">
                <stop offset="0%"   stopColor="#ffe566" />
                <stop offset="50%"  stopColor="#ffaa20" />
                <stop offset="100%" stopColor="#e06010" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        <div className="sun-tagline text-center text-white">
          <h2 className="text-2xl font-extrabold tracking-tight drop-shadow-lg">Join Chhaya</h2>
          <p className="text-white/80 mt-2 text-sm font-medium leading-relaxed max-w-xs">
            Create your account and stay safe<br />
            <span className="text-yellow-200 font-semibold">Live heat alerts · Cooling centers</span><br />
            Safety tips for outdoor workers
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {['🌡️ Live Heat Risk', '💧 Safety Tips', '📍 Cooling Centers'].map(tag => (
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

/* ── Register Page ── */
function Register() {
  const [formData, setFormData] = useState({
    name: '', phone: '', password: '', role: 'worker', occupation: '', location: ''
  });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setError(''); setSuccess(''); setLoading(true);
    try {
      await API.post('/auth/register', formData);
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#fff7f0' }}>

      {/* ── LEFT: Form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 lg:px-14 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Logo mark */}
          <div className="flex items-center gap-2.5 mb-7">
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

          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-400 mb-6">Join thousands of protected outdoor workers</p>

          {error   && <div className="alert alert-error   mb-4">⚠️ {error}</div>}
          {success && <div className="alert alert-success mb-4">✅ {success}</div>}

          <form onSubmit={handleRegister} className="space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input name="name" type="text" value={formData.name} onChange={handleChange}
                  required placeholder="Your full name" className="chhaya-input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <input name="phone" type="text" value={formData.phone} onChange={handleChange}
                  required placeholder="9876543210" className="chhaya-input" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input name="password" type="password" value={formData.password} onChange={handleChange}
                required placeholder="Create a strong password" className="chhaya-input" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
                <select name="role" value={formData.role} onChange={handleChange} className="chhaya-input">
                  <option value="worker">Worker</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Occupation</label>
                <input name="occupation" type="text" value={formData.occupation} onChange={handleChange}
                  placeholder="e.g. Construction Worker" className="chhaya-input" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location / City</label>
              <input name="location" type="text" value={formData.location} onChange={handleChange}
                placeholder="e.g. Ahmedabad" className="chhaya-input" />
            </div>

            <button type="submit" disabled={loading} className="chhaya-btn-primary w-full py-3.5 mt-1">
              {loading ? <><Spinner /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#e06010' }}>
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-6">
            Protecting outdoor workers from extreme heat
          </p>
        </div>
      </div>

      {/* ── RIGHT: Animated Sun ── */}
      <SunPanel />
    </div>
  );
}

export default Register;
