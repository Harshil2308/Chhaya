import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

const SunIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="4.5" fill="white" />
    {[0,45,90,135,180,225,270,315].map((deg, i) => (
      <line key={i} x1="12" y1="2.5" x2="12" y2="4.5"
        stroke="white" strokeWidth="2" strokeLinecap="round"
        transform={`rotate(${deg} 12 12)`} />
    ))}
  </svg>
);

const Spinner = () => <span className="spinner" />;

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
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* ── Card ── */}
        <div className="chhaya-card p-8 sm:p-10">

          {/* Logo + heading */}
          <div className="flex flex-col items-center mb-7">
            <div
              className="w-13 h-13 rounded-2xl flex items-center justify-center mb-4 shadow-md"
              style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#e06010,#c97d08)' }}
            >
              <SunIcon />
            </div>
            <h1 className="text-[1.65rem] font-extrabold text-gray-900 tracking-tight leading-none">Join Chhaya</h1>
            <p className="text-sm text-gray-400 mt-1.5 font-medium">Create your account to get started</p>
          </div>

          {/* Alerts */}
          {error   && <div className="alert alert-error   mb-5">⚠️ {error}</div>}
          {success && <div className="alert alert-success mb-5">✅ {success}</div>}

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Row: Name + Phone */}
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

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input name="password" type="password" value={formData.password} onChange={handleChange}
                required placeholder="Create a strong password" className="chhaya-input" />
            </div>

            {/* Row: Role + Occupation */}
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

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location / City</label>
              <input name="location" type="text" value={formData.location} onChange={handleChange}
                placeholder="e.g. Ahmedabad" className="chhaya-input" />
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="chhaya-btn-primary w-full py-3.5 mt-1">
              {loading ? <><Spinner /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-500 font-semibold hover:text-orange-600 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Protecting outdoor workers from extreme heat
        </p>
      </div>
    </div>
  );
}

export default Register;
