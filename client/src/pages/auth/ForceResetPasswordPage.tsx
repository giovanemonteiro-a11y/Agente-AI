import { useState, useMemo, FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Check, X } from 'lucide-react';
import { GradientButton } from '@/components/shared/GradientButton';
import { GlassInput } from '@/components/shared/GlassInput';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

const PASSWORD_RULES = [
  { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Letra minúscula', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Número', test: (p: string) => /\d/.test(p) },
  { label: 'Símbolo (!@#$%...)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function ForceResetPasswordPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  // If user is not logged in or doesn't need to reset, redirect
  if (!user) return <Navigate to="/login" replace />;
  if (!user.must_reset_password) return <Navigate to="/dashboard" replace />;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, pass: r.test(newPassword) })),
    [newPassword]
  );
  const allRulesPass = ruleResults.every((r) => r.pass);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!allRulesPass) {
      setError('A senha não atende todos os requisitos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      await api.patch('/auth/reset-password', { newPassword });
      updateUser({ must_reset_password: false });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      setError(
        axiosErr?.response?.data?.error ??
        axiosErr?.response?.data?.message ??
        'Erro ao redefinir senha.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-bg-deep">
      {/* Background orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl animate-float"
        style={{ background: 'radial-gradient(circle, rgba(26,86,219,0.6) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl animate-float"
        style={{ background: 'radial-gradient(circle, rgba(224,64,251,0.5) 0%, transparent 70%)', animationDelay: '1.5s' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="glass-card-strong p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-galaxy mb-4 shadow-glow-blue">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text mb-1">Redefinir Senha</h1>
            <p className="text-text-secondary text-sm">
              Olá, <span className="text-text-primary font-medium">{user?.name}</span>. Crie uma nova senha para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              label="Nova Senha"
              type="password"
              icon={<Lock size={16} />}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Crie uma senha segura"
              required
              minLength={8}
            />

            {/* Password strength indicators */}
            {newPassword.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-1">
                {ruleResults.map((r) => (
                  <div key={r.label} className="flex items-center gap-1.5 text-xs">
                    {r.pass ? (
                      <Check size={12} className="text-emerald-400 flex-shrink-0" />
                    ) : (
                      <X size={12} className="text-red-400/60 flex-shrink-0" />
                    )}
                    <span className={r.pass ? 'text-emerald-400' : 'text-text-muted'}>
                      {r.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <GlassInput
              label="Confirmar Senha"
              type="password"
              icon={<Lock size={16} />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              required
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
              >
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-400" />
                {error}
              </motion.div>
            )}

            <GradientButton
              type="submit"
              isLoading={isLoading}
              size="lg"
              className="w-full mt-2"
              disabled={!allRulesPass || !confirmPassword || newPassword !== confirmPassword}
            >
              {isLoading ? 'Salvando...' : 'Definir Nova Senha'}
            </GradientButton>
          </form>

          <p className="mt-6 text-center text-xs text-text-muted">
            V4 Company · AI SICI
          </p>
        </div>
      </motion.div>
    </div>
  );
}
