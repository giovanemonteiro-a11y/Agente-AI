import { Flame, Droplets, Snowflake } from 'lucide-react';

interface TemperatureOverviewProps {
  quente: number;
  morno: number;
  frio: number;
}

export function TemperatureOverview({ quente, morno, frio }: TemperatureOverviewProps) {
  const total = quente + morno + frio || 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-orange-400" />
          <span className="text-sm text-text-secondary">Quente</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">{quente}</span>
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 rounded-full transition-all"
              style={{ width: `${(quente / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets size={14} className="text-yellow-400" />
          <span className="text-sm text-text-secondary">Morno</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">{morno}</span>
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all"
              style={{ width: `${(morno / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Snowflake size={14} className="text-blue-400" />
          <span className="text-sm text-text-secondary">Frio</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">{frio}</span>
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all"
              style={{ width: `${(frio / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
