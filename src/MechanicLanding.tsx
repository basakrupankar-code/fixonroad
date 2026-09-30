import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Settings, ShieldCheck, MapPin, Banknote, ArrowRight, Star, Users, TrendingUp, ChevronDown, Phone, Clock, Zap, Bike, CarFront, ChevronUp, Plus, Minus } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

/* ===== Animation Variants (typed) ===== */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } }
};

/* ===== Counter Animation Hook ===== */
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);
  return { count, start: () => setStarted(true) };
}

/* ===== FAQ Data ===== */
const faqs = [
  {
    q: "Do I need an existing garage or physical shop?",
    a: "No, both independent mobile mechanics and established garage owners can sign up."
  },
  {
    q: "What documents are required for onboarding?",
    a: "Valid Aadhaar card, PAN card, and a bank account/UPI ID for instant payouts."
  },
  {
    q: "How and when do I get paid?",
    a: "Payouts are instant per job completion via UPI or settled daily to your bank account."
  },
  {
    q: "How do commissions work after the 6-month launch period?",
    a: "Zero commission for your first 6 months. Afterward, a nominal flat convenience fee per job is charged—no hidden cuts."
  }
];

export default function MechanicLanding() {
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.97]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0.7]);

  const counter1 = useCounter(500);
  const counter2 = useCounter(98);
  const counter3 = useCounter(15);

  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    document.title = "Partner With FixOnRoad — Earn on Your Schedule in West Bengal";
  }, []);

  const testimonials = [
    { name: 'Sanjay Das', area: 'Kalyani', text: 'I earn ₹3,000 extra every week without leaving my garage area.', stars: 5 },
    { name: 'Pradeep Mondal', area: 'Chakdaha', text: 'The fixed pricing means customers never argue. I just do my work.', stars: 5 },
    { name: 'Bikash Roy', area: 'Gayeshpur', text: 'Instant payouts changed my life. No more waiting for cash.', stars: 4 },
  ];

  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial(prev => (prev + 1) % testimonials.length), 4000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb w-[55%] h-[55%] -top-[15%] -right-[10%] bg-emerald-600/12" style={{ animationDuration: '6s' }} />
        <div className="glow-orb w-[50%] h-[50%] -bottom-[15%] -left-[10%] bg-teal-600/12" style={{ animationDuration: '8s' }} />
        <div className="glow-orb w-[20%] h-[20%] top-[40%] left-[30%] bg-emerald-500/8" style={{ animationDuration: '5s' }} />
        <div className="dot-grid" />
      </div>

      <Navbar variant="mechanic" />

      {/* Hero */}
      <motion.main style={{ scale: heroScale, opacity: heroOpacity }} className="relative z-10 pt-28 sm:pt-32 pb-20 sm:pb-24 px-5 md:px-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left — Text */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-7">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-400" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Now Onboarding in West Bengal
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-bold font-['Outfit'] leading-[1.08] tracking-tight">
            Your Skills,<br />
            <span className="text-gradient-emerald">Their Need,</span><br />
            <span style={{ color: 'var(--text-secondary)' }}>Your Profit.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-base sm:text-lg max-w-md leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Customers find you. Prices are pre-agreed. You show up, fix, and get paid instantly. Zero commission for the first 6 months.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
            <Link to="/auth" className="btn-emerald flex items-center gap-2 group text-[15px]">
              Start Earning Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#how" className="btn-secondary flex items-center gap-2 text-[15px]">
              See How It Works
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </a>
          </motion.div>

          {/* Live Stats */}
          <motion.div
            variants={fadeUp}
            onViewportEnter={() => { counter1.start(); counter2.start(); counter3.start(); }}
            className="flex items-center gap-8 sm:gap-10 pt-6"
            style={{ borderTop: '1px solid var(--border-primary)' }}
          >
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-['Outfit']">{counter1.count}+</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Mechanics Joined</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-['Outfit']">{counter2.count}%</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Satisfaction Rate</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-['Outfit']">{counter3.count} min</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg. Response</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right — Phone Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative w-full max-w-[340px] mx-auto lg:ml-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 blur-[50px] rounded-[50px] scale-110 pointer-events-none" />
          <div className="relative rounded-[36px] p-1.5 shadow-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
            <div className="rounded-[30px] overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
              {/* Status bar */}
              <div className="flex justify-between items-center px-6 py-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span>4:48 PM</span>
                <div className="w-20 h-5 rounded-full" style={{ background: 'var(--bg-secondary)' }} />
                <span>100%</span>
              </div>

              <div className="px-5 pb-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold">Sanjay Das</p>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online • Kalyani
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
                      <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
                      <Settings className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </div>

                {/* Earnings */}
                <div className="bg-gradient-to-r from-emerald-600/15 to-teal-600/15 rounded-2xl p-4" style={{ border: '1px solid rgba(16,185,129,0.15)' }}>
                  <p className="text-[10px] text-emerald-300 uppercase tracking-wider font-semibold mb-1">Today's Earnings</p>
                  <p className="text-2xl font-bold font-['Outfit']">₹1,850</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>4 jobs completed</p>
                </div>

                {/* Incoming Request */}
                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ repeat: Infinity, repeatType: 'reverse' as const, duration: 2.5, repeatDelay: 4 }}
                  className="rounded-2xl p-4"
                  style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 0 20px rgba(239,68,68,0.05)' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-red-500/15 text-red-400 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">⚡ New Job</span>
                    <span className="font-bold text-lg">₹250</span>
                  </div>
                  <p className="text-[10px] font-bold text-orange-400 mb-0.5 uppercase tracking-wide flex items-center gap-1">
                    <Bike className="w-3 h-3" /> Royal Enfield Classic 350
                  </p>
                  <p className="font-semibold text-sm mb-0.5">Flat Tire Repair</p>
                  <p className="text-[11px] flex items-center gap-1 mb-3" style={{ color: 'var(--text-muted)' }}>
                    <MapPin className="w-3 h-3" /> 1.4 km • <Clock className="w-3 h-3" /> 12 min away
                  </p>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-emerald-500 text-black font-bold py-2.5 rounded-xl text-xs hover:bg-emerald-400 transition-colors">Accept</button>
                    <button className="flex-1 font-medium py-2.5 rounded-xl text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>Decline</button>
                  </div>
                </motion.div>

                {/* Past Job */}
                <div className="opacity-60">
                  <div className="rounded-xl p-3 flex justify-between items-center" style={{ background: 'var(--bg-card)' }}>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1 mb-0.5"><CarFront className="w-3 h-3" /> Hyundai i20</span>
                      <span className="text-xs font-medium">Battery Jump Start</span>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>35 min ago</p>
                    </div>
                    <span className="text-xs text-emerald-400 font-semibold">₹450 ✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.main>

      {/* Benefits */}
      <section id="benefits" className="relative z-10 py-16 sm:py-20 px-5 md:px-10" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-['Outfit'] mb-4">Why Mechanics <span className="text-gradient-emerald">Love Us</span></h2>
            <p style={{ color: 'var(--text-secondary)' }} className="max-w-lg mx-auto text-base">We built FixOnRoad to solve every pain-point local mechanics face daily.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { icon: <MapPin className="w-7 h-7 text-emerald-400" />, title: 'No Wasted Trips', desc: 'Get accurate GPS pins. You only travel when you accept a job near you. See distance and ETA before accepting.' },
              { icon: <Banknote className="w-7 h-7 text-teal-400" />, title: 'Fixed Pricing, No Haggling', desc: 'Customers accept the price before booking. No bargaining at the roadside. Your rate = your earnings.' },
              { icon: <ShieldCheck className="w-7 h-7 text-cyan-400" />, title: 'Instant Secure Payouts', desc: 'Instant daily settlements directly via UPI (PhonePe, Google Pay, Paytm) or direct bank transfer. Zero hold time.' },
              { icon: <Zap className="w-7 h-7 text-yellow-400" />, title: 'Zero Commission (Launch)', desc: 'Keep 100% of every rupee during our launch phase. No hidden fees. No platform deductions.' },
              { icon: <Users className="w-7 h-7 text-purple-400" />, title: 'Build Your Reputation', desc: 'Every 5-star review builds your profile. Top mechanics get priority in job dispatch.' },
              { icon: <TrendingUp className="w-7 h-7 text-blue-400" />, title: 'Grow Your Business', desc: 'Track your earnings, completion rate, and customer feedback in a simple dashboard.' }
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass-panel card-hover p-7 rounded-2xl group"
              >
                <div className="p-3 rounded-xl inline-flex mb-4 group-hover:scale-110 transition-transform" style={{ background: 'var(--bg-card)' }}>
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] mb-2">{feat.title}</h3>
                <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="relative z-10 py-16 sm:py-20 px-5 md:px-10">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-['Outfit'] mb-4">Start in <span className="text-gradient-emerald">3 Steps</span></h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Sign Up Free', desc: 'Register with your phone number. Choose your focus: Two-Wheeler Specialist, Car & EV Specialist, or Multi-Vehicle Technician. Upload Aadhaar/PAN for verification. Takes 2 minutes.' },
              { step: '02', title: 'Go Online', desc: 'Toggle your status to "Online" when ready. You\'ll receive jobs within your radius.' },
              { step: '03', title: 'Fix & Earn', desc: 'Accept a job, ride to the pin, fix the vehicle (bike or car), get paid. It\'s that simple.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="text-6xl font-bold font-['Outfit'] mb-4" style={{ color: 'var(--border-primary)' }}>{item.step}</div>
                <h3 className="text-xl font-bold font-['Outfit'] mb-2 -mt-8">{item.title}</h3>
                <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-16 sm:py-20 px-5 md:px-10" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-primary)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Outfit'] mb-12">What <span className="text-gradient-emerald">Mechanics Say</span></h2>

          <div className="relative h-48">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: activeTestimonial === i ? 1 : 0,
                  y: activeTestimonial === i ? 0 : 20,
                }}
                transition={{ duration: 0.5 }}
                className={`w-full ${activeTestimonial === i ? 'relative' : 'absolute inset-0 pointer-events-none'}`}
              >
                <div className="flex justify-center gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-lg sm:text-xl md:text-2xl font-medium italic mb-4" style={{ color: 'var(--text-secondary)' }}>"{t.text}"</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>— {t.name}, <span className="text-emerald-400">{t.area}</span></p>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`h-2 rounded-full transition-all duration-300 ${activeTestimonial === i ? 'bg-emerald-400 w-6' : 'w-2'}`}
                style={activeTestimonial !== i ? { background: 'var(--border-primary)' } : undefined}
                aria-label={`Show testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-16 sm:py-20 px-5 md:px-10" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)' }}>
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-['Outfit'] mb-4">Frequently Asked <span className="text-gradient-emerald">Questions</span></h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-2xl overflow-hidden transition-all"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 hover:bg-white/5 transition-colors"
                >
                  <span className="font-bold text-[15px]">{faq.q}</span>
                  {openFaq === idx ? <Minus className="w-5 h-5 text-emerald-400 shrink-0" /> : <Plus className="w-5 h-5 text-gray-400 shrink-0" />}
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6"
                    >
                      <p className="pb-5 text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 sm:py-24 px-5 md:px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-['Outfit'] mb-6">
            Ready to <span className="text-gradient-emerald">Earn More?</span>
          </h2>
          <p className="text-base sm:text-lg mb-10 max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Join 500+ mechanics already earning with FixOnRoad. Registration is free and takes 2 minutes.
          </p>
          <Link to="/auth" className="inline-flex items-center gap-2 btn-emerald px-10 py-5 text-lg group">
            Join as Partner — It's Free
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </section>

      <Footer variant="mechanic" />
    </div>
  );
}
