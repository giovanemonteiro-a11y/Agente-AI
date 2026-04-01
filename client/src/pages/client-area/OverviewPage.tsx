import { useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, Calendar, ExternalLink, Briefcase, FileText,
  Video, Shield, Building2, Clock, Link2,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useClientById } from '@/hooks/useClient';
import { cn } from '@/lib/utils';
import type { Client, ServiceScope, DesignerScope } from '@/types/client';

const SERVICE_LABELS: Record<ServiceScope, string> = {
  social_media: 'Social Media', trafego: 'Tráfego', site_lp: 'Site/LP',
  ecommerce: 'E-commerce', branding: 'Branding', miv: 'MIV',
};

const DESIGNER_LABELS: Record<DesignerScope, string> = {
  social_media: 'Social Media', campanha: 'Campanha', landing_page: 'Landing Page',
  site: 'Site', ecommerce: 'E-commerce', branding: 'Branding', miv: 'MIV',
};

// Mock SPICED data per client (in production comes from API)
const MOCK_SPICED: Record<string, {
  executiveSummary: string; situation: string; pain: string;
  impact: string; criticalEvent: string; decision: string; contractedScope: string;
}> = {};

function computeLT(startDate: string | null): string {
  if (!startDate) return '—';
  const days = Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} meses`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}a ${rem}m` : `${years} anos`;
}

