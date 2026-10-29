import type { Metadata } from 'next';
import { getAdminMessages } from '@/i18n/admin';
import { fmt, plural } from '@/i18n/format';
import { RETENTION } from '@/lib/legal';
import { databaseDriver } from '@/server/db/client';
import { emailTransport } from '@/server/email/transport';
import { storageDriver } from '@/server/storage/private';
import { scannerMode } from '@/server/admin/files';
import { notificationJobSummary } from '@/server/admin/notifications';
import { adminLocale, adminPageContext } from '@/server/admin/page-context';
import { scopeOf } from '@/server/admin/policy';
import { privacyPolicyVersion } from '@/server/admin/requests';
import { retentionForecast } from '@/server/admin/retention';
import { schedulerMode } from '@/server/scheduler';
import { BUILT_IN_TEMPLATES } from '@/server/admin/templates';
import { PageHead, StatePanel } from '@/components/admin/StatePanel';
import { SettingsForm } from '@/components/admin/SettingsForm';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/settings'>): Promise<Metadata> {
  return { title: getAdminMessages(await adminLocale(params)).settings.title };
}

export default async function SettingsPage({ params }: PageProps<'/[locale]/admin/settings'>) {
  const { locale, t, actor, db, settings } = await adminPageContext(params);
  if (scopeOf(actor, 'settings.manage') === 'none') return <StatePanel locale={locale} kind="forbidden" />;
  const [jobs, forecast] = await Promise.all([notificationJobSummary(db, actor), retentionForecast(db)]);
  const u = t.settings.units;
  const retentionValues = {
    quoteMonths: plural(locale, RETENTION.quoteMonths, u.months),
    partnerMonths: plural(locale, RETENTION.partnerMonths, u.months),
    careerMonths: plural(locale, RETENTION.careerMonths, u.months),
    spamDays: plural(locale, RETENTION.spamDays, u.days),
    uploadHours: plural(locale, RETENTION.abandonedUploadHours, u.hours),
  };
  const transport = emailTransport();
  const v = t.settings.values;
  const integrations: Array<[string, string, boolean]> = [
    [t.settings.labels.database, databaseDriver() === 'postgres' ? v.postgres : v.pglite, databaseDriver() === 'postgres'],
    [t.settings.labels.email, transport === 'smtp' ? v.emailSmtp : transport === 'outbox' ? v.emailOutbox : v.emailNone, transport === 'smtp'],
    [t.settings.labels.scanner, scannerMode() === 'test' ? v.scanTest : v.scanNone, false],
    [t.settings.labels.storage, storageDriver() === 'filesystem' ? v.storageFilesystem : v.storageDatabase, true],
    [t.settings.labels.privacy, privacyPolicyVersion(), true],
    [t.settings.labels.retention, v.retention, true],
  ];
  return (
    <>
      <PageHead title={t.settings.title} lead={t.settings.lead} />
      <SettingsForm locale={locale} settings={settings} defaults={BUILT_IN_TEMPLATES} transport={transport} jobs={jobs} timezone={settings.timezone} />
      <section className="adm-card" style={{ marginBlockStart: 16 }} aria-labelledby="retention" data-testid="retention">
        <div className="adm-card__head">
          <h2 className="adm-h2" id="retention">
            {t.settings.retentionTitle}
          </h2>
        </div>
        <div className="adm-card__body adm-stack--sm">
          <p className="adm-help">{t.settings.retentionLead}</p>
          <ul className="adm-stack--sm" style={{ paddingInlineStart: '1.2em' }}>
            {t.settings.retentionRules.map((rule) => (
              <li key={rule}>{fmt(rule, retentionValues)}</li>
            ))}
          </ul>
          <p className="adm-small" data-testid="retention-due">
            {fmt(t.settings.retentionDue, { now: forecast.dueNow, soon: forecast.dueSoon })}
          </p>
          <p className="adm-small adm-muted">{schedulerMode() === 'internal' ? t.settings.schedulerOn : t.settings.schedulerOff}</p>
        </div>
      </section>
      <section className="adm-card" style={{ marginBlockStart: 16 }} aria-labelledby="integrations">
        <div className="adm-card__head">
          <h2 className="adm-h2" id="integrations">
            {t.settings.integrations}
          </h2>
          <span className="adm-small adm-muted">{t.settings.integrationsLead}</span>
        </div>
        <div className="adm-card__body">
          <dl className="adm-dl" data-testid="integrations">
            {integrations.map(([label, value, ok]) => (
              <div key={label} style={{ display: 'contents' }}>
                <dt>{label}</dt>
                <dd>
                  <span className="adm-badge" data-tone={ok ? 'ok' : 'warn'} style={{ whiteSpace: 'normal' }}>
                    {value}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
