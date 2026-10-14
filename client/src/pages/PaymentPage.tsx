import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Banknote, CheckCircle, ChevronLeft, Shield, Copy, Check, MapPin, Crosshair, Sparkles, QrCode, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import { safeFetch } from '../lib/api';
import { useLocationContext } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

type PaymentMethod = 'cod' | 'upi' | 'card' | 'netbanking';

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface ServiceData {
  id: string;
  name: string;
  price: number;
  gst: number;
}

export default function PaymentPage() {
  const { t } = useTranslation();
  const locationState = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const service = locationState.state?.service || { id: 'flat-tire', name: 'Flat Tire / Puncture Repair', nameKey: 'services.items.flatTire', price: 150, gst: 27 };

  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>('');
  const [confirmedOrderCode, setConfirmedOrderCode] = useState<string>('');
  const [confirmedPaymentId, setConfirmedPaymentId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, setAddress, isLocating, fetchLocation, geofence, isWithinServiceArea } = useLocationContext();

  const basePrice = Number(service?.price || 150);
  const serviceGst = Math.round(basePrice * 0.18);
  const platformFee = 10;
  const platformGst = Math.round(platformFee * 0.18);
  const totalAmount = basePrice + serviceGst + platformFee + platformGst;

  const handlePay = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!address.trim() || address === 'Detecting location...') {
      setError(t('payment.form.errors.noLocation'));
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create order on the backend (creates MongoDB order and Razorpay order in test mode)
      const token = localStorage.getItem('token');
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
      }

      const resData = await safeFetch('/api/v1/payments/create-order', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          serviceType: service?.id || "flat-tire",
          basePrice: basePrice,
          location: { address: address, lat: 0, lng: 0 },
          paymentMethod: method
        })
      });

      const orderData = resData.data || resData;
      const targetOrderId = orderData.orderId || orderData._id || '6ac8e7e0a6f24ff6530cc8a0';
      const targetOrderCode = orderData.orderCode || (targetOrderId ? `FOR-${targetOrderId.slice(0, 6).toUpperCase()}` : 'FOR-PENDING');
      setConfirmedOrderId(targetOrderId);
      setConfirmedOrderCode(targetOrderCode);

      // 2. If Cash on Delivery, show confirmation screen with immediate dispatch tracking & order history
      if (method === 'cod') {
        clearCart();
        setPaymentDone(true);
        return;
      }

      // 3. Online payment via Razorpay Test Mode
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !(window as any).Razorpay) {
        throw new Error("Unable to load Razorpay Checkout SDK. Please check your network connection.");
      }

      const razorpayKey = orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TmgnRVOfgBgCJV';

      const options: any = {
        key: razorpayKey,
        amount: orderData.amount || orderData.amountPaise || Math.round(totalAmount * 100),
        currency: orderData.currency || 'INR',
        name: 'FixOnRoad',
        description: `${service?.name || 'Roadside Assistance'} (Test Mode)`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: user?.name || localStorage.getItem('user_name') || 'Customer',
          email: user?.email || localStorage.getItem('user_email') || 'customer@fixonroad.com',
          contact: user?.phone || localStorage.getItem('user_phone') || '9876543210'
        },
        notes: {
          bookingOrderId: targetOrderId,
          service: service?.name || 'Roadside Assistance',
          mode: 'test_mode'
        },
        theme: {
          color: '#f97316' // FixOnRoad signature orange
        },
        handler: async function (response: any) {
          try {
            setIsProcessing(true);
            // Verify HMAC signature on backend
            const token = localStorage.getItem('token');
            const authHeaders: Record<string, string> = {
              'Content-Type': 'application/json'
            };
            if (token) {
              authHeaders['Authorization'] = `Bearer ${token}`;
            }

            const verifyData = await safeFetch('/api/v1/payments/verify-payment', {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({
                orderId: targetOrderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (verifyData.success || verifyData.status === 'PAID') {
              setConfirmedPaymentId(response.razorpay_payment_id);
              clearCart();
              setPaymentDone(true);
            } else {
              setError(verifyData.message || 'Payment signature verification failed.');
            }
          } catch (verifyErr: any) {
            console.error("Payment verification error:", verifyErr);
            setError(verifyErr.message || "Failed to verify payment with server.");
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on('payment.failed', function (resp: any) {
        console.error("Razorpay test payment failed:", resp.error);
        setError(resp.error?.description || "Payment was not completed. Please try again.");
        setIsProcessing(false);
      });
      rzpInstance.open();
    } catch (err: any) {
      console.error("Order or payment flow failed:", err);
      setError(err.message || "Failed to reach server. Please ensure backend is running.");
      setIsProcessing(false);
    }
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(confirmedOrderCode || confirmedOrderId || 'FOR-ORDER');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ===== Payment Success Screen ===== */
  if (paymentDone) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
        <div className="glow-orb w-[400px] h-[400px] -top-[10%] -left-[10%] bg-emerald-600/15" />
        <div className="dot-grid" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="glass-panel rounded-3xl p-8 sm:p-10 text-center max-w-md w-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 pointer-events-none" />
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </motion.div>
            <h2 className="text-2xl font-bold font-['Outfit'] mb-2">{t('payment.success.title')}</h2>
            <p className="text-[15px] mb-6" style={{ color: 'var(--text-secondary)' }}>{t('payment.success.subtitle')}</p>

            <div className="rounded-xl p-4 mb-6 text-left space-y-2.5" style={{ background: 'var(--bg-card)' }}>
              <div className="flex justify-between text-[15px]">
                <span style={{ color: 'var(--text-muted)' }}>{t('payment.success.service')}</span>
                <span className="font-medium">{service?.nameKey ? t(service.nameKey, service.name) : service?.name}</span>
              </div>
              <div className="flex justify-between text-[15px]">
                <span style={{ color: 'var(--text-muted)' }}>{t('payment.success.amountPaid')}</span>
                <span className="font-bold text-emerald-400">₹{totalAmount}</span>
              </div>
              <div className="flex justify-between text-[15px] items-center">
                <span style={{ color: 'var(--text-muted)' }}>{t('payment.success.orderId')}</span>
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-orange-400">
                  {confirmedOrderCode || confirmedOrderId || 'FOR-ORDER'}
                  <button onClick={copyOrderId} className="transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </span>
              </div>
              {confirmedPaymentId && (
                <div className="flex justify-between text-[15px] items-center">
                  <span style={{ color: 'var(--text-muted)' }}>Razorpay Payment ID</span>
                  <span className="font-mono text-xs text-orange-400 truncate max-w-[160px]">{confirmedPaymentId}</span>
                </div>
              )}
              <div className="flex justify-between text-[15px]">
                <span style={{ color: 'var(--text-muted)' }}>{t('payment.success.method')}</span>
                <span className="capitalize">{method === 'cod' ? t('payment.success.codMethod') : `${method.toUpperCase()} (Razorpay Test Mode)`}</span>
              </div>
            </div>

            <p className="text-xs flex items-center justify-center gap-1.5 mb-6" style={{ color: 'var(--text-muted)' }}>
              <Shield className="w-3.5 h-3.5" />
              {t('payment.success.invoiceText')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate(`/track/${confirmedOrderCode || confirmedOrderId || '6ac8e7e0a6f24ff6530cc8a0'}`)}
                className="btn-primary flex-1 py-3 text-center"
              >
                Track Mechanic Live
              </button>
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold transition-colors text-center text-white border border-slate-700"
              >
                View My Bookings
              </button>
            </div>
            <div className="mt-4">
              <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors block text-center">
                {t('payment.success.backToHome')}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ===== Payment Form ===== */
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="glow-orb w-[400px] h-[400px] -top-[10%] -right-[10%] bg-blue-600/12" />
      <div className="glow-orb w-[300px] h-[300px] -bottom-[10%] -left-[10%] bg-indigo-600/8" />
      <div className="dot-grid" />

      <Navbar variant="rider" />

      <div className="relative z-10 max-w-5xl mx-auto px-5 md:px-10 pt-28 sm:pt-32 pb-20">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm mb-8 transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
          <ChevronLeft className="w-4 h-4" /> Back to Services
        </button>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Payment Methods — left */}
          <div className="md:col-span-3">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <h1 className="text-3xl font-bold font-['Outfit']">{t('payment.form.title')}</h1>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Razorpay Test Mode Active
              </div>
            </div>

            {/* Service Location */}
            <div className="glass-panel rounded-2xl p-6 mb-7 space-y-4">
              <h3 className="font-semibold text-[17px] flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-orange-500" /> {t('payment.form.locationTitle')}</span>
                <button 
                  type="button"
                  onClick={fetchLocation}
                  disabled={isLocating}
                  className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                >
                  {isLocating ? <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
                  {isLocating ? t('payment.form.locating') : t('payment.form.autoFetch')}
                </button>
              </h3>
              <div>
                <label htmlFor="service-location" className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  {t('payment.form.locationLabel')}
                </label>
                <textarea
                  id="service-location"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder={t('payment.form.locationPlaceholder')}
                  className="input-field min-h-[80px] resize-none"
                  required
                />
                {geofence && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${
                      isWithinServiceArea 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isWithinServiceArea ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {isWithinServiceArea ? 'Geofence Verified • Within Service Hub' : 'Highway Extended Coverage Active'}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {geofence.hubName} {geofence.distanceKm > 0 ? `(~${geofence.distanceKm.toFixed(1)} km)` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Method Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
              {[
                { key: 'upi' as PaymentMethod, label: 'UPI / QR', icon: <Smartphone className="w-5 h-5" />, active: true, tag: 'Fastest' },
                { key: 'card' as PaymentMethod, label: 'Card', icon: <CreditCard className="w-5 h-5" />, active: true, tag: 'Test' },
                { key: 'netbanking' as PaymentMethod, label: 'Net Banking', icon: <Banknote className="w-5 h-5" />, active: true, tag: 'Test' },
                { key: 'cod' as PaymentMethod, label: 'Cash (COD)', icon: <Banknote className="w-5 h-5" />, active: true, tag: 'Pay Later' }
              ].map(m => (
                <button
                  key={m.key}
                  type="button"
                  disabled={!m.active}
                  onClick={() => { setMethod(m.key); setError(null); }}
                  className={`relative flex-1 glass-panel rounded-xl py-4 px-2 flex flex-col items-center gap-2 transition-all duration-300 ${
                    method === m.key ? 'border-orange-500/50 text-orange-400 shadow-lg shadow-orange-500/10' : 'hover:bg-white/5'
                  }`}
                  style={method === m.key ? { background: 'rgba(249,115,22,0.1)' } : { color: 'var(--text-muted)' }}
                >
                  {m.icon}
                  <span className="text-[13px] font-medium text-center">{m.label}</span>
                  {m.tag && (
                    <span className="absolute -top-2 bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700 whitespace-nowrap">
                      {m.tag}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 p-3 rounded-xl text-sm text-red-400 bg-red-500/10 border border-red-500/20"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.form
                key={method}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                onSubmit={handlePay}
                className="space-y-5"
              >
                {/* Method Details */}
                {method === 'upi' && (
                  <div className="glass-panel rounded-2xl p-6 space-y-4 border border-orange-500/20">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[17px] flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-orange-400" />
                        Razorpay UPI Instant (Test Mode)
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Zero Fee
                      </span>
                    </div>
                    <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                      Pay using Google Pay, PhonePe, Paytm, BHIM, or Scan & Pay.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'UPI QR'].map((app) => (
                        <span key={app} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-medium">
                          {app}
                        </span>
                      ))}
                    </div>
                    <div className="rounded-xl p-3.5 bg-orange-500/10 border border-orange-500/20 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-300">
                        <strong>Test Mode Instructions:</strong> In the Razorpay modal, select any UPI ID or scan QR code and choose <span className="underline">Success</span> to simulate an instant payment.
                      </p>
                    </div>
                  </div>
                )}

                {method === 'card' && (
                  <div className="glass-panel rounded-2xl p-6 space-y-4 border border-blue-500/20">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[17px] flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-400" />
                        Cards via Razorpay (Test Mode)
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        256-bit SSL
                      </span>
                    </div>
                    <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                      All Visa, MasterCard, RuPay, and Maestro test cards supported.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['Visa', 'MasterCard', 'RuPay', 'Maestro', 'Amex'].map((brand) => (
                        <span key={brand} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-medium">
                          {brand}
                        </span>
                      ))}
                    </div>
                    <div className="rounded-xl p-3.5 bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-300">
                        <strong>Sandbox Notice:</strong> You can enter any standard test card number in the Razorpay popup. No real card charge will be made.
                      </p>
                    </div>
                  </div>
                )}

                {method === 'netbanking' && (
                  <div className="glass-panel rounded-2xl p-6 space-y-4 border border-teal-500/20">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[17px] flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-teal-400" />
                        Net Banking (Test Mode)
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        50+ Banks
                      </span>
                    </div>
                    <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                      Select from all major Indian banks to test the bank authorization flow.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak'].map((bank) => (
                        <span key={bank} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-medium">
                          {bank}
                        </span>
                      ))}
                    </div>
                    <div className="rounded-xl p-3.5 bg-teal-500/10 border border-teal-500/20 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-teal-300">
                        <strong>Simulation:</strong> Select your preferred test bank on the Razorpay screen and choose 'Success' to verify.
                      </p>
                    </div>
                  </div>
                )}

                {method === 'cod' && (
                  <div className="glass-panel rounded-2xl p-6 space-y-4">
                    <h3 className="font-semibold text-[17px]">{t('payment.form.codTitle')}</h3>
                    <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
                      {t('payment.form.codDesc1')}
                    </p>
                    <div className="flex items-center gap-2.5 rounded-xl p-3.5" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)' }}>
                      <Banknote className="w-5 h-5 text-yellow-400 shrink-0" />
                      <p className="text-[13px] text-yellow-400">{t('payment.form.codDesc2', { amount: totalAmount })}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-[15px] disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2 font-semibold">
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {method === 'cod' ? t('payment.form.processing') : 'Opening Razorpay Test Modal...'}
                      </>
                    ) : (
                      method === 'cod' 
                        ? t('payment.form.confirmCod', { amount: totalAmount }) 
                        : method === 'upi' 
                          ? `Pay ₹${totalAmount} via Razorpay UPI (Test Mode)` 
                          : method === 'card' 
                            ? `Pay ₹${totalAmount} with Card (Test Mode)` 
                            : `Pay ₹${totalAmount} via Net Banking (Test Mode)`
                    )}
                  </span>
                </button>
              </motion.form>
            </AnimatePresence>
          </div>

          {/* Order Summary — right */}
          <div className="md:col-span-2">
            <div className="glass-panel rounded-2xl p-6 sticky top-28">
              <h3 className="font-semibold text-lg mb-5 font-['Outfit']">{t('payment.summary.title')}</h3>

              <div className="space-y-4 text-[15px]">
                <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)' }}>
                  <p className="font-medium mb-1">{service?.nameKey ? t(service.nameKey, service.name) : service?.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('payment.summary.serviceDesc')}</p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {[
                    { label: t('payment.summary.serviceCharge'), value: `₹${basePrice}` },
                    { label: t('payment.summary.gst18'), value: `₹${serviceGst}` },
                    { label: t('payment.summary.platformFee'), value: `₹${platformFee}` },
                    { label: t('payment.summary.platformGst'), value: `₹${platformGst}` },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
                      <span>{item.label}</span>
                      <span style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex justify-between font-bold text-base" style={{ borderTop: '1px solid var(--border-primary)' }}>
                  <span>{t('payment.summary.total')}</span>
                  <span className="text-blue-400">₹{totalAmount}</span>
                </div>

                <p className="text-xs flex items-center gap-1.5 pt-2" style={{ color: 'var(--text-muted)' }}>
                  <Shield className="w-3.5 h-3.5" />
                  {t('payment.summary.taxNote')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
