/**
 * Outgoing email adapter.
 *  EMAIL_TRANSPORT=none   (default) nothing is sent; drafts can be copied or recorded as sent offline.
 *  EMAIL_TRANSPORT=outbox local TEST inbox: writes the message to OUTBOX_DIR (default .data/outbox).
 *                         Status is "test_delivered" — never shown as sent to a client.
 *  EMAIL_TRANSPORT=smtp   real SMTP (SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, SMTP_FROM).
 * Provider acceptance is not proof that the recipient read the message.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import nodemailer from 'nodemailer';

export type TransportName = 'none' | 'outbox' | 'smtp';

export function emailTransport(): TransportName {
  const t = process.env.EMAIL_TRANSPORT?.trim();
  if (t === 'outbox') return 'outbox';
  if (t === 'smtp' && process.env.SMTP_HOST && process.env.SMTP_FROM) return 'smtp';
  return 'none';
}

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  idempotencyKey: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
}

export interface SendResult {
  transport: TransportName;
  status: 'sent' | 'test_delivered';
  providerMessageId: string | null;
}

export async function sendEmail(mail: OutgoingEmail): Promise<SendResult> {
  const transport = emailTransport();
  if (transport === 'none') throw new Error('email transport not configured');
  if (transport === 'outbox') {
    if (process.env.OUTBOX_SIMULATE_FAILURE === '1') throw new Error('simulated provider failure (test outbox)');
    const dir = resolve(/*turbopackIgnore: true*/ process.env.OUTBOX_DIR || '.data/outbox');
    mkdirSync(/*turbopackIgnore: true*/ dir, { recursive: true });
    const file = join(/*turbopackIgnore: true*/ dir, `${Date.now()}-${mail.idempotencyKey.replace(/[^a-zA-Z0-9-]/g, '')}.json`);
    writeFileSync(
      /*turbopackIgnore: true*/ file,
      JSON.stringify(
        {
          to: mail.to,
          subject: mail.subject,
          text: mail.text,
          idempotencyKey: mail.idempotencyKey,
          attachments: (mail.attachments ?? []).map((a) => ({ filename: a.filename, contentType: a.contentType, bytes: a.content.length })),
          writtenAt: new Date().toISOString(),
          note: 'LOCAL TEST OUTBOX — not delivered to anyone',
        },
        null,
        2,
      ),
    );
    return { transport, status: 'test_delivered', providerMessageId: `outbox:${mail.idempotencyKey}` };
  }
  const smtp = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  const info = await smtp.sendMail({
    from: process.env.SMTP_FROM,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    attachments: mail.attachments,
    // A stable Message-ID lets the provider/recipient de-duplicate a retried send.
    messageId: `<${mail.idempotencyKey}@zentrac.local>`,
  });
  return { transport, status: 'sent', providerMessageId: info.messageId ?? null };
}
