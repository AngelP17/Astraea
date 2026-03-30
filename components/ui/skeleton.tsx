import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'paragraph' | 'card' | 'avatar';
  lines?: number;
}

const variantStyles = {
  text: 'h-4 w-3/4',
  paragraph: 'h-4 w-full',
  card: 'h-48 w-full rounded-xl',
  avatar: 'h-12 w-12 rounded-full',
};

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', lines = 3, ...props }, ref) => {
    if (variant === 'paragraph') {
      return (
        <div ref={ref} className={cn('space-y-2', className)} {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-4 bg-surface-low rounded',
                i === lines - 1 ? 'w-2/3' : 'w-full'
              )}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden bg-surface-low rounded',
          'before:absolute before:inset-0',
          'before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent',
          'before:animate-shimmer',
          'motion-reduce:before:animate-none',
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
