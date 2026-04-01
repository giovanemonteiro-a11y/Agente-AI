import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gradient' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizeClasses = {
  sm: 'h-8 px-4 text-sm rounded-lg',
  md: 'h-10 px-6 text-sm rounded-xl',
  lg: 'h-12 px-8 text-base rounded-xl',
};

const variantClasses = {
  gradient: 'btn-gradient text-white font-semibold',
  outline:
    'bg-transparent border border-galaxy-blue/50 text-galaxy-blue-light hover:border-galaxy-blue hover:bg-galaxy-blue/10 font-medium transition-all duration-200',
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5 font-medium transition-all duration-200',
};

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  (
    {
      variant = 'gradient',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-galaxy-blue disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

GradientButton.displayName = 'GradientButton';
