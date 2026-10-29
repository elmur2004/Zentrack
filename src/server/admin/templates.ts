/**
 * Built-in client-message templates. Drafts use the client's submission language, independent of
 * the staff interface language. Staff review and edit every draft; nothing is auto-sent.
 * Placeholders: {name} {company} {reference}. No prices, SLAs, NDA or legal promises.
 */
import { TEMPLATE_KEYS, type TemplateKey } from '@/lib/admin/codes';

export { TEMPLATE_KEYS, type TemplateKey };
export type TemplateText = { subject: string; body: string };
export type TemplateOverrides = Partial<Record<TemplateKey, Partial<Record<'en' | 'ar', TemplateText>>>>;

export const BUILT_IN_TEMPLATES: Record<TemplateKey, Record<'en' | 'ar', TemplateText>> = {
  acknowledgement: {
    en: {
      subject: 'Your enquiry {reference}',
      body: 'Dear {name},\n\nThank you for contacting Zentrac. We have received your enquiry (reference {reference}) and are reviewing the details.\n\nWe will contact you if we need any further information.\n\nKind regards,\nZentrac',
    },
    ar: {
      subject: 'استفساركم رقم {reference}',
      body: 'السيد/السيدة {name}،\n\nنشكركم على تواصلكم مع زينتراك. استلمنا استفساركم (رقم {reference}) ونعمل حاليًا على مراجعة تفاصيله.\n\nسنتواصل معكم إذا احتجنا إلى أي معلومات إضافية.\n\nمع خالص التحية،\nزينتراك',
    },
  },
  missing_information: {
    en: {
      subject: 'Additional information for {reference}',
      body: 'Dear {name},\n\nThank you for your enquiry ({reference}). To review the scope, we need the following information:\n\n- \n- \n\nPlease reply to this email with the details or a non-confidential overview.\n\nKind regards,\nZentrac',
    },
    ar: {
      subject: 'معلومات إضافية للطلب {reference}',
      body: 'السيد/السيدة {name}،\n\nنشكركم على استفساركم ({reference}). لمراجعة النطاق، نحتاج إلى المعلومات التالية:\n\n- \n- \n\nيرجى الرد على هذه الرسالة بالتفاصيل أو بنبذة عامة غير سرية.\n\nمع خالص التحية،\nزينتراك',
    },
  },
  proposal_cover: {
    en: {
      subject: 'Proposal for {reference}',
      body: 'Dear {name},\n\nPlease find attached our proposal for your enquiry ({reference}). It describes the scope and deliverables we propose for {company}.\n\nWe would be glad to discuss any questions.\n\nKind regards,\nZentrac',
    },
    ar: {
      subject: 'العرض الخاص بالطلب {reference}',
      body: 'السيد/السيدة {name}،\n\nمرفق عرضنا الخاص باستفساركم ({reference})، ويتضمن النطاق والمخرجات المقترحة لـ {company}.\n\nيسعدنا مناقشة أي استفسارات لديكم.\n\nمع خالص التحية،\nزينتراك',
    },
  },
  follow_up: {
    en: {
      subject: 'Following up on {reference}',
      body: 'Dear {name},\n\nWe are following up on your enquiry ({reference}). Please let us know if you have any questions or updates.\n\nKind regards,\nZentrac',
    },
    ar: {
      subject: 'متابعة الطلب {reference}',
      body: 'السيد/السيدة {name}،\n\nنتابع معكم بخصوص استفساركم ({reference}). يرجى إعلامنا بأي أسئلة أو مستجدات.\n\nمع خالص التحية،\nزينتراك',
    },
  },
};

export function renderTemplate(
  key: TemplateKey,
  lang: 'en' | 'ar',
  vars: { name: string; company: string; reference: string },
  overrides: TemplateOverrides = {},
): TemplateText {
  const t = overrides[key]?.[lang] ?? BUILT_IN_TEMPLATES[key][lang];
  const fill = (s: string) => s.replace(/\{(name|company|reference)\}/g, (_, k: keyof typeof vars) => vars[k]);
  return { subject: fill(t.subject), body: fill(t.body) };
}
