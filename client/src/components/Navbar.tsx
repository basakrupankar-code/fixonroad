import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Menu, X, Globe, MapPin, RefreshCw, ShoppingCart } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { useLocationContext } from '../context/LocationContext';

// Helper for hash links across pages
const HashLink = ({ to, children, className, onClick }: any) => {
  const location = useLocation();
  const [targetPath, targetHash] = to.split("#");

  const handleClick = (e: any) => {
    if (onClick) onClick(e);
    
    // Check if we are already on the target page
    const isSamePage = location.pathname === (targetPath || "/");
    
    if (isSamePage && targetHash) {
      e.preventDefault();
      const el = document.getElementById(targetHash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, '', `#${targetHash}`);
    }
  };

  return (
    <Link className={className} onClick={handleClick} to={to}>
      {children}
    </Link>
  );
};

export default function Navbar({ variant = 'rider' }: { variant?: 'rider' | 'mechanic' }) {
  const { theme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { city, isLocating, fetchLocation, setCity, setAddress } = useLocationContext();

  const handleManualLocation = () => {
    const override = window.prompt("Enter your breakdown city/location (e.g., Samudragar, West Bengal):", city);
    if (override && override.trim() !== "") {
      const formatted = override.trim();
      setCity(formatted);
      setAddress(formatted);
      localStorage.setItem('user_city', formatted);
      localStorage.setItem('user_address', formatted);
      localStorage.setItem('breakdown_address', formatted);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isMechanic = variant === 'mechanic' || user?.role === 'mechanic';
  const accentColor = 'text-orange-400';

  let navLinks = [];
  if (user?.role === 'mechanic') {
    navLinks = [
      { to: '/mechanic-dashboard', label: 'Partner Portal' },
    ];
  } else if (variant === 'mechanic' && !isAuthenticated) {
    navLinks = [
      { to: '/', label: t('nav.switchToRider', 'Switch to Rider/Driver View') },
      { to: '/mechanic#benefits', label: t('nav.benefits', 'Benefits'), isAnchor: true },
      { to: '/mechanic#how-it-works', label: t('nav.howItWorks', 'How it Works'), isAnchor: true },
    ];
  } else {
    navLinks = [
      { to: '/services', label: t('nav.services', 'Services') },
      { to: '/mechanic', label: t('nav.forMechanics', 'For Mechanics') },
      { to: '/#how-it-works', label: t('nav.howItWorks', 'How it Works'), isAnchor: true },
    ];
  }

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'glass-panel border-b-0 py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-10 flex justify-between items-center">
          {/* Logo */}
          <Link to={isMechanic ? '/mechanic' : '/'} className="flex items-center gap-2.5 group">
            <div className="p-1.5 rounded-lg transition-all duration-300 group-hover:scale-110 bg-orange-500/10">
              <Wrench className={`w-6 h-6 ${accentColor}`} />
            </div>
            <span className="text-xl font-bold font-['Outfit'] tracking-tight">
              FixOnRoad<span className={accentColor}>.</span>
            </span>
            {isMechanic && (
              <span className="ml-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-widest">
                {t('nav.mechanicsLabel', 'Mechanics')}
              </span>
            )}
          </Link>

          {/* Location Picker (hidden on mobile) */}
          {(user?.role === 'customer' || (!isAuthenticated && variant !== 'mechanic')) && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs ml-6">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              <span 
                className="text-gray-300 max-w-[120px] truncate cursor-pointer hover:text-white transition-colors"
                onClick={handleManualLocation}
                title="Click to manually override location"
              >
                {city.split(',')[0]}
              </span>
              <button onClick={fetchLocation} disabled={isLocating} className="hover:text-white transition-colors disabled:opacity-50 ml-1">
                <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${isLocating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-7 text-[15px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            {navLinks.map(link =>
              link.isAnchor ? (
                <HashLink key={link.label} to={link.to} className="hover:text-[var(--text-primary)] transition-colors duration-200">
                  {link.label}
                </HashLink>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`hover:text-[var(--text-primary)] transition-colors duration-200 ${
                    location.pathname === link.to ? 'text-[var(--text-primary)]' : ''
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                <Globe className="w-4 h-4" />
                <span className="hidden md:inline uppercase">{i18n.language}</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-32 py-2 rounded-xl bg-[#1A1D24] border border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button onClick={() => i18n.changeLanguage('en')} className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 ${i18n.language === 'en' ? 'text-orange-400' : 'text-gray-300'}`}>English</button>
                <button onClick={() => i18n.changeLanguage('bn')} className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 ${i18n.language === 'bn' ? 'text-orange-400' : 'text-gray-300'}`}>Bengali</button>
                <button onClick={() => i18n.changeLanguage('hi')} className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 ${i18n.language === 'hi' ? 'text-orange-400' : 'text-gray-300'}`}>Hindi</button>
              </div>
            </div>

            {/* Cart Icon (only for authenticated customer) */}
            {isAuthenticated && user?.role === 'customer' && (
              <div className="relative">
                <Link 
                  to="/cart"
                  className="relative p-2 rounded-xl hover:bg-white/5 transition-colors text-gray-300 hover:text-white inline-block"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-[#0B0F17]">1</span>
                </Link>
              </div>
            )}

            {/* User Profile / Logout or Sign In */}
            {isAuthenticated && user ? (
              <div className="hidden md:flex items-center gap-4">
                <Link to="/profile" className="text-sm font-semibold hover:text-orange-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {user.name || user.phone}
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                  {t('nav.logout', 'Logout')}
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className={`hidden md:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  isMechanic ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-500/20' : 'btn-primary'
                }`}
              >
                <span className="relative z-10">{isMechanic ? t('nav.partnerLogin', 'Partner Login') : t('nav.signIn', 'Sign In')}</span>
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2.5 rounded-xl"
              style={{ background: 'var(--bg-card)' }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-72 p-6 pt-20 flex flex-col gap-6"
              style={{ background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-primary)' }}
            >
              {navLinks.map(link =>
                link.isAnchor ? (
                  <HashLink
                    key={link.label}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="text-lg font-medium transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {link.label}
                  </HashLink>
                ) : (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="text-lg font-medium transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {link.label}
                  </Link>
                )
              )}
              {isAuthenticated && user ? (
                <div className="mt-4 text-center">
                  <div className="mb-2">
                    <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-sm font-semibold hover:text-orange-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {user.name || user.phone}
                    </Link>
                  </div>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="w-full px-5 py-2.5 rounded-xl text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    {t('nav.logout', 'Logout')}
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className={`mt-4 text-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isMechanic ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-500/20' : 'btn-primary'}`}
                >
                  <span className="relative z-10">{isMechanic ? t('nav.partnerLogin', 'Partner Login') : t('nav.signIn', 'Sign In')}</span>
                </Link>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
