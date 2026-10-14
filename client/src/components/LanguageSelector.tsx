import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../locales/translations';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'navbar' | 'drawer';
}

export default function LanguageSelector({ className = '', variant = 'navbar' }: LanguageSelectorProps) {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Display label for current selection
  const currentBadgeLabel = 
    language === 'bn' ? 'বাংলা' :
    language === 'hi' ? 'हिन्दी' :
    'EN';

  if (variant === 'drawer') {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          <Globe className="w-3.5 h-3.5 text-orange-400" />
          <span>Select Language</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {languages.map((item) => {
            const isActive = language === item.code;
            return (
              <button
                key={item.code}
                onClick={() => setLanguage(item.code as Language)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-orange-500/15 border-orange-500/40 text-orange-400 shadow-sm shadow-orange-500/10'
                    : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <span>{item.nativeLabel}</span>
                {isActive && <Check className="w-3 h-3 text-orange-400" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm group"
        aria-label="Select Language"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-orange-400 group-hover:rotate-45 transition-transform duration-300" />
        <span className="font-medium tracking-wide">{currentBadgeLabel}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-44 py-2 rounded-2xl bg-[#121824] border border-slate-800 shadow-2xl shadow-black/80 z-50 backdrop-blur-xl"
          >
            <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-800/80 mb-1">
              Select Language
            </div>

            {languages.map((item) => {
              const isActive = language === item.code;
              return (
                <button
                  key={item.code}
                  onClick={() => {
                    setLanguage(item.code as Language);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between hover:bg-white/[0.06] transition-colors ${
                    isActive ? 'text-orange-400 font-bold bg-orange-500/10' : 'text-slate-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-xs">{item.nativeLabel}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{item.label}</span>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-orange-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
