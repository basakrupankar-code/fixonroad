import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('customer' | 'mechanic')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  const effectiveRole = user?.role || 'customer';
  const isUnauthorizedRole = !!(user && allowedRoles && !allowedRoles.includes(effectiveRole as any));

  useEffect(() => {
    if (!isLoading && isUnauthorizedRole && effectiveRole === 'mechanic') {
      toast.error('Cart and roadside dispatch are only accessible to customer accounts.', {
        id: 'mechanic-cart-denied'
      });
    }
  }, [isLoading, isUnauthorizedRole, effectiveRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  const returnUrl = location.pathname + location.search;

  if (!user) {
    // If the route only allows mechanics, redirect directly to partner auth
    if (allowedRoles && allowedRoles.includes('mechanic') && !allowedRoles.includes('customer')) {
      return <Navigate to={`/partner/auth?redirect=${encodeURIComponent(returnUrl)}`} state={{ from: location }} replace />;
    }
    return <Navigate to={`/signin?redirect=${encodeURIComponent(returnUrl)}`} state={{ from: location }} replace />;
  }

  if (isUnauthorizedRole) {
    if (effectiveRole === 'mechanic') {
      return <Navigate to="/mechanic/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

