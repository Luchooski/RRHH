import React from 'react';

type Props = { title: string; description?: string; action?: React.ReactNode; className?: string };

export function Empty({ title, description, action, className = '' }: Props) {
  return (
    <div className={`card ${className}`} style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {description ? <div style={{ color: 'var(--color-muted)', marginBottom: 12 }}>{description}</div> : null}
      {action}
    </div>
  );
}
export default Empty;
