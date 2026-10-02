import { useRef, useState, useEffect } from "react";
import {
  BrowserRouter, Routes, Route, Link, useLocation,
} from "react-router-dom";
import {
  motion, useScroll, useTransform,
  AnimatePresence, useInView,
} from "framer-motion";
import {
  Shield, Zap, Navigation, ChevronRight,
  Clock, MapPin, Wrench, Star, Crosshair, Droplets, Battery, Link2, Cog
} from "lucide-react";
import { ThemeProvider } from "./components/ThemeProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MechanicLanding from "./MechanicLanding";
import AuthPage from "./pages/AuthPage";
import ServicesPage from "./pages/ServicesPage";
import PaymentPage from "./pages/PaymentPage";
import HowItWorks from "./components/HowItWorks";
import NotFoundPage from "./pages/NotFoundPage";

/* ══════════════════════════════════════════════
   REUSABLE ANIMATION PRIMITIVES
══════════════════════════════════════════════ */

function WordReveal({ text, className = "", delay = 0, once = true }: { text: string; className?: string; delay?: number; once?: boolean; }) {
  const words = text.split(" ");
  return (
    <motion.span initial="hidden" whileInView="visible" viewport={{ once, margin: "-60px" }} className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span key={i} variants={{
          hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
          visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, delay: delay + i * 0.08, ease: [0.16, 1, 0.3, 1] } },
        }} style={{ display: "inline-block", marginRight: "0.28em" }}>{word}</motion.span>
      ))}
    </motion.span>
  );
}

function ParallaxImage({ src, alt = "", className = "", overlay = "rgba(13,15,20,0.55)", children }: { src: string; alt?: string; className?: string; overlay?: string; children?: React.ReactNode; }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1.05, 1.12]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y, scale }} className="absolute inset-0 will-change-transform">
        <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0" style={{ background: overlay }} />
      </motion.div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number; }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 48, scale: 0.97 }} animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}} transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden py-5 select-none" style={{ borderTop: "1px solid rgba(249,115,22,0.15)", borderBottom: "1px solid rgba(249,115,22,0.15)", background: "rgba(249,115,22,0.03)" }}>
      <motion.div className="flex gap-0 whitespace-nowrap" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }}>
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-6 pr-10">
            <span className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>{item}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500/50 shrink-0" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   LIVE TRACKER WIDGET
