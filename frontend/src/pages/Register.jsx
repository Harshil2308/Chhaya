import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import SunPanel from '../components/SunPanel';

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
    <div className="min-h-screen flex">

      {/* ── LEFT: Form ── */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-10 lg:px-14 overflow-y-auto"
        style={{ background: 'linear-gradient(145deg, #fdf0e0 0%, #fef6ec 45%, #fff8f2 100%)' }}
      >
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
            Create your account
          </h1>
          <p className="text-sm mb-6" style={{ color: '#a0674a' }}>
            Join thousands of protected outdoor workers
          </p>

          {error   && <div className="alert alert-error   mb-4">⚠️ {error}</div>}
          {success && <div className="alert alert-success mb-4">✅ {success}</div>}

          <form onSubmit={handleRegister} className="space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>Full Name</label>
                <input name="name" type="text" value={formData.name} onChange={handleChange}
                  required placeholder="Your full name" className="chhaya-input" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>Phone Number</label>
                <input name="phone" type="text" value={formData.phone} onChange={handleChange}
                  required placeholder="9876543210" className="chhaya-input" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>Password</label>
              <input name="password" type="password" value={formData.password} onChange={handleChange}
                required placeholder="Create a strong password" className="chhaya-input" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>Role</label>
                <select name="role" value={formData.role} onChange={handleChange} className="chhaya-input">
                  <option value="worker">Worker</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>Occupation</label>
                <input name="occupation" type="text" value={formData.occupation} onChange={handleChange}
                  placeholder="e.g. Construction Worker" className="chhaya-input" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5c2a0a' }}>Location / City</label>
              <input name="location" type="text" value={formData.location} onChange={handleChange}
                placeholder="e.g. Ahmedabad" className="chhaya-input" />
            </div>

            <button type="submit" disabled={loading} className="chhaya-btn-primary w-full py-3.5 mt-1">
              {loading ? <><Spinner /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#8a5a3a' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#c05000' }}>
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs mt-6" style={{ color: '#c08060' }}>
            Protecting outdoor workers from extreme heat
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
