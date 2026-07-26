import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'worker',
    occupation: '',
    location: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await API.post('/auth/register', formData);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 ' +
    'bg-gray-50 focus:bg-white focus:border-orange-400 focus:ring-3 focus:ring-orange-100 outline-none transition-all duration-200';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 40%, #fef3c7 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-25"
        style={{ background: 'radial-gradient(circle, #fb923c, #fbbf24)' }} />
      <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #f97316, #fcd34d)' }} />

      <div className="relative w-full max-w-lg">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-10 border border-orange-100">

          {/* Header */}
          <div className="text-center mb-7">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}
            >
              <span className="text-2xl">🌤️</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Join Chhaya</h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">Create your account to get started</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-2xl mb-5 text-sm">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-3 rounded-2xl mb-5 text-sm">
              <span className="text-lg">✅</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Row 1: Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="10-digit number"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a strong password"
                className={inputClass}
              />
            </div>

            {/* Row 2: Role + Occupation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="worker">Worker</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Occupation</label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  placeholder="e.g. Construction Worker"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location / City</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Ahmedabad"
                className={inputClass}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl text-white font-semibold text-sm shadow-lg mt-2
                         transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              style={{ background: loading ? '#fdba74' : 'linear-gradient(135deg, #f97316, #f59e0b)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 00-8 8h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-500 font-semibold hover:text-orange-600 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Protecting outdoor workers from extreme heat 🌡️
        </p>
      </div>
    </div>
  );
}

export default Register;