import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowRight, ChevronLeft, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CartPage() {
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/payment', { 
      state: { 
        service: { id: 'flat-tire', name: 'Flat Tire / Puncture Repair', nameKey: 'services.items.flatTire', price: 150, gst: 27 } 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col relative overflow-hidden">
      <div className="glow-orb w-[400px] h-[400px] -top-[10%] -right-[10%] bg-orange-600/10" />
      <div className="dot-grid" />
      
      <Navbar variant="rider" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 md:px-10 pt-28 sm:pt-32 pb-20 relative z-10">
        <Link to="/services" className="inline-flex items-center gap-1 text-sm mb-8 transition-colors hover:text-orange-400 text-slate-400">
          <ChevronLeft className="w-4 h-4" /> Back to Services
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <div className="p-3 bg-orange-500/10 rounded-xl">
            <ShoppingCart className="w-6 h-6 text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold font-['Outfit']">Your Cart</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl overflow-hidden border border-slate-800 shadow-2xl"
        >
          <div className="p-6 md:p-8 bg-[#121824]/50 border-b border-slate-800">
            <h2 className="text-xl font-semibold">Service Request Summary</h2>
          </div>
          
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50">
              <div>
                <h3 className="font-bold text-lg mb-1">Flat Tire / Puncture Repair</h3>
                <p className="text-sm text-slate-400">On-site mechanic dispatch and repair</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-emerald-400">₹150</span>
              </div>
            </div>

            <div className="space-y-3 pt-4 px-2">
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Base Service Charge</span>
                <span>₹150</span>
              </div>
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Platform Fee</span>
                <span>₹10</span>
              </div>
              <div className="flex justify-between text-slate-400 text-sm">
                <span>GST (18%)</span>
                <span>₹29</span>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-800/80 px-2 flex justify-between items-center">
              <div>
                <span className="block text-slate-400 text-sm mb-1">Total Amount</span>
                <span className="text-2xl font-bold text-white">₹189</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="btn-primary py-3 px-8 flex items-center gap-2 text-[15px]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
          
          <div className="bg-orange-500/5 border-t border-orange-500/10 p-4 px-6 md:px-8 flex items-center gap-3">
            <Shield className="w-5 h-5 text-orange-400 shrink-0" />
            <p className="text-xs text-slate-400">
              Secure checkout. Your payment details are fully encrypted and we offer a 100% satisfaction guarantee on all roadside assistance services.
            </p>
          </div>
        </motion.div>
      </main>

      <Footer variant="rider" />
    </div>
  );
}
