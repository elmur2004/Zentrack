import { databaseDriver, getDb } from '@/server/db/client';
import { emailTransport } from '@/server/email/transport';
import { newApplicationCounts } from '@/server/admin/applications';
import { scannerMode } from '@/server/admin/files';
import { myDueCount } from '@/server/admin/followups';
import { unreadNotificationCount } from '@/server/admin/notifications';
import { adminLocale } from '@/server/admin/page-context';
import { scopeOf } from '@/server/admin/policy';
import { getSettings } from '@/server/admin/settings';
import { adminAvailable, requireActor } from '@/server/auth/session';
import { AdminShell } from '@/components/admin/Shell';
import { StatePanel } from '@/components/admin/StatePanel';

export const dynamic = 'force-dynamic';

/** Authenticated application shell. Every page below re-checks its own permissions. */
export default async function AdminAppLayout({ children, params }: LayoutProps<'/[locale]/admin'>) {
  const locale = await adminLocale(params);
  if (!adminAvailable()) {
    return (
      <div className="adm-auth">
        <main className="adm-auth__card" id="adm-main">
          <StatePanel locale={locale} kind="unavailable" />
        </main>
      </div>
    );
  }
  const actor = await requireActor(locale, { allowMfaPending: true });
  const db = await getDb();
  const settings = await getSettings(db);
  const [notifications, due, apps] = await Promise.all([
    unreadNotificationCount(db, actor),
    myDueCount(db, actor, settings.timezone),
    newApplicationCounts(db, actor),
  ]);
  const testEnvironment = databaseDriver() === 'pglite' || emailTransport() === 'outbox' || scannerMode() === 'test';

  return (
    <AdminShell
      locale={locale}
      user={{ name: actor.name, role: actor.role }}
      can={{
        team: scopeOf(actor, 'team.manage') !== 'none',
        settings: scopeOf(actor, 'settings.manage') !== 'none',
        audit: scopeOf(actor, 'audit.view') !== 'none',
        applications: scopeOf(actor, 'application.view') !== 'none',
      }}
      counts={{ notifications, due, applications: apps.partner + apps.career }}
      testEnvironment={testEnvironment}
    >
      {children}
    </AdminShell>
  );
}
