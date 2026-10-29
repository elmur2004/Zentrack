'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Locale } from '@/i18n/config';
import { fmt } from '@/i18n/format';
import type { PublicImage } from '@/lib/content/types';
import { ArrowIcon, CloseIcon } from '@/components/ui/icons';

interface Labels {
  openImage: string;
  dialogLabel: string;
  close: string;
  previous: string;
  next: string;
  position: string;
}

/**
 * Technical gallery. Drawings are contained (never cropped away), captions stay visible.
 * The zoom view is a native modal <dialog>: labelled controls, Escape, inert background,
 * keyboard navigation that follows the UI reading direction, focus restored on close,
 * background scroll locked while open.
 */
export function Gallery({ images, locale, labels }: { images: PublicImage[]; locale: Locale; labels: Labels }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const [index, setIndex] = useState(0);
  const total = images.length;
  const current = images[index];

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => {
      document.documentElement.classList.remove('menu-open');
      returnFocus.current?.focus();
    };
    d.addEventListener('close', onClose);
    return () => d.removeEventListener('close', onClose);
  }, []);

  function open(i: number, trigger: HTMLButtonElement) {
    returnFocus.current = trigger;
    setIndex(i);
    dialogRef.current?.showModal();
    document.documentElement.classList.add('menu-open');
  }

  const go = (delta: number) => setIndex((i) => Math.min(total - 1, Math.max(0, i + delta)));

  function onKey(e: KeyboardEvent<HTMLDialogElement>) {
    const rtl = document.documentElement.dir === 'rtl';
    if (e.key === 'ArrowRight') go(rtl ? -1 : 1);
    else if (e.key === 'ArrowLeft') go(rtl ? 1 : -1);
    else if (e.key === 'Home') setIndex(0);
    else if (e.key === 'End') setIndex(total - 1);
  }

  if (!total) return null;

  return (
    <>
      <ul className="gallery">
        {images.map((img, i) => (
          <li key={img.src} className="gallery__item">
            <button
              type="button"
              className="gallery__thumb"
              onClick={(e) => open(i, e.currentTarget)}
              aria-label={fmt(labels.openImage, { n: i + 1, total, caption: img.caption?.[locale] ?? img.alt[locale] })}
            >
              <Image
                src={img.src}
                alt=""
                width={img.width}
                height={img.height}
                sizes="(min-width: 64rem) 33vw, 100vw"
                unoptimized={img.unoptimized}
              />
            </button>
            {img.caption ? <p className="gallery__caption">{img.caption[locale]}</p> : null}
          </li>
        ))}
      </ul>

      <dialog ref={dialogRef} className="lightbox on-dark" aria-label={labels.dialogLabel} onKeyDown={onKey}>
        <div className="lightbox__bar">
          <p className="lightbox__pos" aria-live="polite">
            {fmt(labels.position, { n: index + 1, total })}
          </p>
          <button type="button" className="lightbox__close" onClick={() => dialogRef.current?.close()} aria-label={labels.close}>
            <CloseIcon />
          </button>
        </div>
        {current ? (
          <figure className="lightbox__figure">
            {/* Plain img: drawings are shown whole at their source aspect ratio */}
            <Image
              src={current.src}
              alt={current.alt[locale]}
              width={current.width}
              height={current.height}
              sizes="100vw"
              className="lightbox__img"
              unoptimized={current.unoptimized}
            />
            {current.caption ? <figcaption>{current.caption[locale]}</figcaption> : null}
          </figure>
        ) : null}
        <div className="lightbox__nav">
          <button type="button" className="btn btn--ghost-dark btn--back" onClick={() => go(-1)} disabled={index === 0}>
            <span className="btn__arrow">
              <ArrowIcon className="icon-back" />
            </span>
            <span className="btn__label">{labels.previous}</span>
          </button>
          <button type="button" className="btn btn--ghost-dark" onClick={() => go(1)} disabled={index === total - 1}>
            <span className="btn__label">{labels.next}</span>
            <span className="btn__arrow">
              <ArrowIcon />
            </span>
          </button>
        </div>
      </dialog>
    </>
  );
}
