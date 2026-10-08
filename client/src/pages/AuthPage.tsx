import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Wrench, Phone, ArrowRight, ChevronLeft, CarFront, Mail, User as UserIcon, MapPin, Calendar, Eye, EyeOff, Wand2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { signInWithPopup } from 'firebase/auth';
import { auth as firebaseAuth, googleProvider } from '../lib/firebase';
import { PasswordPolicy } from '../components/PasswordPolicy';
import toast from 'react-hot-toast';
import { safeFetch } from '../lib/api';

type Role = 'customer' | 'mechanic';
type Step = 'phone' | 'otp';
type Mode = 'login' | 'register' | '2fa' | 'forgot_password';

export default function AuthPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'mechanic' ? 'mechanic' : 'customer';
  
  const [role, setRole] = useState<Role>(initialRole as Role);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [registerData, setRegisterData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    city: '',
    acceptedCookies: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [resetToken, setResetToken] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    document.title = role === 'customer' 
      ? 'Join FixOnRoad — Roadside Assistance' 
      : 'Mechanic Portal — FixOnRoad Partner';
  }, [role]);

  useEffect(() => {
    const qRole = searchParams.get('role');
    if (qRole === 'mechanic' || qRole === 'customer') {
      setRole(qRole as Role);
    }
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      toast.success('Email verified successfully! You can now log in.');
      setMode('login');
    }
  }, [searchParams]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const data = await safeFetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (data.require2FA) {
        setTempToken(data.tempToken);
        setMode('2fa');
        return;
      }
      
      login(data.user);
      navigate(data.user.role === 'mechanic' ? '/mechanic' : '/services');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FALogin = async (e: FormEvent) => {
    e.preventDefault();

    if (twoFactorCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const data = await safeFetch('/api/v1/auth/login/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code: twoFactorCode })
      });
      
      login(data.user);
      navigate(data.user.role === 'mechanic' ? '/mechanic' : '/services');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    if (!registerData.acceptedCookies) {
      toast.error('You must accept cookies to register');
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = registerData.phone.startsWith('+') ? registerData.phone : `+91${registerData.phone}`;
      const payload = {
        ...registerData,
        phone: formattedPhone,
        age: parseInt(registerData.age, 10),
        role
      };
      
      const data = await safeFetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setRegisterSuccess(true);
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state_district;
          if (city) {
            setRegisterData(prev => ({ ...prev, city }));
            toast.success('Location detected!');
          } else {
            toast.error('Could not detect city automatically');
          }
        } catch (err) {
          toast.error('Failed to fetch location data');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        toast.error('Failed to get location permission');
        setIsLoading(false);
      }
    );
  };

  const handleGeneratePassword = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    const all = upper + lower + numbers + special;

    let pwd = "";
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += special[Math.floor(Math.random() * special.length)];

    for (let i = 0; i < 10; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }

    pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    
    setRegisterData(d => ({...d, password: pwd}));
    setShowPassword(true);
    toast.success('Strong password generated!');
  };

  const handleGoogleLogin = async () => {
    // Check if firebase was initialized properly
    if (!firebaseAuth || Object.keys(firebaseAuth).length === 0 || !firebaseAuth.name) {
      toast.error('Firebase is not configured! Please add your VITE_FIREBASE_* credentials to the client/.env file.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const data = await safeFetch('/api/v1/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role })
      });
      
      if (data.require2FA) {
        setTempToken(data.tempToken);
        setMode('2fa');
        return;
      }
      
      login(data.user);
      navigate(data.user.role === 'mechanic' ? '/mechanic' : '/services');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Google sign in failed. Is your Firebase .env configured?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier) {
      toast.error('Please enter your email or phone number');
      return;
    }

    setIsLoading(true);
    try {
      const isPhone = /^\d+$/.test(forgotIdentifier) || /^\+\d+$/.test(forgotIdentifier);
      const formattedIdentifier = (isPhone && !forgotIdentifier.startsWith('+')) ? `+91${forgotIdentifier}` : forgotIdentifier;
      
      const data = await safeFetch('/api/v1/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: formattedIdentifier })
      });
      
      toast.success(data.message);
      setForgotStep('verify');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotOtp) {
      toast.error('Please enter OTP');
      return;
    }

    setIsLoading(true);
    try {
      const isPhone = /^\d+$/.test(forgotIdentifier) || /^\+\d+$/.test(forgotIdentifier);
      const formattedIdentifier = (isPhone && !forgotIdentifier.startsWith('+')) ? `+91${forgotIdentifier}` : forgotIdentifier;

      const data = await safeFetch('/api/v1/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: formattedIdentifier, otp: forgotOtp })
      });
      
      toast.success(data.message);
      setResetToken(data.resetToken);
      setForgotStep('reset');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter new password');
      return;
    }

    setIsLoading(true);
    try {
      const data = await safeFetch('/api/v1/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, password })
      });
      
      toast.success(data.message);
      
      if (data.require2FA) {
        setTempToken(data.tempToken);
        setMode('2fa');
        return;
      }
      
      login(data.user);
      navigate(data.user.role === 'mechanic' ? '/mechanic' : '/services');
      
      setForgotStep('request');
      setForgotIdentifier('');
      setForgotOtp('');
      setPassword('');
      setResetToken('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateForgotPassword = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    const all = upper + lower + numbers + special;
    let pwd = "";
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += special[Math.floor(Math.random() * special.length)];
    for (let i = 0; i < 10; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    
    setPassword(pwd);
    setShowPassword(true);
    toast.success('Strong password generated!');
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
        {!registerSuccess && mode === 'login' && (
          <div className="flex bg-[#111622]/90 border border-slate-800 rounded-2xl p-1 mb-4">
            {(['customer', 'mechanic'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  role === r
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                {r === 'customer' ? <CarFront className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                {r === 'customer' ? 'Driver / Rider' : 'Mechanic Partner'}
              </button>
            ))}
          </div>
        )}

        {/* Mode Selector */}
        {!registerSuccess && mode !== '2fa' && mode !== 'forgot_password' && (
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'login' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {t('auth.login_button')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'register' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {t('auth.register_button')}
            </button>
          </div>
        )}

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

            <h2 className="text-2xl font-bold text-white mb-2">
              {registerSuccess 
                ? 'Check Your Email' 
                : mode === 'register' 
                  ? t('auth.create_account') 
                  : mode === '2fa'
                    ? 'Two-Factor Authentication'
                    : mode === 'forgot_password'
                      ? 'Reset Password'
                      : t('auth.welcome_back')}
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              {registerSuccess 
                ? 'A verification link has been sent to your email.'
                : mode === 'register' 
                  ? 'Fill in your details to get started.' 
                  : mode === '2fa'
                    ? 'Enter the 6-digit code from your authenticator app.'
                    : mode === 'forgot_password'
                      ? (forgotStep === 'request' ? 'Enter your email or phone number to receive an OTP.' : forgotStep === 'verify' ? 'Enter the OTP sent to your device.' : 'Set your new password.')
                      : t('auth.login_to_account')}
            </p>


            {/* Forms */}
            <AnimatePresence mode="wait">
              {registerSuccess ? (
                <motion.div
                  key="register-success"
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="text-center"
                >
                  <button
                    onClick={() => {
                      setRegisterSuccess(false);
                      setMode('login');
                    }}
                    className="mt-4 text-sm text-orange-400 hover:text-orange-300"
                  >
                    Return to Login
                  </button>
                </motion.div>
              ) : mode === 'register' ? (
                <motion.form
                  key="register-form"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium block mb-1 text-gray-400">Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          value={registerData.name}
                          onChange={e => setRegisterData(d => ({...d, name: e.target.value}))}
                          className="w-full h-10 bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 text-sm text-white focus:border-orange-500/50 outline-none"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1 text-gray-400">Username</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                        <input
                          type="text"
                          value={registerData.username}
                          onChange={e => setRegisterData(d => ({...d, username: e.target.value}))}
                          className="w-full h-10 bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 text-sm text-white focus:border-orange-500/50 outline-none"
                          placeholder="johndoe"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium block mb-1 text-gray-400">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="email"
                          value={registerData.email}
                          onChange={e => setRegisterData(d => ({...d, email: e.target.value}))}
                          className="w-full h-10 bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 text-sm text-white focus:border-orange-500/50 outline-none"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-400">Password</label>
                        <button type="button" onClick={handleGeneratePassword} className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors">
                          <Wand2 className="w-3 h-3" /> Auto-Generate
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={registerData.password}
                          onChange={e => setRegisterData(d => ({...d, password: e.target.value}))}
                          className="w-full h-10 bg-white/5 border border-white/10 rounded-xl pl-3 pr-10 text-sm text-white focus:border-orange-500/50 outline-none"
                          placeholder="••••••"
                          required
                          minLength={12}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <PasswordPolicy password={registerData.password} email={registerData.email} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium block mb-1 text-gray-400">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="tel"
                          value={registerData.phone}
                          onChange={e => setRegisterData(d => ({...d, phone: e.target.value}))}
                          className="w-full h-10 bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 text-sm text-white focus:border-orange-500/50 outline-none"
                          placeholder="9876543210"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1 text-gray-400">Age</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="number"
                          value={registerData.age}
                          onChange={e => setRegisterData(d => ({...d, age: e.target.value}))}
                          className="w-full h-10 bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 text-sm text-white focus:border-orange-500/50 outline-none"
                          placeholder="18"
                          min="16"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium block mb-1 text-gray-400">City</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          value={registerData.city}
                          onChange={e => setRegisterData(d => ({...d, city: e.target.value}))}
                          className="w-full h-10 bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 text-sm text-white focus:border-orange-500/50 outline-none"
                          placeholder="Mumbai"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isLoading}
                        className="px-3 bg-white/10 hover:bg-white/15 text-xs text-white rounded-xl transition-colors"
                      >
                        Detect
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="acceptCookies"
                      checked={registerData.acceptedCookies}
                      onChange={e => setRegisterData(d => ({...d, acceptedCookies: e.target.checked}))}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500/50 focus:ring-offset-0"
                      required
                    />
                    <label htmlFor="acceptCookies" className="ml-2 text-xs text-gray-400 cursor-pointer">
                      I accept cookies and secure session-cookies.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Register <ArrowRight className="w-4 h-4" /></>
                      )}
                    </span>
                  </button>
                </motion.form>
              ) : mode === '2fa' ? (
                <motion.form
                  key="2fa-form"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  onSubmit={handle2FALogin}
                  className="space-y-5"
                >
                  <div>
                    <label htmlFor="auth-2fa" className="text-xs font-medium block mb-1.5 text-gray-400">Authenticator Code</label>
                    <div className="relative">
                      <input
                        id="auth-2fa"
                        type="text"
                        maxLength={6}
                        value={twoFactorCode}
                        onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-center tracking-widest focus:outline-none focus:border-orange-500/50 transition-colors"
                        placeholder="123456"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || twoFactorCode.length !== 6}
                    className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Verify <ArrowRight className="w-4 h-4" /></>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setTwoFactorCode(''); setTempToken(''); }}
                    className="w-full text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Back to Login
                  </button>
                </motion.form>
              ) : mode === 'forgot_password' ? (
                <motion.div
                  key="forgot-password"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  {forgotStep === 'request' ? (
                    <form onSubmit={handleForgotPasswordRequest} className="space-y-5">
                      <div>
                        <label className="text-xs font-medium block mb-1.5 text-gray-400">Email or Phone Number</label>
                        <div className="relative">
                          <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            value={forgotIdentifier}
                            onChange={e => setForgotIdentifier(e.target.value)}
                            className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                            placeholder="john@example.com or 9876543210"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading || !forgotIdentifier}
                        className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send OTP'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setForgotStep('request'); }}
                        className="w-full text-sm text-gray-400 hover:text-white transition-colors mt-4 block text-center"
                      >
                        Back to Login
                      </button>
                    </form>
                  ) : forgotStep === 'verify' ? (
                    <form onSubmit={handleForgotPasswordVerify} className="space-y-5">
                      <div>
                        <label className="text-xs font-medium block mb-1.5 text-gray-400">OTP Code</label>
                        <div className="relative">
                          <input
                            type="text"
                            maxLength={6}
                            value={forgotOtp}
                            onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-center tracking-widest focus:outline-none focus:border-orange-500/50 transition-colors"
                            placeholder="123456"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading || forgotOtp.length !== 6}
                        className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify OTP'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setForgotStep('request'); setForgotOtp(''); }}
                        className="w-full text-sm text-gray-400 hover:text-white transition-colors mt-4 block text-center"
                      >
                        Back
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotPasswordReset} className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-medium text-gray-400">New Password</label>
                          <button type="button" onClick={handleGenerateForgotPassword} className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors">
                            <Wand2 className="w-3 h-3" /> Auto-Generate
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                            placeholder="••••••"
                            required
                            minLength={12}
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <PasswordPolicy password={password} email="" />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading || !password}
                        className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Reset Password & Login'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setForgotStep('request'); setForgotOtp(''); }}
                        className="w-full text-sm text-gray-400 hover:text-white transition-colors mt-4 block text-center"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </motion.div>
              ) : (
                <motion.form
                  key="login-form"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin}
                  className="space-y-5"
                >
                  <div>
                    <label htmlFor="auth-email" className="text-xs font-medium block mb-1.5 text-gray-400">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        id="auth-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="auth-password" className="text-xs font-medium text-gray-400">Password</label>
                      <button type="button" onClick={() => { setMode('forgot_password'); setForgotStep('request'); setForgotIdentifier(''); setPassword(''); setShowPassword(false); }} className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="auth-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                        placeholder="••••••"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors">
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
                        <>Login <ArrowRight className="w-4 h-4" /></>
                      )}
                    </span>
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
            
            {/* Divider */}
            {!registerSuccess && mode !== '2fa' && mode !== 'forgot_password' && (
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-white/10"></div>
                <span className="px-3 text-xs text-gray-500 uppercase">or</span>
                <div className="flex-1 border-t border-white/10"></div>
              </div>
            )}

            {/* Google Login Button */}
            {!registerSuccess && mode !== '2fa' && mode !== 'forgot_password' && (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-11 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            )}

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
