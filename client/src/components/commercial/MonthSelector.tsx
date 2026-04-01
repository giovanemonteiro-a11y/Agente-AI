import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  value: string; // YYYY-MM-DD
  onChange: (month: string) => void;
}

function formatMonthLabel(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function addMonths(dateStr: string, delta: number): string {
  const [year, month] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export function MonthSelector({ value, onChange }: MonthSelectorProps) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const isCurrentMonth = value === currentMonth;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(addMonths(value, -1))}
        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-medium text-text-primary capitalize min-w-[140px] text-center">
        {formatMonthLabel(value)}
      </span>
      <button
        onClick={() => onChange(addMonths(value, 1))}
        disabled={isCurrentMonth}
        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
