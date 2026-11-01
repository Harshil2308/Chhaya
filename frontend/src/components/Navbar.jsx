import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

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

const SettingsIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
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

function Navbar({ user }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { tr } = useLanguage();
  const { user: authUser, logout } = useAuth();

  const currentUser = user || authUser;

  const handleLogout = () => {
    if (logout) logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('chhaya_lang');
    navigate('/login');
  };

  const handleBrandClick = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const dest =
      currentUser.role === 'admin'
        ? '/admin'
        : currentUser.role === 'manager'
        ? '/manager'
        : '/dashboard';
    navigate(dest);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-orange-100"
      style={{ boxShadow: '0 1px 8px rgba(249,115,22,0.08)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div
            onClick={handleBrandClick}
            className="flex items-center gap-2.5 cursor-pointer select-none"
            title="Go to Dashboard"
          >
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

            {currentUser && (
              <>
                {/* Settings Button */}
                <button
                  id="nav-settings-btn"
                  onClick={() => navigate('/settings')}
                  title={tr('settings.title') || 'Settings'}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100 hover:border-orange-300 transition-all duration-150 cursor-pointer shadow-2xs"
                >
                  <SettingsIcon size={15} />
                  <span>{tr('settings.title') || 'Settings'}</span>
                </button>

                {/* User Avatar & Name — clickable to Settings */}
                <div
                  id="nav-user-profile-badge"
                  onClick={() => navigate('/settings')}
                  title="View Settings & Profile"
                  className="flex items-center gap-2.5 bg-orange-50 border border-orange-100 rounded-2xl px-3.5 py-1.5 cursor-pointer hover:bg-orange-100/70 hover:border-orange-200 transition-all duration-200 select-none shadow-2xs"
                >
                  {currentUser.profilePhoto ? (
                    <img
                      src={currentUser.profilePhoto}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover shadow-xs border border-orange-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-xs shrink-0"
                      style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}>
                      {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
                    <p className="text-xs text-orange-600 capitalize font-medium">
                      {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'manager' ? 'Manager' : tr('register.roleWorker')}
                    </p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  id="nav-logout-btn"
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 cursor-pointer shadow-2xs"
                >
                  {tr('common.logout')}
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          {currentUser && (
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
        {currentUser && menuOpen && (
          <div className="sm:hidden border-t border-orange-100 py-4 space-y-3 px-1">
            {/* Language switcher mobile */}
            <div className="flex justify-center">
              <LanguageSwitcher />
            </div>

            {/* User Info clickable to Settings */}
            <div
              onClick={() => { setMenuOpen(false); navigate('/settings'); }}
              className="flex items-center gap-3 p-3 bg-orange-50 rounded-2xl cursor-pointer hover:bg-orange-100/70 transition-colors shadow-2xs"
            >
              {currentUser.profilePhoto ? (
                <img
                  src={currentUser.profilePhoto}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover shadow-xs border border-orange-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg,#e06010,#c97d08)' }}>
                  {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
                <p className="text-xs text-orange-600 capitalize">
                  {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'manager' ? 'Manager' : tr('register.roleWorker')}
                </p>
              </div>
              <span className="text-xs font-semibold text-orange-600 bg-white/80 px-2 py-1 rounded-lg border border-orange-200">
                {tr('settings.title') || 'Settings'} →
              </span>
            </div>

            {/* Mobile Settings button */}
            <button
              onClick={() => { setMenuOpen(false); navigate('/settings'); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold bg-orange-50 text-orange-900 border border-orange-200 hover:bg-orange-100 transition-all duration-200 cursor-pointer shadow-2xs"
            >
              <SettingsIcon size={16} />
              <span>{tr('settings.title') || 'Settings'}</span>
            </button>

            {/* Mobile Logout button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white transition-all duration-200 cursor-pointer shadow-2xs"
            >
              {tr('common.logout')}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
