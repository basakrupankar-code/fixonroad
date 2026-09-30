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
              <Wrench className={`w-6 h-6 ${isMechanic ? 'text-emerald-400' : 'text-orange-400'}`} />
              <span className="text-xl font-bold font-['Outfit']">
                FixOnRoad<span className={isMechanic ? 'text-emerald-400' : 'text-orange-400'}>.</span>
              </span>
            </div>
            <p className="text-[15px] leading-relaxed max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              On-demand roadside assistance for two-wheelers and four-wheelers. Fixed prices, live tracking, and verified mechanics in Kalyani, West Bengal.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" className="p-2.5 rounded-xl transition-all duration-300 hover:scale-110" style={{ background: 'var(--bg-card)' }}>
                <Globe className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </a>
              <a href="#" className="p-2.5 rounded-xl transition-all duration-300 hover:scale-110" style={{ background: 'var(--bg-card)' }}>
                <Mail className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
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
            © 2026 FixOnRoad. Made with <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" /> in West Bengal.
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
