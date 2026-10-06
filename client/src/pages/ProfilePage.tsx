import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Phone, MapPin, Hash, Activity, Save, AlertCircle, CheckCircle2, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    city: '',
    age: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

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
        age: user.age ? String(user.age) : ''
      });
    }
  }, [user, isAuthenticated, isAuthLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setSaveLoading(true);
    try {
      const res = await fetch('/api/v1/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to update profile');
      updateUserData(data);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passwordData.password !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (passwordData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError(null);
    setSuccess(null);
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
      setSuccess('Password updated successfully');
      setPasswordData({ password: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPasswordLoading(false);
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
          <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-gray-400">Manage your account details and preferences.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-200">{success}</p>
          </div>
        )}

        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setError(null);
                    setSuccess(null);
                    if (user) {
                      setFormData({
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        username: user.username || '',
                        city: user.city || '',
                        age: user.age ? String(user.age) : ''
                      });
                    }
                  }}
                  className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {saveLoading ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
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
            
            <div className="pt-6 mt-6 border-t border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Security</h3>
              <div className="grid sm:grid-cols-2 gap-5 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1.5">New Password</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={passwordData.password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-11 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-11 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                    />
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
              <button 
                onClick={logout}
                className="px-4 py-2 rounded-xl text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer variant={user?.role === 'mechanic' ? 'mechanic' : 'rider'} />
    </div>
  );
}
