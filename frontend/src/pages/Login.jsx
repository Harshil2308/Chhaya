import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/login', { phone, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 40%, #fef3c7 100%)' }}>

      {/* Decorative blobs */}
      <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, #fb923c, #fbbf24)' }} />
      <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #f97316, #fcd34d)' }} />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-10 border border-orange-100">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
              <span className="text-3xl">☀️</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Chhaya</h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">Heatwave Early Warning System</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-2xl mb-6 text-sm">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg select-none">📱</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="Enter your phone number"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400
                             bg-gray-50 focus:bg-white focus:border-orange-400 focus:ring-3 focus:ring-orange-100 outline-none
                             transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg select-none">🔒</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400
                             bg-gray-50 focus:bg-white focus:border-orange-400 focus:ring-3 focus:ring-orange-100 outline-none
                             transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl text-white font-semibold text-sm shadow-lg
                         transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              style={{ background: loading ? '#fdba74' : 'linear-gradient(135deg, #f97316, #f59e0b)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 00-8 8h4z"/>
                  </svg>
                  Logging in...
                </span>
              ) : 'Sign in to Chhaya'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-orange-500 font-semibold hover:text-orange-600 transition-colors">
              Create account
            </Link>
          </p>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Protecting outdoor workers from extreme heat 🌡️
        </p>
      </div>
    </div>
  );
}

export default Login;