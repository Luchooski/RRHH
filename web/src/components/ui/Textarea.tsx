import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-[--color-border] bg-[--color-card] text-[--color-fg]',
          'px-3 py-2 text-sm shadow-sm outline-none min-h-[96px]',
          'focus-visible:ring-2 focus-visible:ring-blue-500/40',
          className,
        )}
        {...props}
      />
    );
  }
);
