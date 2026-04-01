import { cn } from '@/lib/utils';

interface AIThinkingIndicatorProps {
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function AIThinkingIndicator({
  label = 'IA processando...',
  className,
  size = 'md',
}: AIThinkingIndicatorProps) {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              dotSize,
              'rounded-full bg-gradient-blue-pink animate-thinking'
            )}
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
      {label && (
        <span
          className={cn(
            'gradient-text font-medium',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
