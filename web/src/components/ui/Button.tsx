import type { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  full?: boolean;
};

function Button({ variant = 'default', full, className, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'ghost' && 'btn-ghost',
        variant === 'danger' && 'btn-danger',
        full && 'w-full',
        className
      )}
      {...rest}
    />
  );
}

export { Button };        // named export (por si alguien lo usa así)
export default Button;    // default export (para `import Button from ...`)
