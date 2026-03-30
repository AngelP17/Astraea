import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variantStyles = {
  primary: `
    bg-indigo-600 hover:bg-indigo-500 text-white font-semibold
    shadow-[0_4px_12px_rgba(99,102,241,0.4)]
    hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)]
  `,
  secondary: `
    bg-transparent border border-white/10 text-white font-medium
    hover:bg-white/5 hover:border-white/20
  `,
  ghost: `
    bg-transparent border border-white/10 text-white font-medium
    hover:bg-white/5 hover:border-white/20
  `,
  danger: `
    bg-danger/10 hover:bg-danger/20 text-danger font-semibold border border-danger/20
    hover:border-danger/30
  `,
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-100',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          'active:translate-y-0',
          variantStyles[variant],
          sizeStyles[size],
          variant === 'primary' && !disabled && 'hover:-translate-y-0.5',
          isLoading && 'cursor-wait',
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