export function OverviewPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const location = useLocation();
  const stateClient = (location.state as { client?: Client } | null)?.client;
  const { data: apiClient, isLoading } = useClientById(clientId);

  // Cache mock client for sidebar navigation persistence
  if (stateClient && clientId) {
    try { sessionStorage.setItem(`mock-client-${clientId}`, JSON.stringify(stateClient)); } catch { /* ignore */ }
  }
  let cachedClient: Client | undefined;
  if (!apiClient && !stateClient && clientId) {
    try {
      const cached = sessionStorage.getItem(`mock-client-${clientId}`);
      if (cached) cachedClient = JSON.parse(cached);
    } catch { /* ignore */ }
  }

  const client = apiClient ?? stateClient ?? cachedClient;

  if (isLoading && !stateClient) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded shimmer" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl shimmer" />)}
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Visão Geral</h1>
          <p className="text-sm text-text-secondary mt-0.5">Dados do cliente serão carregados quando o cadastro for completo.</p>
        </div>
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 size={32} className="text-text-muted mb-3 opacity-40" />
          <p className="text-sm text-text-muted">Informações do cliente não disponíveis no momento.</p>
        </GlassCard>
      </div>
    );
  }

  const spiced = MOCK_SPICED[client.id];
  const startFormatted = client.start_date
    ? new Date(client.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Visão Geral</h1>
        <p className="text-sm text-text-secondary mt-0.5">Informações do cliente e resumo do projeto</p>
      </div>

      {/* Contact Info */}
      <GlassCard padding="none">
        <div className="p-5">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <User size={14} /> Informações de Contato
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoField icon={<User size={14} />} label="Stakeholder" value={client.stakeholder_name ?? client.contact_name} />
            <InfoField icon={<Mail size={14} />} label="E-mail" value={client.contact_email} />
            <InfoField icon={<Phone size={14} />} label="Telefone" value={client.contact_phone} />
            <InfoField icon={<Building2 size={14} />} label="Razão Social" value={client.razao_social} />
            <InfoField icon={<Shield size={14} />} label="CNPJ" value={client.cnpj} />
            <InfoField icon={<Calendar size={14} />} label="Início do Projeto" value={startFormatted} />
            <InfoField icon={<Clock size={14} />} label="Lifetime (LT)" value={computeLT(client.start_date)} highlight />
          </div>
        </div>
      </GlassCard>

      {/* Scopes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard padding="none">
          <div className="p-5">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
              <Briefcase size={14} /> Escopo de Serviços
            </h3>
            <ScopeChips items={client.services_scope} labels={SERVICE_LABELS} />
          </div>
        </GlassCard>
        <GlassCard padding="none">
          <div className="p-5">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
              <Briefcase size={14} /> Escopo do Designer
            </h3>
            <ScopeChips items={client.designer_scope} labels={DESIGNER_LABELS} />
          </div>
        </GlassCard>
      </div>

      {/* Attachments: Contract + Recording */}
      <GlassCard padding="none">
        <div className="p-5">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <Link2 size={14} /> Documentos e Links
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {client.drive_folder_url && client.drive_folder_url !== '#' && (
              <AttachmentLink icon={<ExternalLink size={14} />} label="Pasta no Google Drive" href={client.drive_folder_url} color="text-galaxy-blue-light" bg="bg-galaxy-blue/10 border-galaxy-blue/20" />
            )}
            <AttachmentLink icon={<FileText size={14} />} label="Contrato" href="#" color="text-galaxy-pink-light" bg="bg-galaxy-pink/10 border-galaxy-pink/20" placeholder />
            <AttachmentLink icon={<Video size={14} />} label="Gravação de Venda" href="#" color="text-emerald-400" bg="bg-emerald-500/10 border-emerald-500/20" placeholder />
          </div>
        </div>
      </GlassCard>

      {/* SPICED Report */}
      <GlassCard padding="none">
        <div className="p-5">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <FileText size={14} /> Relatório SPICED
          </h3>
          {spiced ? (
            <div className="space-y-4">
              <SpicedSection title="Resumo Executivo" content={spiced.executiveSummary} highlight />
              <SpicedSection title="S — Situação" content={spiced.situation} letter="S" color="text-amber-400" />
              <SpicedSection title="P — Dor (Pain)" content={spiced.pain} letter="P" color="text-red-400" />
              <SpicedSection title="I — Impacto" content={spiced.impact} letter="I" color="text-emerald-400" />
              <SpicedSection title="C — Evento Crítico" content={spiced.criticalEvent} letter="C" color="text-galaxy-blue-light" />
              <SpicedSection title="E/D — Decisão" content={spiced.decision} letter="D" color="text-galaxy-purple" />
              <SpicedSection title="Escopo Contratado" content={spiced.contractedScope} highlight />
            </div>
          ) : (
            <div className="rounded-xl bg-white/[0.02] border border-glass-border p-8 text-center">
              <FileText size={28} className="mx-auto text-text-muted mb-3 opacity-40" />
              <p className="text-sm text-text-muted">Relatório SPICED será gerado a partir do Handoff</p>
              <p className="text-2xs text-text-muted mt-1">Quando o handoff deste cliente for processado, o SPICED aparecerá aqui automaticamente.</p>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ── Shared Components ───────────────────────────────────────────────────────

function InfoField({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value?: string | null; highlight?: boolean }) {
  return (
    <div className={cn('rounded-xl border p-3', highlight ? 'bg-galaxy-blue/[0.05] border-galaxy-blue/20' : 'bg-white/[0.02] border-glass-border')}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-text-muted">{icon}</span>
        <span className="text-2xs text-text-muted uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className={cn('text-sm font-medium', highlight ? 'text-galaxy-blue-light' : 'text-text-primary')}>
        {value ?? '—'}
      </p>
    </div>
  );
}

function ScopeChips({ items, labels }: { items: unknown; labels: Record<string, string> }) {
  const parsed: string[] = Array.isArray(items) ? items : [];
  if (parsed.length === 0) return <p className="text-sm text-text-muted">—</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {parsed.map((s) => (
        <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-galaxy-blue/[0.12] text-galaxy-blue-light border border-galaxy-blue/20">
          {labels[s] ?? s}
        </span>
      ))}
    </div>
  );
}

function AttachmentLink({ icon, label, href, color, bg, placeholder }: {
  icon: React.ReactNode; label: string; href: string; color: string; bg: string; placeholder?: boolean;
}) {
  if (placeholder) {
    return (
      <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border opacity-50', bg)}>
        <span className={color}>{icon}</span>
        <div>
          <p className="text-xs font-medium text-text-secondary">{label}</p>
          <p className="text-2xs text-text-muted">Será anexado via Handoff</p>
        </div>
      </div>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.02]', bg)}
    >
      <span className={color}>{icon}</span>
      <p className="text-xs font-medium text-text-primary">{label}</p>
      <ExternalLink size={12} className="ml-auto text-text-muted" />
    </a>
  );
}

function SpicedSection({ title, content, letter, color, highlight }: {
  title: string; content: string; letter?: string; color?: string; highlight?: boolean;
}) {
  return (
    <div className={cn('rounded-xl border p-4', highlight ? 'bg-galaxy-blue/[0.05] border-galaxy-blue/20' : 'bg-white/[0.02] border-glass-border')}>
      <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
        {letter && <span className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold bg-white/5', color)}>{letter}</span>}
        <span className={highlight ? 'text-galaxy-blue-light' : 'text-text-muted'}>{title}</span>
      </h4>
      <p className="text-sm text-text-secondary leading-relaxed">{content}</p>
    </div>
  );
}
