import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'active' | 'neutral';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/[0.12] text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/[0.12] text-amber-400 border-amber-500/20',
  error: 'bg-red-500/[0.12] text-red-400 border-red-500/20',
  info: 'bg-galaxy-blue/[0.12] text-galaxy-blue-light border-galaxy-blue/20',
  active: 'bg-galaxy-pink/[0.12] text-galaxy-pink-light border-galaxy-pink/20',
  neutral: 'bg-white/[0.06] text-text-secondary border-white/10',
};

const DOT_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
  info: 'bg-galaxy-blue-light',
  active: 'bg-galaxy-pink-light',
  neutral: 'bg-text-muted',
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ variant, label, dot = true, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_CLASSES[variant])} />}
      {label}
    </span>
  );
}
