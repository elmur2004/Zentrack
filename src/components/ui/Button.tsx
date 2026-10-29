import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { ArrowIcon } from './icons';

type Variant = 'primary' | 'ghost-dark' | 'ghost-light' | 'navy' | 'text' | 'text-dark';

interface ButtonLinkProps extends Omit<ComponentProps<typeof Link>, 'className'> {
  variant?: Variant;
  arrow?: boolean;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({ variant = 'primary', arrow = false, className = '', children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={`btn btn--${variant} ${className}`} {...rest}>
      <span className="btn__label">{children}</span>
      {arrow ? (
        <span className="btn__arrow">
          <ArrowIcon />
        </span>
      ) : null}
    </Link>
  );
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}
