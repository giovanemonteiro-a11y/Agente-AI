import { cn } from '@/lib/utils';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

interface GoalProgressBarProps {
  label: string;
  achieved: number;
  goal: number;
  pct: number;
  size?: 'sm' | 'lg';
}

export function GoalProgressBar({ label, achieved, goal, pct, size = 'lg' }: GoalProgressBarProps) {
  const capped = Math.min(pct, 100);
  const isOver = pct > 100;

  const barColor =
    pct >= 100 ? 'bg-gradient-to-r from-galaxy-blue to-galaxy-pink' :
    pct >= 70  ? 'bg-galaxy-blue' :
                 'bg-text-muted';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={cn('font-medium text-text-secondary', size === 'lg' ? 'text-sm' : 'text-xs')}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className={cn('font-bold', size === 'lg' ? 'text-base text-text-primary' : 'text-xs text-text-secondary')}>
            {formatCurrency(achieved)}
          </span>
          <span
            className={cn(
              'text-xs font-semibold px-1.5 py-0.5 rounded-md',
              isOver
                ? 'text-galaxy-pink bg-galaxy-pink/10'
                : pct >= 70
                ? 'text-galaxy-blue-light bg-galaxy-blue/10'
                : 'text-text-muted bg-white/5'
            )}
          >
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className={cn('w-full bg-white/10 rounded-full overflow-hidden', size === 'lg' ? 'h-2.5' : 'h-1.5')}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${capped}%` }}
        />
      </div>
      {size === 'lg' && (
        <p className="text-xs text-text-muted">Meta: {formatCurrency(goal)}</p>
      )}
    </div>
  );
}
