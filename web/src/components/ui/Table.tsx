import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={clsx(
        'w-full border-collapse text-sm',
        '[&_*]:align-middle [&_th]:text-left',
        '[&_td,th]:py-2 [&_td,th]:px-3',
        className
      )}
      {...rest}
    />
  );
}
