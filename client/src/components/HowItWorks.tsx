import { motion } from 'framer-motion';
import { MapPin, Wrench, Smartphone, Banknote, ArrowRight } from 'lucide-react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { t } = useTranslation();

  const steps = [
    {
      icon: <MapPin className="w-8 h-8 text-orange-400" />,
      title: t('home.howItWorks.step1.title', 'Pin Your Location'),
      description: t('home.howItWorks.step1.desc', 'Instant auto-detection or manual landmark selection in Kalyani / West Bengal.'),
    },
    {
      icon: <Wrench className="w-8 h-8 text-amber-400" />,
      title: t('home.howItWorks.step2.title', 'Select Issue & Get Price'),
      description: t('home.howItWorks.step2.desc', 'Choose flat tire, jump start, chain, or towing. Transparent upfront pricing with no hidden charges.'),
    },
    {
      icon: <Smartphone className="w-8 h-8 text-emerald-400" />,
      title: t('home.howItWorks.step3.title', 'Mechanic Dispatched'),
      description: t('home.howItWorks.step3.desc', 'Live GPS tracking as your verified technician arrives in minutes with the right tools.'),
    },
    {
      icon: <Banknote className="w-8 h-8 text-blue-400" />,
      title: t('home.howItWorks.step4.title', 'Pay Digitally or Cash'),
      description: t('home.howItWorks.step4.desc', 'Inspect the fix and pay seamlessly via UPI (GPay/PhonePe/Paytm) or cash.'),
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-24 py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            {t('home.howItWorks.badge', 'How It Works')}
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-4">
            {t('home.howItWorks.heading1', 'Roadside Help in')} <span className="text-amber-400 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">{t('home.howItWorks.heading2', '4 Simple Steps')}</span>
          </h2>
        </div>

        <div ref={ref} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: idx * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative glass-panel p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center group hover:border-orange-500/30 transition-colors"
            >
              {/* Connection Line (except last item) */}
              {idx !== steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 -right-6 text-gray-600 group-hover:text-orange-500/50 transition-colors">
                  <ArrowRight className="w-6 h-6" />
                </div>
              )}
              
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-orange-500 text-white font-black flex items-center justify-center border-4 border-[var(--bg-primary)]">
                {idx + 1}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
