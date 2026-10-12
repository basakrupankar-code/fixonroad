import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wrench,
  ArrowRight,
  ChevronLeft,
  Mail,
  User as UserIcon,
  MapPin,
  Eye,
  EyeOff,
  Wand2,
  Phone,
  Compass,
  CarFront,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { signInWithPopup } from 'firebase/auth';
import { auth as firebaseAuth, googleProvider } from '../lib/firebase';
import { PasswordPolicy } from '../components/PasswordPolicy';
import toast from 'react-hot-toast';
import { safeFetch } from '../lib/api';
import { resolveGeofenceLocation } from '../lib/geofencing';

const SPECIALIZATIONS = [
  { id: 'Two-wheeler', label: 'Two-Wheeler (Bikes & Scooters)', icon: '🏍️' },
  { id: 'Four-wheeler', label: 'Four-Wheeler (Cars & Cabs)', icon: '🚗' },
  { id: 'Towing', label: 'Towing & Recovery', icon: '🛻' },
  { id: 'All-Rounder', label: 'Multi-Vehicle All-Rounder', icon: '🔧' }
];

export default function PartnerAuth() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [registerData, setRegisterData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    workshopName: '',
    serviceRadius: '10',
    specialization: 'Two-wheeler',
    city: 'Kalyani',
    age: '24',
    vehiclePlate: '',
    upiId: '',
    acceptedCookies: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  useEffect(() => {
    document.title = 'Partner Portal — FixOnRoad Partner Network';
    if (user?.role === 'mechanic') {
      navigate('/mechanic-dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t('auth.errors.enterEmailPass', 'Please enter both email and password'));
      return;
    }

    setIsLoading(true);
    try {
      const data = await safeFetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      login(data.user);
      toast.success(t('auth.loginSuccess', 'Welcome to Partner Dashboard!'));
      
      // Navigate to partner dashboard
      navigate('/mechanic-dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!registerData.workshopName.trim()) {
      toast.error('Please enter your Workshop / Garage Name');
      return;
    }

    if (!registerData.phone.trim()) {
      toast.error('Please enter your Phone / WhatsApp Number');
      return;
    }

    if (!registerData.acceptedCookies) {
      toast.error('Please accept the partner agreement and session policy');
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = registerData.phone.replace(/[^0-9+]/g, '');
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;
      const radiusNum = parseFloat(registerData.serviceRadius) || 10;
      const usernameFallback = (registerData.username || registerData.name || 'mechanic')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 15) + Math.floor(Math.random() * 1000);

      const payload = {
        name: registerData.name,
        username: usernameFallback,
        email: registerData.email,
        password: registerData.password,
        phone: formattedPhone,
        workshopName: registerData.workshopName,
        serviceRadius: radiusNum,
        specialization: registerData.specialization,
        city: registerData.city || 'Kalyani',
        age: parseInt(registerData.age, 10) || 25,
        vehiclePlate: registerData.vehiclePlate || 'WB 00 AP 0000',
        upiId: registerData.upiId || `${cleanPhone}@upi`,
        acceptedCookies: true,
        role: 'mechanic'
      };

      const data = await safeFetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (data.user) {
        login(data.user);
        toast.success('Partner registration successful! Welcome aboard.');
        navigate('/mechanic-dashboard');
      } else {
        setRegisterSuccess(true);
        toast.success(data.message || 'Partner registration complete! Please log in.');
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please check your details.');
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
      (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const geofenceLoc = resolveGeofenceLocation(latitude, longitude);
          if (geofenceLoc.city) {
            setRegisterData(prev => ({ ...prev, city: geofenceLoc.city }));
            toast.success(`Geofence hub detected: ${geofenceLoc.city}`);
          } else {
            toast.error('Could not detect city automatically');
          }
        } catch (_err) {
          toast.error('Failed to fetch location data');
        } finally {
          setIsLoading(false);
        }
      },
      (_err) => {
        const fallback = resolveGeofenceLocation(22.9772, 88.4312);
        setRegisterData(prev => ({ ...prev, city: fallback.city }));
        toast(`Defaulted to service hub: ${fallback.city}`, { icon: '📍' });
        setIsLoading(false);
      }
    );
  };

  const handleGeneratePassword = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*";
    const all = upper + lower + numbers + special;

    let pwd = "";
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += special[Math.floor(Math.random() * special.length)];

    for (let i = 0; i < 8; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }

    pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    setRegisterData(d => ({ ...d, password: pwd }));
    setShowPassword(true);
    toast.success('Strong password generated!');
  };

  const handleGoogleLogin = async () => {
    if (!firebaseAuth || Object.keys(firebaseAuth).length === 0 || !firebaseAuth.name) {
      toast.error('Firebase is not configured! Please add your VITE_FIREBASE_* credentials.');
      return;
    }

    setIsLoading(true);
    try {
      // Force account picker prompt to allow signing in with any Gmail account
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();

      const data = await safeFetch('/api/v1/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role: 'mechanic' })
      });

      login(data.user);
      toast.success('Signed in with Google as Mechanic Partner!');
      // Navigate to partner dashboard
      navigate('/mechanic-dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Google sign in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 flex items-center justify-center relative overflow-y-auto bg-[#070A0F] text-white">
      {/* Dynamic ambient backgrounds */}
      <div className="glow-orb w-[550px] h-[550px] -top-[15%] -left-[10%] bg-emerald-600/15 blur-[120px]" />
      <div className="glow-orb w-[500px] h-[500px] -bottom-[15%] -right-[10%] bg-amber-600/12 blur-[120px]" />
      <div className="glow-orb w-[300px] h-[300px] top-[40%] right-[30%] bg-teal-500/10 blur-[90px]" />
      <div className="dot-grid opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-xl relative z-10 my-4"
      >
        <div className="bg-[#0E1420]/90 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-emerald-950/40 relative overflow-hidden">
          {/* Subtle top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500" />

          {/* Top navigation row */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => navigate('/mechanic')}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Portal Overview</span>
            </button>

            <Link
              to="/auth"
              className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 transition-all hover:bg-orange-500/15"
            >
              <span>Driver / Rider Login</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Partner Branding Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Partner Network
            </div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 shadow-inner">
                <Wrench className="w-6 h-6 text-emerald-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] tracking-tight">
                FixOnRoad <span className="text-emerald-400">Partner</span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Join West Bengal's leading on-demand breakdown dispatch network. Earn on your schedule with zero platform fee.
            </p>
          </div>

          {/* Mode Switcher */}
          {!registerSuccess && (
            <div className="flex bg-[#070A0F] border border-slate-800 rounded-2xl p-1 mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Partner Login
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'register'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Register Workshop
              </button>
            </div>
          )}

          {/* Form container */}
          <AnimatePresence mode="wait">
            {registerSuccess ? (
              <motion.div
                key="partner-reg-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-6 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">Partner Account Created!</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Your workshop details have been recorded. You can now log in to access live customer breakdown dispatches.
                </p>
                <button
                  onClick={() => {
                    setRegisterSuccess(false);
                    setMode('login');
                  }}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
                >
                  Proceed to Partner Login
                </button>
              </motion.div>
            ) : mode === 'register' ? (
              <motion.form
                key="partner-register-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                {/* 1. Workshop & Specialization Section */}
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Workshop Onboarding Details</span>
                  </div>

                  {/* Workshop / Garage Name */}
                  <div>
                    <label className="text-xs font-semibold block mb-1 text-slate-300">
                      Workshop / Garage Name <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/60" />
                      <input
                        type="text"
                        value={registerData.workshopName}
                        onChange={e => setRegisterData(d => ({ ...d, workshopName: e.target.value }))}
                        className="w-full h-10 bg-slate-900/80 border border-slate-700/80 rounded-xl pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition-colors"
                        placeholder="e.g. Royal Auto Clinic / Mondal Bike Care"
                        required
                      />
                    </div>
                  </div>

                  {/* Specialization selection */}
                  <div>
                    <label className="text-xs font-semibold block mb-1 text-slate-300">
                      Primary Specialization <span className="text-emerald-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SPECIALIZATIONS.map(spec => {
                        const isSelected = registerData.specialization === spec.id;
                        return (
                          <button
                            key={spec.id}
                            type="button"
                            onClick={() => setRegisterData(d => ({ ...d, specialization: spec.id }))}
                            className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium text-left transition-all border ${
                              isSelected
                                ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-base">{spec.icon}</span>
                            <span className="truncate">{spec.label.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Service Radius */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Service Radius (in km) <span className="text-emerald-400">*</span>
                      </label>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {registerData.serviceRadius} km coverage
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="2"
                        max="35"
                        step="1"
                        value={registerData.serviceRadius}
                        onChange={e => setRegisterData(d => ({ ...d, serviceRadius: e.target.value }))}
                        className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                      />
                      <div className="relative w-24">
                        <Compass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={registerData.serviceRadius}
                          onChange={e => setRegisterData(d => ({ ...d, serviceRadius: e.target.value }))}
                          className="w-full h-8 bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-2 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Contact & Owner Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1 text-slate-400">
                      Contact Person / Partner Name <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={registerData.name}
                        onChange={e => setRegisterData(d => ({ ...d, name: e.target.value }))}
                        className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 text-sm text-white focus:border-emerald-500 outline-none"
                        placeholder="Sanjay Das"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium block mb-1 text-slate-400">
                      Phone / WhatsApp Number <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      <input
                        type="tel"
                        value={registerData.phone}
                        onChange={e => setRegisterData(d => ({ ...d, phone: e.target.value }))}
                        className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 text-sm text-white focus:border-emerald-500 outline-none"
                        placeholder="9876543210"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Email & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1 text-slate-400">
                      Email Address <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={registerData.email}
                        onChange={e => setRegisterData(d => ({ ...d, email: e.target.value }))}
                        className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 text-sm text-white focus:border-emerald-500 outline-none"
                        placeholder="partner@garage.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium block mb-1 text-slate-400">Operating City</label>
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={registerData.city}
                          onChange={e => setRegisterData(d => ({ ...d, city: e.target.value }))}
                          className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 text-sm text-white focus:border-emerald-500 outline-none"
                          placeholder="Kalyani"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isLoading}
                        className="px-2.5 bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 rounded-xl border border-slate-700 transition-colors"
                        title="Detect GPS city"
                      >
                        GPS
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-400">
                      Account Password <span className="text-emerald-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                    >
                      <Wand2 className="w-3 h-3" /> Auto-Generate
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={registerData.password}
                      onChange={e => setRegisterData(d => ({ ...d, password: e.target.value }))}
                      className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl pl-3 pr-10 text-sm text-white focus:border-emerald-500 outline-none"
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordPolicy password={registerData.password} email={registerData.email} />
                </div>

                {/* UPI ID for direct payout */}
                <div>
                  <label className="text-xs font-medium block mb-1 text-slate-400">
                    UPI ID for Instant Direct Payouts (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-xs">₹</span>
                    <input
                      type="text"
                      value={registerData.upiId}
                      onChange={e => setRegisterData(d => ({ ...d, upiId: e.target.value }))}
                      className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 text-sm text-white focus:border-emerald-500 outline-none"
                      placeholder="e.g. 9876543210@paytm or garage@okhdfcbank"
                    />
                  </div>
                </div>

                {/* Cookie / Terms Checkbox */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="partnerCookies"
                    checked={registerData.acceptedCookies}
                    onChange={e => setRegisterData(d => ({ ...d, acceptedCookies: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/50"
                    required
                  />
                  <label htmlFor="partnerCookies" className="text-xs text-slate-400 cursor-pointer leading-relaxed">
                    I agree to the FixOnRoad Mechanic Partner Service Agreement, transparent fixed rates, and prompt dispatch policies.
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete Partner Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="partner-login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-semibold block mb-1.5 text-slate-300">
                    Partner Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/70" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full h-11 bg-slate-900/90 border border-slate-800 rounded-xl pl-11 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="partner@fixonroad.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full h-11 bg-slate-900/90 border border-slate-800 rounded-xl pl-4 pr-10 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Partner Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          {!registerSuccess && (
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-slate-800" />
              <span className="px-3 text-xs text-slate-500 uppercase tracking-wider">or sign in with</span>
              <div className="flex-1 border-t border-slate-800" />
            </div>
          )}

          {/* Google Sign-In with select_account */}
          {!registerSuccess && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-11 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google (Mechanic Account)</span>
              </button>
            </div>
          )}

          {/* Bottom Switcher */}
          {!registerSuccess && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-xs sm:text-sm text-slate-400 hover:text-emerald-400 transition-colors"
              >
                {mode === 'login'
                  ? "Own a garage or towing truck? Register as Partner →"
                  : "Already registered as Partner? Sign In →"}
              </button>
            </div>
          )}

          {/* Guarantee badge */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center gap-2 text-slate-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted credentials · Direct customer payouts · Verified partner ID</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
