import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/lib/cn';

export function Table({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-[--color-border] bg-[--color-card]', className)} {...props} />
  );
}

export function TInner({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn('w-full text-sm', className)} {...props} />
  );
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('bg-black/5 dark:bg-white/5', className)} {...props} />
  );
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('', className)} {...props} />;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-t border-[--color-border]', className)} {...props} />;
}

export function TH({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn('px-3 py-2 text-left font-semibold text-[--color-muted]', className)}
      {...props}
    />
  );
}

export function TD({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-3 py-2 align-middle', className)} {...props} />;
}

/** Conveniencia: layout completo */
export function SimpleTable({ head, children, className }:{
  head: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Table className={className}>
      <TInner>
        <THead>
          <TR>
            {head.map((h) => <TH key={h}>{h}</TH>)}
          </TR>
        </THead>
        <TBody>{children}</TBody>
      </TInner>
    </Table>
  );
}
