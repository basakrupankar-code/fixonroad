import { Link } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <Navbar variant="rider" />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center max-w-md w-full"
        >
          <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mb-6 border border-orange-500/20">
            <AlertTriangle className="w-10 h-10 text-orange-500" />
          </div>
          
          <h1 className="text-7xl font-black text-white mb-2 tracking-tight">404</h1>
          <h2 className="text-2xl font-bold text-gray-200 mb-4">Page Not Found</h2>
          
          <p className="text-gray-400 mb-8 leading-relaxed">
            Oops! It looks like you've ventured off the main road. The page you're looking for doesn't exist or has been moved.
          </p>
          
          <Link 
            to="/" 
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
        </motion.div>
      </div>
      
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[120px] bg-orange-500/5" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px] bg-amber-500/5" />
      </div>
      
      <div className="relative z-10">
        <Footer variant="rider" />
      </div>
    </div>
  );
}
