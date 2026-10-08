import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Banknote, CheckCircle, ChevronLeft, Shield, Copy, Check, MapPin, Crosshair } from 'lucide-react';
import Navbar from '../components/Navbar';
import { safeFetch } from '../lib/api';

type PaymentMethod = 'upi' | 'cod';

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
  const service = locationState.state?.service || { id: 'flat-tire', name: 'Flat Tire / Puncture Repair', nameKey: 'services.items.flatTire', price: 150, gst: 27 };

  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [locationText, setLocationText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError(t('payment.form.errors.geoNotSupported'));
      return;
    }

    setIsLocating(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (!response.ok) throw new Error(t('payment.form.errors.geocodeFailed'));
          const data = await response.json();
          setLocationText(data.display_name || `${latitude}, ${longitude}`);
        } catch (err) {
          setError(t('payment.form.errors.fetchAddressFailed'));
          setLocationText(`${position.coords.latitude}, ${position.coords.longitude}`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setError(t('payment.form.errors.locationPermission'));
        setIsLocating(false);
      }
    );
  };

  const basePrice = Number(service?.price || 150);
  const serviceGst = Math.round(basePrice * 0.18);
  const platformFee = 10;
  const platformGst = Math.round(platformFee * 0.18);
  const totalAmount = basePrice + serviceGst + platformFee + platformGst;

  const handlePay = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!locationText.trim()) {
      setError(t('payment.form.errors.noLocation'));
      return;
    }

    setIsProcessing(true);
    
    if (method === 'cod' || method === 'upi') {
        try {
          if (method === 'upi') {
            // Direct UPI Intent to basak2@ptyes
            const upiUrl = `upi://pay?pa=basak2@ptyes&pn=FixOnRoad&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`FixOnRoad - ${service?.nameKey ? t(service.nameKey, service.name) : (service?.name || 'Service')}`)}`;
            window.location.href = upiUrl;
            
            // Wait a bit to let the app open before showing success
            await new Promise(resolve => setTimeout(resolve, 1500));
          }

          await safeFetch(`${import.meta.env.VITE_API_URL}/api/v1/payments/cash-confirm`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
             body: JSON.stringify({ amount: totalAmount, location: locationText, method })
          });
          setPaymentDone(true);
        } catch (err: any) {
          setError(err.message || t('payment.form.errors.confirmOrderFailed'));
        } finally {
          setIsProcessing(false);
        }
    }
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText('FIX-2026-00847');
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
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  FIX-2026-00847
                  <button onClick={copyOrderId} className="transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </span>
              </div>
              <div className="flex justify-between text-[15px]">
                <span style={{ color: 'var(--text-muted)' }}>{t('payment.success.method')}</span>
                <span className="capitalize">{method === 'cod' ? t('payment.success.codMethod') : method.toUpperCase()}</span>
              </div>
            </div>

            <p className="text-xs flex items-center justify-center gap-1.5 mb-6" style={{ color: 'var(--text-muted)' }}>
              <Shield className="w-3.5 h-3.5" />
              {t('payment.success.invoiceText')}
            </p>

            <Link to="/" className="btn-primary inline-flex items-center gap-2">
              <span className="relative z-10">{t('payment.success.backToHome')}</span>
            </Link>
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
          <ChevronLeft className="w-4 h-4" /> {t('common.buttons.back')} to {t('common.navbar.services')}
        </button>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Payment Methods — left */}
          <div className="md:col-span-3">
            <h1 className="text-3xl font-bold font-['Outfit'] mb-6">{t('payment.form.title')}</h1>

            {/* Service Location */}
            <div className="glass-panel rounded-2xl p-6 mb-7 space-y-4">
              <h3 className="font-semibold text-[17px] flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-orange-500" /> {t('payment.form.locationTitle')}</span>
                <button 
                  type="button"
                  onClick={handleDetectLocation}
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
                  value={locationText}
                  onChange={e => setLocationText(e.target.value)}
                  placeholder={t('payment.form.locationPlaceholder')}
                  className="input-field min-h-[80px] resize-none"
                  required
                />
              </div>
            </div>

            {/* Method Selector */}
            <div className="flex gap-3 mb-7">
              {([
                { key: 'upi' as PaymentMethod, label: 'UPI', icon: <Smartphone className="w-5 h-5" /> },
                { key: 'cod' as PaymentMethod, label: 'Cash', icon: <Banknote className="w-5 h-5" /> }
              ]).map(m => (
                <button
                  key={m.key}
                  onClick={() => { setMethod(m.key); setError(null); }}
                  className={`flex-1 glass-panel rounded-xl py-4 flex flex-col items-center gap-2 transition-all duration-300 ${
                    method === m.key ? 'border-blue-500/40 text-blue-400' : ''
                  }`}
                  style={method === m.key ? { background: 'rgba(59,130,246,0.08)' } : { color: 'var(--text-muted)' }}
                >
                  {m.icon}
                  <span className="text-sm font-medium">{m.label}</span>
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
                {method === 'upi' && (
                  <div className="glass-panel rounded-2xl p-6 space-y-4">
                    <h3 className="font-semibold text-[17px]">{t('payment.form.upiTitle')}</h3>
                    <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
                      {t('payment.form.upiDesc1')} <span className="text-orange-400 font-medium">basak2@ptyes</span>.
                    </p>
                    <div className="flex items-center gap-2.5 rounded-xl p-3.5" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
                      <Smartphone className="w-5 h-5 text-orange-400 shrink-0" />
                      <p className="text-[13px] text-orange-400">{t('payment.form.upiDesc2')}</p>
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
                  <span className="relative z-10 flex items-center gap-2">
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('payment.form.processing')}
                      </>
                    ) : (
                      method === 'cod' ? t('payment.form.confirmCod', { amount: totalAmount }) : method === 'upi' ? t('payment.form.payUpi', { amount: totalAmount }) : t('payment.form.payDefault', { amount: totalAmount })
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
