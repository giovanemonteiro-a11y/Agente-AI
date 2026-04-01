import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { GlassInput } from '@/components/shared/GlassInput';
import { PageHeader } from '@/components/shared/PageHeader';
import { useCreateClient } from '@/hooks/useClient';
import { cn } from '@/lib/utils';
import type { ServiceScope, DesignerScope } from '@/types/client';

// ── constants ──────────────────────────────────────────────────────────────

const SERVICE_OPTIONS: { value: ServiceScope; label: string }[] = [
  { value: 'social_media', label: 'Social Media' },
  { value: 'trafego', label: 'Tráfego' },
  { value: 'site_lp', label: 'Site / LP' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'branding', label: 'Branding' },
  { value: 'miv', label: 'MIV' },
];

const DESIGNER_OPTIONS: { value: DesignerScope; label: string }[] = [
  { value: 'social_media', label: 'Social Media' },
  { value: 'campanha', label: 'Campanha' },
  { value: 'landing_page', label: 'Landing Page' },
  { value: 'site', label: 'Site' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'branding', label: 'Branding' },
  { value: 'miv', label: 'MIV' },
];

// ── small helpers ──────────────────────────────────────────────────────────

function CheckboxGroup<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  const toggle = (v: T) => {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value, label }) => {
        const active = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => toggle(value)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full transition-all duration-150 font-medium border',
              active
                ? 'bg-galaxy-blue/20 text-galaxy-blue-light border-galaxy-blue/50'
                : 'bg-white/[0.04] text-text-secondary border-white/10 hover:bg-white/[0.08] hover:border-white/20'
            )}
          >
            {active && '✓ '}
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────

export function ClientCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateClient();

  const [name, setName] = useState('');
  const [segment, setSegment] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [servicesScope, setServicesScope] = useState<ServiceScope[]>([]);
  const [designerScope, setDesignerScope] = useState<DesignerScope[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('O nome do cliente é obrigatório.');
      return;
    }

    try {
      const client = await createMutation.mutateAsync({
        name: name.trim(),
        segment: segment || undefined,
        services_scope: servicesScope,
        designer_scope: designerScope,
        contact_name: contactName || undefined,
        contact_email: contactEmail || undefined,
        contact_phone: contactPhone || undefined,
        start_date: startDate || undefined,
      });
      navigate(`/clients/${client.id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string; message?: string } }; message?: string };
      const status = axiosErr?.response?.status;
      const serverMsg = axiosErr?.response?.data?.message ?? axiosErr?.response?.data?.error;
      const msg =
        (status === 500 || status === 503) ? 'Banco de dados indisponível. Verifique se o PostgreSQL está rodando.' :
        serverMsg ??
        (axiosErr?.message === 'Network Error' ? 'Servidor indisponível. Verifique se o backend está rodando.' :
         (err as Error)?.message ?? 'Erro ao criar cliente.');
      setFormError(msg);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10 hover:text-text-primary transition-all duration-150"
        >
          <ArrowLeft size={18} />
        </button>
        <PageHeader
          title="Novo Cliente"
          subtitle="Preencha os dados para cadastrar um novo cliente"
        />
      </div>

      {/* Form card */}
      <GlassCard padding="none">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error banner */}
          {formError && (
            <div className="rounded-xl px-4 py-3 text-sm bg-red-500/10 border border-red-500/30 text-red-400">
              {formError}
            </div>
          )}

          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <GlassInput
                label="Nome *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do cliente"
                required
              />
            </div>
            <GlassInput
              label="Segmento"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              placeholder="Ex: Saúde, Moda, Tech..."
            />
            <GlassInput
              label="Data de início"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Contato</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <GlassInput
                  label="Nome do contato"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Nome do responsável"
                />
              </div>
              <GlassInput
                label="E-mail do contato"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
              <GlassInput
                label="Telefone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(11) 9 0000-0000"
              />
            </div>
          </div>

          {/* Services scope */}
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Escopo de serviços</p>
            <CheckboxGroup options={SERVICE_OPTIONS} selected={servicesScope} onChange={setServicesScope} />
          </div>

          {/* Designer scope */}
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Escopo do designer</p>
            <CheckboxGroup options={DESIGNER_OPTIONS} selected={designerScope} onChange={setDesignerScope} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-glass-border">
            <GradientButton type="submit" isLoading={createMutation.isPending} leftIcon={<UserPlus size={16} />}>
              Criar Cliente
            </GradientButton>
            <GradientButton type="button" variant="ghost" onClick={() => navigate('/clients')} disabled={createMutation.isPending}>
              Cancelar
            </GradientButton>
          </div>
        </form>
      </GlassCard>
    </motion.div>
  );
}
