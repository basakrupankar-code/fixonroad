import { useEffect, useState, ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { safeFetch } from '../lib/api';
import { Loader2, AlertTriangle, ArrowRight, ShieldAlert, Package, Wrench } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

interface OrderTrackGuardProps {
  children: ReactNode | ((props: { order: any }) => ReactNode);
}

export function OrderTrackGuard({ children }: OrderTrackGuardProps) {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any | null>(null);
  const [checking, setChecking] = useState<boolean>(true);
  const [guardError, setGuardError] = useState<{
    type: 'not_found' | 'unauthorized' | 'inactive';
    message: string;
    status?: string;
  } | null>(null);

  useEffect(() => {
    // 1. Wait for initial session authentication check
    if (authLoading) return;

    // 2. Unauthenticated user: redirect immediately to login with return redirect
    if (!user) {
      const returnUrl = `/track/${orderId ? encodeURIComponent(orderId) : ''}`;
      navigate(`/auth?redirect=${encodeURIComponent(returnUrl)}`, { replace: true });
      return;
    }

    if (!orderId) {
      setGuardError({
        type: 'not_found',
        message: 'No order identifier provided in the URL.'
      });
      setChecking(false);
      return;
    }

    let isMounted = true;

    // 3. Verify order existence, customer ownership, and active confirmation status
    const verifyOrder = async () => {
      setChecking(true);
      setGuardError(null);

      try {
        const token = localStorage.getItem('token') || (user as any)?.token;
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Check via dedicated tracking endpoint
        const data = await safeFetch(`/api/orders/track/${orderId}`, { headers });
        
        if (!isMounted) return;

        // Check confirmed / trackable status
        const statusUpper = (data.status || '').toUpperCase();
        const INACTIVE_STATUSES = ['FAILED', 'CANCELLED', 'EXPIRED'];
        if (INACTIVE_STATUSES.includes(statusUpper)) {
          setGuardError({
            type: 'inactive',
            message: `This order is currently marked as ${data.status.toLowerCase()} and does not have an active live dispatch.`,
            status: data.status
          });
          return;
        }

        setOrder(data);
      } catch (err: any) {
        if (!isMounted) return;
        const msg = err.message || '';
        
        if (msg.includes('401') || msg.toLowerCase().includes('unauthorized. please log in')) {
          navigate(`/auth?redirect=${encodeURIComponent(`/track/${orderId}`)}`, { replace: true });
          return;
        }

        if (msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('do not have permission')) {
          setGuardError({
            type: 'unauthorized',
            message: 'You are not authorized to view this live dispatch. Only the customer who created this booking or an assigned mechanic can track it.'
          });
        } else if (msg.toLowerCase().includes('inactive') || msg.toLowerCase().includes('cancelled') || msg.toLowerCase().includes('expired')) {
          setGuardError({
            type: 'inactive',
            message: msg || 'This order does not have an active live mechanic dispatch.'
          });
        } else {
          setGuardError({
            type: 'not_found',
            message: 'No active order matching this tracking code or order ID was found in the dispatch system.'
          });
        }
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    };

    verifyOrder();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, orderId, navigate]);

  // Loading state
  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center px-4 font-['Outfit',sans-serif]">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 animate-ping absolute" />
          <div className="w-16 h-16 rounded-2xl bg-[#121824] border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-xl shadow-orange-500/10 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-white tracking-wide mb-1">Verifying order dispatch...</h3>
        <p className="text-xs text-slate-400">Checking telemetry permissions and active road status</p>
      </div>
    );
  }

  // Error / Unauthorized / Inactive Order Clean Placeholder
  if (guardError) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col justify-between font-['Outfit',sans-serif] relative overflow-hidden">
        {/* Glow ambient effects */}
        <div className="glow-orb w-[450px] h-[450px] -top-[10%] -left-[10%] bg-orange-600/10 pointer-events-none" />
        <div className="glow-orb w-[400px] h-[400px] bottom-[10%] -right-[10%] bg-red-600/8 pointer-events-none" />
        <div className="dot-grid" />

        <Navbar variant="rider" />

        <main className="flex-1 flex items-center justify-center px-4 py-28 relative z-10">
          <div className="max-w-lg w-full bg-[#121824]/95 border border-slate-800 rounded-3xl p-8 sm:p-10 text-center shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className={`absolute top-0 left-0 w-full h-1.5 ${
              guardError.type === 'unauthorized' 
                ? 'bg-gradient-to-r from-red-500 via-amber-500 to-red-500' 
                : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500'
            }`} />

            {/* Icon badge */}
            <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6 text-orange-400 shadow-inner">
              {guardError.type === 'unauthorized' ? (
                <ShieldAlert className="w-10 h-10 text-red-400" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-orange-400" />
              )}
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-black text-white mb-2">
              {guardError.type === 'unauthorized'
                ? 'Unauthorized Order Access'
                : guardError.type === 'inactive'
                ? 'Dispatch Session Ended'
                : 'No Active Order Found'}
            </h2>

            {/* Error Message */}
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {guardError.message}
            </p>

            {/* Tracking Code Chip (if available) */}
            {orderId && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B0F17] border border-slate-800 text-xs font-mono text-slate-300 mb-8">
                <span className="text-slate-500">Code:</span>
                <span className="font-bold text-orange-400">{orderId.toUpperCase()}</span>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-center">
              <Link
                to="/services"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Wrench className="w-4 h-4" />
                <span>Request Emergency Help</span>
              </Link>

              <Link
                to="/orders"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all cursor-pointer"
              >
                <Package className="w-4 h-4 text-slate-400" />
                <span>View All Bookings</span>
              </Link>
            </div>
          </div>
        </main>

        <Footer variant="rider" />
      </div>
    );
  }

  // Render children with verified order telemetry
  return <>{typeof children === 'function' ? children({ order }) : children}</>;
}

export default OrderTrackGuard;
