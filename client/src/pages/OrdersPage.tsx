import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  Package, Clock, CheckCircle2, AlertCircle, ChevronRight, 
  MapPin, Wrench, Bike, Navigation, ArrowRight, ShieldCheck, 
  Search, RefreshCw, PhoneCall, ExternalLink, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface MechanicDetails {
  _id?: string;
  name?: string;
  workshopName?: string;
  specialization?: string;
  serviceCategories?: string[];
  vehiclePlate?: string;
  phone?: string;
  rating?: number;
}

interface OrderItem {
  _id: string;
  orderCode?: string;
  serviceType: string;
  status: string;
  amount: number;
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
  createdAt: string;
}

type TabType = 'all' | 'active' | 'completed' | 'cancelled';

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await safeFetch('/api/v1/bookings', { headers });
      const rawList = res?.orders || res?.bookings || (Array.isArray(res) ? res : []);
      setOrders(rawList);
    } catch (err) {
      console.error("Failed to fetch customer bookings:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
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
      case 'EN_ROUTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
            Mechanic Dispatched
          </span>
        );
      case 'IN_PROGRESS':
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
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const isActiveOrder = (status: string) => {
    const s = (status || '').toUpperCase();
    return ['PENDING', 'CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS'].includes(s);
  };

  const isCompletedOrder = (status: string) => {
    const s = (status || '').toUpperCase();
    return ['COMPLETED', 'PAID'].includes(s);
  };

  const isCancelledOrder = (status: string) => {
    const s = (status || '').toUpperCase();
    return s === 'CANCELLED';
  };

  const filteredOrders = orders.filter((order) => {
    // Tab filter
    if (activeTab === 'active' && !isActiveOrder(order.status)) return false;
    if (activeTab === 'completed' && !isCompletedOrder(order.status)) return false;
    if (activeTab === 'cancelled' && !isCancelledOrder(order.status)) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const code = (order.orderCode || order._id).toLowerCase();
      const service = (order.serviceType || '').toLowerCase();
      const mechName = (order.mechanicId?.name || '').toLowerCase();
      const addr = (order.location?.address || order.address || '').toLowerCase();
      return code.includes(q) || service.includes(q) || mechName.includes(q) || addr.includes(q);
    }

    return true;
  });

  const activeCount = orders.filter(o => isActiveOrder(o.status)).length;
  const completedCount = orders.filter(o => isCompletedOrder(o.status)).length;
  const cancelledCount = orders.filter(o => isCancelledOrder(o.status)).length;

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
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">My Bookings & Orders</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Track active dispatches, view order history, and monitor mechanic routes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-orange-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold shadow-lg shadow-orange-500/20 transition-all"
            >
              <Wrench className="w-4 h-4" />
              <span>Book Assistance</span>
            </Link>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
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
              All Orders ({orders.length})
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
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'cancelled'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Cancelled ({cancelledCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by code, mechanic, place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121824] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>
        </div>

        {/* Orders List / Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4" />
            <p className="text-slate-400 text-sm">Loading your bookings...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
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
                const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const mech = order.mechanicId;

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
                            <span className="text-lg font-black text-white">₹{order.amount || order.totalPrice || 150}</span>
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
                              {order.serviceType.replace(/-/g, ' ')}
                            </div>
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-400" /> Location
                            </span>
                            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                              {order.location?.address || order.address || 'Your breakdown location'}
                            </p>
                          </div>
                        </div>

                        {/* Assigned Mechanic Partner Details */}
                        <div className="sm:col-span-1 space-y-2 bg-[#0B0F17]/60 p-3 rounded-xl border border-slate-800/80">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-orange-400" /> Assigned Mechanic
                          </span>
                          {mech && typeof mech === 'object' ? (
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-white">{mech.name || 'Certified Partner'}</span>
                                {mech.rating && (
                                  <span className="text-[11px] text-orange-400 font-bold bg-orange-500/15 px-1.5 py-0.5 rounded border border-orange-500/20">
                                    {mech.rating} ★
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 truncate mt-0.5">{mech.workshopName || 'FixOnRoad Garage Hub'}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {mech.vehiclePlate && (
                                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                                    {mech.vehiclePlate}
                                  </span>
                                )}
                                {mech.phone && (
                                  <a 
                                    href={`tel:${mech.phone}`}
                                    className="text-[11px] text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                                  >
                                    <PhoneCall className="w-3 h-3" /> Call
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">Assigning nearest certified workshop technician...</p>
                          )}
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
                                  <Bike className="w-3 h-3 text-orange-400" /> Bike ETA
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
