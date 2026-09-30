import { Link } from 'react-router-dom';
import { Wrench, Globe, Mail, Heart } from 'lucide-react';

export default function Footer({ variant = 'rider' }: { variant?: 'rider' | 'mechanic' }) {
  const isMechanic = variant === 'mechanic';

  return (
    <footer className="relative z-10" style={{ borderTop: '1px solid var(--border-primary)' }}>
      <div className="max-w-7xl mx-auto px-5 md:px-10 py-12">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-6 h-6 text-orange-400" />
              <span className="text-xl font-bold font-['Outfit']">
                FixOnRoad<span className="text-orange-400">.</span>
              </span>
            </div>
            <p className="text-[15px] leading-relaxed max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              On-demand roadside assistance for two-wheelers and four-wheelers. Fixed prices, live tracking, and verified mechanics in Kalyani, West Bengal.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" aria-label="Twitter" className="p-2.5 rounded-xl transition-all duration-300 hover:scale-110 hover:text-[var(--text-primary)]" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="p-2.5 rounded-xl transition-all duration-300 hover:scale-110 hover:text-[var(--text-primary)]" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="p-2.5 rounded-xl transition-all duration-300 hover:scale-110 hover:text-[var(--text-primary)]" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold font-['Outfit'] mb-4 text-[15px]">Quick Links</h4>
            <div className="flex flex-col gap-3 text-[15px]" style={{ color: 'var(--text-secondary)' }}>
              <Link to="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
              <Link to="/services" className="hover:text-[var(--text-primary)] transition-colors">Services</Link>
              <Link to="/mechanic" className="hover:text-[var(--text-primary)] transition-colors">For Mechanics</Link>
              <Link to="/auth" className="hover:text-[var(--text-primary)] transition-colors">Sign In</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold font-['Outfit'] mb-4 text-[15px]">Contact</h4>
            <div className="flex flex-col gap-3 text-[15px]" style={{ color: 'var(--text-secondary)' }}>
              <span>Kalyani, Nadia</span>
              <span>West Bengal, India</span>
              <span>support@fixonroad.in</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px]"
          style={{ borderTop: '1px solid var(--border-primary)', color: 'var(--text-muted)' }}
        >
          <p className="flex items-center gap-1">
            © 2026 FixOnRoad. Made with ❤️ in West Bengal.
          </p>
          <div className="flex gap-6">
            <Link to={isMechanic ? '/' : '/mechanic'} className={`transition-colors ${isMechanic ? 'text-blue-400 hover:text-blue-300' : 'text-emerald-400 hover:text-emerald-300'}`}>
              {isMechanic ? '← Switch to Rider View' : 'Switch to Mechanic Portal →'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
