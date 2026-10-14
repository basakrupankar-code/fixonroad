import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('customer' | 'mechanic')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    // If the route only allows mechanics, redirect directly to partner auth
    if (allowedRoles && allowedRoles.includes('mechanic') && !allowedRoles.includes('customer')) {
      return <Navigate to={`/partner/auth?redirect=${encodeURIComponent(location.pathname)}`} state={{ from: location }} replace />;
    }
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} state={{ from: location }} replace />;
  }

  const effectiveRole = user.role || 'customer';
  if (allowedRoles && !allowedRoles.includes(effectiveRole as any)) {
    // role not authorized so redirect
    if (effectiveRole === 'mechanic') {
      return <Navigate to="/mechanic-dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
