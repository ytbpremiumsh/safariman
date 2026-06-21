import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Html, Preview,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'


interface Props {
  subject?: string
  nama?: string
  kode?: string
  kategori?: string
  bodyHtml?: string // HTML-safe, already escaped + <br> applied
  preview?: string
}

const Email = ({ bodyHtml, preview }: Props) => (
  <Html lang="id">
    <Head />
    <Preview>{preview || 'Safar Iman'}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Custom HTML controls its own margins, background, and layout. */}
        <div dangerouslySetInnerHTML={{ __html: bodyHtml ?? '' }} />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => d?.subject || 'Notifikasi Safar Iman',
  displayName: 'Notifikasi Safar Iman',
  previewData: {
    subject: 'Pendaftaran Safar Iman Berhasil',
    nama: 'Ahmad',
    kode: 'HXP-DEMO1234',
    bodyHtml: 'Assalamualaikum Ahmad,<br/><br/>Pendaftaranmu sudah tercatat.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', margin: 0, padding: 0 }
const container = { maxWidth: '600px', margin: '0 auto' }

