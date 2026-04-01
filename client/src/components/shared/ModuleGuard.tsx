import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ModuleGuardProps {
  module: string;
  children: React.ReactNode;
}

export function ModuleGuard({ module, children }: ModuleGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // super_admin bypasses module checks
  if (user.role === 'super_admin') {
    return <>{children}</>;
  }

  if (!user.modules?.includes(module)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
