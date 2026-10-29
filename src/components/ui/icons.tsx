import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/**
 * Forward arrow. Semantic direction icon: mirrored in RTL through the `icon-dir` class.
 * Other icons (download, phone, check, close…) are never mirrored.
 */
export function ArrowIcon({ size = 18, className = '', ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`icon-dir ${className}`}
      {...rest}
    >
      <path d="M3 10h13M11 4.5 16.5 10 11 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}

export function ChevronIcon({ size = 14, className = '', ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" className={className} {...rest}>
      <path d="M3.5 6 8 10.5 12.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}

/** Breadcrumb separator: semantic progression, mirrored in RTL. */
export function CrumbIcon({ size = 12, className = '', ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false" className={`icon-dir ${className}`} {...rest}>
      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function MenuIcon({ size = 22, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...rest}>
      <path d="M3 7h18M3 12h18M9 17h12" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function CloseIcon({ size = 22, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...rest}>
      <path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function CheckIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" {...rest}>
      <path d="M2.5 8.5 6 12l7.5-8" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function DownloadIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" {...rest}>
      <path d="M8 2v8m-3.5-3.5L8 10l3.5-3.5M2.5 13.5h11" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function PinIcon({ size = 18, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false" {...rest}>
      <path d="M10 18s5.5-5.1 5.5-9.5a5.5 5.5 0 1 0-11 0C4.5 12.9 10 18 10 18Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function AlertIcon({ size = 18, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false" {...rest}>
      <path d="M10 2.5 18 17H2L10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 8v4.5M10 14.2v1.3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function PlusIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" {...rest}>
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