══════════════════════════════════════════════ */
function LiveTracker() {
  const [eta, setEta] = useState(12);
  const [distance, setDistance] = useState(2.4);
  const [status, setStatus] = useState<"searching" | "found" | "arriving">("searching");

  useEffect(() => {
    const t1 = setTimeout(() => setStatus("found"), 2000);
    const t2 = setTimeout(() => setStatus("arriving"), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (status !== "arriving") return;
    const iv = setInterval(() => {
      setEta(p => Math.max(0, p - 1));
      setDistance(p => Math.max(0, +(p - 0.2).toFixed(1)));
    }, 3000);
    return () => clearInterval(iv);
  }, [status]);

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden" style={{ border: "1px solid rgba(249,115,22,0.2)" }}>
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 pointer-events-none" />
      <div className="relative z-10 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[17px]">Live Dispatch Radar</h3>
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Live
          </motion.span>
        </div>
        <div className="rounded-xl overflow-hidden relative h-36" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
          <div className="dot-grid" />
          <div className="absolute inset-0 flex items-center justify-center">
            {status === "searching" ? (
              <motion.div animate={{ scale: [1, 1.7, 1], opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-orange-500" />
              </motion.div>
            ) : (
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                <MapPin className="w-8 h-8 text-orange-500 fill-orange-500/30" />
              </motion.div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <div>
            <p className="font-semibold text-[15px]">{status === "searching" ? "Finding nearest mechanic…" : "Sanjay Das (Bike Expert)"}</p>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>{status === "searching" ? "Scanning 3 km radius" : `${distance} km away · ${eta} min ETA`}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${status === "searching" ? "bg-yellow-500/15 text-yellow-400" : status === "found" ? "bg-orange-500/15 text-orange-400" : "bg-emerald-500/15 text-emerald-400"}`}>
            {status === "searching" ? "Searching" : status === "found" ? "Matched" : "En Route"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CINEMATIC INTRO OVERLAY
══════════════════════════════════════════════ */
function CinematicIntro({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div className="fixed inset-0 z-[999] flex flex-col items-center justify-center" style={{ background: "#000" }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 1.5, delay: 0.4, ease: "easeInOut" }}>
            <Wrench className="w-10 h-10 text-orange-500" />
          </motion.div>
          <span className="text-5xl font-black font-['Outfit'] tracking-tight text-white">Fix<span className="text-orange-500">On</span>Road</span>
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-xs uppercase tracking-[0.3em] font-bold" style={{ color: "rgba(249,115,22,0.6)" }}>
          Two-Wheeler Assistance · Reimagined
        </motion.p>
      </motion.div>
      <motion.div className="absolute top-0 left-0 right-0 h-12 bg-black origin-top" animate={{ scaleY: [1, 0] }} transition={{ duration: 0.9, delay: 1.6, ease: [0.76, 0, 0.24, 1] }} />
      <motion.div className="absolute bottom-0 left-0 right-0 h-12 bg-black origin-bottom" animate={{ scaleY: [1, 0] }} transition={{ duration: 0.9, delay: 1.6, ease: [0.76, 0, 0.24, 1] }} />
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   RIDER LANDING PAGE
══════════════════════════════════════════════ */
function RiderLanding() {
  const [introShown, setIntroShown] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [locationState, setLocationState] = useState<'idle' | 'locating' | 'found'>('idle');

  useEffect(() => {
    document.title = "FixOnRoad — On-Demand Roadside Help for Bikes & Cars";
    const seen = sessionStorage.getItem("for_intro_seen");
    if (seen) { setIntroDone(true); setIntroShown(true); }
    else { setIntroShown(true); }
  }, []);

  const handleIntroDone = () => {
    sessionStorage.setItem("for_intro_seen", "1");
    setIntroDone(true);
  };

  const handleLocate = () => {
    setLocationState('locating');
    setTimeout(() => {
      setLocationState('found');
    }, 1500);
  };

  /* Hero parallax */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY       = useTransform(heroScroll, [0, 1], ["0%", "40%"]);
  const heroOpacity = useTransform(heroScroll, [0, 0.6], [1, 0]);
  const heroScale   = useTransform(heroScroll, [0, 1], [1, 1.08]);
  const heroTextY   = useTransform(heroScroll, [0, 1], ["0%", "60%"]);

  const marqueItems = ["Flat Tire Repair", "Jump Start", "Chain Fix", "Engine Diagnosis", "Brake Repair", "Fuel Delivery", "500+ Mechanics", "Fixed Pricing", "Live Tracking", "15 Min Response"];

  const breakdownIssues = [
    { name: "Flat Tire", icon: <Droplets className="w-5 h-5 text-blue-400" /> },
    { name: "Dead Battery", icon: <Battery className="w-5 h-5 text-yellow-400" /> },
    { name: "Chain Snapped", icon: <Link2 className="w-5 h-5 text-purple-400" /> },
    { name: "Won't Start", icon: <Cog className="w-5 h-5 text-red-400" /> },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg-primary)", overflowX: "hidden" }}>
      <AnimatePresence>
        {introShown && !introDone && <CinematicIntro onDone={handleIntroDone} />}
      </AnimatePresence>
      <Navbar variant="rider" />

      {/* ════════ HERO ════════ */}
      <section ref={heroRef} className="relative min-h-[100vh] lg:min-h-[85vh] flex items-center overflow-hidden pt-16">
        <motion.div style={{ y: heroY, scale: heroScale }} className="absolute inset-0 will-change-transform">
          <img src="/img-highway.jpg" alt="Dark highway" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(13,15,20,0.95) 0%, rgba(13,15,20,0.7) 50%, rgba(13,15,20,0.4) 100%)" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F14] via-transparent to-transparent" />
          <div className="absolute inset-0 mix-blend-multiply" style={{ background: "rgba(249,115,22,0.1)" }} />
        </motion.div>

        <motion.div style={{ y: heroTextY, opacity: heroOpacity }} className="relative z-20 w-full px-5 md:px-10 lg:px-16 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-20">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-7">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: introDone ? 1 : 0, y: introDone ? 0 : 24 }} transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
              <span className="pill-badge">
                <Zap className="w-3 h-3" /> Live in Kalyani, West Bengal <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </span>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: introDone ? 1 : 0 }} transition={{ delay: 0.2 }}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
                On-Demand{" "}
                <span className="text-amber-400 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent inline-block">
                  Roadside Help
                </span>{" "}
                for Bikes & Cars.
              </h1>
            </motion.div>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: introDone ? 1 : 0, y: introDone ? 0 : 20 }} transition={{ delay: 0.6, duration: 0.7 }} className="text-base sm:text-lg leading-relaxed text-gray-300">
              Stranded on your vehicle? Request a verified mechanic instantly. Fixed pricing, live tracking, and fast response times.
            </motion.p>

            {/* Quick Action Emergency Input */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: introDone ? 1 : 0, y: introDone ? 0 : 20 }} transition={{ delay: 0.75 }} className="w-full max-w-md p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row gap-2">
              <button 
                onClick={handleLocate}
                className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/10"
              >
                {locationState === 'idle' && <><Crosshair className="w-4 h-4 text-orange-400" /> Use Current Location</>}
                {locationState === 'locating' && <><span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /> Locating...</>}
                {locationState === 'found' && <><MapPin className="w-4 h-4 text-emerald-400" /> Kalyani Highway</>}
              </button>
              <Link to="/services" className="h-12 bg-orange-500 hover:bg-orange-600 text-white px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shrink-0">
                Request Help <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Trust Badges Row */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: introDone ? 1 : 0 }} transition={{ delay: 0.9 }} className="flex flex-wrap gap-6 pt-6 border-t border-orange-500/20">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                <div className="text-sm"><span className="font-bold text-white">15 min</span><br/><span className="text-gray-400 text-xs">Avg Response</span></div>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-400" />
                <div className="text-sm"><span className="font-bold text-white">500+</span><br/><span className="text-gray-400 text-xs">Verified Mechanics</span></div>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                <div className="text-sm"><span className="font-bold text-white">4.9/5</span><br/><span className="text-gray-400 text-xs">User Rating</span></div>
              </div>
            </motion.div>
          </div>

          {/* Hero Right: Live Dispatch Radar Illustration */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: introDone ? 1 : 0, scale: introDone ? 1 : 0.95 }} transition={{ delay: 0.8, duration: 0.7 }} className="lg:col-span-5 w-full hidden lg:block">
            <LiveTracker />
          </motion.div>
        </motion.div>
      </section>

      <Marquee items={marqueItems} />

      {/* ════════ QUICK TRIAGE SECTION (Replaced BMW 3D) ════════ */}
      <section className="py-24 relative z-10 overflow-hidden" style={{ borderTop: "1px solid rgba(249,115,22,0.07)" }}>
        <div className="px-5 md:px-10 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Instant Assistance
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-4">
              What happened to{" "}
              <span className="text-amber-400 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent inline-block">
                your vehicle?
              </span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-md mx-auto">
              Select your issue for transparent, fixed pricing and instant mechanic dispatch.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Interactive Issue Grid */}
            <div className="grid grid-cols-2 gap-4">
              {breakdownIssues.map((issue, idx) => (
                <RevealSection key={idx} delay={idx * 0.1}>
                  <Link to="/services" className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group border border-white/5">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {issue.icon}
                    </div>
                    <span className="font-bold text-sm text-gray-200">{issue.name}</span>
                  </Link>
                </RevealSection>
              ))}
            </div>

            {/* Core Pillars */}
            <div className="flex flex-col gap-6">
              <RevealSection delay={0.4}>
                <div className="glass-panel p-6 rounded-2xl flex items-start gap-4 border border-white/5">
                  <Shield className="w-6 h-6 text-orange-400 shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold font-['Outfit'] text-white">Fixed Transparent Pricing</h3>
                    <p className="text-sm text-gray-400 mt-1">Starting at ₹150. Know the exact cost before confirming the request. No haggling on the roadside.</p>
                  </div>
                </div>
              </RevealSection>
              <RevealSection delay={0.5}>
                <div className="glass-panel p-6 rounded-2xl flex items-start gap-4 border border-white/5">
                  <Navigation className="w-6 h-6 text-amber-400 shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold font-['Outfit'] text-white">Real-time GPS Tracking</h3>
                    <p className="text-sm text-gray-400 mt-1">Watch your assigned mechanic travel to your exact location on a live map with precise ETAs.</p>
                  </div>
                </div>
              </RevealSection>
              <RevealSection delay={0.6}>
                <div className="glass-panel p-6 rounded-2xl flex items-start gap-4 border border-white/5">
                  <Zap className="w-6 h-6 text-yellow-400 shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold font-['Outfit'] text-white">Instant UPI / Cash</h3>
                    <p className="text-sm text-gray-400 mt-1">Pay seamlessly through the app via UPI, card, or hand cash directly to the mechanic after the job is done.</p>
                  </div>
                </div>
              </RevealSection>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />

      {/* ════════ MECHANIC PARALLAX SECTION ════════ */}
      <ParallaxImage src="/img-mechanic.jpg" overlay="rgba(13,15,20,0.85)" className="py-36 md:py-48 border-t border-orange-500/10">
        <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16 text-center">
          <RevealSection>
            <span className="pill-badge mb-6 inline-flex">Verified Experts</span>
          </RevealSection>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black font-['Outfit'] leading-[1.04] mb-6">
            <WordReveal text="500+ Certified" delay={0} /><br />
            <WordReveal text="Mechanics" className="text-gradient" delay={0.2} /><br />
            <WordReveal text="On Call." delay={0.35} />
          </h2>
          <RevealSection delay={0.4}>
            <p className="text-lg max-w-xl mx-auto text-gray-300">
              Every mechanic on FixOnRoad is background-verified, rated by real riders, and equipped to handle bike emergencies on the spot.
            </p>
          </RevealSection>
        </div>
      </ParallaxImage>

      <Footer variant="rider" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  
  useEffect(() => {
    if (hash) {
      // Small delay ensures page renders before scroll calculation
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<RiderLanding />} />
          <Route path="/mechanic" element={<MechanicLanding />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
