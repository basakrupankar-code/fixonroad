import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Phone, MapPin, Hash, Activity, Save, AlertCircle, CheckCircle2, Key, Shield, Eye, EyeOff, Wand2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PasswordPolicy } from '../components/PasswordPolicy';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading: isAuthLoading, logout, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    city: '',
    age: '',
    language: 'en'
  });
  const [mechanicData, setMechanicData] = useState({
    garageName: '',
    isOnline: false,
    specializations: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [twoFactorQrCode, setTwoFactorQrCode] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  useEffect(() => {
    // Update language when selection changes
    i18n.changeLanguage(formData.language);
  }, [formData.language]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        username: user.username || '',
        city: user.city || '',
        age: user.age ? String(user.age) : '',
        language: user.language || 'en'
      });

      if (user.role === 'mechanic') {
        fetch('/api/v1/me/mechanic')
          .then(res => res.json())
          .then(data => {
            if (!data.error) {
              setMechanicData({
                garageName: data.garageName || '',
                isOnline: data.isOnline || false,
                specializations: data.specializations?.join(', ') || ''
              });
            }
          });
      }
    }
  }, [user, isAuthenticated, isAuthLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      const formattedPhone = formData.phone && formData.phone.length > 0 && !formData.phone.startsWith('+') ? `+91${formData.phone}` : formData.phone;
      const payload = { ...formData, phone: formattedPhone };
      
      const res = await fetch('/api/v1/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to update profile');

      if (user?.role === 'mechanic') {
        const mechPayload = {
          garageName: mechanicData.garageName,
          isOnline: mechanicData.isOnline,
          specializations: mechanicData.specializations.split(',').map(s => s.trim()).filter(Boolean)
        };
        const resMech = await fetch('/api/v1/me/mechanic', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mechPayload)
        });
        if (!resMech.ok) {
          const mechData = await resMech.json();
          throw new Error(mechData.error?.message || 'Failed to update mechanic profile');
        }
      }

      updateUserData(data);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/v1/me/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: passwordData.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to update password');
      toast.success('Password updated successfully');
      setPasswordData({ password: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPasswordLoading(false);
    }
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
    
    setPasswordData({ password: pwd, confirmPassword: pwd });
    setShowPassword(true);
    setShowConfirmPassword(true);
    toast.success('Strong password generated!');
  };

  const handleGenerate2FA = async () => {
    setTwoFactorLoading(true);
    try {
      const res = await fetch('/api/v1/me/2fa/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to generate 2FA');
      setTwoFactorQrCode(data.qrCodeImage);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (twoFactorCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    setTwoFactorLoading(true);
    try {
      const res = await fetch('/api/v1/me/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFactorCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to verify 2FA');
      toast.success('Two-Factor Authentication enabled successfully');
      setTwoFactorQrCode(null);
      setTwoFactorCode('');
      updateUserData({ isTwoFactorEnabled: true });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setTwoFactorLoading(true);
    try {
      const res = await fetch('/api/v1/me/2fa/disable', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to disable 2FA');
      toast.success('Two-Factor Authentication disabled');
      updateUserData({ isTwoFactorEnabled: false });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0F14]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0F14]">
      <Navbar variant={user?.role === 'mechanic' ? 'mechanic' : 'rider'} />
      
      <main className="flex-1 pt-24 pb-12 px-5 max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('profile.my_profile')}</h1>
        </div>



        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                {t('profile.edit_profile')}
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (user) {
                      setFormData({
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        username: user.username || '',
                        city: user.city || '',
                        age: user.age ? String(user.age) : '',
                        language: user.language || 'en'
                      });
                    }
                  }}
                  className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  {t('profile.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {saveLoading ? 'Saving...' : <><Save className="w-4 h-4" /> {t('profile.save_changes')}</>}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center border-2 border-orange-500/50">
              <UserIcon className="w-10 h-10 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.name || 'User'}</h2>
              <p className="text-sm text-gray-400 capitalize">{user?.role} Account</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-11 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500/50 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Username</label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-11 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500/50 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-11 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500/50 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-11 pl-10 pr-4 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Phone number cannot be changed.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-11 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500/50 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Age</label>
                <div className="relative">
                  <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-11 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500/50 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5 mt-5">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">{t('profile.language_preference')}</label>
                <div className="relative">
                  <select
                    name="language"
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-white focus:outline-none focus:border-orange-500/50 disabled:opacity-70 disabled:cursor-not-allowed transition-colors appearance-none"
                  >
                    <option value="en" className="bg-[#0D0F14]">{t('profile.english')}</option>
                    <option value="bn" className="bg-[#0D0F14]">{t('profile.bengali')}</option>
                    <option value="hi" className="bg-[#0D0F14]">{t('profile.hindi')}</option>
                  </select>
                </div>
              </div>
            </div>

            {user?.role === 'mechanic' && (
              <div className="pt-6 mt-6 border-t border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Mechanic Profile</h3>
                <div className="grid sm:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1.5">Garage Name</label>
                    <input
                      type="text"
                      value={mechanicData.garageName}
                      onChange={(e) => setMechanicData(prev => ({ ...prev, garageName: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="e.g., RiderFix Garage"
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-white focus:outline-none focus:border-orange-500/50 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1.5">Specializations (comma separated)</label>
                    <input
                      type="text"
                      value={mechanicData.specializations}
                      onChange={(e) => setMechanicData(prev => ({ ...prev, specializations: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="e.g., tires, engine, towing"
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-white focus:outline-none focus:border-orange-500/50 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isOnline"
                    checked={mechanicData.isOnline}
                    onChange={(e) => setMechanicData(prev => ({ ...prev, isOnline: e.target.checked }))}
                    disabled={!isEditing}
                    className="w-5 h-5 rounded bg-white/5 border-white/10 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="isOnline" className="text-sm font-medium text-white">
                    Available for requests (Online)
                  </label>
                </div>
              </div>
            )}
            
            <div className="pt-6 mt-6 border-t border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Security</h3>
              <div className="grid sm:grid-cols-2 gap-5 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-gray-400">New Password</label>
                    <button type="button" onClick={handleGeneratePassword} className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors">
                      <Wand2 className="w-3 h-3" /> Auto-Generate
                    </button>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 12 characters"
                      minLength={12}
                      value={passwordData.password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-11 pl-10 pr-10 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordPolicy password={passwordData.password} email={user?.email} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-11 pl-10 pr-10 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={handlePasswordSave}
                disabled={passwordLoading || !passwordData.password}
                className="px-4 py-2 rounded-xl text-sm font-bold text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {passwordLoading ? 'Updating...' : 'Set / Update Password'}
              </button>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" />
                    Two-Factor Authentication (2FA)
                  </h3>
                  <p className="text-sm text-gray-400">Add an extra layer of security to your account.</p>
                </div>
                {user?.isTwoFactorEnabled ? (
                  <button
                    onClick={handleDisable2FA}
                    disabled={twoFactorLoading}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    Disable 2FA
                  </button>
                ) : !twoFactorQrCode ? (
                  <button
                    onClick={handleGenerate2FA}
                    disabled={twoFactorLoading}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 transition-colors disabled:opacity-50"
                  >
                    Enable 2FA
                  </button>
                ) : null}
              </div>

              {twoFactorQrCode && !user?.isTwoFactorEnabled && (
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 mt-4">
                  <p className="text-sm text-gray-300 mb-4">
                    1. Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).
                  </p>
                  <div className="bg-white p-2 rounded-xl w-fit mb-4">
                    <img src={twoFactorQrCode} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    2. Enter the 6-digit code from your app to verify.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                      className="bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-white focus:outline-none focus:border-orange-500/50 transition-colors w-32 text-center tracking-widest"
                    />
                    <button
                      onClick={handleVerify2FA}
                      disabled={twoFactorLoading || twoFactorCode.length !== 6}
                      className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors disabled:opacity-50 h-11"
                    >
                      {twoFactorLoading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-white/10">
              <button 
                onClick={logout}
                className="px-4 py-2 rounded-xl text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
              >
                {t('profile.logout')}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer variant={user?.role === 'mechanic' ? 'mechanic' : 'rider'} />
    </div>
  );
}
