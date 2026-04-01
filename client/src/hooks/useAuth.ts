import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import type { AuthResponse, UserRole } from '@/types/auth';

export function useAuth() {
  const { user, token, isLoading, login, logout: clearAuth, setLoading } = useAuthStore();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      setLoading(true);
      try {
        const { data } = await api.post<AuthResponse>('/auth/login', credentials);
        return data;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (data: AuthResponse) => {
      login(data);
      navigate('/dashboard', { replace: true });
    },
    onError: () => {
      setLoading(false);
    },
  });

  const logout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isLideranca = user?.role === 'lideranca';
  const isAquisicao = user?.role === 'aquisicao';
  const isCoordenador = user?.role === 'coordenador';
  const isAccount = user?.role === 'account';
  const isDesigner = user?.role === 'designer';
  const isGestorTrafego = user?.role === 'gestor_trafego';
  const isTechCrm = user?.role === 'tech_crm';

  return {
    user,
    token,
    isLoading: isLoading || loginMutation.isPending,
    isAuthenticated: !!user && !!token,
    role: user?.role,
    isSuperAdmin,
    isLideranca,
    isAquisicao,
    isCoordenador,
    isAccount,
    isDesigner,
    isGestorTrafego,
    isTechCrm,
    hasRole,
    loginMutation,
    login,
    logout,
  };
}
