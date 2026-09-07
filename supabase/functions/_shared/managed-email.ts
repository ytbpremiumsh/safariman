// deno-lint-ignore-file no-explicit-any
// Managed email sender for app (transactional) emails.
//
// The app composes its own subject/HTML per send (admin-editable templates in
// app_settings, plus a per-send From header built from the sender settings), so
// these sends go directly through Lovable's managed email API instead of the
// registry helper. Delivery, retries, rate limits, suppression, and the
// unsubscribe footer are handled by Lovable.
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { EmailAPIError, sendLovableEmail } from 'npm:@lovable.dev/email-js@0.1.0'
import { TEMPLATES } from './transactional-email-templates/registry.ts'

// Verified sender subdomain FQDN — must match the domain delegated to Lovable.
export const SENDER_DOMAIN = 'notify.mail.kejarprestasi.id'
// Domain shown in the From: header (cosmetic).
export const FROM_DOMAIN = 'mail.kejarprestasi.id'

export interface SendManagedEmailArgs {
  /** Supabase service-role client, used only to append email_send_log rows. */
  admin: any
  templateName: string
  to: string
  /** Full From header, e.g. `Safar Iman <noreply@mail.kejarprestasi.id>`. */
  from: string
  replyTo?: string
  idempotencyKey: string
  templateData: Record<string, any>
}

export type SendManagedEmailResult =
  | { ok: true }
  | { ok: false; suppressed?: true; error: string }

async function logSend(
  admin: any,
  row: {
    template_name: string
    recipient_email: string
    status: 'sent' | 'suppressed' | 'failed'
    error_message?: string
  },
) {
  const { error } = await admin.from('email_send_log').insert({
    message_id: null,
    ...row,
  })
  if (error) {
    console.error('Failed to write email_send_log', { code: error.code, message: error.message })
  }
}

export async function sendManagedEmail(
  args: SendManagedEmailArgs,
): Promise<SendManagedEmailResult> {
  const { admin, templateName, to, from, replyTo, idempotencyKey, templateData } = args

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) {
    await logSend(admin, {
      template_name: templateName,
      recipient_email: to,
      status: 'failed',
      error_message: 'LOVABLE_API_KEY is not configured',
    })
    return { ok: false, error: 'Pengiriman email belum dikonfigurasi' }
  }

  const template = TEMPLATES[templateName]
  if (!template) {
    return { ok: false, error: `Template '${templateName}' tidak ditemukan` }
  }

  const element = React.createElement(template.component, templateData)
  const html = await renderAsync(element)
  const text = await renderAsync(element, { plainText: true })
  const subject =
    typeof template.subject === 'function' ? template.subject(templateData) : template.subject

  try {
    await sendLovableEmail(
      {
        to,
        from,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: 'transactional',
        label: templateName,
        idempotency_key: idempotencyKey,
        reply_to: replyTo,
      },
      { apiKey, sendUrl: Deno.env.get('LOVABLE_SEND_URL') },
    )
  } catch (error) {
    if (error instanceof EmailAPIError && error.code === 'recipient_suppressed') {
      await logSend(admin, {
        template_name: templateName,
        recipient_email: to,
        status: 'suppressed',
      })
      return { ok: false, suppressed: true, error: 'email_suppressed' }
    }
    const message = error instanceof Error ? error.message : String(error)
    await logSend(admin, {
      template_name: templateName,
      recipient_email: to,
      status: 'failed',
      error_message: message.slice(0, 1000),
    })
    console.error('Managed email send failed', { templateName, message })
    return { ok: false, error: message }
  }

  await logSend(admin, {
    template_name: templateName,
    recipient_email: to,
    status: 'sent',
  })
  return { ok: true }
}
