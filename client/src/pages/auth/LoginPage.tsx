import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, Mail, Lock } from 'lucide-react';
import { GradientButton } from '@/components/shared/GradientButton';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import type { AuthResponse } from '@/types/auth';
import { cn } from '@/lib/utils';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      login(data);
      if (data.user.must_reset_password) {
        navigate('/reset-password', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
      const status = axiosErr?.response?.status;
      const serverMsg = axiosErr?.response?.data?.error;
      const message =
        serverMsg ||
        (status === 401 ? 'E-mail ou senha incorretos.' :
         status === 503 ? 'Serviço temporariamente indisponível. Tente novamente em breve.' :
         'Erro ao conectar. Verifique sua conexão.');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-bg-deep">
      {/* Animated background orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(26,86,219,0.6) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(224,64,251,0.5) 0%, transparent 70%)',
          animationDelay: '1.5s',
        }}
      />
      <div
        className="absolute top-3/4 left-1/3 w-64 h-64 rounded-full opacity-10 blur-3xl animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.5) 0%, transparent 70%)',
          animationDelay: '0.8s',
        }}
      />

      {/* Star dots */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-white opacity-30"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="glass-card-strong p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-galaxy mb-4 animate-glow-pulse shadow-glow-blue"
            >
              <Zap size={28} className="text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-3xl font-bold gradient-text mb-1"
            >
              AI SICI
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-text-secondary text-sm"
            >
              Sistema de Inteligência de Cliente Integrado
            </motion.p>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className={cn(
                    'w-full h-11 pl-10 pr-4 rounded-xl text-sm text-text-primary placeholder-text-muted',
                    'bg-white/5 border border-glass-border',
                    'focus:outline-none focus:border-galaxy-blue focus:bg-galaxy-blue/5 focus:shadow-glow-blue-sm',
                    'transition-all duration-200'
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className={cn(
                    'w-full h-11 pl-10 pr-11 rounded-xl text-sm text-text-primary placeholder-text-muted',
                    'bg-white/5 border border-glass-border',
                    'focus:outline-none focus:border-galaxy-blue focus:bg-galaxy-blue/5 focus:shadow-glow-blue-sm',
                    'transition-all duration-200'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-secondary transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error message */}
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

            {/* Submit button */}
            <GradientButton
              type="submit"
              isLoading={isLoading}
              size="lg"
              className="w-full mt-2"
            >
              {isLoading ? 'Entrando...' : 'Entrar na plataforma'}
            </GradientButton>
          </motion.form>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-6 text-center text-xs text-text-muted"
          >
            Agência Inteligente &copy; {new Date().getFullYear()}
          </motion.p>
        </div>

        {/* Decorative bottom border gradient */}
        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-blue-pink opacity-30 rounded-full" />
      </motion.div>
    </div>
  );
}
