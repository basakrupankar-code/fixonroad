import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, Clock, ChevronRight, Zap, Droplets, Battery, Link2, Cog, AlertTriangle, PackageOpen, Wrench, Key, Truck, CarFront, Bike } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/* ===== Service Data ===== */
type VehicleType = 'bike' | 'car';

interface Service {
  id: string;
  name: string;
  type: VehicleType;
  icon: string;
  price: number;
  eta: string;
  rating: number;
  jobs: number;
  note?: string;
}

const SERVICES: Service[] = [
  { id: 'flat-tire-bike', name: 'Flat Tire / Puncture Repair', type: 'bike', icon: 'droplets', price: 150, eta: '15-25 min', rating: 4.9, jobs: 1240 },
  { id: 'flat-tire-car', name: 'Flat Tire / Puncture Repair', type: 'car', icon: 'droplets', price: 350, eta: '15-30 min', rating: 4.8, jobs: 890 },
  { id: 'battery-bike', name: 'Dead Battery / Jump Start', type: 'bike', icon: 'battery', price: 200, eta: '10-20 min', rating: 4.8, jobs: 890 },
  { id: 'battery-car', name: 'Dead Battery / Jump Start', type: 'car', icon: 'battery', price: 450, eta: '15-25 min', rating: 4.9, jobs: 1120 },
  { id: 'fuel-bike', name: 'Fuel Delivery (1L)', type: 'bike', icon: 'zap', price: 180, eta: '15-25 min', rating: 4.7, jobs: 500 },
  { id: 'fuel-car', name: 'Fuel Delivery (5L)', type: 'car', icon: 'zap', price: 450, eta: '20-30 min', rating: 4.6, jobs: 340, note: '+ Fuel Cost' },
  { id: 'chain', name: 'Chain Repair / Adjustment', type: 'bike', icon: 'link2', price: 250, eta: '20-30 min', rating: 4.7, jobs: 560 },
  { id: 'lockout', name: 'Car Lockout / Key Retrieval', type: 'car', icon: 'key', price: 500, eta: '20-35 min', rating: 4.9, jobs: 310 },
  { id: 'towing-bike', name: 'Bike Towing', type: 'bike', icon: 'truck', price: 500, eta: '25-40 min', rating: 4.8, jobs: 620, note: '+ ₹20/km' },
  { id: 'towing-car', name: 'Car Flatbed Transport', type: 'car', icon: 'truck', price: 1200, eta: '30-45 min', rating: 4.7, jobs: 430, note: '+ ₹40/km' },
  { id: 'brake-bike', name: 'Brake & Clutch Inspection', type: 'bike', icon: 'alert', price: 300, eta: '20-35 min', rating: 4.8, jobs: 420 },
  { id: 'brake-car', name: 'Brake & Clutch Inspection', type: 'car', icon: 'alert', price: 600, eta: '25-40 min', rating: 4.7, jobs: 380 },
];

const iconMap: Record<string, React.ReactNode> = {
  droplets: <Droplets className="w-6 h-6 text-blue-400" />,
  battery:  <Battery  className="w-6 h-6 text-yellow-400" />,
  link2:    <Link2    className="w-6 h-6 text-purple-400" />,
  cog:      <Cog      className="w-6 h-6 text-red-400" />,
  alert:    <AlertTriangle className="w-6 h-6 text-orange-400" />,
  zap:      <Zap      className="w-6 h-6 text-emerald-400" />,
  key:      <Key      className="w-6 h-6 text-indigo-400" />,
  truck:    <Truck    className="w-6 h-6 text-gray-400" />,
};

