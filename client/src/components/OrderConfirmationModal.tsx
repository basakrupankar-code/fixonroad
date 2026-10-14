import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Copy, Check, MapPin, Wrench, 
  CreditCard, Banknote, ArrowRight, Package, Radio, ShieldCheck 
} from 'lucide-react';

export interface OrderConfirmationData {
  _id?: string;
  orderCode?: string;
  trackingCode?: string;
  serviceType?: string;
  serviceName?: string;
  breakdownAddress?: string;
  location?: {
    address?: string;
    lat?: number;
    lng?: number;
  };
  paymentMethod?: string;
  amount?: number;
  totalAmount?: number;
  status?: string;
  mechanic?: {
    name?: string;
    phone?: string;
    vehiclePlate?: string;
  };
}

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  order: OrderConfirmationData | null;
}

export default function OrderConfirmationModal({ isOpen, onClose, order }: OrderConfirmationModalProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const trackingCode = 
    order.trackingCode || 
    order.orderCode || 
    (order._id ? `FOR-${order._id.slice(0, 8).toUpperCase()}` : 'FOR-CONFIRMED');

  const serviceName = 
    order.serviceName || 
    order.serviceType || 
    'Roadside Emergency Assistance';

  const breakdownSpot = 
    order.breakdownAddress || 
    order.location?.address || 
    'Bengal Breakdown Location (Pinned Spot)';

  const paymentMode = 
    order.paymentMethod === 'cod' 
      ? 'Cash on Delivery (Pay to Mechanic)' 
      : `${(order.paymentMethod || 'Online').toUpperCase()} (Verified)`;

  const totalPayable = 
    order.totalAmount || 
    order.amount || 
    180;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTrackLive = () => {
    if (onClose) onClose();
    navigate(`/track/${encodeURIComponent(trackingCode)}`);
  };

  const handleViewAllBookings = () => {
    if (onClose) onClose();
    navigate('/orders');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-['Outfit',sans-serif]">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#121824] border border-orange-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/90 overflow-hidden z-10"
        >
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-orange-500 to-amber-500" />
          
          {/* Background subtle radial glow */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header & Icon */}
          <div className="text-center mb-6 relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-lg shadow-emerald-500/10"
            >
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </motion.div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Order Confirmed & Dispatched
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Dispatch Confirmed!
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Your roadside request has been registered and assigned to our rapid dispatch network.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-[#0B0F17] rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-3.5 mb-6">
            {/* Tracking Code */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400">Unique Tracking Code</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-orange-400 tracking-wider">
                  {trackingCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Tracking Code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Service Type */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-orange-400" />
                Service Type
              </span>
              <span className="font-bold text-white text-right max-w-[200px] truncate">
                {serviceName}
              </span>
            </div>

            {/* Breakdown Spot */}
            <div className="flex items-start justify-between text-xs sm:text-sm gap-2">
              <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Breakdown Spot
              </span>
              <span className="font-medium text-slate-200 text-right text-xs truncate max-w-[220px]">
                {breakdownSpot}
              </span>
            </div>

            {/* Payment Mode */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-amber-400" />
                Payment Mode
              </span>
              <span className="font-medium text-slate-200 text-xs">
                {paymentMode}
              </span>
            </div>

            {/* Total Amount */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-xs font-bold text-slate-300">Total Payable</span>
              <span className="text-base font-extrabold text-emerald-400">
                ₹{totalPayable}
              </span>
            </div>
          </div>

          {/* Dual Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Primary CTA */}
            <button
              type="button"
              onClick={handleTrackLive}
              className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Track Live Dispatch</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary CTA */}
            <button
              type="button"
              onClick={handleViewAllBookings}
              className="py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Package className="w-4 h-4 text-slate-400" />
              <span>View All Bookings</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
