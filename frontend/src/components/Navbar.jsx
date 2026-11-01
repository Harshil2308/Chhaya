import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const SunIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="4.5" fill="white" />
    {[0,45,90,135,180,225,270,315].map((deg, i) => (
      <line key={i} x1="12" y1="2.5" x2="12" y2="4.5"
        stroke="white" strokeWidth="2" strokeLinecap="round"
        transform={`rotate(${deg} 12 12)`} />
    ))}
  </svg>
);

const SettingsIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);

const LANG_OPTIONS = [
  { value: 'en', label: 'EN', full: 'English' },
  { value: 'hi', label: 'हिन्दी', full: 'हिन्दी' },
  { value: 'gu', label: 'ગુજ', full: 'ગુજરાતી' },
];

export function LanguageSwitcher({ className = '' }) {
  const { lang, setLang } = useLanguage();
  return (
    <div className={`flex items-center gap-1 bg-orange-50 border border-orange-100 rounded-xl px-1.5 py-1 ${className}`}>
      {LANG_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          id={`lang-btn-${opt.value}`}
          title={opt.full}
          onClick={() => setLang(opt.value)}
          className="text-[11px] font-bold px-2 py-1 rounded-lg transition-all duration-150 cursor-pointer border-0"
          style={
            lang === opt.value
              ? { background: 'linear-gradient(135deg,#e06010,#c97d08)', color: '#fff' }
              : { background: 'transparent', color: '#9a3412' }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Avatar component — shows profile photo or initial letter
function Avatar({ user, size = 8 }) {
  const initials = user?.name?.charAt(0)?.toUpperCase() || 'U';
  const sizeClass = `w-${size} h-${size}`;

  if (user?.profilePhoto) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden border-2 border-orange-200 shadow-sm`}>
        <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm`}
      style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}
    >
      {initials}
    </div>
  );
}

function Navbar({ user }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { tr } = useLanguage();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('chhaya_lang');
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-orange-100"
      style={{ boxShadow: '0 1px 8px rgba(249,115,22,0.08)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}>
              <SunIcon size={18} />
            </div>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">Chhaya</span>
          </div>

          {/* Desktop right */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Language switcher — always visible */}
            <LanguageSwitcher />

            {user && (
              <>
                {/* Settings link */}
                <Link
                  to="/settings"
                  id="nav-settings-link"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-all text-xs font-semibold"
                >
                  <SettingsIcon size={14} />
                  <span>Settings</span>
                </Link>

                {/* Clickable avatar/name → /settings */}
                <Link
                  to="/settings"
                  id="nav-avatar-link"
                  className="flex items-center gap-2.5 bg-orange-50 border border-orange-100 rounded-2xl px-3.5 py-2 hover:bg-orange-100 transition-colors"
                >
                  <Avatar user={user} size={8} />
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                    <p className="text-xs text-orange-500 capitalize font-medium">
                      {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Manager' : tr('register.roleWorker')}
                    </p>
                  </div>
                </Link>

                <button onClick={handleLogout}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 bg-red-50
                             hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200">
                  {tr('common.logout')}
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          {user && (
            <button className="sm:hidden p-2 rounded-xl text-gray-600 hover:bg-orange-50 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>

        {/* Mobile dropdown */}
        {user && menuOpen && (
          <div className="sm:hidden border-t border-orange-100 py-4 space-y-3 px-1">
            {/* Language switcher mobile */}
            <div className="flex justify-center">
              <LanguageSwitcher />
            </div>

            {/* Clickable profile area → /settings */}
            <Link
              to="/settings"
              id="nav-mobile-avatar-link"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 p-3 bg-orange-50 rounded-2xl hover:bg-orange-100 transition-colors"
            >
              <Avatar user={user} size={9} />
              <div>
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-orange-500 capitalize">
                  {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Manager' : tr('register.roleWorker')} · Tap to edit profile
                </p>
              </div>
            </Link>

            {/* Settings link mobile */}
            <Link
              to="/settings"
              id="nav-mobile-settings-link"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold
                         bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-all"
            >
              <SettingsIcon size={15} />
              <span>Settings & Profile</span>
            </Link>

            <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold
                         bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white transition-all duration-200">
              {tr('common.logout')}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
