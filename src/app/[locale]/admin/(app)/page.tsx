import type { Metadata } from 'next';
import Link from 'next/link';
import { getAdminMessages } from '@/i18n/admin';
import { fmt } from '@/i18n/format';
import { METRIC_WINDOWS } from '@/lib/admin/codes';
import { formatCount, formatDateTime, formatDay } from '@/lib/admin/format';
import { labelMaps } from '@/lib/admin/labels';
import { newApplicationCounts } from '@/server/admin/applications';
import { dueCount, dueFollowUps } from '@/server/admin/followups';
import { attentionList, overviewMetrics, recentActivity } from '@/server/admin/metrics';
import { adminLocale, adminPageContext } from '@/server/admin/page-context';
import { can } from '@/server/admin/policy';
import { PageHead } from '@/components/admin/StatePanel';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { VolumeChart } from '@/components/admin/VolumeChart';
import { IconAlert } from '@/components/admin/icons';
import { Rich } from '@/components/ui/Rich';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin'>): Promise<Metadata> {
  return { title: getAdminMessages(await adminLocale(params)).overview.title };
}

function Bars({ items, labels }: { items: Array<{ key: string; label: string; n: number }>; labels: { empty: string } }) {
  if (!items.length) return <p className="adm-muted">{labels.empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.n));
  return (
    <div className="adm-bars" role="list">
      {items.map((i) => (
        <div key={i.key} className="adm-bars__row" role="listitem">
          <span>{i.label}</span>
          <span className="adm-bars__track" aria-hidden="true">
            <span className="adm-bars__fill" style={{ inlineSize: `${(i.n / max) * 100}%` }} />
          </span>
          <span className="adm-bars__value">{i.n}</span>
        </div>
      ))}
    </div>
  );
}

