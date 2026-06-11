import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const Input = ({
  className,
  type = 'text',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      'bg-background border-input ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    type={type}
    {...props}
  />
);

export { Input };
