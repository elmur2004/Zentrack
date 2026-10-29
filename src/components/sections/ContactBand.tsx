import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { pageHref } from '@/i18n/routes';
import { whatsappHref } from '@/lib/contacts';
import { getPublicContacts } from '@/server/public/site-settings';
import { ButtonLink } from '@/components/ui/Button';

interface ContactBandProps {
  locale: Locale;
  /** Stable-ID query for a visible, editable preselection, e.g. "service=coordination" */
  quoteQuery?: string;
  title?: string;
  text?: string;
  buttonLabel?: string;
}

/** H10 contact band. Main accent area of the page: orange field, navy text. */
export async function ContactBand({ locale, quoteQuery, title, text, buttonLabel }: ContactBandProps) {
  const t = getMessages(locale);
  const { whatsapp } = await getPublicContacts();
  const quote = pageHref(locale, 'quote') + (quoteQuery ? `?${quoteQuery}` : '');
  return (
    <section className="contact-band on-orange" aria-labelledby="contact-band-title">
      <div className="contact-band__slash" aria-hidden="true" />
      <div className="container contact-band__inner">
        <div className="contact-band__copy">
          <h2 id="contact-band-title" className="h2">
            {title ?? t.home.contact.title}
          </h2>
          <p className="lead">{text ?? t.home.contact.text}</p>
          <p className="contact-band__note">{t.home.contact.note}</p>
        </div>
        <div className="contact-band__actions">
          <ButtonLink href={quote} variant="navy" arrow>
            {buttonLabel ?? t.common.requestQuote}
          </ButtonLink>
          {whatsapp ? (
            <a className="btn btn--ghost-navy" href={whatsappHref(whatsapp)} target="_blank" rel="noopener noreferrer">
              <span className="btn__label">{t.home.contact.whatsapp}</span>
              <span className="sr-only">{t.common.opensInNewTab}</span>
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Shorter contextual closing for quote, careers and privacy pages. */
export function ClosingNote({ children }: { children: ReactNode }) {
  return (
    <section className="closing-note">
      <div className="container closing-note__inner">{children}</div>
    </section>
  );
}
