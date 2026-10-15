import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, ArrowRight, ChevronLeft, Shield, Trash2, 
  ShoppingBag, Wrench, Droplets, Battery, Link2, Cog, AlertTriangle, 
  Key, Truck, Zap, Plus, Minus, MapPin, RefreshCw, CheckCircle2, Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart, CartItem } from '../context/CartContext';
import { useLocationContext } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';

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
  const { user, isAuthenticated, isLoading } = useAuth();
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    baseTotal, 
    platformFee, 
    gst, 
    totalAmount, 
    itemCount 
  } = useCart();

  const { 
    address, 
    city, 
    isLocating, 
    fetchLocation, 
    setAddress 
  } = useLocationContext();

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [customAddress, setCustomAddress] = useState(address || '');

  // Defensive route protection directly within CartPage
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        toast.error('Please sign in to view your roadside assistance cart.', { id: 'cart-auth-required' });
        navigate('/signin?redirect=/cart', { replace: true });
      } else if (user?.role === 'mechanic') {
        toast.error('Cart and roadside dispatch are only accessible to customer accounts.', { id: 'mechanic-cart-denied' });
        navigate('/mechanic/dashboard', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user?.role, navigate]);

  const handleRemove = (item: CartItem) => {
    removeItem(item.id);
    toast.success(t('cart.removedToast', `Removed ${item.name} from cart`));
  };

  const handleClearAll = () => {
    clearCart();
    toast.success(t('cart.clearedToast', 'All items removed from cart'));
  };

  const handleSaveLocation = () => {
    if (customAddress.trim()) {
      setAddress(customAddress.trim());
      setIsEditingLocation(false);
      toast.success(t('cart.locationUpdated', 'Breakdown location updated'));
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    if (!isAuthenticated) {
      toast.error(t('cart.authRequired', 'Please sign in to confirm breakdown dispatch'));
      navigate('/signin?redirect=/cart');
      return;
    }
    if (user?.role === 'mechanic') {
      toast.error('Cart and roadside dispatch are only accessible to customer accounts.', { id: 'mechanic-cart-denied' });
      navigate('/mechanic/dashboard');
      return;
    }
    navigate('/payment', { 
      state: { 
        service: items[0],
        items: items,
        totalAmount: totalAmount
      } 
    });
  };


  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="glow-orb w-[500px] h-[500px] -top-[15%] -right-[10%] bg-orange-600/10 pointer-events-none" />
      <div className="glow-orb w-[400px] h-[400px] top-[40%] -left-[10%] bg-amber-600/8 pointer-events-none" />
      <div className="dot-grid" />
      
      <Navbar variant="rider" />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 md:px-10 pt-28 sm:pt-32 pb-24 relative z-10">
        
        {/* Navigation Breadcrumb & Clear Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Link 
            to="/services" 
            className="inline-flex items-center gap-1.5 text-sm transition-colors hover:text-orange-400 text-slate-400 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> 
            <span>{t('cart.backToServices', 'Back to Roadside Services')}</span>
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

        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-2xl border border-orange-500/30 text-orange-400 shadow-inner">
              <ShoppingCart className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] tracking-tight text-white">
                  {t('cart.title', 'Your Roadside Cart')}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  {itemCount} {itemCount === 1 ? t('cart.item', 'item') : t('cart.items', 'items')}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {t('cart.subtitle', 'Review your breakdown assistance requests before instant mechanic dispatch')}
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
            className="glass-panel rounded-3xl p-10 sm:p-16 border border-slate-800 text-center shadow-2xl relative overflow-hidden my-6 bg-[#121824]/70"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-center shadow-inner">
              <ShoppingBag className="w-12 h-12 text-orange-400" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white mb-3">
              {t('cart.emptyTitle', 'Your roadside cart is empty')}
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
                {t('cart.browseServices', 'Browse Services')}
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </motion.div>
        ) : (
          /* Cart Grid: Items List (Col 7) + Summary Sidebar (Col 5) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-3.5 px-5 rounded-2xl bg-[#121824]/80 border border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-orange-400" />
                  {t('cart.selectedServices', 'Assistance Items')}
                </span>
                <span>{itemCount} {itemCount === 1 ? 'Dispatch Request' : 'Dispatch Requests'}</span>
              </div>

              <AnimatePresence mode="popLayout">
                {items.map((item) => {
                  const qty = item.quantity || 1;
                  const itemBaseTotal = item.price * qty;
                  const itemGst = Math.round(itemBaseTotal * 0.18);
                  const isFuel = item.id.includes('fuel') || item.unit === 'liters';

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
                      transition={{ duration: 0.3 }}
                      className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300 relative group overflow-hidden bg-[#121824]/90"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        
                        {/* Service Details */}
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 shrink-0 text-orange-400 mt-0.5">
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

                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {item.eta ? `${t('cart.estArrival', 'Est. arrival')}: ${item.eta}` : t('cart.instantDispatch', 'Instant verified mechanic dispatch')}
                            </p>

                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span>{t('cart.basePrice', 'Base')}: ₹{itemBaseTotal}</span>
                              <span className="text-slate-600">•</span>
                              <span>{t('cart.gst', 'GST (18%)')}: ₹{itemGst}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity / Single Dispatch Control & Pricing */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                          
                          {/* Price */}
                          <div className="text-left sm:text-right">
                            <span className="text-xl font-bold font-['Outfit'] text-emerald-400">
                              ₹{itemBaseTotal + itemGst}
                            </span>
                            <span className="block text-[10px] text-slate-500">incl. GST</span>
                          </div>

                          {/* Quantity Controls or Single-Dispatch Indicator */}
                          <div className="flex items-center gap-3">
                            {isFuel ? (
                              <div className="flex items-center gap-2 bg-[#0B0F19] p-1 rounded-xl border border-slate-800">
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                                  title="Decrease quantity"
                                  disabled={qty <= 1}
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold text-white min-w-[50px] text-center">
                                  {qty} {qty === 1 ? 'Liter' : 'Liters'}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                                  title="Increase quantity"
                                  disabled={qty >= 20}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div 
                                className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-slate-800 text-[11px] font-semibold text-slate-400"
                                title="Single dispatch per vehicle breakdown"
                              >
                                1 Unit Dispatch
                              </div>
                            )}

                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemove(item)}
                              title={t('cart.removeItem', 'Remove item')}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Right Column: Price Summary & Breakdown Location Sidebar */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-3xl overflow-hidden border border-slate-800 shadow-2xl sticky top-28 bg-[#121824]/95"
              >
                {/* Header */}
                <div className="p-6 bg-[#161D2B]/80 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-lg font-bold font-['Outfit'] text-white">
                    {t('cart.summaryTitle', 'Price Summary')}
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="p-6 space-y-5">
                  
                  {/* Selected Breakdown Location Display */}
                  <div className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-orange-400" />
                        Breakdown Location
                      </span>
                      <button
                        onClick={fetchLocation}
                        disabled={isLocating}
                        className="text-[11px] text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Auto-detect current GPS coordinates"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                        GPS Sync
                      </button>
                    </div>

                    {isEditingLocation ? (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          value={customAddress}
                          onChange={(e) => setCustomAddress(e.target.value)}
                          placeholder="Enter breakdown street / landmark..."
                          className="w-full text-xs bg-[#161D2B] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setIsEditingLocation(false)}
                            className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveLocation}
                            className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-xs"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                          {address || city || 'FixOnRoad Kalyani Central Auto Hub, West Bengal'}
                        </p>
                        <button
                          onClick={() => {
                            setCustomAddress(address || city || '');
                            setIsEditingLocation(true);
                          }}
                          className="text-[11px] text-orange-400 hover:underline font-semibold shrink-0 cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-400">
                      <span>{t('cart.baseCharge', 'Item Subtotal')}</span>
                      <span className="text-white font-medium">₹{baseTotal}</span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>{t('cart.gstCharge', 'GST (18%) itemized')}</span>
                      <span className="text-white font-medium">₹{gst}</span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        {t('cart.platformFee', 'Emergency Platform Fee')}
                      </span>
                      <span className="text-white font-medium">₹{platformFee}</span>
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="pt-4 border-t border-slate-800 flex justify-between items-baseline">
                    <div>
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {t('cart.totalPayable', 'Grand Total')}
                      </span>
                      <span className="text-xs text-emerald-400 font-medium">
                        {t('cart.allInclusive', 'All taxes & platform fees included')}
                      </span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
                      ₹{totalAmount}
                    </span>
                  </div>

                  {/* Proceed to Checkout CTA */}
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

                {/* Trust Footer */}
                <div className="bg-orange-500/5 border-t border-orange-500/10 p-4 px-6 flex items-start gap-3">
                  <Shield className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {t('cart.securityNotice', '100% verified mechanics. Fixed transparent prices. Real-time GPS location tracking once dispatched.')}
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