/* ===== Quick Price Estimator ===== */
function PriceEstimator() {
  const [vehicle, setVehicle] = useState<VehicleType>('bike');
  const [issueId, setIssueId] = useState('flat-tire');

  const issues = [
    { id: 'flat-tire', label: 'Flat Tire' },
    { id: 'battery', label: 'Dead Battery' },
    { id: 'towing', label: 'Towing' },
  ];

  const getPrice = () => {
    const s = SERVICES.find(s => s.id.startsWith(issueId) && s.type === vehicle);
    if (!s) return null;
    return s.price + Math.round(s.price * 0.18);
  };

  const getEta = () => {
    const s = SERVICES.find(s => s.id.startsWith(issueId) && s.type === vehicle);
    return s ? s.eta : '--';
  };

  const price = getPrice();

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden" style={{ border: '1px solid rgba(249,115,22,0.2)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-6 h-6 text-orange-400" />
          <h3 className="text-xl font-bold font-['Outfit'] text-white">Quick Estimator</h3>
        </div>

        <div className="space-y-5">
          {/* Vehicle Selector */}
          <div>
            <p className="text-sm font-semibold text-gray-400 mb-2">1. Vehicle Type</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setVehicle('bike')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                  vehicle === 'bike' ? 'bg-orange-500/20 border-orange-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Bike className="w-5 h-5" /> Two-Wheeler
              </button>
              <button
                onClick={() => setVehicle('car')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                  vehicle === 'car' ? 'bg-orange-500/20 border-orange-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <CarFront className="w-5 h-5" /> Car
              </button>
            </div>
          </div>

          {/* Issue Selector */}
          <div>
            <p className="text-sm font-semibold text-gray-400 mb-2">2. Issue (Common)</p>
            <div className="grid grid-cols-3 gap-2">
              {issues.map(issue => (
                <button
                  key={issue.id}
                  onClick={() => setIssueId(issue.id)}
                  className={`py-2 px-1 text-xs sm:text-sm rounded-lg border transition-all ${
                    issueId === issue.id ? 'bg-orange-500/20 border-orange-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {issue.label}
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          <div className="pt-5 mt-5 border-t border-white/10 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400">Total Est. (Inc. GST)</p>
              <p className="text-3xl font-bold text-orange-400">{price ? `₹${price}` : '--'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Arrival ETA</p>
              <p className="text-lg font-bold text-white">{getEta()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Skeleton ===== */
function ServiceSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-6 animate-pulse">
      <div className="skeleton w-12 h-12 rounded-xl mb-4" />
      <div className="skeleton h-5 w-3/4 mb-3" />
      <div className="flex gap-4 mb-4">
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-4 w-12" />
      </div>
      <div className="skeleton h-px w-full mb-4" />
      <div className="flex justify-between">
        <div className="skeleton h-7 w-16" />
        <div className="skeleton h-5 w-20" />
      </div>
    </div>
  );
}

/* ===== Empty State ===== */
function EmptyState({ query }: { query: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-full text-center py-16">
      <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'var(--bg-card)' }}>
        <PackageOpen className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3 className="text-xl font-bold font-['Outfit'] mb-2 text-white">No services found</h3>
      <p style={{ color: 'var(--text-secondary)' }} className="text-[15px] max-w-sm mx-auto">
        We couldn't find any service matching "<span className="font-medium text-orange-400">{query}</span>".
      </p>
    </motion.div>
  );
}

/* ===== Main Page ===== */
export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'bike' | 'car'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useState(() => {
    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  });

  const filtered = useMemo(() => {
    return SERVICES.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.type.includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'all' || s.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterType]);

  const handleProceed = (serviceId: string) => {
    const svc = SERVICES.find(s => s.id === serviceId);
    if (svc) navigate('/payment', { state: { service: svc } });
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* BG glows */}
      <div className="glow-orb w-[500px] h-[500px] -top-[15%] -right-[10%] bg-orange-600/8" />
      <div className="glow-orb w-[400px] h-[400px] top-[40%] -left-[10%] bg-amber-600/6" style={{ animationDelay: '4s' }} />
      <div className="dot-grid" />

      <Navbar variant="rider" />

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden pt-24 pb-12">
        <div className="relative z-20 px-5 md:px-10 lg:px-16 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Hero text */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            className="lg:col-span-7 space-y-6"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}>
              <span className="pill-badge">
                <Wrench className="w-3 h-3" />
                Fixed Pricing · No Surprises
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              </span>
            </motion.div>

            <motion.h1
              variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black font-['Outfit'] leading-[1.08] tracking-tight text-white"
            >
              Our <span className="text-amber-400 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent inline-block">Services</span>
            </motion.h1>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}
              className="text-base sm:text-lg leading-relaxed text-gray-300 max-w-lg"
            >
              Select your vehicle type and issue. We'll dispatch a verified mechanic to your location instantly with no haggling.
            </motion.p>
          </motion.div>

          {/* Right: Price Estimator */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-5 w-full max-w-md mx-auto lg:ml-auto"
          >
            <PriceEstimator />
          </motion.div>
        </div>
      </section>

      {/* ══════════════ FILTERS + GRID ══════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 pb-32">

        <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-10">
          {/* Vehicle Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex p-1 rounded-xl bg-white/5 border border-white/10 w-full md:w-auto overflow-x-auto"
          >
            <button onClick={() => setFilterType('all')} className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${filterType === 'all' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
              All Services
            </button>
            <button onClick={() => setFilterType('bike')} className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${filterType === 'bike' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
              <Bike className="w-4 h-4" /> Two-Wheeler
            </button>
            <button onClick={() => setFilterType('car')} className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${filterType === 'car' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
              <CarFront className="w-4 h-4" /> Four-Wheeler
            </button>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative w-full md:w-72"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </motion.div>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <ServiceSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <EmptyState query={searchQuery} />
          ) : (
            filtered.map((service, i) => {
              const gst = Math.round(service.price * 0.18);
              const total = service.price + gst;
              
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="glass-panel rounded-2xl p-6 flex flex-col group hover:border-orange-500/30 transition-all border border-white/10"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                      {iconMap[service.icon]}
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${
                      service.type === 'bike' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {service.type === 'bike' ? 'Bike' : 'Car'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-['Outfit'] text-white mb-2">{service.name}</h3>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-400 mb-6">
                    <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-500" /> {service.eta}</div>
                    <div className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> {service.rating} ({service.jobs})</div>
                  </div>

                  <div className="mt-auto pt-5 border-t border-white/10">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-2xl font-bold text-white flex items-end gap-1">
                          ₹{service.price} 
                          {service.note && <span className="text-xs text-orange-400 font-semibold pb-1">{service.note}</span>}
                        </p>
                        <p className="text-xs text-gray-500">+ ₹{gst} GST (18%)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="text-lg font-bold text-orange-400">₹{total}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleProceed(service.id)}
                      className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      Book Now <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <Footer variant="rider" />
    </div>
  );
}
