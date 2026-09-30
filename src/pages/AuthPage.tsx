import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Wrench, Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, ChevronLeft, MapPin, Bike, CarFront, Smartphone } from 'lucide-react';

type AuthMode = 'login' | 'register';
type Role = 'rider' | 'mechanic';
type Specialization = 'bike' | 'car' | 'both';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'mechanic' ? 'mechanic' : 'rider';
  
  const [role, setRole] = useState<Role>(initialRole);
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    phone: '', 
    password: '', 
    city: '',
    specialization: 'bike' as Specialization
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Dynamic Document Title
  useEffect(() => {
    document.title = role === 'rider' 
      ? 'Sign In to FixOnRoad — Roadside Assistance' 
      : 'Mechanic Portal Login — FixOnRoad Partner';
  }, [role]);

  // Update role if query param changes
  useEffect(() => {
    const qRole = searchParams.get('role');
    if (qRole === 'mechanic' || qRole === 'rider') {
      setRole(qRole);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (mode === 'register') {
      if (formData.name.length < 2) {
        setError('Name must be at least 2 characters');
        return;
      }
      if (role === 'mechanic' && formData.phone.length < 10) {
        setError('Please enter a valid phone number');
        return;
      }
      if (role === 'mechanic' && formData.city.length < 2) {
        setError('Please enter your City/Area');
        return;
      }
    }
    
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    document.cookie = `fixonroad_session=mock_session_${Date.now()}; path=/; max-age=86400; SameSite=Lax`;
    localStorage.setItem('fixonroad_user', JSON.stringify({
      name: formData.name || 'Demo User',
      email: formData.email,
      role: role,
      loggedIn: true
    }));
    setIsLoading(false);
    navigate(role === 'mechanic' ? '/mechanic' : '/services');
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 })
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-10" style={{ background: 'var(--bg-primary)' }}>
      {/* Background */}
      <div className="glow-orb w-[500px] h-[500px] -top-[20%] -left-[15%] bg-orange-600/15" />
      <div className="glow-orb w-[500px] h-[500px] -bottom-[20%] -right-[15%] bg-amber-600/10" style={{ animationDelay: '3s' }} />
      <div className="glow-orb w-[300px] h-[300px] top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-yellow-500/8" style={{ animationDelay: '1.5s' }} />
      <div className="dot-grid" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="inline-flex items-center gap-1 text-sm mb-6 transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Role Selector */}
        <div className="flex bg-[#111622]/90 border border-slate-800 rounded-2xl p-1 mb-4">
          {(['rider', 'mechanic'] as const).map(r => (
            <button
              key={r}
              onClick={() => { setRole(r); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                role === r
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              {r === 'rider' ? <CarFront className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
              {r === 'rider' ? 'Driver / Rider' : 'Mechanic Partner'}
            </button>
          ))}
        </div>

        <div className="bg-[#111622]/90 border border-slate-800 rounded-2xl p-7 sm:p-8 relative overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-7">
              <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <Wrench className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-xl font-bold font-['Outfit'] tracking-tight text-white">
                FixOnRoad<span className="text-orange-500">.</span>
              </span>
            </div>

            {/* Tab Switcher */}
            <div className="flex rounded-lg p-1 mb-7 bg-white/5 border border-white/5">
              {(['login', 'register'] as AuthMode[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setMode(tab); setError(null); }}
                  className={`flex-1 py-2.5 rounded-md text-sm font-semibold capitalize transition-all duration-300 ${
                    mode === tab
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 p-3 rounded-xl text-sm text-red-400 bg-red-500/10 border border-red-500/20"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <AnimatePresence mode="wait" custom={mode === 'register' ? 1 : -1}>
              <motion.form
                key={`${mode}-${role}`}
                custom={mode === 'register' ? 1 : -1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {mode === 'register' && (
                  <>
                    <div>
                      <label htmlFor="auth-name" className="text-xs font-medium block mb-1.5 text-gray-400">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          id="auth-name"
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                          placeholder="Your Name"
                          required
                        />
                      </div>
                    </div>

                    {role === 'mechanic' && (
                      <>
                        <div>
                          <label htmlFor="auth-phone" className="text-xs font-medium block mb-1.5 text-gray-400">Phone Number (OTP Verified)</label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                              id="auth-phone"
                              type="tel"
                              value={formData.phone}
                              onChange={e => setFormData({ ...formData, phone: e.target.value })}
                              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                              placeholder="+91 98XXX XXXXX"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="auth-city" className="text-xs font-medium block mb-1.5 text-gray-400">City / Area</label>
                          <div className="relative">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                              id="auth-city"
                              type="text"
                              value={formData.city}
                              onChange={e => setFormData({ ...formData, city: e.target.value })}
                              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                              placeholder="e.g. Kalyani, West Bengal"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium block mb-1.5 text-gray-400">Vehicle Specialization</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['bike', 'car', 'both'] as Specialization[]).map(spec => (
                              <button
                                key={spec}
                                type="button"
                                onClick={() => setFormData({ ...formData, specialization: spec })}
                                className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                                  formData.specialization === spec
                                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                }`}
                              >
                                {spec === 'bike' ? 'Bikes' : spec === 'car' ? 'Cars' : 'Both'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div>
                  <label htmlFor="auth-email" className="text-xs font-medium block mb-1.5 text-gray-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      id="auth-email"
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="auth-password" className="text-xs font-medium text-gray-400">Password</label>
                    {mode === 'login' && (
                      <a href="#" className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors">
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80 text-gray-500 hover:text-gray-300"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </span>
                </button>
              </motion.form>
            </AnimatePresence>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Social buttons */}
            <div className="flex flex-col gap-3">
              <button className="w-full h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors flex items-center justify-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              
              <button className="w-full h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors flex items-center justify-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-400" />
                Continue with Phone / OTP
              </button>
            </div>
            
            {/* Disclaimer */}
            <p className="mt-8 text-center text-[10px] text-gray-500 max-w-xs mx-auto">
              By continuing, you agree to FixOnRoad's Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
