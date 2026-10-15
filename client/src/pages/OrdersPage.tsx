import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  Package, Clock, CheckCircle2, AlertCircle, 
  MapPin, Wrench, Bike, Navigation, ArrowRight, ShieldCheck, 
  Search, RefreshCw, PhoneCall, ExternalLink, LogIn, KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { resolveOrderMechanic } from '../lib/mechanics';

interface MechanicDetails {
  _id?: string;
  name?: string;
  workshopName?: string;
  specialization?: string;
  serviceCategories?: string[];
  vehiclePlate?: string;
  vehicleModel?: string;
  phone?: string;
  rating?: number;
}

interface OrderItem {
  _id: string;
  orderCode?: string;
  serviceType?: string;
  serviceId?: string;
  serviceDetails?: {
    serviceType?: string;
    totalAmount?: number;
  };
  status?: string;
  amount?: number;
  totalAmount?: number;
  totalPrice?: number;
  paymentMethod?: string;
  location?: {
    address?: string;
    lat?: number;
    lng?: number;
  };
  address?: string;
  roadDistanceKm?: number;
  estimatedDurationMin?: number;
  mechanicId?: MechanicDetails | null;
  createdAt?: string;
}

type TabType = 'all' | 'active' | 'completed';

export default function OrdersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [quickTrackCode, setQuickTrackCode] = useState<string>('');

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      setFetchError(null);
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await safeFetch('/api/v1/bookings', { headers });
      const rawList = res?.orders || res?.bookings || (Array.isArray(res) ? res : []);
      setOrders(rawList);
    } catch (err: any) {
      console.warn("Failed to fetch customer bookings:", err.message);
      setFetchError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchOrders();
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading]);

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickTrackCode.trim();
    if (clean) {
      navigate(`/track/${clean.toUpperCase()}`);
    }
  };

  const getStatusBadge = (rawStatus?: string) => {
    const s = (rawStatus || '').toUpperCase();
    switch (s) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Finding Mechanic
          </span>
        );
      case 'CONFIRMED':
      case 'ASSIGNED':
      case 'MECHANIC_ASSIGNED':
      case 'EN_ROUTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
            Mechanic Dispatched
          </span>
        );
      case 'IN_PROGRESS':
      case 'ARRIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Service In Progress
          </span>
        );
      case 'COMPLETED':
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Completed
          </span>
        );
      case 'CANCELLED':
      case 'EXPIRED':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            {s === 'EXPIRED' ? 'Expired' : 'Cancelled'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {rawStatus || 'Confirmed'}
          </span>
        );
    }
  };

  const isActiveOrder = (rawStatus?: string) => {
    const s = (rawStatus || '').toUpperCase();
    return ['PENDING', 'CONFIRMED', 'ASSIGNED', 'MECHANIC_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(s);
  };

  const isCompletedOrder = (rawStatus?: string) => {
    const s = (rawStatus || '').toUpperCase();
    return ['COMPLETED', 'PAID'].includes(s);
  };

  const isCancelledOrder = (rawStatus?: string) => {
    const s = (rawStatus || '').toUpperCase();
    return ['CANCELLED', 'EXPIRED', 'FAILED'].includes(s);
  };

  // Exclude cancelled / inactive orders so they are removed from the /orders list
  const validOrders = orders.filter((order) => !isCancelledOrder(order.status));

  const filteredOrders = validOrders.filter((order) => {
    // Tab filter
    if (activeTab === 'active' && !isActiveOrder(order.status)) return false;
    if (activeTab === 'completed' && !isCompletedOrder(order.status)) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const code = (order.orderCode || order._id || '').toLowerCase();
      const service = (order.serviceType || order.serviceId || order.serviceDetails?.serviceType || '').toLowerCase();
      const mechName = (order.mechanicId?.name || '').toLowerCase();
      const addr = (order.location?.address || order.address || '').toLowerCase();
      return code.includes(q) || service.includes(q) || mechName.includes(q) || addr.includes(q);
    }

    return true;
  });

  const activeCount = validOrders.filter(o => isActiveOrder(o.status)).length;
  const completedCount = validOrders.filter(o => isCompletedOrder(o.status)).length;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-['Outfit',sans-serif]">
      <Navbar variant="rider" />

      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('nav.myBookings', 'My Bookings & Orders')}</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Track active mechanic dispatches, review service history, and monitor real road routes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={fetchOrders}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-orange-400 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )}
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold shadow-lg shadow-orange-500/20 transition-all"
            >
              <Wrench className="w-4 h-4" />
              <span>{t('services.bookService', 'Book Assistance')}</span>
            </Link>
          </div>
        </div>

        {/* Quick Order Tracker Lookup Card */}
        <div className="bg-[#121824] rounded-2xl border border-slate-800 p-5 mb-8 shadow-md">
          <form onSubmit={handleQuickTrack} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold shrink-0">
              <KeyRound className="w-4 h-4 text-orange-400" />
              <span>{t('track.title', 'Live Dispatch Tracking')}:</span>
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Order Code (e.g. FOR-685370) or Order ID..."
                value={quickTrackCode}
                onChange={(e) => setQuickTrackCode(e.target.value)}
                className="w-full bg-[#0B0F17] border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <button
              type="submit"
              disabled={!quickTrackCode.trim()}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-sm transition-all shrink-0 flex items-center justify-center gap-2"
            >
              <span>{t('track.title', 'Track Now')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Not Signed In Banner */}
        {!authLoading && !isAuthenticated && (
          <div className="bg-[#121824] rounded-3xl border border-orange-500/30 p-8 sm:p-10 text-center max-w-lg mx-auto mb-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4 text-orange-400">
              <LogIn className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sign in to view all your bookings</h3>
            <p className="text-slate-400 text-sm mb-6">
              You are currently browsing as a guest. Sign in to synchronize and view your complete roadside assistance history.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/auth?redirect=/orders"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Account</span>
              </Link>
              <Link
                to="/services"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all"
              >
                <span>Request Service</span>
              </Link>
            </div>
          </div>
        )}

        {/* Filter Tabs & Search Bar (when authenticated) */}
        {isAuthenticated && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
            {/* Tabs */}
            <div className="flex items-center gap-2 bg-[#121824] p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                All Orders ({validOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'active'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Active Dispatches
                {activeCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-orange-600 font-extrabold">
                    {activeCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'completed'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by code, mechanic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121824] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>
          </div>
        )}

        {/* Orders List / Grid */}
        {loading || authLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4" />
            <p className="text-slate-400 text-sm">Loading your bookings...</p>
          </div>
        ) : isAuthenticated && filteredOrders.length === 0 ? (
          <div className="bg-[#121824] rounded-3xl border border-slate-800 p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Bookings Found</h3>
            <p className="text-slate-400 text-sm mb-6">
              {searchQuery 
                ? "No orders match your search criteria. Try a different query."
                : activeTab === 'active'
                ? "You don't have any active roadside assistance dispatches at the moment."
                : "You haven't requested any roadside assistance services yet."
              }
            </p>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all"
            >
              <Wrench className="w-4 h-4" />
              <span>Request Roadside Service</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredOrders.map((order) => {
                const isLive = isActiveOrder(order.status);
                const trackingKey = order.orderCode || order._id;
                const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Recent';

                const serviceName = (
                  order.serviceType || 
                  order.serviceId || 
                  order.serviceDetails?.serviceType || 
                  'Roadside Assistance'
                ).replace(/-/g, ' ');

                const orderPrice = 
                  order.amount || 
                  order.totalPrice || 
                  order.totalAmount || 
                  order.serviceDetails?.totalAmount || 
                  150;

                const orderLocation = 
                  order.location?.address || 
                  order.address || 
                  'Your breakdown location';

                const mech = resolveOrderMechanic(order);

                return (
                  <motion.div
                    key={order._id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className={`bg-[#121824] rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg ${
                      isLive 
                        ? 'border-orange-500/40 shadow-[0_0_24px_rgba(249,115,22,0.12)]' 
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-5 sm:p-6">
                      {/* Top Header of Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs sm:text-sm font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-lg border border-orange-500/20">
                            {order.orderCode || `FOR-${order._id.slice(0, 6).toUpperCase()}`}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {formattedDate}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge(order.status)}
                          <div className="text-right">
                            <span className="text-lg font-black text-white">₹{orderPrice}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Details Grid */}
                      <div className="grid sm:grid-cols-3 gap-6 py-4">
                        {/* Service Type & Breakdown Location */}
                        <div className="sm:col-span-1 space-y-2">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Service Required</span>
                            <div className="text-sm font-bold text-white capitalize mt-0.5">
                              {serviceName}
                            </div>
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-400" /> Location
                            </span>
                            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                              {orderLocation}
                            </p>
                          </div>
                        </div>

                        {/* Assigned Mechanic Partner Details (Decoupled & Dynamic) */}
                        <div className="sm:col-span-1 space-y-2 bg-[#0B0F17]/60 p-3.5 rounded-xl border border-slate-800/80">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" /> Assigned Mechanic
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              Verified
                            </span>
                          </span>
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-sm font-bold text-white truncate max-w-[150px]">{mech.name}</span>
                              <span className="text-[11px] text-orange-400 font-bold bg-orange-500/15 px-1.5 py-0.5 rounded border border-orange-500/20 shrink-0">
                                {mech.rating} ★
                              </span>
                            </div>
                            <p className="text-[11px] text-orange-400/90 font-medium truncate mt-0.5">{mech.specialization}</p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{mech.workshopName}</p>
                            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/60">
                              <span className="text-[10px] font-mono bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700/80 flex items-center gap-1 truncate">
                                <Bike className="w-3 h-3 text-orange-400 shrink-0" />
                                <span className="truncate">{mech.vehicleDisplay}</span>
                              </span>
                              <a 
                                href={`tel:${mech.phone}`}
                                className="text-[11px] text-emerald-400 font-semibold hover:underline flex items-center gap-1 shrink-0 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/20 transition-colors"
                              >
                                <PhoneCall className="w-3 h-3" /> Call
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Dispatch Distance & Action CTA */}
                        <div className="sm:col-span-1 flex flex-col justify-between space-y-3">
                          <div className="flex items-center justify-between sm:justify-start sm:gap-6">
                            {order.roadDistanceKm ? (
                              <div>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                  <Navigation className="w-3 h-3 text-orange-400" /> Road Dist
                                </span>
                                <div className="text-sm font-bold text-white mt-0.5">
                                  {order.roadDistanceKm.toFixed(1)} km
                                </div>
                              </div>
                            ) : null}

                            {order.estimatedDurationMin ? (
                              <div>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                  <Bike className="w-3.5 h-3.5 text-orange-400" /> Bike ETA
                                </span>
                                <div className="text-sm font-bold text-orange-400 mt-0.5">
                                  {order.estimatedDurationMin} min
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <Link
                              to={`/track/${trackingKey}`}
                              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all text-center ${
                                isLive
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/25'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                              }`}
                            >
                              <span>{isLive ? 'Track Live Dispatch' : 'View Tracking State'}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Footer variant="rider" />
    </div>
  );
}
