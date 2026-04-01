export type UserRole = 'super_admin' | 'lideranca' | 'aquisicao' | 'coordenador' | 'account' | 'designer' | 'gestor_trafego' | 'tech_crm';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  must_reset_password?: boolean;
  modules?: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
