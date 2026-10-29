'use client';
/**
 * Accessible modal built on <dialog>: focus is trapped by the browser, Escape closes, focus
 * returns to the element that opened it, and page scrolling is locked while open.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconClose } from './icons';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  testId?: string;
}

export function Dialog({ open, onClose, title, closeLabel, children, footer, wide, testId }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement as HTMLElement | null;
      d.showModal();
      const first = d.querySelector<HTMLElement>('[data-autofocus]') ?? d.querySelector<HTMLElement>('input, select, textarea, button:not([data-dialog-close])');
      first?.focus();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const handle = () => {
      closeRef.current();
      const o = opener.current;
      if (o && document.contains(o)) requestAnimationFrame(() => o.focus());
    };
    d.addEventListener('close', handle);
    return () => d.removeEventListener('close', handle);
  }, []);

  return (
    <dialog ref={ref} className={`adm-dialog${wide ? ' adm-dialog--wide' : ''}`} aria-labelledby={titleId} data-testid={testId}>
      {open ? (
        <>
          <div className="adm-dialog__head">
            <h2 id={titleId} className="adm-h2">
              {title}
            </h2>
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--icon adm-btn--sm" onClick={() => ref.current?.close()} aria-label={closeLabel} data-dialog-close>
              <IconClose />
            </button>
          </div>
          <div className="adm-dialog__body">{children}</div>
          {footer ? <div className="adm-dialog__foot">{footer}</div> : null}
        </>
      ) : null}
    </dialog>
  );
}
