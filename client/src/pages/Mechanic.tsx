import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { safeFetch } from '../lib/api';
import { Power, MapPin, Navigation, TrendingUp, Clock, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';

interface Job {
  id: string;
  type: string;
  customerName: string;
  location: string;
  distance: string;
  price: number;
  status: 'PENDING' | 'MECHANIC_ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED' | 'pending' | 'active' | 'completed';
  time: string;
}

export default function MechanicPortal() {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState((user as any)?.isAvailable || false);
  const [activeTab, setActiveTab] = useState<'feed' | 'active' | 'earnings'>('feed');
  const [jobs, setJobs] = useState<Job[]>([]);

  const fetchJobs = async () => {
    try {
      const data = await safeFetch('/api/v1/bookings/mechanic-jobs');
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    }
  };

  useEffect(() => {
    if (isAvailable) {
      fetchJobs();
      // Poll every 10 seconds for new jobs
      const interval = setInterval(fetchJobs, 10000);
      return () => clearInterval(interval);
    }
  }, [isAvailable]);

  const toggleAvailability = async () => {
    const newState = !isAvailable;
    setIsAvailable(newState);
    try {
      await safeFetch('/api/v1/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAvailable: newState })
      });
    } catch (err) {
      console.error('Failed to update availability:', err);
      setIsAvailable(!newState);
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    try {
      await safeFetch(`/api/v1/bookings/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'MECHANIC_ASSIGNED' })
      });
      // Refresh jobs to move it to active tab
      await fetchJobs();
      setActiveTab('active');
    } catch (err) {
      console.error('Failed to accept job', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1920&q=80')] opacity-[0.03] bg-cover bg-center mix-blend-overlay pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-600/10 blur-[130px] rounded-full pointer-events-none" />
      
      <Navbar variant="rider" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 relative z-10">
        
        {/* Header & Availability Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 bg-[#121824]/80 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-white">Partner Portal</h1>
            <p className="text-sm text-slate-400 mt-1">Welcome back, {user?.name || 'Mechanic'}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className={`text-sm font-semibold ${isAvailable ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isAvailable ? 'ONLINE & RECEIVING JOBS' : 'OFFLINE'}
            </span>
            <button 
              onClick={toggleAvailability}
              className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors duration-300 focus:outline-none ${isAvailable ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-slate-800 border border-slate-700'}`}
            >
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white transition-transform duration-300 ${isAvailable ? 'translate-x-12 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'translate-x-1'}`}>
                <Power className={`w-5 h-5 ${isAvailable ? 'text-emerald-500' : 'text-slate-400'}`} />
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-slate-800 mb-8 overflow-x-auto pb-2">
          {['feed', 'active', 'earnings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'feed' ? 'Incident Feed' : tab === 'active' ? 'Active Job' : 'Earnings Summary'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'feed' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!isAvailable ? (
                  <div className="col-span-full py-16 text-center border border-slate-800 border-dashed rounded-3xl bg-slate-900/30">
                    <Power className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">You are currently offline</h3>
                    <p className="text-slate-400">Go online to start receiving rescue requests.</p>
                  </div>
                ) : (
                  jobs.filter(j => j.status === 'PENDING').map(job => (
                    <div key={job.id} className="bg-[#121824] border border-orange-500/20 rounded-3xl p-6 relative overflow-hidden group hover:border-orange-500/50 transition-colors">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-[30px] group-hover:bg-orange-500/20 transition-colors" />
                      
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> NEW REQUEST
                        </span>
                        <span className="text-xs text-slate-400">{job.time}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-1">{job.type}</h3>
                      <p className="text-slate-400 text-sm mb-4">{job.customerName}</p>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-3 text-sm text-slate-300">
                          <MapPin className="w-4 h-4 text-orange-400" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-300">
                          <Navigation className="w-4 h-4 text-emerald-400" />
                          <span>{job.distance}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Est. Earnings</p>
                          <p className="text-lg font-bold text-emerald-400">₹{job.price}</p>
                        </div>
                        <button 
                          onClick={() => handleAcceptJob(job.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]"
                        >
                          Accept Job
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'active' && (
              <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
                {jobs.filter(j => j.status === 'MECHANIC_ASSIGNED' || j.status === 'EN_ROUTE' || j.status === 'ARRIVED').length === 0 ? (
                  <div className="py-16 text-center border border-slate-800 border-dashed rounded-3xl bg-[#121824]/50">
                    <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Active Jobs</h3>
                    <p className="text-slate-400">Accept a request from the incident feed to begin tracking.</p>
                  </div>
                ) : (
                  jobs.filter(j => j.status === 'MECHANIC_ASSIGNED' || j.status === 'EN_ROUTE' || j.status === 'ARRIVED').map(job => (
                    <div key={job.id} className="bg-[#121824] border border-emerald-500/30 rounded-3xl p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px]" />
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-1">{job.type}</h3>
                          <p className="text-emerald-400 font-semibold">{job.status.replace('_', ' ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400 mb-1">Earnings</p>
                          <p className="text-2xl font-bold text-white">₹{job.price}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4 mb-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                            👤
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Customer</p>
                            <p className="font-semibold text-white">{job.customerName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-orange-400">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Location</p>
                            <p className="font-semibold text-white">{job.location}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-semibold transition-colors border border-white/10">
                          Navigate
                        </button>
                        <button 
                          onClick={async () => {
                            await safeFetch(`/api/v1/bookings/${job.id}/status`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'COMPLETED' })
                            });
                            fetchJobs();
                          }}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                        >
                          Mark Complete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-[#121824] border border-slate-800 p-6 rounded-3xl">
                    <p className="text-slate-400 text-sm mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Today's Earnings</p>
                    <p className="text-3xl font-bold text-white">₹1,250</p>
                  </div>
                  <div className="bg-[#121824] border border-slate-800 p-6 rounded-3xl">
                    <p className="text-slate-400 text-sm mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Jobs Completed</p>
                    <p className="text-3xl font-bold text-white">3</p>
                  </div>
                  <div className="bg-[#121824] border border-slate-800 p-6 rounded-3xl">
                    <p className="text-slate-400 text-sm mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> Online Time</p>
                    <p className="text-3xl font-bold text-white">4h 12m</p>
                  </div>
                </div>

                <div className="bg-[#121824] border border-slate-800 rounded-3xl overflow-hidden">
                  <div className="p-6 border-b border-slate-800">
                    <h3 className="text-lg font-bold">Recent Payouts</h3>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-4 sm:px-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div>
                          <p className="font-semibold text-white">Flat Tire Repair</p>
                          <p className="text-xs text-slate-400 mt-1">Oct {10 - i}, 2026 • 14:30 PM</p>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <p className="font-bold text-emerald-400">+₹350</p>
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </main>
    </div>
  );
}
