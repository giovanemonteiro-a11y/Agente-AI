import { Flame, Droplets, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProposalTemperature } from '@/types/commercial';

const config: Record<ProposalTemperature, { icon: React.ElementType; label: string; className: string }> = {
  quente: { icon: Flame, label: 'Quente', className: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  morno:  { icon: Droplets, label: 'Morno',  className: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  frio:   { icon: Snowflake, label: 'Frio',   className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
};

interface TemperatureIndicatorProps {
  value: ProposalTemperature;
  size?: 'sm' | 'md';
}

export function TemperatureIndicator({ value, size = 'sm' }: TemperatureIndicatorProps) {
  const { icon: Icon, label, className } = config[value];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
    >
      <Icon size={size === 'sm' ? 10 : 13} />
      {label}
    </span>
  );
}
