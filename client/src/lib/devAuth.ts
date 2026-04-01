import type { UserRole } from '@/types/auth';
import type { AuthResponse } from '@/types/auth';

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  lideranca: 'Liderança',
  aquisicao: 'Aquisição',
  coordenador: 'Coordenadora',
  account: 'Account',
  designer: 'Designer',
  gestor_trafego: 'Gestor de Tráfego',
  tech_crm: 'Tech CRM',
};

// Dev secret must match server/src/config/jwt.ts default
const DEV_SECRET = 'dev-secret-change-in-production';

function base64url(data: string): string {
  return btoa(data).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function signJwt(payload: Record<string, unknown>): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const data = `${header}.${body}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(DEV_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${sig}`;
}

export async function createDevAuth(role: UserRole): Promise<AuthResponse> {
  const userId = `dev-${role}-${Date.now()}`;
  const now = Math.floor(Date.now() / 1000);

  const accessToken = await signJwt({
    userId,
    email: `dev-${role}@sici.local`,
    role,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days
  });

  const refreshToken = await signJwt({
    userId,
    type: 'refresh',
    iat: now,
    exp: now + 30 * 24 * 60 * 60, // 30 days
  });

  return {
    user: {
      id: userId,
      name: ROLE_LABELS[role],
      email: `dev-${role}@sici.local`,
      role,
      created_at: new Date().toISOString(),
    },
    accessToken,
    refreshToken,
  };
}
