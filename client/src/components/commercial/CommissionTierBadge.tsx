import { cn } from '@/lib/utils';

interface CommissionTierBadgeProps {
  tierName: string | null;
  commissionPct: string | null;
  commissionValue: string;
}

function formatCurrency(value: string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(parseFloat(value));
}

export function CommissionTierBadge({ tierName, commissionPct, commissionValue }: CommissionTierBadgeProps) {
  const isFixed = commissionPct === null;

  return (
    <div className="flex items-center gap-1.5">
      {tierName && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-galaxy-blue/10 text-galaxy-blue-light border border-galaxy-blue/20">
          {tierName}
        </span>
      )}
      <span className={cn('text-sm font-semibold', 'text-text-primary')}>
        {formatCurrency(commissionValue)}
        {!isFixed && commissionPct && (
          <span className="text-xs text-text-muted ml-1">({parseFloat(commissionPct).toFixed(1)}%)</span>
        )}
      </span>
    </div>
  );
}
