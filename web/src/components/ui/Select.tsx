import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-[--color-border] bg-[--color-card] text-[--color-fg]',
          'px-3 py-2 text-sm shadow-sm outline-none pr-8',
          'focus-visible:ring-2 focus-visible:ring-blue-500/40',
          className,
        )}
        {...props}
      />
    );
  }
);