export default async function OverviewPage({ params, searchParams }: PageProps<'/[locale]/admin'>) {
  const { locale, t, actor, db, settings } = await adminPageContext(params);
  const sp = await searchParams;
  const days = (METRIC_WINDOWS as readonly number[]).includes(Number(sp.window)) ? Number(sp.window) : 30;
  const tz = settings.timezone;
  const labels = labelMaps(locale);
  const base = `/${locale}/admin`;

  let data: null | {
    metrics: Awaited<ReturnType<typeof overviewMetrics>>;
    attention: Awaited<ReturnType<typeof attentionList>>;
    due: Awaited<ReturnType<typeof dueFollowUps>>;
    dueTotal: number;
    activity: Awaited<ReturnType<typeof recentActivity>>;
    apps: Awaited<ReturnType<typeof newApplicationCounts>>;
  } = null;
  try {
    const [metrics, attention, due, dueTotal, activity, apps] = await Promise.all([
      overviewMetrics(db, actor, days, tz),
      attentionList(db, actor),
      dueFollowUps(db, actor, tz, { limit: 8 }),
      dueCount(db, actor, tz),
      recentActivity(db, actor, 10),
      newApplicationCounts(db, actor),
    ]);
    data = { metrics, attention, due, dueTotal, activity, apps };
  } catch (e) {
    console.error('[admin] overview metrics failed', e instanceof Error ? e.name : typeof e);
  }

  const now = new Date();
  const c = t.overview.cards;
  return (
    <>
      <PageHead title={t.overview.title} lead={t.overview.lead}>
        <nav aria-label={t.overview.window} className="adm-row">
          {METRIC_WINDOWS.map((w) => (
            <Link key={w} href={`${base}?window=${w}`} className={`adm-btn adm-btn--sm${w === days ? ' adm-btn--primary' : ''}`} aria-current={w === days ? 'page' : undefined}>
              {t.overview.windows[String(w) as '7' | '30' | '90']}
            </Link>
          ))}
        </nav>
      </PageHead>

      {!data ? (
        <div className="adm-alert adm-alert--error" role="alert" data-testid="overview-error">
          <IconAlert size={16} />
          <span>{t.overview.error}</span>
        </div>
      ) : (
        <>
          <div className="adm-section-title">
            <h2 className="adm-h2">{t.overview.current}</h2>
            <p className="adm-small adm-muted">{t.overview.currentHelp}</p>
          </div>
          <div className="adm-stats" data-testid="current-stats">
            {(
              [
                ['new', data.metrics.current.new, `${base}/requests?status=new`],
                ['unassigned', data.metrics.current.unassigned, `${base}/requests?assignee=unassigned`],
                ['in_review', data.metrics.current.in_review, `${base}/requests?status=in_review`],
                ['awaiting_information', data.metrics.current.awaiting_information, `${base}/requests?status=awaiting_information`],
                ['preparing_quote', data.metrics.current.preparing_quote, `${base}/requests?status=preparing_quote`],
                ['quote_sent', data.metrics.current.quote_sent, `${base}/requests?status=quote_sent`],
                ['followUpsDue', data.dueTotal, `${base}/requests?followUp=due`],
              ] as const
            ).map(([key, value, href]) => (
              <Link key={key} href={href} className="adm-stat" data-testid={`stat-${key}`}>
                <span className="adm-stat__label">{c[key]}</span>
                <span className="adm-stat__value">{formatCount(locale, value)}</span>
                <span className="adm-stat__kind">{t.overview.cardKind.current}</span>
              </Link>
            ))}
          </div>

          {can(actor, 'application.view') ? (
            <>
              <div className="adm-section-title">
                <h2 className="adm-h2">{t.overview.applications}</h2>
                <p className="adm-small adm-muted">{t.overview.applicationsHelp}</p>
              </div>
              <div className="adm-stats" data-testid="application-stats">
                {(['partner', 'career'] as const).map((k) => (
                  <Link key={k} href={`${base}/applications?kind=${k}&status=new`} className="adm-stat" data-testid={`stat-new-${k}`}>
                    <span className="adm-stat__label">{t.overview.appCards[k]}</span>
                    <span className="adm-stat__value">{formatCount(locale, data.apps[k])}</span>
                    <span className="adm-stat__kind">{t.overview.cardKind.current}</span>
                  </Link>
                ))}
              </div>
            </>
          ) : null}

          <div className="adm-section-title">
            <h2 className="adm-h2">{t.overview.period}</h2>
            <p className="adm-small adm-muted">
              {fmt(t.overview.windowRange, { from: formatDay(locale, data.metrics.window.firstDay), to: formatDay(locale, data.metrics.window.lastDay), tz })} · {fmt(t.overview.periodHelp, { tz })}
            </p>
          </div>
          <div className="adm-stats" data-testid="period-stats">
            {(
              [
                ['received', data.metrics.period.received],
                ['quotesSent', data.metrics.period.quotesSent],
                ['won', data.metrics.period.won],
                ['lost', data.metrics.period.lost],
                ['spam', data.metrics.period.spam],
                ['archived', data.metrics.current.archived],
              ] as const
            ).map(([key, value]) => (
              <div key={key} className="adm-stat" data-testid={`stat-${key}`}>
                <span className="adm-stat__label">{c[key]}</span>
                <span className="adm-stat__value">{formatCount(locale, value)}</span>
                <span className="adm-stat__kind">{key === 'archived' ? t.overview.cardKind.current : t.overview.cardKind.period}</span>
              </div>
            ))}
          </div>

          <div className="adm-grid-2" style={{ marginBlockStart: 16 }}>
            <section className="adm-card">
              <div className="adm-card__body">
                <VolumeChart locale={locale} data={data.metrics.volume} />
              </div>
            </section>
            <section className="adm-card">
              <div className="adm-card__body adm-stack">
                <div className="adm-stack--sm">
                  <h3 className="adm-h3">{t.overview.services}</h3>
                  <Bars items={data.metrics.services.map((s) => ({ key: s.id, label: labels.services[s.id] ?? s.id, n: s.n }))} labels={{ empty: t.overview.noData }} />
                </div>
                <div className="adm-stack--sm">
                  <h3 className="adm-h3">{t.overview.countries}</h3>
                  <Bars items={data.metrics.countries.map((s) => ({ key: s.code, label: labels.countries[s.code] ?? s.code, n: s.n }))} labels={{ empty: t.overview.noData }} />
                </div>
              </div>
            </section>
          </div>

          <div className="adm-grid-2" style={{ marginBlockStart: 16 }}>
            <section className="adm-card" aria-labelledby="ov-attn">
              <div className="adm-card__head">
                <h2 className="adm-h2" id="ov-attn">
                  {t.overview.attention}
                </h2>
                <span className="adm-small adm-muted">{t.overview.attentionHelp}</span>
              </div>
              <div className="adm-card__body">
                {data.attention.length ? (
                  <ul className="adm-list">
                    {data.attention.map((r) => (
                      <li key={r.id}>
                        <span>
                          <Link href={`${base}/requests/${r.id}`} className="adm-link adm-ltr">
                            {r.reference}
                          </Link>{' '}
                          <bdi>{r.company}</bdi>
                          <span className="adm-small adm-muted" style={{ display: 'block' }}>
                            {formatDateTime(locale, r.createdAt, tz)} · {r.assigneeId ? '' : t.common.unassigned}
                          </span>
                        </span>
                        <StatusBadge status={r.status} locale={locale} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="adm-muted">{t.overview.attentionEmpty}</p>
                )}
              </div>
            </section>
            <section className="adm-card" aria-labelledby="ov-due">
              <div className="adm-card__head">
                <h2 className="adm-h2" id="ov-due">
                  {t.overview.dueFollowUps}
                </h2>
              </div>
              <div className="adm-card__body">
                {data.due.length ? (
                  <ul className="adm-list">
                    {data.due.map((f) => (
                      <li key={f.id}>
                        <span>
                          <Link href={`${base}/requests/${f.requestId}`} className="adm-link adm-ltr">
                            {f.reference}
                          </Link>{' '}
                          <bdi>{f.action}</bdi>
                          <span className="adm-small adm-muted" style={{ display: 'block' }}>
                            {formatDateTime(locale, f.dueAt, tz)} · {f.assigneeName ?? t.common.formerMember}
                          </span>
                        </span>
                        <span className="adm-badge" data-tone={f.dueAt.getTime() < now.getTime() ? 'danger' : 'warn'}>
                          {f.dueAt.getTime() < now.getTime() ? t.inbox.due.overdue : t.inbox.due.today}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="adm-muted">{t.overview.dueEmpty}</p>
                )}
              </div>
            </section>
          </div>

          <section className="adm-card" style={{ marginBlockStart: 16 }} aria-labelledby="ov-act">
            <div className="adm-card__head">
              <h2 className="adm-h2" id="ov-act">
                {t.overview.activity}
              </h2>
            </div>
            <div className="adm-card__body">
              {data.activity.length ? (
                <ol className="adm-timeline">
                  {data.activity.map((a) => {
                    const ref = (
                      <Link href={`${base}/requests/${a.requestId}`} className="adm-link">
                        <bdi dir="ltr">{a.reference}</bdi>
                      </Link>
                    );
                    return (
                      <li key={a.id}>
                        <span className="adm-timeline__time">
                          {formatDateTime(locale, a.at, tz)}
                          {a.kind !== 'received' && a.actorName ? ` · ${fmt(t.activity.by, { name: a.actorName })}` : ''}
                        </span>
                        {a.kind === 'received' ? (
                          <Rich text={t.activity.received} values={{ ref }} />
                        ) : a.kind === 'status' ? (
                          <Rich text={t.activity.status} values={{ ref, from: t.status[a.from as keyof typeof t.status], to: t.status[a.to as keyof typeof t.status] }} />
                        ) : a.toName ? (
                          <Rich text={t.activity.assigned} values={{ ref, name: <bdi>{a.toName}</bdi> }} />
                        ) : (
                          <Rich text={t.activity.unassigned} values={{ ref }} />
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="adm-muted">{t.overview.activityEmpty}</p>
              )}
            </div>
          </section>

          <details className="adm-card" style={{ marginBlockStart: 16 }}>
            <summary className="adm-card__head" style={{ cursor: 'pointer' }}>
              <span className="adm-h3">{t.overview.definitions}</span>
            </summary>
            <div className="adm-card__body">
              <ul className="adm-stack--sm" style={{ paddingInlineStart: '1.2em' }}>
                {t.overview.definitionsText.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          </details>
        </>
      )}
    </>
  );
}
