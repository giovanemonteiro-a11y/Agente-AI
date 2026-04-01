import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export function SettingsPage() {
  return (
    <motion.div
      className="space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="Configurações"
        subtitle="Gerenciamento de usuários, integrações e sistema"
      />
      <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
        <Settings size={40} className="text-text-muted mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">Painel de Configurações</h2>
        <p className="text-text-secondary text-sm max-w-sm">
          Gerenciamento de usuários, configuração de integrações (Google, WhatsApp, Monday) e parâmetros do sistema.
        </p>
        <StatusBadge variant="info" label="Em desenvolvimento" dot={false} className="mt-4" />
      </GlassCard>
    </motion.div>
  );
}
