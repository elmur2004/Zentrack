import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';

const STATUS_CLASS = ['raised', 'review', 'answered', 'closed'];

/** H04 illustrative issue register. Explicitly labelled as an example; contains no project data. */
export function IssueRegister({ locale }: { locale: Locale }) {
  const t = getMessages(locale).home.why;
  return (
    <figure className="register" data-reveal>
      <figcaption className="register__head">
        <span className="register__title" id="issue-register-title">
          {t.registerTitle}
        </span>
        <span className="register__tag">{t.registerNote}</span>
      </figcaption>
      {/* Scrolls sideways on narrow screens or with enlarged text spacing: focusable so keyboard users can scroll it. */}
      <div className="register__scroll" tabIndex={0} role="region" aria-labelledby="issue-register-title">
        <table className="register__table">
          <thead>
            <tr>
              <th scope="col">{t.columns.ref}</th>
              <th scope="col">{t.columns.interface}</th>
              <th scope="col">{t.columns.issue}</th>
              <th scope="col">{t.columns.status}</th>
            </tr>
          </thead>
          <tbody>
            {t.rows.map((row, i) => (
              <tr key={row.ref}>
                <td>
                  <bdi dir="ltr" className="register__ref">
                    {row.ref}
                  </bdi>
                </td>
                <td>{row.interface}</td>
                <td>{row.issue}</td>
                <td>
                  <span className={`status status--${STATUS_CLASS[i] ?? 'raised'}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
