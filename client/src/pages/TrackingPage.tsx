import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MapPin, PhoneCall, ChevronLeft, Navigation2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TrackingPage() {
  const { orderId } = useParams();
  const [eta, setEta] = useState(15);
  const [status, setStatus] = useState('Mechanic Assigned');

  useEffect(() => {
    // Simulated live tracking polling
    const interval = setInterval(() => {
      setEta((prev) => Math.max(1, prev - 1));
      if (eta < 10) setStatus('En Route');
      if (eta <= 2) setStatus('Arrived');
    }, 5000);
    return () => clearInterval(interval);
  }, [eta]);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col">
      <Navbar variant="rider" />
      <div className="flex-1 flex flex-col pt-24 px-4 pb-10 max-w-4xl mx-auto w-full">
        <Link to="/" className="inline-flex items-center text-orange-500 hover:text-orange-400 mb-6 font-semibold">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Home
        </Link>
        
        <div className="bg-[#121824] rounded-3xl border border-slate-800 p-6 md:p-10 shadow-2xl relative overflow-hidden flex-1 flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-['Outfit']">Live Tracking</h1>
              <p className="text-slate-400 text-sm mt-1">Order #{orderId?.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl md:text-4xl font-black text-orange-400">{eta} min</div>
              <div className="text-sm font-semibold text-emerald-400 uppercase tracking-widest mt-1 animate-pulse">
                {status}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#0A0D14] rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center min-h-[300px]">
            {/* Fake Map visualization */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <div className="relative w-full max-w-md h-full flex flex-col items-center justify-center space-y-16 py-10">
              
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="relative z-10">
                 <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                    <Navigation2 className="w-8 h-8 text-orange-400" />
                 </div>
                 <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap text-xs font-bold bg-[#121824] px-3 py-1 rounded-full border border-slate-700">Mechanic</div>
              </motion.div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-32 border-l-2 border-dashed border-orange-500/50" />

              <div className="relative z-10">
                 <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <MapPin className="w-8 h-8 text-emerald-400" />
                 </div>
                 <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap text-xs font-bold bg-[#121824] px-3 py-1 rounded-full border border-slate-700">Your Location</div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center transition-colors">
              <PhoneCall className="w-5 h-5 mr-2" />
              Call Mechanic
            </button>
          </div>
        </div>
      </div>
      <Footer variant="rider" />
    </div>
  );
}
