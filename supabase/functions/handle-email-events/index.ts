// deno-lint-ignore-file no-explicit-any
import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.1.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Records delivery outcomes reported by Lovable's managed email delivery into
// the project's own history tables. Notification/record-keeping only — Lovable
// enforces suppression at send time.
function getAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

type Reason = 'bounce' | 'complaint' | 'unsubscribe'

const LOG_STATUS: Record<Reason, 'bounced' | 'complained' | 'suppressed'> = {
  bounce: 'bounced',
  complaint: 'complained',
  unsubscribe: 'suppressed',
}

const LOG_MESSAGE: Record<Reason, string> = {
  bounce: 'Permanent bounce — email address is invalid or rejected',
  complaint: 'Spam complaint — recipient marked email as spam',
  unsubscribe: 'Recipient unsubscribed',
}

async function record(event: any, reason: Reason) {
  const data = event?.data ?? {}
  const recipient: string = String(data.recipient ?? '').toLowerCase()
  if (!recipient) {
    console.warn('Email event without recipient', { event_id: event?.event_id })
    return
  }
  const metadata = (data.metadata ?? null) as Record<string, unknown> | null
  const admin = getAdmin()

  const { error: suppressError } = await admin
    .from('suppressed_emails')
    .upsert({ email: recipient, reason, metadata }, { onConflict: 'email' })
  if (suppressError) {
    console.error('Failed to upsert suppressed email', {
      event_id: event?.event_id,
      code: suppressError.code,
      message: suppressError.message,
    })
    throw new Error('Failed to write suppression')
  }

  if (reason === 'unsubscribe') {
    // Mirror the legacy unsubscribe flow: mark this address's token as used.
    const { error: tokenError } = await admin
      .from('email_unsubscribe_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('email', recipient)
      .is('used_at', null)
    if (tokenError) {
      console.warn('Failed to stamp unsubscribe token', {
        event_id: event?.event_id,
        code: tokenError.code,
        message: tokenError.message,
      })
    }
  }

  const { error: logError } = await admin.from('email_send_log').insert({
    message_id: data.message_id ?? null,
    template_name: 'system',
    recipient_email: recipient,
    status: LOG_STATUS[reason],
    error_message: LOG_MESSAGE[reason],
    metadata,
  })
  if (logError) {
    console.warn('Failed to insert email_send_log', {
      event_id: event?.event_id,
      code: logError.code,
      message: logError.message,
    })
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      await record(event, 'bounce')
    },
    'email.complaint': async (event) => {
      await record(event, 'complaint')
    },
    'email.unsubscribed': async (event) => {
      await record(event, 'unsubscribe')
    },
  },
})

Deno.serve((req) => handler(req))
