import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar({ user }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-orange-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}
            >
              <span className="text-lg leading-none">☀️</span>
            </div>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">Chhaya</span>
          </div>

          {/* Desktop right section */}
          {user && (
            <div className="hidden sm:flex items-center gap-4">
              {/* User badge */}
              <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-orange-500 capitalize font-medium">{user.role}</p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold
                           border border-red-200 text-red-600 bg-red-50
                           hover:bg-red-500 hover:text-white hover:border-red-500
                           transition-all duration-200"
              >
                <span>→</span>
                Logout
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          {user && (
            <button
              className="sm:hidden p-2 rounded-xl text-gray-600 hover:bg-orange-50 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>

        {/* Mobile dropdown */}
        {user && menuOpen && (
          <div className="sm:hidden border-t border-orange-100 py-4 space-y-3 px-2">
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-2xl">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-orange-500 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold
                         bg-red-50 text-red-600 border border-red-200
                         hover:bg-red-500 hover:text-white transition-all duration-200"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;