import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Menu, X } from 'lucide-react';
import { useTheme } from './ThemeProvider';

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
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isMechanic = variant === 'mechanic';
  const accentColor = 'text-orange-400';

  const navLinks = isMechanic
    ? [
        { to: '/', label: 'Switch to Rider/Driver View' },
        { to: '/mechanic#benefits', label: 'Benefits', isAnchor: true },
        { to: '/mechanic#how-it-works', label: 'How it Works', isAnchor: true },
      ]
    : [
        { to: '/services', label: 'Services' },
        { to: '/mechanic', label: 'For Mechanics' },
        { to: '/#how-it-works', label: 'How it Works', isAnchor: true },
      ];

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
                Mechanics
              </span>
            )}
          </Link>

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


            {/* Sign In / Partner Login */}
            <Link
              to="/auth"
              className={`hidden md:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                isMechanic ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-500/20' : 'btn-primary'
              }`}
            >
              <span className="relative z-10">{isMechanic ? 'Partner Login' : 'Sign In'}</span>
            </Link>

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
              <Link
                to="/auth"
                className={`mt-4 text-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isMechanic ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-500/20' : 'btn-primary'}`}
              >
                <span className="relative z-10">{isMechanic ? 'Partner Login' : 'Sign In'}</span>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
