import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

type Props = InputHTMLAttributes<HTMLInputElement> & { full?: boolean };

const Input = forwardRef<HTMLInputElement, Props>(({ full, className, ...rest }, ref) => {
  return <input ref={ref} className={clsx('input', full && 'w-full', className)} {...rest} />;
});
Input.displayName = 'Input';
export default Input;
