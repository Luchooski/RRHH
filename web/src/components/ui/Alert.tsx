import React from 'react';

type Props = {
  kind?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children?: React.ReactNode;
  className?: string;
};

const color: Record<NonNullable<Props['kind']>, string> = {
  info:    'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error:   'var(--color-danger)',
};

export function Alert({ kind = 'info', title, children, className = '' }: Props) {
  return (
    <div
      role="alert"
      className={`card ${className}`}
      style={{ padding: '12px 14px', borderLeft: `4px solid ${color[kind]}` }}
    >
      {title ? <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div> : null}
      {children ? <div style={{ color: 'var(--color-muted)' }}>{children}</div> : null}
    </div>
  );
}
export default Alert;
