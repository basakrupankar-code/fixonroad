import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Banknote, CheckCircle, ChevronLeft, Shield, Copy, Check } from 'lucide-react';
import Navbar from '../components/Navbar';

type PaymentMethod = 'upi' | 'card' | 'cod';

interface ServiceData {
  id: string;
  name: string;
  price: number;
  gst: number;
}

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const service: ServiceData = location.state?.service || { id: 'flat-tire', name: 'Flat Tire / Puncture Repair', price: 150, gst: 27 };

  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = service.price;
  const gstAmount = service.gst;
  const platformFee = 10;
  const platformGst = Math.round(platformFee * 0.18);
  const total = subtotal + gstAmount + platformFee + platformGst;

  const handlePay = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (method === 'upi' && !upiId.includes('@')) {
      setError('Please enter a valid UPI ID (e.g., name@upi)');
      return;
    }
    if (method === 'card') {
      if (cardData.number.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid 16-digit card number');
        return;
      }
      if (cardData.cvv.length < 3) {
        setError('Please enter a valid CVV');
        return;
      }
    }

    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2500));
    setIsProcessing(false);
    setPaymentDone(true);
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
            <h2 className="text-2xl font-bold font-['Outfit'] mb-2">Payment Successful!</h2>
            <p className="text-[15px] mb-6" style={{ color: 'var(--text-secondary)' }}>Your mechanic has been notified and is on the way.</p>

            <div className="rounded-xl p-4 mb-6 text-left space-y-2.5" style={{ background: 'var(--bg-card)' }}>
              <div className="flex justify-between text-[15px]">
                <span style={{ color: 'var(--text-muted)' }}>Service</span>
                <span className="font-medium">{service.name}</span>
              </div>
              <div className="flex justify-between text-[15px]">
                <span style={{ color: 'var(--text-muted)' }}>Amount Paid</span>
                <span className="font-bold text-emerald-400">₹{total}</span>
              </div>
              <div className="flex justify-between text-[15px] items-center">
                <span style={{ color: 'var(--text-muted)' }}>Order ID</span>
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  FIX-2026-00847
                  <button onClick={copyOrderId} className="transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </span>
              </div>
              <div className="flex justify-between text-[15px]">
                <span style={{ color: 'var(--text-muted)' }}>Payment</span>
                <span className="capitalize">{method === 'cod' ? 'Cash on Delivery' : method.toUpperCase()}</span>
              </div>
            </div>

            <p className="text-xs flex items-center justify-center gap-1.5 mb-6" style={{ color: 'var(--text-muted)' }}>
              <Shield className="w-3.5 h-3.5" />
              GST Invoice will be sent to your email
            </p>

            <Link to="/" className="btn-primary inline-flex items-center gap-2">
              <span className="relative z-10">Back to Home</span>
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
          <ChevronLeft className="w-4 h-4" /> Back to Services
        </button>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Payment Methods — left */}
          <div className="md:col-span-3">
            <h1 className="text-3xl font-bold font-['Outfit'] mb-6">Payment</h1>

            {/* Method Selector */}
            <div className="flex gap-3 mb-7">
              {([
                { key: 'upi' as PaymentMethod, label: 'UPI', icon: <Smartphone className="w-5 h-5" /> },
                { key: 'card' as PaymentMethod, label: 'Card', icon: <CreditCard className="w-5 h-5" /> },
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
                  <div className="glass-panel rounded-2xl p-6 space-y-5">
                    <h3 className="font-semibold text-[17px]">Pay via UPI</h3>
                    <div>
                      <label htmlFor="upi-id" className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>UPI ID</label>
                      <input
                        id="upi-id"
                        type="text"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="input-field"
                        required
                      />
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Supports GooglePay, PhonePe, Paytm, BHIM & all UPI apps.</p>
                  </div>
                )}

                {method === 'card' && (
                  <div className="glass-panel rounded-2xl p-6 space-y-5">
                    <h3 className="font-semibold text-[17px]">Credit / Debit Card</h3>
                    <div>
                      <label htmlFor="card-number" className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Card Number</label>
                      <input
                        id="card-number"
                        type="text"
                        value={cardData.number}
                        onChange={e => setCardData({ ...cardData, number: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim() })}
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                        className="input-field font-mono"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="card-expiry" className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Expiry</label>
                        <input
                          id="card-expiry"
                          type="text"
                          value={cardData.expiry}
                          onChange={e => setCardData({ ...cardData, expiry: e.target.value })}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="input-field font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="card-cvv" className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>CVV</label>
                        <input
                          id="card-cvv"
                          type="password"
                          value={cardData.cvv}
                          onChange={e => setCardData({ ...cardData, cvv: e.target.value })}
                          placeholder="•••"
                          maxLength={4}
                          className="input-field font-mono"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="card-name" className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Name on Card</label>
                      <input
                        id="card-name"
                        type="text"
                        value={cardData.name}
                        onChange={e => setCardData({ ...cardData, name: e.target.value })}
                        placeholder="RUPANKAR BASAK"
                        className="input-field uppercase"
                        required
                      />
                    </div>
                  </div>
                )}

                {method === 'cod' && (
                  <div className="glass-panel rounded-2xl p-6 space-y-4">
                    <h3 className="font-semibold text-[17px]">Cash on Delivery</h3>
                    <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
                      Pay the mechanic in cash after the service is completed. The exact amount (including GST) is shown in the summary.
                    </p>
                    <div className="flex items-center gap-2.5 rounded-xl p-3.5" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)' }}>
                      <Banknote className="w-5 h-5 text-yellow-400 shrink-0" />
                      <p className="text-[13px] text-yellow-400">Please keep ₹{total} ready. The mechanic may not carry change.</p>
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
                        Processing...
                      </>
                    ) : (
                      method === 'cod' ? `Confirm Booking — ₹${total}` : `Pay ₹${total}`
                    )}
                  </span>
                </button>
              </motion.form>
            </AnimatePresence>
          </div>

          {/* Order Summary — right */}
          <div className="md:col-span-2">
            <div className="glass-panel rounded-2xl p-6 sticky top-28">
              <h3 className="font-semibold text-lg mb-5 font-['Outfit']">Order Summary</h3>

              <div className="space-y-4 text-[15px]">
                <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)' }}>
                  <p className="font-medium mb-1">{service.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Roadside repair service</p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {[
                    { label: 'Service Charge', value: `₹${subtotal}` },
                    { label: 'GST @ 18%', value: `₹${gstAmount}` },
                    { label: 'Platform Fee', value: `₹${platformFee}` },
                    { label: 'Platform GST @ 18%', value: `₹${platformGst}` },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
                      <span>{item.label}</span>
                      <span style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex justify-between font-bold text-base" style={{ borderTop: '1px solid var(--border-primary)' }}>
                  <span>Total</span>
                  <span className="text-blue-400">₹{total}</span>
                </div>

                <p className="text-xs flex items-center gap-1.5 pt-2" style={{ color: 'var(--text-muted)' }}>
                  <Shield className="w-3.5 h-3.5" />
                  Prices include 18% GST as per Indian tax regulations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
