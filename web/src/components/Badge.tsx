import { cn } from '@/lib/cn';

type Props = {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
};

export function Badge({ children, variant = 'neutral', className }: Props) {
  const styles = {
    neutral: 'border text-gray-800 bg-white',
    success: 'border-green-200 text-green-900 bg-green-50',
    warning: 'border-amber-200 text-amber-900 bg-amber-50',
    danger:  'border-red-200 text-red-900 bg-red-50',
    info:    'border-slate-200 text-slate-900 bg-slate-50',
  }[variant];

  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs', styles, className)}>
      {children}
    </span>
  );
}
