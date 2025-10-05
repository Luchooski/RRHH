import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'default' | 'primary' | 'ghost' | 'danger';
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  full?: boolean;
};

const styles: Record<Variant, string> = {
  default:
    'bg-[--color-card] text-[--color-fg] border border-[--color-border] hover:bg-black/5 dark:hover:bg-white/5',
  primary:
    'bg-blue-600 text-white hover:bg-blue-700',
  ghost:
    'border border-[--color-border] bg-[--color-card] text-[--color-fg] hover:bg-black/5 dark:hover:bg-white/5',
  danger:
    'bg-red-600 text-white hover:bg-red-700',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = 'default', full, ...props }, ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        styles[variant],
        full && 'w-full',
        className,
      )}
      {...props}
    />
  );
});
