import { ReactNode } from 'react';
import ProtectedRoute from './ProtectedRoute';

interface CustomerRouteProps {
  children: ReactNode;
}

/**
 * Route guard wrapper that restricts access strictly to authenticated
 * customer perspective users. Unauthenticated visitors are redirected
 * to /signin with the return URL preserved. Authenticated mechanics are
 * redirected to their mechanic dashboard with an informative notification.
 */
export default function CustomerRoute({ children }: CustomerRouteProps) {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      {children}
    </ProtectedRoute>
  );
}
