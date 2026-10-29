'use client';

import { useId, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { formatCount, formatDay } from '@/lib/admin/format';

/** Daily volume as simple columns, with an equivalent data table (labels, not colour alone). */
export function VolumeChart({ locale, data }: { locale: Locale; data: Array<{ day: string; count: number }> }) {
  const t = getAdminMessages(locale);
  const uid = useId();
  const [table, setTable] = useState(false);
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((n, d) => n + d.count, 0);
  return (
    <div className="adm-stack--sm">
      <div className="adm-row" style={{ justifyContent: 'space-between' }}>
        <h3 className="adm-h3" id={`${uid}-h`}>
          {t.overview.volume}
        </h3>
        <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" aria-pressed={table} onClick={() => setTable((v) => !v)}>
          {table ? t.overview.showChart : t.overview.showTable}
        </button>
      </div>
      {total === 0 ? (
        <p className="adm-muted">{t.overview.noData}</p>
      ) : table ? (
        <div className="adm-table-wrap" style={{ maxBlockSize: '18rem', overflowY: 'auto' }}>
          <table className="adm-table" aria-labelledby={`${uid}-h`}>
            <thead>
              <tr>
                <th scope="col">{t.overview.day}</th>
                <th scope="col">{t.overview.requests}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.day}>
                  <td>{formatDay(locale, d.day)}</td>
                  <td className="adm-mono">{formatCount(locale, d.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="adm-columns" role="img" aria-label={`${t.overview.volume}: ${formatCount(locale, total)}`} dir="ltr">
            {data.map((d) => (
              <span
                key={d.day}
                className="adm-columns__bar"
                data-zero={d.count === 0}
                style={{ blockSize: d.count ? `${Math.max(4, (d.count / max) * 100)}%` : undefined }}
                title={`${formatDay(locale, d.day)}: ${formatCount(locale, d.count)}`}
              />
            ))}
          </div>
          <div className="adm-row adm-small adm-muted" style={{ justifyContent: 'space-between' }} dir="ltr">
            <span lang={locale}>{formatDay(locale, data[0].day)}</span>
            <span lang={locale}>{formatDay(locale, data[data.length - 1].day)}</span>
          </div>
        </>
      )}
    </div>
  );
}
