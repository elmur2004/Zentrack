import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { countryName } from '@/i18n/format';
import { pageHref } from '@/i18n/routes';
import { intlLocale } from '@/i18n/config';
import { services } from '@/content/public/services';
import { engagements } from '@/content/public/track';
import { commonCountryCodes, countryCodes } from '@/content/public/countries';
import { disciplineIds, partnerTypeIds, type FormType } from '@/lib/forms/schema';
import { getFormMode, uploadsEnabled } from '@/lib/forms/config';
import { getPublicSiteSettings } from '@/server/public/site-settings';
import { EnquiryForm } from './EnquiryForm';

/**
 * Server wrapper: resolves localized options, the configured delivery mode and (for the partner
 * and careers forms in live mode) whether the owner has paused the form in the dashboard.
 */
export async function FormMount({ type, locale, submitLabel }: { type: FormType; locale: Locale; submitLabel: string }) {
  const t = getMessages(locale);
  const configured = getFormMode(type);
  let mode: typeof configured | 'closed' = configured;
  if (configured === 'live' && type !== 'quote') {
    const settings = await getPublicSiteSettings();
    if (!(type === 'partner' ? settings.partnerIntakeOpen : settings.careerIntakeOpen)) mode = 'closed';
  }
  const collator = new Intl.Collator(intlLocale[locale]);
  const all = countryCodes
    .map((code) => ({ id: code, label: countryName(locale, code) }))
    .sort((a, b) => collator.compare(a.label, b.label));
  const common = commonCountryCodes.map((code) => ({ id: code, label: countryName(locale, code) }));

  return (
    <EnquiryForm
      type={type}
      locale={locale}
      mode={mode}
      uploads={uploadsEnabled(type === 'career' ? 'cv' : 'attachment')}
      privacyHref={pageHref(locale, 'privacy')}
      t={t.forms}
      countries={{ common, all }}
      services={services.map((s) => ({ id: s.id, label: s.name[locale] }))}
      scopes={engagements.map((e) => ({ id: e.id, label: e.title[locale] }))}
      partnerTypes={partnerTypeIds.map((id) => ({ id, label: t.forms.partnerTypes[id] }))}
      disciplines={disciplineIds.map((id) => ({ id, label: t.forms.disciplines[id] }))}
      submitLabel={submitLabel}
    />
  );
}
