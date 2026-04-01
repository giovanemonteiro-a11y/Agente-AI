import { motion } from 'framer-motion';
import { Newspaper } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export function EditorialPage() {
  return (
    <motion.div
      className="space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="Linhas Editoriais"
        subtitle="Pilares de conteúdo por coorte"
      />
      <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
        <Newspaper size={40} className="text-text-muted mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">Linhas Editoriais</h2>
        <p className="text-text-secondary text-sm max-w-sm">
          Estrutura editorial com pilares de conteúdo, proporções e temas gerados a partir das coortes.
        </p>
        <StatusBadge variant="info" label="Em desenvolvimento" dot={false} className="mt-4" />
      </GlassCard>
    </motion.div>
  );
}
