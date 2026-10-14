import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, Menu, X, Globe, MapPin, RefreshCw, Package, 
  ChevronDown, User as UserIcon, LogOut, PhoneCall, 
  AlertTriangle, ShieldCheck, Check, Sparkles, Navigation
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocationContext } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { safeFetch } from '../lib/api';

// Helper for smooth hash links across pages
const HashLink = ({ to, children, className, onClick }: any) => {
  const location = useLocation();
  const [targetPath, targetHash] = to.split('#');

  const handleClick = (e: any) => {
    if (onClick) onClick(e);
    const isSamePage = location.pathname === (targetPath || '/');
    if (isSamePage && targetHash) {
      e.preventDefault();
      const el = document.getElementById(targetHash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
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
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { city, isLocating, fetchLocation, setCity, setAddress } = useLocationContext();

  const [scrolled, setScrolled] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [hasActiveOrder, setHasActiveOrder] = useState<boolean>(false);
  const [activeOrderCode, setActiveOrderCode] = useState<string | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);

  // Sticky navbar shadow and backdrop blur on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Outside click listener for floating dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Check for active dispatch orders dynamically:
  // Only show pulsing dot / direct quick-link if status is 'en_route' or 'dispatched'
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && user?.role !== 'mechanic') {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      safeFetch('/api/v1/bookings', { headers })
        .then((res) => {
          if (!isMounted) return;
          const list = res?.orders || res?.bookings || (Array.isArray(res) ? res : []);
          const active = list.find((o: any) => {
            const s = (o.status || '').toUpperCase();
            return s === 'EN_ROUTE' || s === 'DISPATCHED' || s === 'MECHANIC_DISPATCHED';
          });
          if (active) {
            setHasActiveOrder(true);
            const code = active.trackingCode || active.orderCode || active._id;
            setActiveOrderCode(code);
          } else {
            setHasActiveOrder(false);
            setActiveOrderCode(null);
          }
        })
        .catch(() => {
          if (isMounted) {
            setHasActiveOrder(false);
            setActiveOrderCode(null);
          }
        });
    } else {
      setHasActiveOrder(false);
      setActiveOrderCode(null);
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.role, location.pathname]);

  const handleManualLocation = () => {
    const override = window.prompt('Enter your breakdown city or area (e.g. Kalyani, WB):', city);
    if (override && override.trim() !== '') {
      const formatted = override.trim();
      setCity(formatted);
      setAddress(formatted);
      localStorage.setItem('user_city', formatted);
      localStorage.setItem('user_address', formatted);
      localStorage.setItem('breakdown_address', formatted);
    }
  };

  const isMechanic = variant === 'mechanic' || user?.role === 'mechanic';
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  // Navigation Links configuration
  const navLinks = [
    { to: '/services', label: t('nav.services', 'Services') },
    { to: '/#how-it-works', label: t('nav.howItWorks', 'How It Works'), isAnchor: true },
    { 
      to: isAuthenticated ? '/orders' : '/auth?redirect=/orders', 
      label: t('nav.trackOrders', 'Track Orders'), 
      hasPulse: hasActiveOrder 
    },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 font-['Outfit',sans-serif] ${
          scrolled
            ? 'bg-[#0B0F17]/90 backdrop-blur-xl border-b border-slate-800/90 shadow-2xl shadow-black/60 py-3'
            : 'bg-[#0B0F17]/70 backdrop-blur-md border-b border-slate-800/40 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* ========================================================= */}
          {/* LEFT SECTION: Brand Logo + Interactive Pinned Location     */}
          {/* ========================================================= */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Brand Logo */}
            <Link to={isMechanic ? '/mechanic' : '/'} className="flex items-center gap-2.5 group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 text-orange-400 group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all">
                <Wrench className="w-5 h-5 text-orange-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center">
                  FixOnRoad<span className="text-orange-500 text-2xl leading-none">.</span>
                </span>
                {isMechanic && (
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400 -mt-1">
                    Partner Portal
                  </span>
                )}
              </div>
            </Link>

            {/* Pinned Location Chip (Desktop & Tablet) */}
            <div className="hidden md:flex items-center">
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-orange-500/40 text-xs text-slate-300 transition-all shadow-inner group"
              >
                <MapPin className="w-3.5 h-3.5 text-orange-400 group-hover:animate-bounce" />
                <button
                  onClick={handleManualLocation}
                  className="max-w-[130px] lg:max-w-[160px] truncate text-left font-medium text-slate-200 hover:text-white transition-colors"
                  title="Click to manually change breakdown city"
                >
                  {city ? city.split(',')[0] : 'Kalyani, WB'}
                </button>
                <button
                  onClick={fetchLocation}
                  disabled={isLocating}
                  className="ml-0.5 p-0.5 text-slate-400 hover:text-orange-400 transition-colors disabled:opacity-50"
                  title="Auto-detect location from GPS"
                  aria-label="Refresh Location"
                >
                  <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin text-orange-400' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* CENTER SECTION: Clean Spaced Navigation Links             */}
          {/* ========================================================= */}
          <nav className="hidden lg:flex items-center gap-8 text-sm">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return link.isAnchor ? (
                <HashLink
                  key={link.label}
                  to={link.to}
                  className={`py-1 relative text-zinc-300 hover:text-orange-400 active:text-orange-500 transition-colors duration-200 font-medium ${
                    isActive ? 'text-white font-semibold' : ''
                  }`}
                >
                  {link.label}
                </HashLink>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`py-1 relative flex items-center gap-2 transition-colors duration-200 font-medium ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-zinc-300 hover:text-orange-400 active:text-orange-500'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.hasPulse && (
                    <span className="flex h-2.5 w-2.5 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                    </span>
                  )}
                  {link.hasPulse && activeOrderCode && (
                    <Link
                      to={`/track/${activeOrderCode}`}
                      className="ml-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 transition-all shadow-sm"
                      title="Open Live Dispatch Tracking"
                    >
                      <Navigation className="w-3 h-3 text-orange-400" />
                      <span>Live</span>
                    </Link>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="navPill"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                    />
                  )}
                </Link>
              );
            })}

            {/* Partner Portal Secondary Outline Pill */}
            {isMechanic ? (
              <Link
                to="/"
                className="px-3.5 py-1.5 rounded-full border border-slate-700 hover:border-orange-500/50 bg-white/[0.02] text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                {t('nav.switchToRider', 'Switch to Rider')}
              </Link>
            ) : (
              <Link
                to="/mechanic"
                className="px-3.5 py-1.5 rounded-full border border-orange-500/30 hover:border-orange-500 bg-orange-500/5 hover:bg-orange-500/10 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-all shadow-sm"
              >
                {t('nav.forMechanics', 'For Mechanics')}
              </Link>
            )}
          </nav>

          {/* ========================================================= */}
          {/* RIGHT SECTION: Language, Auth & Profile State            */}
          {/* ========================================================= */}
          <div className="flex items-center gap-3">
            
            {/* Interactive Language Selector Dropdown */}
            <LanguageSelector variant="navbar" />

            {/* Logged Out State: Sign In + Emergency CTA */}
            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to={isMechanic ? '/partner/auth' : '/auth'}
                  className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 transition-colors"
                >
                  {isMechanic ? t('nav.partnerLogin', 'Partner Login') : t('nav.signIn', 'Sign In')}
                </Link>

                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{t('nav.emergencyHelp', 'Emergency Help')}</span>
                </Link>
              </div>
            ) : (
              /* Logged In State: Emergency CTA + Interactive Profile Dropdown */
              <div className="flex items-center gap-3">
                {/* Emergency CTA button (only for customers) */}
                {user?.role !== 'mechanic' && (
                  <Link
                    to="/services"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02]"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t('nav.emergencyHelp', 'Emergency Help')}</span>
                  </Link>
                )}

                {/* Profile Avatar & Interactive Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-orange-500/30 transition-all group"
                    aria-label="User profile menu"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xs shadow-inner ring-2 ring-orange-500/30 group-hover:ring-orange-500 transition-all">
                      {userInitial}
                    </div>
                    <span className="hidden md:inline text-xs font-bold text-slate-200 group-hover:text-white max-w-[110px] truncate">
                      {user?.name || user?.phone || 'Account'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 top-full mt-2 w-72 p-2 rounded-2xl bg-[#121824] border border-slate-800 shadow-2xl shadow-black/90 z-50 backdrop-blur-2xl"
                      >
                        {/* Profile Header Block */}
                        <div className="p-3 bg-[#0B0F17]/80 rounded-xl border border-slate-800/80 mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
                              {userInitial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-white truncate">{user?.name || 'Customer'}</h4>
                              <p className="text-xs text-slate-400 truncate">{user?.email || user?.phone || 'Signed in'}</p>
                            </div>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Account Type</span>
                            <span className={`font-bold px-2 py-0.5 rounded ${
                              user?.role === 'mechanic'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {user?.role === 'mechanic' ? 'Certified Partner' : 'Customer'}
                            </span>
                          </div>
                        </div>

                        {/* Dropdown Menu Items */}
                        <div className="space-y-1">
                          <Link
                            to={isAuthenticated ? "/orders" : "/auth?redirect=/orders"}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                          >
                            <span className="flex items-center gap-2.5">
                              <Package className="w-4 h-4 text-orange-400" />
                              <span>{t('nav.myBookings', 'My Bookings')}</span>
                            </span>
                            {hasActiveOrder && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse">
                                Active Dispatch
                              </span>
                            )}
                          </Link>

                          {hasActiveOrder && activeOrderCode && (
                            <Link
                              to={`/track/${activeOrderCode}`}
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-all"
                            >
                              <span className="flex items-center gap-2">
                                <Navigation className="w-3.5 h-3.5 text-orange-400" />
                                <span>Track Active Order</span>
                              </span>
                              <span className="font-mono text-[10px]">{activeOrderCode.slice(0, 10)}</span>
                            </Link>
                          )}

                          <Link
                            to="/profile"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                          >
                            <UserIcon className="w-4 h-4 text-slate-400" />
                            <span>{t('nav.myProfile', 'Profile & Account Settings')}</span>
                          </Link>

                          {user?.role === 'mechanic' && (
                            <Link
                              to="/mechanic-dashboard"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4 text-amber-400" />
                              <span>Partner Portal Dashboard</span>
                            </Link>
                          )}

                          <a
                            href="tel:+919800112233"
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                          >
                            <span className="flex items-center gap-2.5">
                              <PhoneCall className="w-4 h-4 text-emerald-400" />
                              <span>Emergency Helpline</span>
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              24/7
                            </span>
                          </a>
                        </div>

                        {/* Divider & Sign Out */}
                        <div className="my-1.5 border-t border-slate-800/80" />

                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-red-400" />
                          <span>{t('nav.logout', 'Sign Out')}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-5 h-5 text-orange-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================= */}
      {/* MOBILE RESPONSIVE DRAWER & OVERLAY                        */}
      {/* ========================================================= */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            {/* Backdrop Overlay */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)} 
            />

            {/* Sliding Mobile Sheet */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-[#121824] border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl z-50 overflow-y-auto"
            >
              <div>
                {/* Mobile Drawer Top Header */}
                <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <span className="font-extrabold text-lg text-white">FixOnRoad</span>
                  </div>
                  <button 
                    onClick={() => setMobileOpen(false)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Location Chip for Mobile */}
                <div className="mt-4 p-3 rounded-xl bg-[#0B0F17] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="truncate max-w-[150px]">{city ? city.split(',')[0] : 'Kalyani, WB'}</span>
                  </div>
                  <button
                    onClick={handleManualLocation}
                    className="text-[11px] font-bold text-orange-400 hover:underline"
                  >
                    Change
                  </button>
                </div>

                {/* User Card if Authenticated */}
                {isAuthenticated && user && (
                  <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-bold flex items-center justify-center">
                        {userInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate">{user.name || 'Customer'}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email || user.phone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Language Selector for Mobile Drawer */}
                <LanguageSelector variant="drawer" className="mt-4 mb-2" />

                {/* Mobile Links */}
                <div className="mt-5 space-y-2">
                  <Link
                    to="/services"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-zinc-300 hover:text-orange-400 active:text-orange-500 hover:bg-white/[0.05] transition-colors duration-200"
                  >
                    <Wrench className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>{t('nav.services', 'Roadside Services')}</span>
                  </Link>

                  <HashLink
                    to="/#how-it-works"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-zinc-300 hover:text-orange-400 active:text-orange-500 hover:bg-white/[0.05] transition-colors duration-200"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{t('nav.howItWorks', 'How It Works')}</span>
                  </HashLink>

                  <Link
                    to={isAuthenticated ? "/orders" : "/auth?redirect=/orders"}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium text-zinc-300 hover:text-orange-400 active:text-orange-500 hover:bg-white/[0.05] transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-orange-400 shrink-0" />
                      <span>{t('nav.trackOrders', 'Track Bookings & Orders')}</span>
                    </div>
                    {hasActiveOrder && (
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping shrink-0" />
                    )}
                  </Link>

                  {hasActiveOrder && activeOrderCode && (
                    <Link
                      to={`/track/${activeOrderCode}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Navigation className="w-4 h-4 text-orange-400" />
                        <span>Track Live Dispatch</span>
                      </div>
                      <span className="font-mono text-xs">{activeOrderCode.slice(0, 10)}</span>
                    </Link>
                  )}

                  {isAuthenticated && (
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>{t('nav.myProfile', 'Account Settings')}</span>
                    </Link>
                  )}

                  {isMechanic ? (
                    <Link
                      to="/"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/[0.05]"
                    >
                      <Navigation className="w-4 h-4 text-slate-400" />
                      <span>{t('nav.switchToRider', 'Switch to Driver/Rider')}</span>
                    </Link>
                  ) : (
                    <Link
                      to="/mechanic"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-orange-400 hover:bg-orange-500/10"
                    >
                      <ShieldCheck className="w-4 h-4 text-orange-400" />
                      <span>{t('nav.forMechanics', 'Partner Portal (For Mechanics)')}</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Bottom Actions of Drawer */}
              <div className="pt-6 border-t border-slate-800 space-y-3">
                <a
                  href="tel:+919800112233"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-all"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{t('nav.emergencyHelp', 'Call Emergency Dispatch (24/7)')}</span>
                </a>

                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('nav.logout', 'Sign Out')}</span>
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="w-full block py-3 rounded-xl text-center text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/30 transition-all"
                  >
                    {t('nav.signIn', 'Sign In to FixOnRoad')}
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
