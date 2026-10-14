import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { safeFetch } from '../lib/api';
import {
  Power,
  MapPin,
  Navigation,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  Wallet,
  Calendar,
  LocateFixed,
  Phone
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { formatCurrencyINR } from '../utils/currency';
import { calculateHaversineDistanceKm, isValidCoordinate, formatDistance, LatLng } from '../utils/distance';
import { useCurrentLocation } from '../hooks/useCurrentLocation';

interface Job {
  id: string;
  type: string;
  customerName: string;
  customerPhone?: string | null;
  location: string;
  coordinates?: { lat: number | null; lng: number | null };
  distanceKm?: number | null;
  distance: string;
  price: number;
  basePrice?: number;
  gst?: number;
  platformFee?: number;
  status: 'PENDING' | 'MECHANIC_ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED' | 'pending' | 'active' | 'completed';
  time: string;
}

interface EarningsData {
  today: number;
  todayJobs: number;
  week: number;
  weekJobs: number;
  month: number;
  monthJobs: number;
  lifetime: number;
  completedJobs: number;
  activeJobs: number;
  activeEarnings: number;
}

interface PayoutRecord {
  id: string;
  serviceType: string;
  customerName: string;
  amount: number;
  basePrice?: number;
  date: string;
  paymentMethod: string;
  status: string;
}

export default function MechanicPortal() {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState((user as any)?.isAvailable || false);
  const [activeTab, setActiveTab] = useState<'feed' | 'active' | 'earnings'>('feed');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(false);

  // Use production-grade useCurrentLocation hook with GPS timeout handling & IP fallback
  const {
    coords: mechanicCoords,
    source: geoSource,
    isLoading: isLocating,
    error: geoError,
    refreshLocation
  } = useCurrentLocation({
    autoFetch: true,
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
    syncWithBackend: true,
    fallbackCoords:
      (user as any)?.currentLocation && isValidCoordinate((user as any).currentLocation.lat, (user as any).currentLocation.lng)
        ? (user as any).currentLocation
        : undefined
  });

  // Aggregated earnings state
  const [earnings, setEarnings] = useState<EarningsData>({
    today: 0,
    todayJobs: 0,
    week: 0,
    weekJobs: 0,
    month: 0,
    monthJobs: 0,
    lifetime: 0,
    completedJobs: 0,
    activeJobs: 0,
    activeEarnings: 0
  });
  const [recentPayouts, setRecentPayouts] = useState<PayoutRecord[]>([]);

  // ── API Fetchers ────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    try {
      setIsLoadingJobs(true);
      const queryParams = new URLSearchParams();
      if (mechanicCoords && isValidCoordinate(mechanicCoords.lat, mechanicCoords.lng)) {
        queryParams.set('lat', mechanicCoords.lat.toString());
        queryParams.set('lng', mechanicCoords.lng.toString());
      }
      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const data = await safeFetch(`/api/v1/bookings/mechanic-jobs${qs}`);
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setIsLoadingJobs(false);
    }
  }, [mechanicCoords]);

  const fetchEarnings = useCallback(async () => {
    try {
      setIsLoadingEarnings(true);
      const data = await safeFetch('/api/v1/bookings/mechanic-earnings');
      if (data?.earnings) {
        setEarnings(data.earnings);
      }
      if (Array.isArray(data?.recentPayouts)) {
        setRecentPayouts(data.recentPayouts);
      }
    } catch (err) {
      console.error('Failed to fetch earnings', err);
    } finally {
      setIsLoadingEarnings(false);
    }
  }, []);

  // Poll jobs when available and online
  useEffect(() => {
    if (isAvailable) {
      fetchJobs();
      const interval = setInterval(fetchJobs, 10000);
      return () => clearInterval(interval);
    }
  }, [isAvailable, fetchJobs]);

  // Refresh earnings when earnings tab is selected
  useEffect(() => {
    if (activeTab === 'earnings') {
      fetchEarnings();
    }
  }, [activeTab, fetchEarnings]);

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
      if (newState) {
        fetchJobs();
      }
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
      await fetchJobs();
      setActiveTab('active');
    } catch (err: any) {
      console.error('Failed to accept job', err);
      alert(err.message || 'Unable to accept this request. It may have already been claimed.');
      fetchJobs();
    }
  };

  // ── Dynamic Distance Computation ───────────────────────────────────────────
  const getDisplayDistance = (job: Job): string => {
    // If mechanic has live coords and job has coordinates, calculate live on client
    if (
      mechanicCoords &&
      job.coordinates &&
      isValidCoordinate(job.coordinates.lat, job.coordinates.lng)
    ) {
      const liveKm = calculateHaversineDistanceKm(mechanicCoords, {
        lat: job.coordinates.lat!,
        lng: job.coordinates.lng!
      });
      if (liveKm !== null) {
        return formatDistance(liveKm);
      }
    }

    // Fall back to server precomputed distance or distanceKm
    if (typeof job.distanceKm === 'number' && !isNaN(job.distanceKm)) {
      return formatDistance(job.distanceKm);
    }

    if (job.distance && job.distance !== 'Unknown km') {
      return job.distance;
    }

    return 'Nearby';
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-['Outfit'] text-white">Partner Portal</h1>
              {geoSource === 'gps' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <LocateFixed className="w-3 h-3" /> GPS Live
                </span>
              ) : geoSource === 'ip' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30" title="Position approximated via IP">
                  <LocateFixed className="w-3 h-3" /> Network IP
                </span>
              ) : (
                <button
                  onClick={refreshLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  <LocateFixed className="w-3 h-3 text-orange-400" />
                  {isLocating ? 'Locating...' : 'Enable GPS'}
                </button>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Welcome back, {user?.name || 'Mechanic'}
              {mechanicCoords ? ` • Loc: ${mechanicCoords.lat.toFixed(3)}, ${mechanicCoords.lng.toFixed(3)} (${geoSource || 'approx'})` : ''}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className={`text-sm font-semibold ${isAvailable ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isAvailable ? 'ONLINE & RECEIVING JOBS' : 'OFFLINE'}
            </span>
            <button 
              onClick={toggleAvailability}
              className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors duration-300 focus:outline-none ${isAvailable ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-slate-800 border border-slate-700'}`}
              aria-label="Toggle online availability"
            >
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white transition-transform duration-300 ${isAvailable ? 'translate-x-12 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'translate-x-1'}`}>
                <Power className={`w-5 h-5 ${isAvailable ? 'text-emerald-500' : 'text-slate-400'}`} />
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-between items-center border-b border-slate-800 mb-8 overflow-x-auto pb-2 gap-4">
          <div className="flex gap-4">
            {['feed', 'active', 'earnings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'feed'
                  ? `Incident Feed (${jobs.filter(j => j.status === 'PENDING').length})`
                  : tab === 'active'
                  ? `Active Job (${jobs.filter(j => ['MECHANIC_ASSIGNED', 'EN_ROUTE', 'ARRIVED'].includes(j.status)).length})`
                  : 'Earnings Summary'}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              fetchJobs();
              if (activeTab === 'earnings') fetchEarnings();
            }}
            disabled={isLoadingJobs || isLoadingEarnings}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(isLoadingJobs || isLoadingEarnings) ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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
            {/* ── 1. Incident Feed ────────────────────────────────────────── */}
            {activeTab === 'feed' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!isAvailable ? (
                  <div className="col-span-full py-16 text-center border border-slate-800 border-dashed rounded-3xl bg-slate-900/30">
                    <Power className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">You are currently offline</h3>
                    <p className="text-slate-400 mb-4">Go online to start receiving live roadside assistance rescue requests.</p>
                    <button
                      onClick={toggleAvailability}
                      className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                      <Power className="w-4 h-4" /> Go Online Now
                    </button>
                  </div>
                ) : jobs.filter(j => j.status === 'PENDING').length === 0 ? (
                  <div className="col-span-full py-16 text-center border border-slate-800 border-dashed rounded-3xl bg-slate-900/30">
                    <CheckCircle className="w-12 h-12 text-emerald-500/50 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Incident Feed Clear</h3>
                    <p className="text-slate-400">No pending roadside requests in your area right now. Standing by for incoming alerts...</p>
                  </div>
                ) : (
                  jobs.filter(j => j.status === 'PENDING').map(job => (
                    <div key={job.id} className="bg-[#121824] border border-orange-500/20 rounded-3xl p-6 relative overflow-hidden group hover:border-orange-500/50 transition-colors flex flex-col justify-between">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-[30px] group-hover:bg-orange-500/20 transition-colors pointer-events-none" />
                      
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-orange-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" /> NEW REQUEST
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(job.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-1">{job.type}</h3>
                        <p className="text-slate-400 text-sm mb-4">{job.customerName}</p>

                        <div className="space-y-2 mb-6">
                          <div className="flex items-start gap-3 text-sm text-slate-300">
                            <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{job.location}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-300">
                            <Navigation className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="font-medium text-emerald-400">{getDisplayDistance(job)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Est. Earnings</p>
                          <p className="text-xl font-bold text-emerald-400">
                            {formatCurrencyINR(job.price)}
                          </p>
                          {job.basePrice && job.basePrice !== job.price ? (
                            <p className="text-[11px] text-slate-500">Base: {formatCurrencyINR(job.basePrice)}</p>
                          ) : null}
                        </div>
                        <button 
                          onClick={() => handleAcceptJob(job.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]"
                        >
                          Accept Job
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── 2. Active Job Tab ────────────────────────────────────────── */}
            {activeTab === 'active' && (
              <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
                {jobs.filter(j => ['MECHANIC_ASSIGNED', 'EN_ROUTE', 'ARRIVED'].includes(j.status)).length === 0 ? (
                  <div className="py-16 text-center border border-slate-800 border-dashed rounded-3xl bg-[#121824]/50">
                    <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Active Jobs</h3>
                    <p className="text-slate-400">Accept a request from the incident feed to begin live dispatch and service.</p>
                  </div>
                ) : (
                  jobs.filter(j => ['MECHANIC_ASSIGNED', 'EN_ROUTE', 'ARRIVED'].includes(j.status)).map(job => (
                    <div key={job.id} className="bg-[#121824] border border-emerald-500/30 rounded-3xl p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] pointer-events-none" />
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {job.status.replace('_', ' ')}
                          </div>
                          <h3 className="text-2xl font-bold text-white">{job.type}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400 mb-1">Expected Payout</p>
                          <p className="text-2xl font-bold text-emerald-400">{formatCurrencyINR(job.price)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4 mb-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold">
                              {job.customerName?.charAt(0) || 'C'}
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">Customer</p>
                              <p className="font-semibold text-white">{job.customerName}</p>
                            </div>
                          </div>
                          {job.customerPhone && (
                            <a
                              href={`tel:${job.customerPhone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" /> Call Customer
                            </a>
                          )}
                        </div>

                        <div className="flex items-start gap-4 pt-2 border-t border-slate-800/80">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-orange-400 shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Incident Location</p>
                            <p className="font-semibold text-white">{job.location}</p>
                            <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1">
                              <Navigation className="w-3 h-3" /> Distance: {getDisplayDistance(job)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Job Status Workflow Controls */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => {
                            if (job.coordinates?.lat && job.coordinates?.lng) {
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${job.coordinates.lat},${job.coordinates.lng}`,
                                '_blank'
                              );
                            } else {
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.location)}`,
                                '_blank'
                              );
                            }
                          }}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-semibold transition-colors border border-white/10 flex items-center justify-center gap-2"
                        >
                          <Navigation className="w-4 h-4 text-orange-400" />
                          Open in Google Maps
                        </button>

                        {job.status === 'MECHANIC_ASSIGNED' && (
                          <button
                            onClick={async () => {
                              await safeFetch(`/api/v1/bookings/${job.id}/status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'EN_ROUTE' })
                              });
                              fetchJobs();
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                          >
                            Mark En Route
                          </button>
                        )}

                        {job.status === 'EN_ROUTE' && (
                          <button
                            onClick={async () => {
                              await safeFetch(`/api/v1/bookings/${job.id}/status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'ARRIVED' })
                              });
                              fetchJobs();
                            }}
                            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)]"
                          >
                            Mark Arrived
                          </button>
                        )}

                        <button 
                          onClick={async () => {
                            await safeFetch(`/api/v1/bookings/${job.id}/status`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'COMPLETED' })
                            });
                            await fetchJobs();
                            await fetchEarnings();
                            setActiveTab('earnings');
                          }}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                        >
                          Complete Service
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── 3. Earnings Summary Tab ──────────────────────────────────── */}
            {activeTab === 'earnings' && (
              <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Active in-progress banner */}
                {earnings.activeJobs > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 animate-spin" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Active Rescue in Progress</p>
                        <p className="text-xs text-slate-400">
                          {earnings.activeJobs} assigned job(s) awaiting completion
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">In-Progress Value: </span>
                      <span className="font-bold text-emerald-400 text-lg">
                        {formatCurrencyINR(earnings.activeEarnings)}
                      </span>
                    </div>
                  </div>
                )}

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  
                  {/* Today */}
                  <div className="bg-[#121824] border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-400">
                        <TrendingUp className="w-5 h-5" />
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        Today
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mb-1 font-medium uppercase tracking-wider">Today's Earnings</p>
                    <p className="text-3xl font-bold text-white tracking-tight">
                      {formatCurrencyINR(earnings.today)}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {earnings.todayJobs} {earnings.todayJobs === 1 ? 'job' : 'jobs'} completed today
                    </p>
                  </div>

                  {/* This Week */}
                  <div className="bg-[#121824] border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400">
                        <Calendar className="w-5 h-5" />
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        7 Days
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mb-1 font-medium uppercase tracking-wider">This Week</p>
                    <p className="text-3xl font-bold text-white tracking-tight">
                      {formatCurrencyINR(earnings.week)}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {earnings.weekJobs} {earnings.weekJobs === 1 ? 'job' : 'jobs'} this week
                    </p>
                  </div>

                  {/* This Month */}
                  <div className="bg-[#121824] border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400">
                        <Wallet className="w-5 h-5" />
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        Month
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mb-1 font-medium uppercase tracking-wider">This Month</p>
                    <p className="text-3xl font-bold text-white tracking-tight">
                      {formatCurrencyINR(earnings.month)}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {earnings.monthJobs} {earnings.monthJobs === 1 ? 'job' : 'jobs'} this month
                    </p>
                  </div>

                  {/* Lifetime Total */}
                  <div className="bg-[#121824] border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        Lifetime
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mb-1 font-medium uppercase tracking-wider">Total Revenue</p>
                    <p className="text-3xl font-bold text-emerald-400 tracking-tight">
                      {formatCurrencyINR(earnings.lifetime)}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {earnings.completedJobs} total completed orders
                    </p>
                  </div>

                </div>

                {/* Real Recent Payouts Table */}
                <div className="bg-[#121824] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-white">Recent Completed Payouts</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Direct ledger of fulfilled roadside services and payouts</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                      {recentPayouts.length} record{recentPayouts.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {recentPayouts.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                      <Wallet className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="font-semibold text-white">No completed payouts recorded yet</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Accept and complete customer requests from the Incident Feed to start building your earnings history.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {recentPayouts.map(payout => (
                        <div
                          key={payout.id}
                          className="p-4 sm:px-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white text-sm sm:text-base">{payout.serviceType}</p>
                              <span className="text-[11px] font-medium uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {payout.paymentMethod}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              {payout.customerName} • {new Date(payout.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-4">
                            <div>
                              <p className="font-bold text-emerald-400 text-base sm:text-lg">
                                +{formatCurrencyINR(payout.amount)}
                              </p>
                              {payout.basePrice && payout.basePrice !== payout.amount ? (
                                <p className="text-[10px] text-slate-500">Base: {formatCurrencyINR(payout.basePrice)}</p>
                              ) : null}
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 hidden sm:block" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </main>
    </div>
  );
}
