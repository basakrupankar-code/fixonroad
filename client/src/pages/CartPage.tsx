import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, ArrowRight, ChevronLeft, Shield, Trash2, 
  ShoppingBag, Wrench, Droplets, Battery, Link2, Cog, AlertTriangle, Key, Truck, Zap 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart, CartItem } from '../context/CartContext';

const iconMap: Record<string, React.ReactNode> = {
  droplets: <Droplets className="w-5 h-5 text-blue-400" />,
  battery:  <Battery  className="w-5 h-5 text-yellow-400" />,
  link2:    <Link2    className="w-5 h-5 text-purple-400" />,
  cog:      <Cog      className="w-5 h-5 text-red-400" />,
  alert:    <AlertTriangle className="w-5 h-5 text-orange-400" />,
  zap:      <Zap      className="w-5 h-5 text-emerald-400" />,
  key:      <Key      className="w-5 h-5 text-indigo-400" />,
  truck:    <Truck    className="w-5 h-5 text-gray-400" />,
};

export default function CartPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { items, removeItem, clearCart, baseTotal, platformFee, gst, totalAmount, itemCount } = useCart();

  const handleRemove = (item: CartItem) => {
    removeItem(item.id);
    toast.success(t('cart.removedToast', `Removed ${item.name} from cart`));
  };

  const handleClearAll = () => {
    clearCart();
    toast.success(t('cart.clearedToast', 'All items removed from cart'));
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    navigate('/payment', { 
      state: { 
        service: items[0],
        items: items,
        totalAmount: totalAmount
      } 
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="glow-orb w-[500px] h-[500px] -top-[15%] -right-[10%] bg-orange-600/10" />
      <div className="glow-orb w-[400px] h-[400px] top-[40%] -left-[10%] bg-amber-600/8" />
      <div className="dot-grid" />
      
      <Navbar variant="rider" />

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 md:px-10 pt-28 sm:pt-32 pb-24 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <Link 
            to="/services" 
            className="inline-flex items-center gap-1.5 text-sm transition-colors hover:text-orange-400 text-slate-400 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> 
            <span>{t('cart.backToServices', 'Back to Services')}</span>
          </Link>

          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('cart.clearAll', 'Clear Cart')}</span>
            </button>
          )}
        </div>

        {/* Page Title & Count Badge */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
              <ShoppingCart className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold font-['Outfit'] tracking-tight">
                  {t('cart.title', 'Your Cart')}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  {itemCount} {itemCount === 1 ? t('cart.item', 'item') : t('cart.items', 'items')}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {t('cart.subtitle', 'Review your roadside assistance requests before instant mechanic dispatch')}
              </p>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="glass-panel rounded-3xl p-10 sm:p-16 border border-slate-800 text-center shadow-2xl relative overflow-hidden my-6"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-center shadow-inner">
              <ShoppingBag className="w-12 h-12 text-orange-400" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white mb-3">
              {t('cart.emptyTitle', 'Your Cart is Empty')}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
              {t('cart.emptyDesc', "You don't have any breakdown assistance services in your cart right now. Stranded on the road? Choose a service and we'll dispatch a verified mechanic.")}
            </p>

            <Link
              to="/services"
              className="inline-flex items-center gap-2 btn-primary px-8 py-4 rounded-xl text-base font-bold shadow-lg shadow-orange-500/20"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                {t('cart.browseServices', 'Explore Roadside Services')}
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </motion.div>
        ) : (
          /* Cart Items & Summary Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 rounded-2xl bg-[#121824]/60 border border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>{t('cart.selectedServices', 'Selected Breakdown Services')}</span>
                <span>{itemCount} {itemCount === 1 ? 'Service' : 'Services'}</span>
              </div>

              <AnimatePresence mode="popLayout">
                {items.map((item) => {
                  const itemGst = Math.round(item.price * 0.18);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
                      transition={{ duration: 0.3 }}
                      className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 relative group overflow-hidden bg-[#121824]/80"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10 shrink-0 text-orange-400 mt-0.5">
                            {item.icon && iconMap[item.icon] ? iconMap[item.icon] : <Wrench className="w-5 h-5 text-orange-400" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-bold text-base sm:text-lg text-white font-['Outfit']">
                                {item.nameKey ? t(item.nameKey, item.name) : item.name}
                              </h3>
                              {item.type && (
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                  item.type === 'bike' 
                                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                }`}>
                                  {item.type === 'bike' ? t('services.badges.bike', 'Bike') : t('services.badges.car', 'Car')}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 mb-2">
                              {item.eta ? `${t('cart.estArrival', 'Est. arrival')}: ${item.eta}` : t('cart.instantDispatch', 'Instant verified mechanic dispatch')}
                            </p>

                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>{t('cart.basePrice', 'Base')}: ₹{item.price}</span>
                              <span>•</span>
                              <span>{t('cart.gst', 'GST')}: ₹{itemGst}</span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Remove Action */}
                        <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                          <span className="text-xl font-bold font-['Outfit'] text-emerald-400">
                            ₹{item.price}
                          </span>

                          <button
                            onClick={() => handleRemove(item)}
                            title={t('cart.removeItem', 'Remove item')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-red-500/20 transition-all cursor-pointer mt-3 group/btn"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-red-400 transition-colors" />
                            <span>{t('cart.remove', 'Remove')}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-3xl overflow-hidden border border-slate-800 shadow-2xl sticky top-28 bg-[#121824]/90"
              >
                <div className="p-6 bg-[#161D2B]/70 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-lg font-bold font-['Outfit'] text-white">
                    {t('cart.summaryTitle', 'Order Summary')}
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="p-6 space-y-5">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-400">
                      <span>{t('cart.baseCharge', 'Base Service Charge')}</span>
                      <span className="text-white font-medium">₹{baseTotal}</span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        {t('cart.platformFee', 'Platform Fee')}
                      </span>
                      <span className="text-white font-medium">₹{platformFee}</span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>{t('cart.gstCharge', 'GST (18%)')}</span>
                      <span className="text-white font-medium">₹{gst}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-between items-baseline">
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {t('cart.totalPayable', 'Total Payable')}
                      </span>
                      <span className="text-xs text-emerald-400">
                        {t('cart.allInclusive', 'All taxes & platform fees included')}
                      </span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
                      ₹{totalAmount}
                    </span>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    className="w-full btn-primary py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-base font-bold shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {t('cart.proceedToCheckout', 'Proceed to Checkout')}
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </button>
                </div>

                <div className="bg-orange-500/5 border-t border-orange-500/10 p-4 px-6 flex items-start gap-3">
                  <Shield className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {t('cart.securityNotice', '100% verified mechanics. Fixed transparent prices. Live GPS location tracking upon confirmation.')}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </main>

      <Footer variant="rider" />
    </div>
  );
}
