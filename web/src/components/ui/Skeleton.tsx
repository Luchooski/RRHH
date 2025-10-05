import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn'; // si no tenés util cn, sustituí por (a,b)=>[a,b].filter(Boolean).join(' ')

type Props = HTMLAttributes<HTMLDivElement> & { rounded?: 'sm'|'md'|'lg'|'xl'|'2xl'|'full' };

export function Skeleton({ className, rounded = 'lg', ...rest }: Props) {
  const r =
    rounded === 'sm' ? 'rounded' :
    rounded === 'md' ? 'rounded-md' :
    rounded === 'lg' ? 'rounded-lg' :
    rounded === 'xl' ? 'rounded-xl' :
    rounded === '2xl' ? 'rounded-2xl' : 'rounded-full';

  return (
    <div
      {...rest}
      className={cn(
        'animate-pulse',
        'bg-[color-mix(in_oKLCH,canvas,white_8%)] dark:bg-[color-mix(in_oKLCH,Canvas,black_18%)]',
        r,
        className
      )}
    />
  );
}

/** Lista/tabla genérica */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full rounded-2xl ring-1 ring-[--color-border] overflow-hidden">
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_100px] gap-3 px-4 py-3 bg-[--color-muted-bg] text-xs font-semibold">
        <div>Nombre</div><div>Email</div><div>Rol</div><div>Match</div><div>Acciones</div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_100px] gap-3 px-4 py-3 border-t border-[--color-border]">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
