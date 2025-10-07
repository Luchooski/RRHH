import type { ReactNode } from 'react';
import clsx from 'clsx';

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export default function Empty({ icon, title, description, action, className, children }: Props) {
  return (
    <div className={clsx('flex h-full min-h-32 flex-col items-center justify-center gap-2 text-center rounded-xl border p-6', className)}>
      {icon && <div className="opacity-70">{icon}</div>}
      <h3 className="text-base font-medium">{title}</h3>
      {description && <p className="text-sm text-[--color-muted]">{description}</p>}
      {children}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
