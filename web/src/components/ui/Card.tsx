import type { HTMLAttributes, PropsWithChildren } from 'react';
import { clsx } from 'clsx';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('card p-4', className)} {...rest} />;
}
export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('mb-3 flex items-center justify-between gap-2', className)} {...rest} />;
}
export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={clsx('text-lg font-semibold', className)} {...rest} />;
}
export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={clsx('text-sm text-[--color-muted]', className)} {...rest} />;
}
export function CardContent({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('text-sm', className)} {...rest} />;
}
export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('mt-4 flex items-center gap-2', className)} {...rest} />;
}
